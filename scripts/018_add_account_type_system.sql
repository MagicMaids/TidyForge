-- Add account type tracking to support both company and client accounts
-- This allows users to choose their account type during signup

-- =============================================
-- STEP 1: Add account_type column to users table
-- =============================================

-- Note: We keep company_id nullable because client portal users won't have a company_id
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'company_staff' 
    CHECK (account_type IN ('company_staff', 'client'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- =============================================
-- STEP 2: Link client_portal_users to auth.users
-- =============================================

-- Add auth_user_id to track which Supabase auth user this portal user is
ALTER TABLE client_portal_users 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_client_portal_users_auth_user_id ON client_portal_users(auth_user_id);

-- =============================================
-- STEP 3: Update helper function to detect account type
-- =============================================

CREATE OR REPLACE FUNCTION get_user_account_type()
RETURNS TEXT AS $$
DECLARE
  acc_type TEXT;
BEGIN
  -- Check users table first
  SELECT account_type INTO acc_type
  FROM users
  WHERE id = auth.uid();
  
  IF acc_type IS NOT NULL THEN
    RETURN acc_type;
  END IF;
  
  -- Check if they're a client portal user
  IF EXISTS (
    SELECT 1 FROM client_portal_users
    WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
  ) THEN
    RETURN 'client';
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- STEP 4: Update is_client_portal_user to use auth_user_id
-- =============================================

CREATE OR REPLACE FUNCTION is_client_portal_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_portal_users
    WHERE auth_user_id = auth.uid()
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- STEP 5: Update get_client_id_for_portal_user to use auth_user_id
-- =============================================

CREATE OR REPLACE FUNCTION get_client_id_for_portal_user()
RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  SELECT cpu.client_id INTO client_id
  FROM client_portal_users cpu
  WHERE cpu.auth_user_id = auth.uid()
    AND cpu.is_active = TRUE;
  
  RETURN client_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- STEP 6: Update RLS policies for client portal users table
-- =============================================

DROP POLICY IF EXISTS "users_view_own_client_portal_account" ON client_portal_users;
DROP POLICY IF EXISTS "platform_admins_view_client_portal_users" ON client_portal_users;
DROP POLICY IF EXISTS "companies_view_their_client_portal_users" ON client_portal_users;

CREATE POLICY "users_view_own_client_portal_account"
  ON client_portal_users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "platform_admins_view_all_client_portal_users"
  ON client_portal_users FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "companies_view_their_client_portal_users"
  ON client_portal_users FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
  );

CREATE POLICY "companies_manage_their_client_portal_users"
  ON client_portal_users FOR ALL
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
  );

-- =============================================
-- STEP 7: Update users table RLS for mixed account types
-- =============================================

-- Users with account_type='client' won't have company_id, so policies need to handle this
DROP POLICY IF EXISTS "users_select_company" ON users;
DROP POLICY IF EXISTS "users_insert_own_or_impersonate" ON users;
DROP POLICY IF EXISTS "users_update_company" ON users;

CREATE POLICY "users_select_accessible"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Own record
    id = auth.uid()
    -- Or same company (for company_staff)
    OR (account_type = 'company_staff' AND company_id = get_effective_company_id())
    -- Or platform admin
    OR is_platform_admin()
  );

CREATE POLICY "users_insert_own_or_company"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Can insert own user record during signup
    id = auth.uid()
    -- Or impersonating admin can insert company staff
    OR (can_impersonate() AND account_type = 'company_staff' AND company_id = get_effective_company_id())
  );

CREATE POLICY "users_update_accessible"
  ON users FOR UPDATE
  TO authenticated
  USING (
    -- Own record
    id = auth.uid()
    -- Or same company (for company_staff)
    OR (account_type = 'company_staff' AND company_id = get_effective_company_id())
    -- Or platform admin
    OR is_platform_admin()
  )
  WITH CHECK (
    -- Own record
    id = auth.uid()
    -- Or same company (for company_staff)
    OR (account_type = 'company_staff' AND company_id = get_effective_company_id())
    -- Or platform admin
    OR is_platform_admin()
  );
