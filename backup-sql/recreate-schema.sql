-- Aktiviere Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Entferne alle abhängigen Policies zuerst
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;
DROP POLICY IF EXISTS "Allow company admins to update their company" ON companies;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON companies;
DROP POLICY IF EXISTS "Allow public read access to companies" ON companies;

-- Tabelle neu erstellen (mit CASCADE um alle Abhängigkeiten zu löschen)
DROP TABLE IF EXISTS company_admins CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Erstelle die Tabelle explizit im public Schema
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Erstelle die company_admins Tabelle
CREATE TABLE public.company_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(company_id, user_id)
);

-- Wichtig: RLS temporär deaktivieren für Tests
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_admins DISABLE ROW LEVEL SECURITY;

-- Erteile alle Berechtigungen an anon und service_role
GRANT ALL ON TABLE public.companies TO anon, service_role;
GRANT ALL ON TABLE public.company_admins TO anon, service_role;

-- Testdaten einfügen
INSERT INTO public.companies (name, domain)
VALUES ('EcomTask', 'ecomtask.de')
ON CONFLICT (domain) DO NOTHING;

-- Prüfen, ob Tabelle und Daten vorhanden sind
SELECT * FROM public.companies; 