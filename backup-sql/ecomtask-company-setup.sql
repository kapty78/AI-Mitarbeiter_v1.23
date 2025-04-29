-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add company_id to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';

-- Create company_admins table for tracking company administrators
CREATE TABLE IF NOT EXISTS company_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(company_id, user_id)
);

-- Add RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Companies are viewable by members" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;
DROP POLICY IF EXISTS "Company admins are viewable by company members" ON company_admins;
DROP POLICY IF EXISTS "Users can INSERT into companies" ON companies;
DROP POLICY IF EXISTS "Users can INSERT into company_admins" ON company_admins;
DROP POLICY IF EXISTS "Users can view company workspaces" ON workspaces;

-- Companies can be viewed by their members
CREATE POLICY "Companies are viewable by members" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Company admins can update their company
CREATE POLICY "Company admins can update their company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id 
      FROM company_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Company admins table policies
CREATE POLICY "Company admins are viewable by company members" ON company_admins
  FOR SELECT USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create a default company for testing
INSERT INTO companies (name, domain)
VALUES ('EcomTask', 'ecomtask.de')
ON CONFLICT DO NOTHING;

-- Create test company and insert RLS
CREATE POLICY "Users can INSERT into companies" ON companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can INSERT into company_admins" ON company_admins
  FOR INSERT WITH CHECK (true);

-- Update workspaces to include company_id
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create workspace policies
CREATE POLICY "Users can view company workspaces" ON workspaces
  FOR SELECT USING (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  ); 