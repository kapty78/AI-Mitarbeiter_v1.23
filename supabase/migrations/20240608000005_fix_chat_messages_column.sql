-- Check if chat_session_id column exists and chat_id doesn't exist
DO $$ 
BEGIN
    -- Check if chat_session_id exists and chat_id doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'chat_messages' AND column_name = 'chat_session_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'chat_messages' AND column_name = 'chat_id') THEN
        
        -- Make chat_session_id nullable temporarily
        ALTER TABLE chat_messages ALTER COLUMN chat_session_id DROP NOT NULL;
        
        -- Add chat_id column
        ALTER TABLE chat_messages ADD COLUMN chat_id UUID;
        
        -- Copy values from chat_session_id to chat_id
        UPDATE chat_messages SET chat_id = chat_session_id;
        
        RAISE NOTICE 'Added chat_id column as alternative to chat_session_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'chat_messages' AND column_name = 'chat_session_id') THEN
        -- Just make chat_session_id nullable if it exists
        ALTER TABLE chat_messages ALTER COLUMN chat_session_id DROP NOT NULL;
        RAISE NOTICE 'Made chat_session_id nullable';
    END IF;
END $$; 