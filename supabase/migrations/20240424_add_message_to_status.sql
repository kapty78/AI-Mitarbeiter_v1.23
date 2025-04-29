ALTER TABLE public.document_processing_status
ADD COLUMN IF NOT EXISTS message TEXT NULL;
