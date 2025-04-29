-- This migration adds missing columns to the chats table if they don't exist
DO $$ 
BEGIN 
  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chats' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.chats ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to chats table';
  ELSE
    RAISE NOTICE 'description column already exists in chats table';
  END IF;

  -- Add sharing column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chats' 
    AND column_name = 'sharing'
  ) THEN
    ALTER TABLE public.chats ADD COLUMN sharing TEXT DEFAULT 'private';
    RAISE NOTICE 'Added sharing column to chats table';
  ELSE
    RAISE NOTICE 'sharing column already exists in chats table';
  END IF;
END $$; 