-- Create a function that creates a minimal chat with only essential fields
CREATE OR REPLACE FUNCTION create_minimal_chat(user_id_param UUID)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_chat_id UUID;
  new_chat_name TEXT := 'Neuer Chat';
BEGIN
  -- Insert with only essential fields to minimize chances of failure
  INSERT INTO chats (user_id, name)
  VALUES (user_id_param, new_chat_name)
  RETURNING id INTO new_chat_id;
  
  RETURN QUERY SELECT new_chat_id, new_chat_name;
END;
$$; 