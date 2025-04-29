-- Create a function to correctly insert chat messages
CREATE OR REPLACE FUNCTION insert_chat_message(
    chat_id_param UUID,
    role_param TEXT,
    content_param TEXT,
    created_at_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_message_id UUID;
BEGIN
    -- Insert the message with both ID fields
    INSERT INTO chat_messages (
        chat_id,
        chat_session_id,
        role,
        content,
        created_at
    ) VALUES (
        chat_id_param,
        chat_id_param,
        role_param,
        content_param,
        created_at_param
    ) RETURNING id INTO new_message_id;
    
    RETURN new_message_id;
END;
$$; 