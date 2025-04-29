-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add username column if it doesn't exist
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add columns needed for API keys
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_organization_id TEXT;

-- Create assistants table if it doesn't exist (minimal version)
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  context_length INTEGER NOT NULL DEFAULT 4000,
  description TEXT,
  model TEXT NOT NULL,
  name TEXT NOT NULL,
  temperature DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Simple assistant_workspaces junction table
CREATE TABLE IF NOT EXISTS assistant_workspaces (
  assistant_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (assistant_id, workspace_id)
); 