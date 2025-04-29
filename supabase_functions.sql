-- Aktiviere die Vector-Erweiterung 
CREATE EXTENSION IF NOT EXISTS "vector";

-- Erstelle eine Trigger-Funktion, die automatisch source_chunk in UUID konvertiert
CREATE OR REPLACE FUNCTION convert_source_chunk_to_uuid()
RETURNS TRIGGER AS $$
BEGIN
  -- Nur konvertieren, wenn es ein numerischer Wert ist (nicht bereits eine UUID)
  IF NEW.source_chunk IS NOT NULL AND NEW.source_chunk ~ '^[0-9]+$' THEN
    -- Hole die entsprechende UUID aus document_chunks basierend auf content_position
    SELECT id INTO NEW.source_chunk
    FROM document_chunks
    WHERE document_id = NEW.document_id
      AND content_position = NEW.source_chunk::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle einen Trigger für knowledge_items
DROP TRIGGER IF EXISTS convert_source_chunk_trigger ON knowledge_items;
CREATE TRIGGER convert_source_chunk_trigger
BEFORE INSERT ON knowledge_items
FOR EACH ROW
EXECUTE FUNCTION convert_source_chunk_to_uuid();

-- Kommentar zur Erklärung
COMMENT ON FUNCTION convert_source_chunk_to_uuid IS 'Konvertiert automatisch source_chunk von einer Positions-ID in eine tatsächliche document_chunks.id UUID beim Einfügen in knowledge_items';

-- Funktion zur Suche nach Fakten mit ihren Chunks
CREATE OR REPLACE FUNCTION public.kb_find_facts_with_chunks(
  p_query_embedding vector,
  p_knowledge_base_id uuid,
  p_match_threshold double precision DEFAULT 0.2, -- Niedrigerer Schwellenwert für bessere Ergebnisse
  p_match_count integer DEFAULT 10
)
RETURNS TABLE (
  fact_id uuid,
  fact_content text,
  fact_source_name text,
  chunk_id uuid,
  chunk_content text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rückgabe: Fakten mit ihren zugehörigen Chunks
  RETURN QUERY
  WITH matching_facts AS (
    SELECT 
      ki.id as fact_id,
      ki.content as fact_content,
      ki.source_name,
      ki.source_chunk as chunk_reference,
      1 - (ki.openai_embedding <=> p_query_embedding) AS similarity
    FROM 
      knowledge_items ki
    WHERE 
      ki.knowledge_base_id = p_knowledge_base_id
      AND 1 - (ki.openai_embedding <=> p_query_embedding) > p_match_threshold
    ORDER BY 
      similarity DESC
    LIMIT 
      p_match_count
  )
  SELECT 
    mf.fact_id,
    mf.fact_content,
    mf.source_name,
    dc.id as chunk_id,
    dc.content as chunk_content,
    mf.similarity
  FROM 
    matching_facts mf
  JOIN 
    document_chunks dc ON dc.id::text = mf.chunk_reference::text
  ORDER BY 
    mf.similarity DESC;
END;
$$;

-- Berechtigungen für die neue Funktion
REVOKE ALL ON FUNCTION public.kb_find_facts_with_chunks(vector, uuid, double precision, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kb_find_facts_with_chunks(vector, uuid, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kb_find_facts_with_chunks(vector, uuid, double precision, integer) TO service_role;

-- Kommentar hinzufügen
COMMENT ON FUNCTION public.kb_find_facts_with_chunks IS 'Sucht nach Fakten basierend auf Vektorähnlichkeit und gibt auch die zugehörigen Quell-Chunks zurück. Niedrigerer Standardschwellenwert für bessere Trefferquote.'; 