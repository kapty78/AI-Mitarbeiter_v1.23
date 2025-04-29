-- Funktion für Vektorsuche nach Wissensdatenbank-Einträgen
-- Diese Funktion vermeidet Überladungsprobleme durch einen eindeutigen Namen
CREATE OR REPLACE FUNCTION public.kb_vector_search(
  p_user_id uuid,
  p_query_embedding vector,
  p_match_threshold double precision,
  p_match_count integer
)
RETURNS TABLE (
  id uuid,
  content text,
  source_name text,
  source_type text,
  knowledge_base_id uuid,
  similarity double precision
)
LANGUAGE sql
AS $$
  SELECT 
    ki.id, 
    ki.content, 
    ki.source_name, 
    ki.source_type, 
    ki.knowledge_base_id,
    (1 - (ki.openai_embedding <=> p_query_embedding)) AS similarity
  FROM 
    knowledge_items ki
  WHERE 
    -- Similarity-Bedingung basierend auf dem Vektoroperator <=>
    (1 - (ki.openai_embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY 
    similarity DESC
  LIMIT 
    p_match_count;
$$;

-- Kommentar zu dieser Funktion hinzufügen
COMMENT ON FUNCTION public.kb_vector_search IS 'Sucht nach ähnlichen Wissenseinträgen basierend auf Vektorähnlichkeit. Eindeutige Funktion zur Vermeidung von Überladungsproblemen.';

-- Alternativ die ursprüngliche match_knowledge_items-Funktion umbenennen
-- (nur ausführen, wenn die obige Funktion nicht ausreicht)
/*
ALTER FUNCTION public.match_knowledge_items(
  p_user_id uuid, 
  p_query_embedding vector, 
  p_match_threshold double precision, 
  p_match_count integer
) 
RENAME TO match_knowledge_items_vector_old;
*/

-- Hilfsfunktion um Spalten der Tabelle knowledge_items anzuzeigen
-- Mit dieser Funktion können wir den richtigen Spaltennamen für den Einbettungsvektor ermitteln
CREATE OR REPLACE FUNCTION public.show_kb_columns()
RETURNS TABLE (
  column_name text,
  data_type text
)
LANGUAGE sql
AS $$
  SELECT 
    column_name, 
    data_type
  FROM 
    information_schema.columns
  WHERE 
    table_name = 'knowledge_items'
    AND table_schema = 'public'
  ORDER BY 
    ordinal_position;
$$;

-- Alternativ-Funktion, die local_embedding verwendet
CREATE OR REPLACE FUNCTION public.kb_vector_search_local(
  p_user_id uuid,
  p_query_embedding vector,
  p_match_threshold double precision,
  p_match_count integer
)
RETURNS TABLE (
  id uuid,
  content text,
  source_name text,
  source_type text,
  knowledge_base_id uuid,
  similarity double precision
)
LANGUAGE sql
AS $$
  SELECT 
    ki.id, 
    ki.content, 
    ki.source_name, 
    ki.source_type, 
    ki.knowledge_base_id,
    (1 - (ki.local_embedding <=> p_query_embedding)) AS similarity
  FROM 
    knowledge_items ki
  WHERE 
    -- Similarity-Bedingung basierend auf dem Vektoroperator <=>
    (1 - (ki.local_embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY 
    similarity DESC
  LIMIT 
    p_match_count;
$$;

-- Neue, verbesserte Funktion zur direkten Suche nach Wissenseinträgen und ihren zugehörigen Chunks
CREATE OR REPLACE FUNCTION public.find_knowledge_facts_with_chunks(
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
REVOKE ALL ON FUNCTION public.find_knowledge_facts_with_chunks(vector, uuid, double precision, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_knowledge_facts_with_chunks(vector, uuid, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_knowledge_facts_with_chunks(vector, uuid, double precision, integer) TO service_role;

-- Kommentar hinzufügen
COMMENT ON FUNCTION public.find_knowledge_facts_with_chunks IS 'Sucht nach Fakten basierend auf Vektorähnlichkeit und gibt auch die zugehörigen Quell-Chunks zurück. Niedrigerer Standardschwellenwert für bessere Trefferquote.'; 