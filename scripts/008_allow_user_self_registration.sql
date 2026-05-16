-- Allow authenticated users to create their own company and user profiles
-- This is needed for the onboarding flow after email confirmation

-- Drop and recreate company insert policy with proper authentication check
DROP POLICY IF EXISTS "companies_insert_authenticated" ON companies;

CREATE POLICY "companies_insert_authenticated"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Drop and recreate user insert policy  
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;

CREATE POLICY "users_insert_authenticated"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Grant necessary permissions to authenticated role
GRANT INSERT ON companies TO authenticated;
GRANT INSERT ON users TO authenticated;
GRANT SELECT ON companies TO authenticated;
GRANT SELECT ON users TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
