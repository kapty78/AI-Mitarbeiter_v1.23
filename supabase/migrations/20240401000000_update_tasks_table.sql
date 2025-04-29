-- Überprüfe und füge fehlende Spalten hinzu
DO $$ 
BEGIN
    -- Füge system_prompt hinzu, falls nicht vorhanden
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'system_prompt') THEN
        ALTER TABLE tasks ADD COLUMN system_prompt TEXT NOT NULL DEFAULT '';
    END IF;

    -- Füge preferred_model hinzu, falls nicht vorhanden
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'preferred_model') THEN
        ALTER TABLE tasks ADD COLUMN preferred_model VARCHAR(100) NOT NULL DEFAULT 'claude-3-opus-20240229';
    END IF;

    -- Füge workspace_id hinzu, falls nicht vorhanden
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'workspace_id') THEN
        ALTER TABLE tasks ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;

    -- Stelle sicher, dass RLS aktiviert ist
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

    -- Überprüfe und erstelle fehlende Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view their own tasks') THEN
        CREATE POLICY "Users can view their own tasks"
            ON tasks FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can insert their own tasks') THEN
        CREATE POLICY "Users can insert their own tasks"
            ON tasks FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update their own tasks') THEN
        CREATE POLICY "Users can update their own tasks"
            ON tasks FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can delete their own tasks') THEN
        CREATE POLICY "Users can delete their own tasks"
            ON tasks FOR DELETE
            USING (auth.uid() = user_id);
    END IF;

    -- Überprüfe und erstelle fehlende Indizes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tasks' AND indexname = 'tasks_user_id_idx') THEN
        CREATE INDEX tasks_user_id_idx ON tasks(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tasks' AND indexname = 'tasks_workspace_id_idx') THEN
        CREATE INDEX tasks_workspace_id_idx ON tasks(workspace_id);
    END IF;

END $$; 