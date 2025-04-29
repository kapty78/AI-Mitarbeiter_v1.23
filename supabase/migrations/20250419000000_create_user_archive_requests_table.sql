-- Create a table to store user archive requests
CREATE TABLE IF NOT EXISTS user_archive_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Add comments
COMMENT ON TABLE user_archive_requests IS 'Stores requests to archive users for AI worker training data extraction';
COMMENT ON COLUMN user_archive_requests.status IS 'Status: pending, processing, completed, rejected';

-- Enable RLS
ALTER TABLE user_archive_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for all authenticated users to create records
CREATE POLICY "Authenticated users can create archive requests"
  ON user_archive_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for admins to manage all requests
CREATE POLICY "Admins can manage all user archive requests"
  ON user_archive_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT p.id FROM profiles p WHERE p.role = 'admin'
  ));

-- Create policy for users to view their own requests
CREATE POLICY "Users can view their own archive requests"
  ON user_archive_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requested_by
  );

-- Add an index for faster lookup
CREATE INDEX idx_user_archive_requests_user_id ON user_archive_requests(user_id);
CREATE INDEX idx_user_archive_requests_status ON user_archive_requests(status);

-- Add column to mark users as pending archive in profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'pending_archive') THEN
    
    ALTER TABLE profiles ADD COLUMN pending_archive BOOLEAN DEFAULT false;
    COMMENT ON COLUMN profiles.pending_archive IS 'Flag indicating that a user is pending archival/deletion';
  END IF;
END $$;

-- Create function to update profile pending_archive flag when a request is created
CREATE OR REPLACE FUNCTION update_profile_pending_archive()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET pending_archive = TRUE
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS set_profile_pending_archive ON user_archive_requests;
CREATE TRIGGER set_profile_pending_archive
  AFTER INSERT ON user_archive_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_pending_archive(); 