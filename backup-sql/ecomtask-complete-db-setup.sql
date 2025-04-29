-- Vollständiges SQL-Skript für die EcomTask-Datenbank
-- Enablen von UUID-v4 Generierung
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------- HAUPTTABELLEN --------------------

-- Workspaces Tabelle - zentrale Organisationseinheit
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  is_home BOOLEAN NOT NULL DEFAULT false,
  default_context_length INTEGER,
  default_model TEXT,
  default_prompt TEXT,
  default_temperature DOUBLE PRECISION,
  embeddings_provider TEXT,
  include_profile_context BOOLEAN DEFAULT true,
  include_workspace_instructions BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles Tabelle - Benutzerprofile
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  has_onboarded BOOLEAN DEFAULT false,
  anthropic_api_key TEXT,
  openai_api_key TEXT,
  openai_organization_id TEXT,
  google_gemini_api_key TEXT,
  mistral_api_key TEXT,
  groq_api_key TEXT,
  perplexity_api_key TEXT,
  openrouter_api_key TEXT,
  use_azure_openai BOOLEAN DEFAULT false,
  azure_openai_api_key TEXT,
  azure_openai_endpoint TEXT,
  azure_openai_35_turbo_id TEXT,
  azure_openai_45_turbo_id TEXT,
  azure_openai_45_vision_id TEXT,
  azure_openai_embeddings_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Folders Tabelle - zur Organisation von Ressourcen
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes für Folders
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON folders(user_id);
CREATE INDEX IF NOT EXISTS folders_workspace_id_idx ON folders(workspace_id);

-- RLS für Folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own folders"
    ON folders
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Assistants Tabelle - KI-Assistenten
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  context_length INTEGER NOT NULL DEFAULT 4000,
  description TEXT,
  embeddings_provider TEXT NOT NULL DEFAULT 'openai',
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  image_path TEXT,
  include_profile_context BOOLEAN NOT NULL DEFAULT false,
  include_workspace_instructions BOOLEAN NOT NULL DEFAULT false,
  model TEXT NOT NULL,
  name TEXT NOT NULL,
  temperature DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Collections Tabelle - Sammlungen von Ressourcen
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Files Tabelle - hochgeladene Dateien
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  size BIGINT NOT NULL,
  tokens INTEGER,
  sharing TEXT NOT NULL DEFAULT 'private',
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tools Tabelle - Erweiterungen
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Models Tabelle - verfügbare KI-Modelle
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Presets Tabelle - vordefinierte Einstellungen
CREATE TABLE IF NOT EXISTS presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Prompts Tabelle - vordefinierte Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Chats Tabelle - Chatverläufe
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Messages Tabelle - einzelne Chat-Nachrichten
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ------------------- JUNCTION-TABELLEN --------------------

-- Junction-Tabelle für Assistants und Workspaces
CREATE TABLE IF NOT EXISTS assistant_workspaces (
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (assistant_id, workspace_id)
);

-- Junction-Tabelle für Collections und Workspaces
CREATE TABLE IF NOT EXISTS collection_workspaces (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (collection_id, workspace_id)
);

-- Junction-Tabelle für Files und Workspaces
CREATE TABLE IF NOT EXISTS file_workspaces (
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (file_id, workspace_id)
);

-- Junction-Tabelle für Tools und Workspaces
CREATE TABLE IF NOT EXISTS tool_workspaces (
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (tool_id, workspace_id)
);

-- Junction-Tabelle für Models und Workspaces
CREATE TABLE IF NOT EXISTS model_workspaces (
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (model_id, workspace_id)
);

-- Junction-Tabelle für Presets und Workspaces
CREATE TABLE IF NOT EXISTS preset_workspaces (
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (preset_id, workspace_id)
);

-- Junction-Tabelle für Prompts und Workspaces
CREATE TABLE IF NOT EXISTS prompt_workspaces (
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (prompt_id, workspace_id)
);

-- ------------------- ROW LEVEL SECURITY (RLS) --------------------

-- RLS für Workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'workspaces' AND policyname = 'Users can view their own workspaces'
    ) THEN
        CREATE POLICY "Users can view their own workspaces" 
        ON workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS für Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view their own profiles'
    ) THEN
        CREATE POLICY "Users can view their own profiles" 
        ON profiles FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS für assistants und junction
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assistants' AND policyname = 'Users can view their own assistants'
    ) THEN
        CREATE POLICY "Users can view their own assistants" 
        ON assistants FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

ALTER TABLE assistant_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assistant_workspaces' AND policyname = 'Users can view their own assistant workspaces'
    ) THEN
        CREATE POLICY "Users can view their own assistant workspaces" 
        ON assistant_workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS für collections und junction
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'collections' AND policyname = 'Users can view their own collections'
    ) THEN
        CREATE POLICY "Users can view their own collections" 
        ON collections FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

ALTER TABLE collection_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'collection_workspaces' AND policyname = 'Users can view their own collection workspaces'
    ) THEN
        CREATE POLICY "Users can view their own collection workspaces" 
        ON collection_workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS für files und junction
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'files' AND policyname = 'Users can view their own files'
    ) THEN
        CREATE POLICY "Users can view their own files" 
        ON files FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

ALTER TABLE file_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'file_workspaces' AND policyname = 'Users can view their own file workspaces'
    ) THEN
        CREATE POLICY "Users can view their own file workspaces" 
        ON file_workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS für andere Junction-Tabellen
ALTER TABLE tool_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tool_workspaces' AND policyname = 'Users can view their own tool workspaces'
    ) THEN
        CREATE POLICY "Users can view their own tool workspaces" 
        ON tool_workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

ALTER TABLE model_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'model_workspaces' AND policyname = 'Users can view their own model workspaces'
    ) THEN
        CREATE POLICY "Users can view their own model workspaces" 
        ON model_workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

ALTER TABLE preset_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'preset_workspaces' AND policyname = 'Users can view their own preset workspaces'
    ) THEN
        CREATE POLICY "Users can view their own preset workspaces" 
        ON preset_workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

ALTER TABLE prompt_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prompt_workspaces' AND policyname = 'Users can view their own prompt workspaces'
    ) THEN
        CREATE POLICY "Users can view their own prompt workspaces" 
        ON prompt_workspaces FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- ------------------- SUPABASE REALTIME --------------------

-- Realtime für Junction-Tabellen aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE assistant_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE collection_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE file_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE tool_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE model_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE preset_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE prompt_workspaces; 