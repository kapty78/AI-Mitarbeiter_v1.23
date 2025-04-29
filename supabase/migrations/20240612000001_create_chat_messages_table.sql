-- This migration creates or updates the chat_messages table with all required columns
DO $$ 
BEGIN 
  -- First, check if the chat_messages table exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_messages'
  ) THEN
    CREATE TABLE public.chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id UUID NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Add foreign key to chats table
    ALTER TABLE public.chat_messages 
      ADD CONSTRAINT fk_chat_messages_chat_id 
      FOREIGN KEY (chat_id) 
      REFERENCES public.chats(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Created chat_messages table';
  ELSE
    -- Check for each column and add if missing
    
    -- Check for chat_id column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_messages' 
      AND column_name = 'chat_id'
    ) THEN
      ALTER TABLE public.chat_messages ADD COLUMN chat_id UUID NOT NULL;
      RAISE NOTICE 'Added chat_id column to chat_messages table';
    END IF;
    
    -- Check for role column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_messages' 
      AND column_name = 'role'
    ) THEN
      ALTER TABLE public.chat_messages ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
      RAISE NOTICE 'Added role column to chat_messages table';
    END IF;
    
    -- Check for content column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_messages' 
      AND column_name = 'content'
    ) THEN
      ALTER TABLE public.chat_messages ADD COLUMN content TEXT NOT NULL DEFAULT '';
      RAISE NOTICE 'Added content column to chat_messages table';
    END IF;
    
    -- Check for created_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_messages' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.chat_messages ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
      RAISE NOTICE 'Added created_at column to chat_messages table';
    END IF;
    
    -- Check for updated_at column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_messages' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.chat_messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
      RAISE NOTICE 'Added updated_at column to chat_messages table';
    END IF;
    
    -- Add foreign key if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'chat_messages'
      AND constraint_name = 'fk_chat_messages_chat_id'
    ) THEN
      ALTER TABLE public.chat_messages 
        ADD CONSTRAINT fk_chat_messages_chat_id 
        FOREIGN KEY (chat_id) 
        REFERENCES public.chats(id) 
        ON DELETE CASCADE;
      
      RAISE NOTICE 'Added foreign key constraint to chat_messages table';
    END IF;
  END IF;
END $$; 