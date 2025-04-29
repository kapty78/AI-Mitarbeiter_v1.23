-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for document metadata
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  storage_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for document chunks with vector embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  local_embedding VECTOR(384),
  content_position INTEGER,
  chunk_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create full-text search index on document chunks
ALTER TABLE document_chunks ADD COLUMN content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('german', content)) STORED;
CREATE INDEX content_tsv_idx ON document_chunks USING gin(content_tsv);

-- Create index for vector searches
CREATE INDEX document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for local embedding searches (smaller dimensionality)
CREATE INDEX document_chunks_local_embedding_idx ON document_chunks USING ivfflat (local_embedding vector_cosine_ops)
WITH (lists = 50);

-- Create RLS policies for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
ON documents FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
ON documents FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create RLS policies for document_chunks table
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chunks of their documents"
ON document_chunks FOR SELECT
TO authenticated
USING (document_id IN (
  SELECT id FROM documents WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert chunks for their documents"
ON document_chunks FOR INSERT
TO authenticated
WITH CHECK (document_id IN (
  SELECT id FROM documents WHERE user_id = auth.uid()
));

-- Create stored procedure for semantic search using vector embeddings
CREATE OR REPLACE FUNCTION cursor_vector_search(
  p_user_id UUID,
  p_query_embedding VECTOR(1536),
  p_match_threshold FLOAT DEFAULT 0.3,
  p_match_count INTEGER DEFAULT 10,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  document_title TEXT,
  document_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) AS similarity,
    d.title AS document_title,
    d.storage_url AS document_url
  FROM
    document_chunks dc
  JOIN
    documents d ON dc.document_id = d.id
  WHERE
    d.user_id = p_user_id
    AND (p_workspace_id IS NULL OR d.workspace_id = p_workspace_id)
    AND (1 - (dc.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    p_match_count;
END;
$$;

-- Create stored procedure for semantic search using local embeddings (fallback)
CREATE OR REPLACE FUNCTION cursor_local_vector_search(
  p_user_id UUID,
  p_query_embedding VECTOR(384),
  p_match_threshold FLOAT DEFAULT 0.3,
  p_match_count INTEGER DEFAULT 10,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  document_title TEXT,
  document_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.local_embedding <=> p_query_embedding) AS similarity,
    d.title AS document_title,
    d.storage_url AS document_url
  FROM
    document_chunks dc
  JOIN
    documents d ON dc.document_id = d.id
  WHERE
    d.user_id = p_user_id
    AND (p_workspace_id IS NULL OR d.workspace_id = p_workspace_id)
    AND (1 - (dc.local_embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    p_match_count;
END;
$$;

-- Create stored procedure for full-text search
CREATE OR REPLACE FUNCTION cursor_text_search(
  p_user_id UUID,
  p_query TEXT,
  p_match_count INTEGER DEFAULT 10,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  rank FLOAT,
  document_title TEXT,
  document_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    ts_rank_cd(dc.content_tsv, to_tsquery('german', p_query)) AS rank,
    d.title AS document_title,
    d.storage_url AS document_url
  FROM
    document_chunks dc
  JOIN
    documents d ON dc.document_id = d.id
  WHERE
    d.user_id = p_user_id
    AND (p_workspace_id IS NULL OR d.workspace_id = p_workspace_id)
    AND dc.content_tsv @@ to_tsquery('german', p_query)
  ORDER BY
    rank DESC
  LIMIT
    p_match_count;
END;
$$; 