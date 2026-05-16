-- FINAL FIX: Remove all recursive policies on users table
-- The key insight: SELECT policies on users table CANNOT query the users table

-- Drop ALL policies on users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- Create NON-RECURSIVE policies for users table
-- Policy 1: Users can select ONLY their own record (no recursion)
CREATE POLICY "users_select_own"
  ON public.users 
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Users can insert their own record (no recursion)
CREATE POLICY "users_insert_own"
  ON public.users 
  FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy 3: Users can update their own record (no recursion)
CREATE POLICY "users_update_own"
  ON public.users 
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Note: We removed the policy that allowed viewing other users in the company
-- That will need to be handled differently (e.g., through a function or at the application layer)

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
