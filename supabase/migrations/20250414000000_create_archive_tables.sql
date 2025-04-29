-- Erstellen von Archivtabellen für verschiedene Entitäten
-- Diese Tabellen speichern Daten von archivierten Benutzern

-- 1. Archivtabelle für Benutzerprofile
CREATE TABLE IF NOT EXISTS archived_profiles (
  id UUID PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  email TEXT,
  role TEXT,
  company_id UUID,
  metadata JSONB,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID
);

-- 2. Archivtabelle für Chat-Nachrichten
CREATE TABLE IF NOT EXISTS archived_chat_messages (
  id UUID PRIMARY KEY,
  chat_id UUID NOT NULL,
  user_id UUID,
  content TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  model TEXT,
  sentfrom TEXT,
  metadata JSONB,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID
);

-- 3. Archivtabelle für Chats
CREATE TABLE IF NOT EXISTS archived_chats (
  id UUID PRIMARY KEY,
  title TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  description TEXT,
  metadata JSONB,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID
);

-- 4. Archivtabelle für Workspace-Mitgliedschaften
CREATE TABLE IF NOT EXISTS archived_workspace_members (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID
);

-- 5. Archivtabelle für Projektverantwortlichkeiten
CREATE TABLE IF NOT EXISTS archived_project_responsibilities (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID
);

-- RLS-Policies für Archivtabellen
-- Nur Administratoren können auf Archivdaten zugreifen
ALTER TABLE archived_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin kann Archivdaten einsehen" ON archived_profiles
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM company_admins WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

ALTER TABLE archived_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin kann Archivdaten einsehen" ON archived_chat_messages
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM company_admins WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

ALTER TABLE archived_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin kann Archivdaten einsehen" ON archived_chats
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM company_admins WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

ALTER TABLE archived_workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin kann Archivdaten einsehen" ON archived_workspace_members
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM company_admins WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

ALTER TABLE archived_project_responsibilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin kann Archivdaten einsehen" ON archived_project_responsibilities
  FOR SELECT TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM company_admins WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
  ); 