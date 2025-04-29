-- Dieses Skript erstellt die Tabelle workspace_members für Team-Workspaces

-- Prüfen, ob die Tabelle bereits existiert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'workspace_members'
  ) THEN
    -- Tabelle für Workspace-Mitglieder erstellen
    CREATE TABLE public.workspace_members (
      workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      PRIMARY KEY (workspace_id, user_id)
    );

    -- Indizes für schnellere Abfragen
    CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
    CREATE INDEX idx_workspace_members_user_id ON public.workspace_members(user_id);

    -- RLS (Row Level Security) Policies
    ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
    
    -- Workspace-Besitzer und Admins können Mitglieder verwalten
    CREATE POLICY workspace_members_admin_policy ON public.workspace_members
      USING (
        workspace_id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ) OR
        workspace_id IN (
          SELECT id FROM public.workspaces 
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ) OR
        workspace_id IN (
          SELECT id FROM public.workspaces 
          WHERE user_id = auth.uid()
        )
      );

    -- Alle Mitglieder können die Mitgliederliste sehen
    CREATE POLICY workspace_members_view_policy ON public.workspace_members
      FOR SELECT
      USING (
        workspace_id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid()
        ) OR
        workspace_id IN (
          SELECT id FROM public.workspaces 
          WHERE user_id = auth.uid()
        )
      );

    -- Trigger für updated_at Aktualisierung
    CREATE TRIGGER update_workspace_members_updated_at
    BEFORE UPDATE ON public.workspace_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE 'Tabelle workspace_members wurde erstellt';
  ELSE
    RAISE NOTICE 'Tabelle workspace_members existiert bereits';
  END IF;
END $$; 