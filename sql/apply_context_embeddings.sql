-- Add pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create message_embeddings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  workspace_id UUID,
  role TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS message_embeddings_message_id_idx ON message_embeddings(message_id);
CREATE INDEX IF NOT EXISTS message_embeddings_chat_id_idx ON message_embeddings(chat_id);
CREATE INDEX IF NOT EXISTS message_embeddings_embedding_idx ON message_embeddings USING hnsw (embedding vector_cosine_ops);

-- Add row level security
ALTER TABLE message_embeddings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (drop if exist)
DROP POLICY IF EXISTS "Users can insert their own message embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Users can view message embeddings from their chats" ON message_embeddings;

CREATE POLICY "Users can insert their own message embeddings" 
ON message_embeddings FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can view message embeddings from their chats" 
ON message_embeddings FOR SELECT 
TO authenticated 
USING (chat_id IN (
  SELECT id FROM chats WHERE user_id = auth.uid()
));

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS search_similar_messages(vector(1536), UUID, float, int);

-- Create function to search similar messages
CREATE OR REPLACE FUNCTION search_similar_messages(
  query_embedding vector(1536),
  chat_id UUID,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INT DEFAULT 10
) 
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  role TEXT,
  similarity FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id AS message_id,
    cm.content,
    cm.role,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM 
    message_embeddings me
  JOIN 
    chat_messages cm ON me.message_id = cm.id
  WHERE 
    me.chat_id = search_similar_messages.chat_id
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
  ORDER BY 
    similarity DESC
  LIMIT 
    max_results;
END;
$$; 