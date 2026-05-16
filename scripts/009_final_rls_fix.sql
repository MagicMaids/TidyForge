-- Final comprehensive fix for RLS policies
-- This will ensure authenticated users can create companies and user profiles

-- First, let's see what policies exist and drop them all
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop ALL policies on companies table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.companies';
    END LOOP;
END $$;

-- Create a very permissive INSERT policy for companies
-- Allow any authenticated user to insert a company
CREATE POLICY "allow_authenticated_insert_companies"
  ON public.companies 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create a very permissive SELECT policy for companies  
CREATE POLICY "allow_authenticated_select_companies"
  ON public.companies 
  FOR SELECT
  TO authenticated
  USING (true);

-- Create UPDATE policy for companies
CREATE POLICY "allow_authenticated_update_companies"
  ON public.companies 
  FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  );

-- Do the same for users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop ALL policies on users table except if they don't exist
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- Allow any authenticated user to insert their own user record
CREATE POLICY "allow_authenticated_insert_users"
  ON public.users 
  FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow users to select their own record
CREATE POLICY "allow_authenticated_select_own_user"
  ON public.users 
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to select others in their company
CREATE POLICY "allow_authenticated_select_company_users"
  ON public.users 
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
  );

-- Allow users to update their own record
CREATE POLICY "allow_authenticated_update_own_user"
  ON public.users 
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary table permissions
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
