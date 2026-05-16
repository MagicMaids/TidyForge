-- Fix RLS policies to support staff members who haven't joined a company yet
-- Addresses issues where pending staff can't access their profiles or browse companies

-- =============================================
-- STEP 1: Update users table policies for pending staff
-- =============================================

-- Drop all existing user policies that are too restrictive
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins/Managers can insert users" ON users;
DROP POLICY IF EXISTS "Admins/Managers can update users in their company" ON users;
DROP POLICY IF EXISTS "Admins/Managers can delete users in their company" ON users;
DROP POLICY IF EXISTS "users_select_accessible" ON users;
DROP POLICY IF EXISTS "users_insert_own_or_company" ON users;
DROP POLICY IF EXISTS "users_update_accessible" ON users;

-- Allow users to always view their own record, even without company_id
CREATE POLICY "users_view_own_record"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Always allow viewing own record
    id = auth.uid()
    -- Or same company (for company_staff with company_id)
    OR (company_id IS NOT NULL AND company_id = get_effective_company_id())
    -- Or platform admin
    OR is_platform_admin()
  );

-- Allow authenticated users to insert their own record during signup
CREATE POLICY "users_insert_own_record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Can insert own user record during signup (company_id can be null)
    id = auth.uid()
    -- Or platform admin
    OR is_platform_admin()
  );

-- Allow users to update their own record, companies to manage their staff
CREATE POLICY "users_update_record"
  ON users FOR UPDATE
  TO authenticated
  USING (
    -- Own record (can update even without company_id)
    id = auth.uid()
    -- Or same company staff (managers/admins managing their team)
    OR (company_id IS NOT NULL AND company_id = get_effective_company_id() AND is_admin_or_manager())
    -- Or platform admin
    OR is_platform_admin()
  )
  WITH CHECK (
    -- Own record
    id = auth.uid()
    -- Or same company staff
    OR (company_id IS NOT NULL AND company_id = get_effective_company_id() AND is_admin_or_manager())
    -- Or platform admin
    OR is_platform_admin()
  );

-- Admins/managers can delete users in their company
CREATE POLICY "users_delete_company_staff"
  ON users FOR DELETE
  TO authenticated
  USING (
    (company_id IS NOT NULL AND company_id = get_effective_company_id() AND is_admin_or_manager())
    OR is_platform_admin()
  );

-- =============================================
-- STEP 2: Update companies table policies for staff browsing
-- =============================================

DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Admins can update their own company" ON companies;

-- Allow all authenticated users to browse companies (for join requests)
CREATE POLICY "authenticated_users_view_companies"
  ON companies FOR SELECT
  TO authenticated
  USING (TRUE);  -- All authenticated users can browse companies

-- Only admins of a company can update it
CREATE POLICY "company_admins_update_company"
  ON companies FOR UPDATE
  TO authenticated
  USING (id = get_effective_company_id() AND is_admin_or_manager())
  WITH CHECK (id = get_effective_company_id() AND is_admin_or_manager());

-- Platform admins can manage all companies
CREATE POLICY "platform_admins_manage_companies"
  ON companies FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- =============================================
-- STEP 3: Update helper function to handle pending staff
-- =============================================

-- Make get_effective_company_id handle NULL gracefully
CREATE OR REPLACE FUNCTION get_effective_company_id()
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_impersonation_id UUID;
BEGIN
  -- Check for active impersonation first
  SELECT company_id INTO v_impersonation_id
  FROM user_impersonations
  WHERE impersonator_id = auth.uid()
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_impersonation_id IS NOT NULL THEN
    RETURN v_impersonation_id;
  END IF;
  
  -- Return user's actual company_id (can be NULL for pending staff)
  SELECT company_id INTO v_company_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_company_id;  -- Returns NULL if user has no company yet
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- STEP 4: Create helper to check if user is pending staff
-- =============================================

CREATE OR REPLACE FUNCTION is_pending_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND account_type = 'company_staff'
      AND company_id IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- STEP 5: Update admin/manager check to handle NULL company_id
-- =============================================

CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_company UUID;
BEGIN
  SELECT role, company_id INTO user_role, user_company
  FROM users
  WHERE id = auth.uid();
  
  -- Must have a company_id and be admin/manager
  RETURN user_company IS NOT NULL AND user_role IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
