-- Add pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create message_embeddings table
CREATE TABLE IF NOT EXISTS message_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  workspace_id UUID,
  role TEXT NOT NULL,
  embedding vector(1536),
  content_with_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add explicit foreign key constraints with correct references
  CONSTRAINT message_embeddings_message_id_fkey
    FOREIGN KEY (message_id)
    REFERENCES chat_messages(id)
    ON DELETE CASCADE,
  
  CONSTRAINT message_embeddings_chat_id_fkey
    FOREIGN KEY (chat_id)
    REFERENCES chats(id)
    ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS message_embeddings_message_id_idx ON message_embeddings(message_id);
CREATE INDEX IF NOT EXISTS message_embeddings_chat_id_idx ON message_embeddings(chat_id);
CREATE INDEX IF NOT EXISTS message_embeddings_embedding_idx ON message_embeddings USING hnsw (embedding vector_cosine_ops);

-- Add row level security
ALTER TABLE message_embeddings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "Users can insert their own message embeddings" ON message_embeddings;
CREATE POLICY "Users can insert their own message embeddings" 
ON message_embeddings FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view message embeddings from their chats" ON message_embeddings;
CREATE POLICY "Users can view message embeddings from their chats" 
ON message_embeddings FOR SELECT 
TO authenticated 
USING (chat_id IN (
  SELECT id FROM chats WHERE user_id = auth.uid()
));

-- Drop the existing function if it exists (consider previous signature)
DROP FUNCTION IF EXISTS search_similar_messages(vector(1536), UUID, float, int);
-- Drop potentially existing function with the new signature to be safe
DROP FUNCTION IF EXISTS search_similar_messages(vector(1536), UUID, float, int, UUID);

-- Create improved function to search similar messages with conversation context
CREATE OR REPLACE FUNCTION search_similar_messages(
  query_embedding vector(1536),
  p_user_id UUID,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INT DEFAULT 10
) 
RETURNS TABLE (
  message_id UUID,
  chat_id UUID,
  content TEXT,
  role TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ, -- Added for sorting
  is_context BOOLEAN     -- Flag to indicate if this is a context message
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- First, find similar messages based on embedding
  CREATE TEMP TABLE similar_messages ON COMMIT DROP AS
  SELECT 
    cm.id AS message_id,
    cm.chat_id,
    COALESCE(me.content_with_date, cm.content) as content,
    cm.role,
    1 - (me.embedding <=> query_embedding) AS similarity,
    cm.created_at,
    FALSE as is_context
  FROM 
    message_embeddings me
  JOIN 
    chat_messages cm ON me.message_id = cm.id
  JOIN
    chats c ON cm.chat_id = c.id
  WHERE 
    c.user_id = p_user_id
    AND me.embedding IS NOT NULL
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
  ORDER BY 
    similarity DESC
  LIMIT 
    max_results;

  -- For each found message, add the next message(s) in the conversation as context
  INSERT INTO similar_messages (message_id, chat_id, content, role, similarity, created_at, is_context)
  SELECT 
    next_msg.id AS message_id,
    next_msg.chat_id,
    next_msg.content,
    next_msg.role,
    sm.similarity * 0.9 AS similarity, -- Slightly lower similarity for context msgs
    next_msg.created_at,
    TRUE as is_context
  FROM 
    similar_messages sm
  JOIN 
    chat_messages next_msg 
    ON sm.chat_id = next_msg.chat_id
    AND next_msg.created_at > sm.created_at
    AND NOT sm.is_context -- Only add context for original matches
  WHERE
    NOT EXISTS (
      SELECT 1 FROM similar_messages sm2
      WHERE sm2.message_id = next_msg.id
    )
  ORDER BY
    sm.chat_id, next_msg.created_at
  LIMIT 
    max_results * 2; -- Allow up to 2 context messages per match

  -- Return results, sorted by similarity then created_at
  RETURN QUERY
  SELECT 
    message_id,
    chat_id,
    content,
    role,
    similarity,
    created_at,
    is_context
  FROM 
    similar_messages
  ORDER BY 
    CASE WHEN is_context THEN 0 ELSE 1 END, -- Group context with their matches
    similarity DESC,
    created_at
  LIMIT 
    max_results * 3; -- Return more total results to account for context
END;
$$; 