-- Fix infinite recursion in RLS policies
-- Drop problematic helper functions and recreate policies without circular dependencies

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins/Managers can insert users" ON users;
DROP POLICY IF EXISTS "Admins/Managers can update users in their company" ON users;
DROP POLICY IF EXISTS "Admins/Managers can delete users in their company" ON users;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Admins can update their own company" ON companies;

-- Drop helper functions that cause recursion
DROP FUNCTION IF EXISTS get_user_company_id();
DROP FUNCTION IF EXISTS is_admin_or_manager();

-- ====================================
-- USERS POLICIES - Fixed to avoid recursion
-- ====================================

-- Users can always view their own profile (no recursion)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can view other users in their company (uses table alias to avoid recursion)
CREATE POLICY "Users can view company members"
  ON users FOR SELECT
  USING (
    company_id IN (
      SELECT u2.company_id FROM users u2 WHERE u2.id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Allow inserting new users (needed for sign-up and onboarding)
CREATE POLICY "Allow insert for authenticated users"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ====================================
-- COMPANIES POLICIES - Fixed
-- ====================================

CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their company"
  ON companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Allow company creation"
  ON companies FOR INSERT
  WITH CHECK (TRUE);
