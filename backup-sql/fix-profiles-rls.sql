-- Remove existing policies
DROP POLICY IF EXISTS "Profiles can be read by anyone" ON profiles;
DROP POLICY IF EXISTS "Profiles can be created by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owners" ON profiles;

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Profiles can be read by anyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Profiles can be created by authenticated users"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles can be updated by owners"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Reset permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO service_role; 