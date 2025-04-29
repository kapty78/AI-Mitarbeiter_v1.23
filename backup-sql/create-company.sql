-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add unique constraint to domain if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'companies_domain_key'
    ) THEN
        ALTER TABLE companies ADD CONSTRAINT companies_domain_key UNIQUE (domain);
    END IF;
END $$;

-- Insert EcomTask company
INSERT INTO companies (name, domain)
VALUES ('EcomTask', 'ecomtask.de')
ON CONFLICT (domain) DO NOTHING;

-- Verify the company exists
SELECT * FROM companies WHERE domain = 'ecomtask.de'; 