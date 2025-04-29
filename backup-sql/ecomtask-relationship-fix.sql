-- Enablen von UUID-v4 Generierung
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Damit Supabase die Beziehung zwischen workspaces und assistants erkennt, 
-- müssen wir explicit die RLS-Richtlinien und Fremdschlüsselbeziehungen definieren

-- 1. Definiere die Beziehung in der DB (nur wenn nötig)
-- Wir überspringen das Entfernen der Primary Keys, da sie bereits existieren und verwendet werden

-- 2. Definiere die Beziehungen in den Junction-Tabellen

-- 2.1 Junction-Tabelle für Assistants
DROP TABLE IF EXISTS assistant_workspaces;
CREATE TABLE IF NOT EXISTS assistant_workspaces (
  assistant_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (assistant_id, workspace_id),
  FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 2.2 Junction-Tabelle für Collections
DROP TABLE IF EXISTS collection_workspaces;
CREATE TABLE IF NOT EXISTS collection_workspaces (
  collection_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (collection_id, workspace_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 3. RLS-Richtlinien für die Junction-Tabellen

-- 3.1 RLS für Assistants Junction-Tabelle
ALTER TABLE assistant_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assistant workspaces" ON assistant_workspaces;
CREATE POLICY "Users can view their own assistant workspaces" 
ON assistant_workspaces FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own assistant workspaces" ON assistant_workspaces;
CREATE POLICY "Users can insert their own assistant workspaces" 
ON assistant_workspaces FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assistant workspaces" ON assistant_workspaces;
CREATE POLICY "Users can update their own assistant workspaces" 
ON assistant_workspaces FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own assistant workspaces" ON assistant_workspaces;
CREATE POLICY "Users can delete their own assistant workspaces" 
ON assistant_workspaces FOR DELETE
USING (auth.uid() = user_id);

-- 3.2 RLS für Collections Junction-Tabelle
ALTER TABLE collection_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own collection workspaces" ON collection_workspaces;
CREATE POLICY "Users can view their own collection workspaces" 
ON collection_workspaces FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own collection workspaces" ON collection_workspaces;
CREATE POLICY "Users can insert their own collection workspaces" 
ON collection_workspaces FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collection workspaces" ON collection_workspaces;
CREATE POLICY "Users can update their own collection workspaces" 
ON collection_workspaces FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collection workspaces" ON collection_workspaces;
CREATE POLICY "Users can delete their own collection workspaces" 
ON collection_workspaces FOR DELETE
USING (auth.uid() = user_id);

-- 4. Supabase Realtime aktivieren für die Junction-Tabellen
ALTER PUBLICATION supabase_realtime ADD TABLE assistant_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_workspaces;

-- 5. Erstellen eines Beispiel-Assistants (falls nicht vorhanden)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assistants LIMIT 1) THEN
    INSERT INTO assistants (id, user_id, model, name, description, temperature)
    SELECT 
      uuid_generate_v4(),
      auth.uid(),
      'gpt-4-1106-preview',
      'Default Assistant',
      'A helpful assistant that can answer questions',
      0.7;
  END IF;
END $$;

-- 6. Verknüpfe Assistants mit Workspaces (falls nicht bereits verknüpft)
INSERT INTO assistant_workspaces (assistant_id, workspace_id, user_id)
SELECT 
  a.id, 
  w.id, 
  w.user_id
FROM assistants a
CROSS JOIN workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM assistant_workspaces WHERE assistant_id = a.id AND workspace_id = w.id
)
LIMIT 1; 