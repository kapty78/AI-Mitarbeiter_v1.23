-- This migration creates or updates the chats table with all required columns
DO $$ 
BEGIN 
  -- First, check if the chats table exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chats'
  ) THEN
    CREATE TABLE public.chats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      workspace_id UUID,
      title TEXT NOT NULL,
      description TEXT,
      sharing TEXT DEFAULT 'private',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    RAISE NOTICE 'Created chats table';
  ELSE
    -- Check for each column and add if missing
    
    -- Check for title column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chats' 
      AND column_name = 'title'
    ) THEN
      ALTER TABLE public.chats ADD COLUMN title TEXT NOT NULL DEFAULT 'Neuer Chat';
      RAISE NOTICE 'Added title column to chats table';
    END IF;
    
    -- Check for description column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chats' 
      AND column_name = 'description'
    ) THEN
      ALTER TABLE public.chats ADD COLUMN description TEXT;
      RAISE NOTICE 'Added description column to chats table';
    END IF;
    
    -- Check for sharing column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chats' 
      AND column_name = 'sharing'
    ) THEN
      ALTER TABLE public.chats ADD COLUMN sharing TEXT DEFAULT 'private';
      RAISE NOTICE 'Added sharing column to chats table';
    END IF;
    
    -- Check for workspace_id column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chats' 
      AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE public.chats ADD COLUMN workspace_id UUID;
      RAISE NOTICE 'Added workspace_id column to chats table';
    END IF;
    
    -- Check for created_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chats' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.chats ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
      RAISE NOTICE 'Added created_at column to chats table';
    END IF;
    
    -- Check for updated_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chats' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.chats ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
      RAISE NOTICE 'Added updated_at column to chats table';
    END IF;
  END IF;
END $$; 