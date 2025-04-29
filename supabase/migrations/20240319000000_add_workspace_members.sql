-- Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    -- ID and relationships
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role information
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Make workspace_id and user_id combination unique
    PRIMARY KEY(workspace_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);

-- Enable RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view members of their workspaces"
    ON public.workspace_members
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM public.workspace_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace owners and admins can manage members"
    ON public.workspace_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.workspace_members 
            WHERE workspace_id = workspace_members.workspace_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Create function to get available users for workspace
CREATE OR REPLACE FUNCTION public.get_available_workspace_users(workspace_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    workspace_company_id UUID;
BEGIN
    -- Get the company_id for the workspace
    SELECT company_id INTO workspace_company_id
    FROM public.workspaces
    WHERE id = $1;

    -- Check if the calling user has permission to view workspace members
    IF NOT EXISTS (
        SELECT 1 
        FROM public.workspace_members 
        WHERE workspace_members.workspace_id = $1
        AND user_id = auth.uid()
    ) THEN
        RETURN;
    END IF;

    -- Return users from the same company who are not yet workspace members
    RETURN QUERY
    SELECT DISTINCT
        u.id as user_id,
        u.email,
        p.full_name
    FROM auth.users u
    JOIN public.profiles p ON p.user_id = u.id
    -- Join with company_admins to get the company_id
    JOIN public.company_admins ca ON ca.company_id = workspace_company_id
    WHERE NOT EXISTS (
        SELECT 1 
        FROM public.workspace_members wm 
        WHERE wm.workspace_id = $1 
        AND wm.user_id = u.id
    )
    AND u.id <> auth.uid() -- Exclude the current user
    ORDER BY p.full_name;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_available_workspace_users(UUID) TO authenticated;

-- ==================================================================
-- NEW FUNCTION: Get workspace members with email and full name
-- ==================================================================
CREATE OR REPLACE FUNCTION public.get_workspace_members_with_details(p_workspace_id UUID)
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    email TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Optional: Add permission check if needed, similar to get_available_workspace_users
    -- IF NOT EXISTS (
    --     SELECT 1 
    --     FROM public.workspace_members 
    --     WHERE workspace_members.workspace_id = p_workspace_id
    --     AND user_id = auth.uid()
    -- ) THEN
    --     RETURN;
    -- END IF;

    RETURN QUERY
    SELECT 
        wm.user_id,
        wm.role,
        u.email,
        p.full_name
    FROM public.workspace_members wm
    JOIN auth.users u ON wm.user_id = u.id
    LEFT JOIN public.profiles p ON wm.user_id = p.user_id
    WHERE wm.workspace_id = p_workspace_id;
END;
$$;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.get_workspace_members_with_details(UUID) TO authenticated; 