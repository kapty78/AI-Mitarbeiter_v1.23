-- 1. Alten Constraint entfernen (Name muss ggf. angepasst werden!)
ALTER TABLE public.document_processing_status
DROP CONSTRAINT IF EXISTS document_processing_status_status_check;

-- 2. Neuen Constraint mit allen erlaubten Werten hinzufügen
ALTER TABLE public.document_processing_status
ADD CONSTRAINT document_processing_status_status_check CHECK (
  status = ANY (
    ARRAY[
      'uploading'::text,
      'processing'::text,
      'embedding'::text,
      'completed'::text,
      'failed'::text,
      'unknown'::text,
      'facts_extracting'::text,
      'facts_saving'::text,
      'facts_completed'::text,
      'facts_failed'::text,
      'skipped'::text -- 'skipped' auch hinzufügen, falls verwendet
    ]
  )
);
