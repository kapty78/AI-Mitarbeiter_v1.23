-- Zuerst alle existierenden Policies für companies entfernen
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON companies;
DROP POLICY IF EXISTS "Companies can be read by anyone" ON companies;
DROP POLICY IF EXISTS "Companies can be created by authenticated users" ON companies;

-- RLS temporär deaktivieren
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Neue, einfachere Policies erstellen
CREATE POLICY "Companies can be read by anyone"
ON companies FOR SELECT
USING (true);

CREATE POLICY "Companies can be created by authenticated users"
ON companies FOR INSERT
WITH CHECK (true);

-- RLS wieder aktivieren
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Berechtigungen neu setzen
GRANT ALL ON companies TO authenticated;
GRANT ALL ON companies TO anon;
GRANT ALL ON companies TO service_role;

-- Create Company Funktion erstellen
CREATE OR REPLACE FUNCTION create_company(company_name text, company_domain text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Dies ist wichtig, damit die Funktion mit den Berechtigungen des Erstellers läuft
AS $$
DECLARE
    new_company_id uuid;
    result json;
BEGIN
    INSERT INTO companies (name, domain)
    VALUES (company_name, company_domain)
    RETURNING id INTO new_company_id;
    
    SELECT json_build_object(
        'id', new_company_id,
        'name', company_name,
        'domain', company_domain
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'error', 'Company with this domain already exists',
            'code', SQLSTATE
        );
    WHEN others THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'code', SQLSTATE
        );
END;
$$; 