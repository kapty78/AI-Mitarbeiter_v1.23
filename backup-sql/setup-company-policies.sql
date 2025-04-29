-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow public read access to companies table
CREATE POLICY "Allow public read access to companies"
ON companies FOR SELECT
TO authenticated
USING (true);

-- Allow company admins to update their company
CREATE POLICY "Allow company admins to update their company"
ON companies FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM company_admins
        WHERE company_admins.company_id = companies.id
        AND company_admins.user_id = auth.uid()
    )
);

-- Allow users to create companies
CREATE POLICY "Allow users to create companies"
ON companies FOR INSERT
TO authenticated
WITH CHECK (true); 