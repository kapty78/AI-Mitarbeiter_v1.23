-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to profiles table
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_organization_id TEXT,
ADD COLUMN IF NOT EXISTS google_gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS mistral_api_key TEXT,
ADD COLUMN IF NOT EXISTS groq_api_key TEXT,
ADD COLUMN IF NOT EXISTS perplexity_api_key TEXT,
ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_endpoint TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_35_turbo_id TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_45_turbo_id TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_45_vision_id TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_embeddings_id TEXT;

-- Create assistants table if it doesn't exist
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  context_length INTEGER NOT NULL DEFAULT 4000,
  description TEXT,
  embeddings_provider TEXT NOT NULL DEFAULT 'openai',
  folder_id UUID,
  image_path TEXT,
  include_profile_context BOOLEAN NOT NULL DEFAULT false,
  include_workspace_instructions BOOLEAN NOT NULL DEFAULT false,
  model TEXT NOT NULL,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  sharing TEXT NOT NULL DEFAULT 'private',
  temperature DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create assistant_workspaces table if it doesn't exist
CREATE TABLE IF NOT EXISTS assistant_workspaces (
  assistant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (assistant_id, workspace_id)
);

-- Create a view for simpler querying
CREATE OR REPLACE VIEW user_profile_view AS
SELECT 
  u.id as user_id, 
  p.id as profile_id,
  p.display_name,
  p.username,
  p.has_onboarded
FROM 
  auth.users u
LEFT JOIN 
  profiles p ON u.id = p.user_id;

-- Populate default API keys for existing profiles
UPDATE profiles 
SET
  openai_api_key = (SELECT current_setting('app.openai_api_key', true)),
  anthropic_api_key = (SELECT current_setting('app.anthropic_api_key', true))
WHERE 
  openai_api_key IS NULL OR openai_api_key = '';

-- Create function to set API keys for new users
CREATE OR REPLACE FUNCTION set_default_api_keys()
RETURNS TRIGGER AS $$
BEGIN
  NEW.openai_api_key := (SELECT current_setting('app.openai_api_key', true));
  NEW.anthropic_api_key := (SELECT current_setting('app.anthropic_api_key', true));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set API keys for new profiles
DROP TRIGGER IF EXISTS set_api_keys_on_insert ON profiles;
CREATE TRIGGER set_api_keys_on_insert
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_default_api_keys(); 