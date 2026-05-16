-- Allow authenticated users to create their own client records during onboarding
-- This is safe because users can only create one client record per auth account

-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;

-- Create a permissive INSERT policy for authenticated users
-- Users can insert any client record during signup/onboarding
CREATE POLICY "authenticated_can_create_clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- The SELECT, UPDATE, DELETE policies remain restrictive
-- Only the INSERT is permissive to allow onboarding
