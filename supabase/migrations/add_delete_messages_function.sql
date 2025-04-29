-- Function to delete chat messages by an array of IDs
-- This bypasses some of the RLS issues we might be encountering
CREATE OR REPLACE FUNCTION delete_messages_by_ids(p_message_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Use a more direct approach with explicit transaction control
  DELETE FROM chat_messages
  WHERE id = ANY(p_message_ids)
  RETURNING COUNT(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION delete_messages_by_ids IS 'Deletes chat messages by an array of IDs, returning the count of deleted messages';

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION delete_messages_by_ids TO authenticated;
GRANT EXECUTE ON FUNCTION delete_messages_by_ids TO service_role; 