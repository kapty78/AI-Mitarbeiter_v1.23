-- Create a function to create a minimal chat
CREATE OR REPLACE FUNCTION create_minimal_chat(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  new_chat_id UUID;
  result JSON;
BEGIN
  -- Create a new chat with minimal fields
  INSERT INTO public.chats (id, user_id, title, created_at)
  VALUES (gen_random_uuid(), user_id_param, 'Neuer Chat', now())
  RETURNING id INTO new_chat_id;
  
  -- Return the new chat ID
  SELECT json_build_object('id', new_chat_id) INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return the error
  SELECT json_build_object('error', SQLERRM) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update a chat title
CREATE OR REPLACE FUNCTION update_chat_title(chat_id_param UUID, title_param TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Update the chat title
  UPDATE public.chats
  SET title = title_param
  WHERE id = chat_id_param;
  
  -- Return success
  SELECT json_build_object('success', true) INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return the error
  SELECT json_build_object('error', SQLERRM) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql; 