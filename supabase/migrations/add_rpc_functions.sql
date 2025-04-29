-- Add RPC function to delete messages after a specific timestamp
CREATE OR REPLACE FUNCTION delete_messages_after_timestamp(
  p_chat_id UUID,
  p_timestamp TIMESTAMPTZ
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_messages
  WHERE chat_id = p_chat_id
    AND created_at >= p_timestamp
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the function
COMMENT ON FUNCTION delete_messages_after_timestamp IS 'Deletes all messages in a chat that were created at or after the specified timestamp';

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION delete_messages_after_timestamp TO authenticated;
GRANT EXECUTE ON FUNCTION delete_messages_after_timestamp TO service_role; 