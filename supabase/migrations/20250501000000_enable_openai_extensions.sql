-- Aktiviere die Vector-Erweiterung für Vektorsuche
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