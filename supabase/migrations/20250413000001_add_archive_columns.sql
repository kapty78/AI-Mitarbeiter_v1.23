-- Diese Migration ist obsolet, da wir jetzt Archiv-Tabellen verwenden
-- Die Spalten "archived" und "archived_at" werden nicht mehr benötigt

-- Zuerst RLS-Policies entfernen, falls sie existieren
DROP POLICY IF EXISTS "Archivierte Profile ausblenden" ON profiles;
DROP POLICY IF EXISTS "Archivierte Nachrichten ausblenden" ON chat_messages;
DROP POLICY IF EXISTS "Archivierte Chats ausblenden" ON chats;
DROP POLICY IF EXISTS "Archivierte Workspace-Mitgliedschaften ausblenden" ON workspace_members;
DROP POLICY IF EXISTS "Archivierte Projektverantwortlichkeiten ausblenden" ON project_responsibilities;

-- Dann für den Fall, dass die Spalten bereits hinzugefügt wurden, entfernen wir sie wieder
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'archived') THEN
        ALTER TABLE profiles DROP COLUMN archived;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'profiles' 
              AND column_name = 'archived_at') THEN
        ALTER TABLE profiles DROP COLUMN archived_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'chat_messages' 
              AND column_name = 'archived') THEN
        ALTER TABLE chat_messages DROP COLUMN archived;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'chat_messages' 
              AND column_name = 'archived_at') THEN
        ALTER TABLE chat_messages DROP COLUMN archived_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'chats' 
              AND column_name = 'archived') THEN
        ALTER TABLE chats DROP COLUMN archived;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'chats' 
              AND column_name = 'archived_at') THEN
        ALTER TABLE chats DROP COLUMN archived_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'workspace_members' 
              AND column_name = 'archived') THEN
        ALTER TABLE workspace_members DROP COLUMN archived;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'workspace_members' 
              AND column_name = 'archived_at') THEN
        ALTER TABLE workspace_members DROP COLUMN archived_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'project_responsibilities' 
              AND column_name = 'archived') THEN
        ALTER TABLE project_responsibilities DROP COLUMN archived;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'project_responsibilities' 
              AND column_name = 'archived_at') THEN
        ALTER TABLE project_responsibilities DROP COLUMN archived_at;
    END IF;
END
$$; 