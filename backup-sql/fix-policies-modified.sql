-- Drop ALL existing policies for the affected tables
BEGIN;

-- Drop all policies for workspaces table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'workspaces'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON workspaces';
    END LOOP;
END $$;

-- Drop all policies for workspace_members table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'workspace_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON workspace_members';
    END LOOP;
END $$;

-- Drop all policies for company_admins table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'company_admins'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON company_admins';
    END LOOP;
END $$;

-- Temporarily disable RLS
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins DISABLE ROW LEVEL SECURITY;

-- Create new simplified policies for workspaces with unique names
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fix_workspaces_view_policy_2024" 
    ON workspaces FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "fix_workspaces_insert_policy_2024" 
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fix_workspaces_update_policy_2024" 
    ON workspaces FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fix_workspaces_delete_policy_2024" 
    ON workspaces FOR DELETE
    USING (auth.uid() = user_id);

-- Create new simplified policies for workspace_members with unique names
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fix_workspace_members_view_policy_2024" 
    ON workspace_members FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

CREATE POLICY "fix_workspace_members_all_policy_2024" 
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

-- Create new simplified policies for company_admins with unique names
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fix_company_admins_view_policy_2024" 
    ON company_admins FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "fix_company_admins_all_policy_2024" 
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

COMMIT; 