-- Consolidate chat tables and simplify schema

-- 0. First drop the Row Level Security policies that depend on chat_session_id
DROP POLICY IF EXISTS "chat_messages_user_policy" ON "chat_messages";
DROP POLICY IF EXISTS "Users can access their own messages" ON "chat_messages";
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON "chat_messages";

-- 1. Ensure all data from chat_sessions is in chats
INSERT INTO chats (id, user_id, name, created_at, workspace_id)
SELECT 
  cs.id, 
  cs.user_id, 
  cs.name, 
  cs.created_at, 
  NULL as workspace_id
FROM chat_sessions cs
LEFT JOIN chats c ON cs.id = c.id
WHERE c.id IS NULL;

-- 2. Update chat_messages to use only chat_id and handle records with only chat_session_id
UPDATE chat_messages
SET chat_id = chat_session_id
WHERE chat_id IS NULL AND chat_session_id IS NOT NULL;

-- 3. Remove the chat_session_id column from chat_messages
ALTER TABLE chat_messages DROP COLUMN IF EXISTS chat_session_id;

-- 4. Add a foreign key constraint to ensure referential integrity
ALTER TABLE chat_messages 
  DROP CONSTRAINT IF EXISTS chat_messages_chat_id_fkey,
  ADD CONSTRAINT chat_messages_chat_id_fkey 
  FOREIGN KEY (chat_id) 
  REFERENCES chats(id) 
  ON DELETE CASCADE;

-- 5. Create new RLS policies that use only chat_id
CREATE POLICY "Users can access their own messages" ON "chat_messages"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = chat_messages.chat_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their chats" ON "chat_messages" 
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = chat_messages.chat_id
      AND c.user_id = auth.uid()
    )
  );

-- 6. We'll keep the chat_sessions table for now but mark it as deprecated
COMMENT ON TABLE chat_sessions IS 'DEPRECATED - Use chats table instead'; 