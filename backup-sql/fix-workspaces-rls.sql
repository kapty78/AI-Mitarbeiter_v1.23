-- Remove existing policies
DROP POLICY IF EXISTS "Workspaces can be read by workspace members" ON workspaces;
DROP POLICY IF EXISTS "Workspaces can be created by authenticated users" ON workspaces;
DROP POLICY IF EXISTS "Workspaces can be updated by workspace owner" ON workspaces;
DROP POLICY IF EXISTS "Workspaces can be deleted by workspace owner" ON workspaces;

-- Temporarily disable RLS
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Workspaces can be read by workspace members"
ON workspaces FOR SELECT
USING (true);

CREATE POLICY "Workspaces can be created by authenticated users"
ON workspaces FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workspaces can be updated by workspace owner"
ON workspaces FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workspaces can be deleted by workspace owner"
ON workspaces FOR DELETE
USING (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Reset permissions
GRANT ALL ON workspaces TO authenticated;
GRANT ALL ON workspaces TO anon;
GRANT ALL ON workspaces TO service_role; 