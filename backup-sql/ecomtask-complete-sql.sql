-- Enablen von UUID-v4 Generierung
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add all required columns to profiles table
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_organization_id TEXT,
ADD COLUMN IF NOT EXISTS google_gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS mistral_api_key TEXT,
ADD COLUMN IF NOT EXISTS groq_api_key TEXT,
ADD COLUMN IF NOT EXISTS perplexity_api_key TEXT,
ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT,
ADD COLUMN IF NOT EXISTS use_azure_openai BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS azure_openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_endpoint TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_35_turbo_id TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_45_turbo_id TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_45_vision_id TEXT,
ADD COLUMN IF NOT EXISTS azure_openai_embeddings_id TEXT;

-- Create minimal assistants table
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

-- Create assistant_workspaces junction table
CREATE TABLE IF NOT EXISTS assistant_workspaces (
  assistant_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (assistant_id, workspace_id)
); 