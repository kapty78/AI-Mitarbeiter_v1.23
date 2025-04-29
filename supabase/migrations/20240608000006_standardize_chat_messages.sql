-- Standardize chat_messages table structure

-- First, check if table exists, if not create it with proper structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        CREATE TABLE chat_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            chat_id UUID,
            chat_session_id UUID,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created chat_messages table from scratch';
    ELSE
        RAISE NOTICE 'chat_messages table already exists';
    END IF;
END $$;

-- Make sure all necessary columns exist
DO $$ 
BEGIN
    -- Add chat_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'chat_messages' AND column_name = 'chat_id') THEN
        ALTER TABLE chat_messages ADD COLUMN chat_id UUID;
        RAISE NOTICE 'Added chat_id column to chat_messages';
    END IF;
    
    -- Add chat_session_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'chat_messages' AND column_name = 'chat_session_id') THEN
        ALTER TABLE chat_messages ADD COLUMN chat_session_id UUID;
        RAISE NOTICE 'Added chat_session_id column to chat_messages';
    END IF;
    
    -- Make sure both chat_id and chat_session_id allow NULL values
    BEGIN
        ALTER TABLE chat_messages ALTER COLUMN chat_id DROP NOT NULL;
        RAISE NOTICE 'Made chat_id nullable';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'chat_id is already nullable or another error occurred';
    END;
    
    BEGIN
        ALTER TABLE chat_messages ALTER COLUMN chat_session_id DROP NOT NULL;
        RAISE NOTICE 'Made chat_session_id nullable';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'chat_session_id is already nullable or another error occurred';
    END;
END $$;

-- Ensure data integrity: if one ID column is NULL but the other isn't, copy the values
UPDATE chat_messages
SET chat_id = chat_session_id
WHERE chat_id IS NULL AND chat_session_id IS NOT NULL;

UPDATE chat_messages
SET chat_session_id = chat_id
WHERE chat_session_id IS NULL AND chat_id IS NOT NULL; 