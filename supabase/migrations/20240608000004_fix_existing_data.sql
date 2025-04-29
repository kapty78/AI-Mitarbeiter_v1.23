-- Fix any existing data issues

-- Update any NULL chat names
UPDATE chats
SET name = 'Neuer Chat'
WHERE name IS NULL;

-- Ensure description exists in all chats
DO $$ 
BEGIN
    -- Check if description column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'chats' AND column_name = 'description') THEN
        -- Update NULL descriptions
        UPDATE chats
        SET description = 'Chat erstellt am ' || to_char(created_at, 'DD.MM.YYYY HH24:MI')
        WHERE description IS NULL;
        
        RAISE NOTICE 'Updated NULL descriptions in chats table';
    END IF;
END $$;

-- Ensure workspace_id exists
DO $$ 
BEGIN
    -- Check if workspace_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'chats' AND column_name = 'workspace_id') THEN
        -- Ensure workspace_id is NULL where not specified
        UPDATE chats
        SET workspace_id = NULL
        WHERE workspace_id IS NULL;
        
        RAISE NOTICE 'Validated workspace_id in chats table';
    END IF;
END $$; 