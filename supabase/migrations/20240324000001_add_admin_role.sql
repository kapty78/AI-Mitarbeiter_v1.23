-- Add role column to users table
ALTER TABLE auth.users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy to allow admins to view all users
CREATE POLICY "Admins can view all users"
ON auth.users
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Create a policy to allow admins to update user roles
CREATE POLICY "Admins can update user roles"
ON auth.users
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid())); 