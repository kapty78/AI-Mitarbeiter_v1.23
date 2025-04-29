-- Fix chat table permissions by adding proper RLS policy
ALTER TABLE IF EXISTS chats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own chats
DROP POLICY IF EXISTS "Users can insert their own chats" ON chats;
CREATE POLICY "Users can insert their own chats" 
ON chats 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own chats
DROP POLICY IF EXISTS "Users can update their own chats" ON chats;
CREATE POLICY "Users can update their own chats" 
ON chats 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create policy to allow users to select their own chats
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
CREATE POLICY "Users can view their own chats" 
ON chats 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id); 