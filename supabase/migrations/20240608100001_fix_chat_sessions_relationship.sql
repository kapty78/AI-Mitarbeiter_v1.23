-- Make sure chat_sessions table exists
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' AND column_name = 'name'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN name TEXT;
    RAISE NOTICE 'Added name column to chat_sessions table';
  END IF;
END $$;

-- Grant access permissions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Add RLS policy to chat_sessions
DROP POLICY IF EXISTS "Users can access their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can access their own chat sessions"
  ON chat_sessions
  USING (auth.uid() = user_id);
  
-- Create missing chat_sessions from existing chats
INSERT INTO chat_sessions (id, user_id, created_at)
SELECT c.id, c.user_id, c.created_at
FROM chats c
LEFT JOIN chat_sessions cs ON c.id = cs.id
WHERE cs.id IS NULL;

-- Update names from chats if possible
UPDATE chat_sessions cs
SET name = c.name
FROM chats c
WHERE cs.id = c.id AND c.name IS NOT NULL AND cs.name IS NULL;

-- Make chat_session_id nullable in chat_messages if it has a foreign key constraint
BEGIN;
  -- Check if the constraint exists and drop it
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'chat_messages_chat_session_id_fkey'
    ) THEN
      ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_chat_session_id_fkey;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
  END;
  $$;

  -- Make chat_session_id nullable if the column exists
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'chat_messages' AND column_name = 'chat_session_id'
    ) THEN
      ALTER TABLE chat_messages ALTER COLUMN chat_session_id DROP NOT NULL;
      RAISE NOTICE 'Made chat_session_id nullable';
    END IF;
  END $$;
COMMIT;

-- Add chat_id column to chat_messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN chat_id UUID;
    RAISE NOTICE 'Added chat_id column to chat_messages table';
    
    -- Copy values from chat_session_id to chat_id
    UPDATE chat_messages 
    SET chat_id = chat_session_id 
    WHERE chat_session_id IS NOT NULL AND chat_id IS NULL;
  END IF;
END $$;

-- Add RLS policy for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can access their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON chat_messages;

-- Create new policies
CREATE POLICY "Users can access their own messages"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.chat_session_id 
      AND chat_sessions.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their chats"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.chat_session_id 
      AND chat_sessions.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  ); 