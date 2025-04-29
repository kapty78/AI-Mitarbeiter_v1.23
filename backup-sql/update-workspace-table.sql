-- Dieses Skript aktualisiert die Tabelle workspaces für Team-Funktionalität

-- Prüfen, ob die workspaces Tabelle existiert
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'workspaces'
  ) THEN
    -- Prüfen und hinzufügen der is_team Spalte
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'workspaces' 
      AND column_name = 'is_team'
    ) THEN
      ALTER TABLE public.workspaces 
      ADD COLUMN is_team BOOLEAN DEFAULT false;
      
      RAISE NOTICE 'Spalte is_team zur Tabelle workspaces hinzugefügt';
    ELSE
      RAISE NOTICE 'Spalte is_team existiert bereits in der Tabelle workspaces';
    END IF;
    
    -- Prüfen und hinzufügen der settings Spalte (für workspace-spezifische Einstellungen)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'workspaces' 
      AND column_name = 'settings'
    ) THEN
      ALTER TABLE public.workspaces 
      ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
      
      RAISE NOTICE 'Spalte settings zur Tabelle workspaces hinzugefügt';
    ELSE
      RAISE NOTICE 'Spalte settings existiert bereits in der Tabelle workspaces';
    END IF;
    
    -- Prüfen und hinzufügen des sharing-Feldes für Workspace-Zugriff
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'workspaces' 
      AND column_name = 'sharing'
    ) THEN
      ALTER TABLE public.workspaces 
      ADD COLUMN sharing TEXT DEFAULT 'private' 
      CHECK (sharing IN ('private', 'team', 'public'));
      
      RAISE NOTICE 'Spalte sharing zur Tabelle workspaces hinzugefügt';
    ELSE
      RAISE NOTICE 'Spalte sharing existiert bereits in der Tabelle workspaces';
    END IF;
    
    -- RLS (Row Level Security) Policies aktualisieren - für Team-Zugriff
    -- Zugriff auf eigene und Team-Workspaces ermöglichen
    DROP POLICY IF EXISTS workspaces_policy ON public.workspaces;
    
    CREATE POLICY workspaces_user_policy ON public.workspaces
      FOR SELECT
      USING (
        user_id = auth.uid() OR 
        id IN (
          SELECT workspace_id FROM public.workspace_members 
          WHERE user_id = auth.uid()
        )
      );
      
    CREATE POLICY workspaces_owner_policy ON public.workspaces
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    RAISE NOTICE 'RLS-Policies für Workspaces wurden aktualisiert';
    
  ELSE
    RAISE EXCEPTION 'Tabelle workspaces existiert nicht. Bitte zuerst die Workspace-Tabelle erstellen.';
  END IF;
END $$; 