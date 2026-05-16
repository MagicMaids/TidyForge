-- Fix RLS policies to allow user profile creation during onboarding
-- The issue is that INSERT policies need proper WITH CHECK conditions

-- Drop existing insert policies
DROP POLICY IF EXISTS "companies_insert_authenticated" ON companies;
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;

-- Recreate INSERT policies with proper checks
-- Allow any authenticated user to create a company (needed for onboarding)
CREATE POLICY "companies_insert_authenticated"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Allow users to insert their own user record (id must match auth.uid())
CREATE POLICY "users_insert_authenticated"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Also ensure the policies apply to the authenticated role
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
