-- Complete fix for infinite recursion in RLS policies
-- This script drops ALL policies and helper functions, then recreates them without recursion

-- ====================================
-- STEP 1: Drop ALL existing policies on users and companies tables
-- ====================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
    
    -- Drop all policies on companies table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON companies';
    END LOOP;
END $$;

-- Drop the problematic helper functions
DROP FUNCTION IF EXISTS get_user_company_id();
DROP FUNCTION IF EXISTS is_admin_or_manager();

-- ====================================
-- STEP 2: Create new policies WITHOUT recursion
-- ====================================

-- USERS TABLE POLICIES
-- These policies must NOT reference helper functions that query users table

-- Policy: Users can always view their own profile (no recursion)
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Policy: Users can update only their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Policy: Allow new user creation during signup (needed for onboarding)
CREATE POLICY "users_insert_authenticated"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ====================================
-- COMPANIES TABLE POLICIES  
-- ====================================

-- Policy: Users can view their company
CREATE POLICY "companies_select_by_user"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their company (we'll check role in the app layer)
CREATE POLICY "companies_update_by_user"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Allow company creation during signup
CREATE POLICY "companies_insert_authenticated"
  ON companies FOR INSERT
  WITH CHECK (TRUE);

-- ====================================
-- STEP 3: Recreate helper functions with STABLE not SECURITY DEFINER
-- These can be used by OTHER tables, just not by users table
-- ====================================

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid() LIMIT 1
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
$$ LANGUAGE SQL STABLE;
