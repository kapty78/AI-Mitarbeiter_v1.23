-- Add workspace_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
    -- Check if workspace_id column already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'workspace_id') THEN
        -- Add workspace_id column with foreign key reference
        ALTER TABLE tasks ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
        
        -- Create index on workspace_id
        CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
        
        RAISE NOTICE 'Added workspace_id column to tasks table';
    ELSE
        RAISE NOTICE 'workspace_id column already exists in tasks table';
    END IF;
END $$;

-- Ensure tasks table exists with proper structure
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    due_date TIMESTAMPTZ,
    tags TEXT[],
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id),
    system_prompt TEXT,
    ai_model TEXT
);

-- Ensure RLS policies exist for workspace access
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view workspace tasks') THEN
        -- Create policy for viewing workspace tasks
        CREATE POLICY "Users can view workspace tasks" ON tasks
            FOR SELECT
            USING (
                workspace_id IN (
                    SELECT workspace_id FROM workspace_members
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created RLS policy for viewing workspace tasks';
    ELSE
        RAISE NOTICE 'RLS policy for workspace tasks already exists';
    END IF;
    
    -- Check if the policy already exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can modify workspace tasks') THEN
        -- Create policy for modifying workspace tasks
        CREATE POLICY "Users can modify workspace tasks" ON tasks
            FOR ALL
            USING (
                workspace_id IN (
                    SELECT workspace_id FROM workspace_members
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created RLS policy for modifying workspace tasks';
    ELSE
        RAISE NOTICE 'RLS policy for modifying workspace tasks already exists';
    END IF;
END $$; 