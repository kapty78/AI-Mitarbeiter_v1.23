-- Add description column to chats table if it doesn't exist
DO $$ 
BEGIN
    -- Check if description column already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chats' AND column_name = 'description') THEN
        -- Add description column
        ALTER TABLE chats ADD COLUMN description TEXT;
        
        RAISE NOTICE 'Added description column to chats table';
    ELSE
        RAISE NOTICE 'description column already exists in chats table';
    END IF;
END $$; 