-- Aktiviere RLS für die Tabelle, falls nicht bereits aktiviert
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Entferne alle vorhandenen Policies (um zu vermeiden, dass sich Policies gegenseitig blockieren)
DROP POLICY IF EXISTS "Allow public read access to companies" ON companies;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON companies;
DROP POLICY IF EXISTS "Allow users to create companies" ON companies;

-- Erstelle eine neue Policy für anonyme und authentifizierte Benutzer
CREATE POLICY "companies_select_policy" 
ON companies FOR SELECT 
TO PUBLIC
USING (true);

-- Erstelle eine Policy für Inserts (optional, wenn Benutzer Firmen erstellen sollen)
CREATE POLICY "companies_insert_policy" 
ON companies FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Überprüfe, ob die Policies korrekt erstellt wurden
SELECT * FROM pg_policies WHERE tablename = 'companies'; 