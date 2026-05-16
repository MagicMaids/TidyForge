-- Fix RLS policies to properly support impersonation
-- The key insight: policies need to check BOTH regular user access AND impersonation access

-- Helper function to get effective company ID (either from user record or impersonation)
CREATE OR REPLACE FUNCTION get_effective_company_id()
RETURNS UUID AS $$
DECLARE
  impersonated_company UUID;
  user_company UUID;
BEGIN
  -- First check if user is impersonating
  SELECT target_company_id INTO impersonated_company
  FROM impersonation_sessions
  WHERE admin_user_id = auth.uid()
    AND is_active = TRUE
    AND started_at > NOW() - INTERVAL '8 hours'
  LIMIT 1;
  
  IF impersonated_company IS NOT NULL THEN
    RETURN impersonated_company;
  END IF;
  
  -- Otherwise get user's actual company
  SELECT company_id INTO user_company
  FROM users
  WHERE id = auth.uid();
  
  RETURN user_company;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Update users table policies to support impersonation
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "impersonating_admins_view_company_users" ON users;
DROP POLICY IF EXISTS "impersonating_admins_modify_company_users" ON users;

CREATE POLICY "users_select_company"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id = get_effective_company_id()
    OR id = auth.uid()
  );

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = get_effective_company_id()
    AND (id = auth.uid() OR can_impersonate())
  );

CREATE POLICY "users_update_company"
  ON users FOR UPDATE
  TO authenticated
  USING (
    company_id = get_effective_company_id()
    OR id = auth.uid()
  )
  WITH CHECK (
    company_id = get_effective_company_id()
    OR id = auth.uid()
  );

-- Update companies table policies
DROP POLICY IF EXISTS "impersonating_admins_access_company" ON companies;

CREATE POLICY "companies_access_own"
  ON companies FOR ALL
  TO authenticated
  USING (
    id = get_effective_company_id()
  );

-- Update jobs table policies
DROP POLICY IF EXISTS "impersonating_admins_access_jobs" ON jobs;

CREATE POLICY "jobs_access_company"
  ON jobs FOR ALL
  TO authenticated
  USING (
    company_id = get_effective_company_id()
  );

-- Update properties table policies
DROP POLICY IF EXISTS "impersonating_admins_access_properties" ON properties;

CREATE POLICY "properties_access_company"
  ON properties FOR ALL
  TO authenticated
  USING (
    company_id = get_effective_company_id()
  );

-- Update clients table policies
DROP POLICY IF EXISTS "impersonating_admins_access_clients" ON clients;

CREATE POLICY "clients_access_company"
  ON clients FOR ALL
  TO authenticated
  USING (
    company_id = get_effective_company_id()
  );
