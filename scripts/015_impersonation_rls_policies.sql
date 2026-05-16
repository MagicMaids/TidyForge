-- RLS Policies to allow platform admins to access company data while impersonating
-- This extends the existing RLS policies to check for active impersonation sessions

-- Helper function to check if user is currently impersonating a company
CREATE OR REPLACE FUNCTION is_impersonating_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM impersonation_sessions
    WHERE admin_user_id = auth.uid()
    AND target_company_id = target_company_id
    AND is_active = TRUE
    AND started_at > NOW() - INTERVAL '8 hours' -- Auto-expire after 8 hours
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get the company ID that the current admin is impersonating
CREATE OR REPLACE FUNCTION get_impersonated_company_id()
RETURNS UUID AS $$
  SELECT target_company_id FROM impersonation_sessions
  WHERE admin_user_id = auth.uid()
  AND is_active = TRUE
  AND started_at > NOW() - INTERVAL '8 hours'
  LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Update users table policy to allow impersonating admins to view company users
DROP POLICY IF EXISTS "impersonating_admins_view_company_users" ON users;
CREATE POLICY "impersonating_admins_view_company_users"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id = get_impersonated_company_id() 
    AND can_impersonate()
  );

-- Allow impersonating admins to modify company users
DROP POLICY IF EXISTS "impersonating_admins_modify_company_users" ON users;
CREATE POLICY "impersonating_admins_modify_company_users"
  ON users FOR ALL
  TO authenticated
  USING (
    company_id = get_impersonated_company_id() 
    AND can_impersonate()
  );

-- Update companies table policy to allow impersonating admins to view and modify
DROP POLICY IF EXISTS "impersonating_admins_access_company" ON companies;
CREATE POLICY "impersonating_admins_access_company"
  ON companies FOR ALL
  TO authenticated
  USING (
    id = get_impersonated_company_id() 
    AND can_impersonate()
  );

-- Update jobs table policy to allow impersonating admins
DROP POLICY IF EXISTS "impersonating_admins_access_jobs" ON jobs;
CREATE POLICY "impersonating_admins_access_jobs"
  ON jobs FOR ALL
  TO authenticated
  USING (
    company_id = get_impersonated_company_id() 
    AND can_impersonate()
  );

-- Update properties table policy
DROP POLICY IF EXISTS "impersonating_admins_access_properties" ON properties;
CREATE POLICY "impersonating_admins_access_properties"
  ON properties FOR ALL
  TO authenticated
  USING (
    company_id = get_impersonated_company_id() 
    AND can_impersonate()
  );

-- Update clients table policy
DROP POLICY IF EXISTS "impersonating_admins_access_clients" ON clients;
CREATE POLICY "impersonating_admins_access_clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    company_id = get_impersonated_company_id() 
    AND can_impersonate()
  );
