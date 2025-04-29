-- Add name column to chats table if it doesn't exist
DO $$ 
BEGIN
    -- Check if name column already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chats' AND column_name = 'name') THEN
        -- Add name column
        ALTER TABLE chats ADD COLUMN name TEXT;
        
        RAISE NOTICE 'Added name column to chats table';
    ELSE
        RAISE NOTICE 'name column already exists in chats table';
    END IF;
END $$;

-- Create a function that can safely update chat titles using either name or title
CREATE OR REPLACE FUNCTION safe_update_chat_title(chat_id_param UUID, new_title TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if the name column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'name'
    ) INTO column_exists;
    
    IF column_exists THEN
        -- Update using the name column
        UPDATE chats
        SET name = new_title
        WHERE id = chat_id_param
        AND user_id = auth.uid();
    ELSE
        RAISE EXCEPTION 'Neither name nor title column exists in chats table';
    END IF;
END;
$$; 