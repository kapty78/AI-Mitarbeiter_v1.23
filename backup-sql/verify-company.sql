-- Überprüfe, ob die Tabelle existiert
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'companies'
) AS "Table exists";

-- Falls die Tabelle nicht existiert, erstelle sie
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Überprüfe, ob die Firma bereits existiert
SELECT * FROM companies WHERE domain = 'ecomtask.de';

-- Falls die Firma nicht existiert, erstelle sie
INSERT INTO companies (name, domain)
VALUES ('EcomTask', 'ecomtask.de')
ON CONFLICT (domain) DO NOTHING;

-- Überprüfe nochmals, ob die Firma existiert
SELECT * FROM companies WHERE domain = 'ecomtask.de';

-- Aktiviere RLS für die Tabelle
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Erstelle eine RLS-Policy, die SELECT für alle authentifizierten Benutzer erlaubt
DROP POLICY IF EXISTS "Allow public read access to companies" ON companies;
CREATE POLICY "Allow public read access to companies"
ON companies FOR SELECT
TO authenticated
USING (true); 