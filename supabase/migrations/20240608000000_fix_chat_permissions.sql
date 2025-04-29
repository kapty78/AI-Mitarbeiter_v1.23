-- Fix chat message permissions by adding proper RLS policy
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own messages
DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
CREATE POLICY "Users can insert their own messages" 
ON chat_messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM chats WHERE id = chat_id
  )
);

-- Create policy to allow users to select their own messages
DROP POLICY IF EXISTS "Users can view their own messages" ON chat_messages;
CREATE POLICY "Users can view their own messages" 
ON chat_messages 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT user_id FROM chats WHERE id = chat_id
  )
);

-- Create the missing update_chat_title function
CREATE OR REPLACE FUNCTION update_chat_title(chat_id_param UUID, title_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE chats
  SET name = title_param
  WHERE id = chat_id_param
  AND user_id = auth.uid();
END;
$$; 