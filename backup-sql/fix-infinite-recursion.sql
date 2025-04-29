-- Drop existing problematic policies
DROP POLICY IF EXISTS "Workspaces can be read by workspace members" ON workspaces;
DROP POLICY IF EXISTS "Workspaces can be created by authenticated users" ON workspaces;
DROP POLICY IF EXISTS "Workspaces can be updated by workspace owner" ON workspaces;
DROP POLICY IF EXISTS "Workspaces can be deleted by workspace owner" ON workspaces;
DROP POLICY IF EXISTS "workspaces_user_policy" ON workspaces;
DROP POLICY IF EXISTS "workspaces_owner_policy" ON workspaces;
DROP POLICY IF EXISTS "workspace_members_admin_policy" ON workspace_members;
DROP POLICY IF EXISTS "company_admins_policy" ON company_admins;

-- Temporarily disable RLS
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins DISABLE ROW LEVEL SECURITY;

-- Create new simplified policies for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workspaces"
    ON workspaces FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces"
    ON workspaces FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces"
    ON workspaces FOR DELETE
    USING (auth.uid() = user_id);

-- Create new simplified policies for workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workspace members"
    ON workspace_members FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

CREATE POLICY "Users can manage workspace members"
    ON workspace_members FOR ALL
    USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM workspaces WHERE user_id = auth.uid()
        )
    );

-- Create new simplified policies for company_admins
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view company admins"
    ON company_admins FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage company admins"
    ON company_admins FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Reset permissions
GRANT ALL ON workspaces TO authenticated;
GRANT ALL ON workspace_members TO authenticated;
GRANT ALL ON company_admins TO authenticated; 