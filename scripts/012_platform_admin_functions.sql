-- Platform Administration Helper Functions
-- These functions check system roles and permissions

-- =============================================
-- SYSTEM ROLE CHECK FUNCTIONS
-- =============================================

-- Check if current user has a specific system role
CREATE OR REPLACE FUNCTION has_system_role(role_name TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_system_roles usr
    JOIN system_roles sr ON sr.id = usr.system_role_id
    WHERE usr.user_id = auth.uid()
    AND (role_name IS NULL OR sr.name = role_name)
    AND (usr.expires_at IS NULL OR usr.expires_at > NOW())
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is a platform administrator (super_admin or platform_admin)
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT has_system_role('super_admin') OR has_system_role('platform_admin')
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT has_system_role('super_admin')
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user can impersonate other users
CREATE OR REPLACE FUNCTION can_impersonate()
RETURNS BOOLEAN AS $$
  SELECT has_system_role('super_admin') 
      OR has_system_role('platform_admin') 
      OR has_system_role('support')
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get all system roles for current user
CREATE OR REPLACE FUNCTION get_user_system_roles()
RETURNS TABLE (
  role_name TEXT,
  permissions JSONB,
  expires_at TIMESTAMPTZ
) AS $$
  SELECT 
    sr.name,
    sr.permissions,
    usr.expires_at
  FROM user_system_roles usr
  JOIN system_roles sr ON sr.id = usr.system_role_id
  WHERE usr.user_id = auth.uid()
  AND (usr.expires_at IS NULL OR usr.expires_at > NOW())
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if a feature flag is enabled for current user's company
CREATE OR REPLACE FUNCTION is_feature_enabled(flag_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_company UUID;
  flag_record RECORD;
BEGIN
  -- Get user's company
  SELECT company_id INTO user_company FROM users WHERE id = auth.uid();
  
  -- Get feature flag
  SELECT * INTO flag_record FROM feature_flags WHERE name = flag_name;
  
  -- If flag doesn't exist or is disabled globally, return false
  IF flag_record IS NULL OR flag_record.is_enabled = FALSE THEN
    RETURN FALSE;
  END IF;
  
  -- If enabled for specific companies, check if user's company is in the list
  IF array_length(flag_record.enabled_for_companies, 1) > 0 THEN
    RETURN user_company = ANY(flag_record.enabled_for_companies);
  END IF;
  
  -- If rollout percentage, check randomly
  IF flag_record.rollout_percentage > 0 THEN
    RETURN (random() * 100) < flag_record.rollout_percentage;
  END IF;
  
  -- Default: if globally enabled with no restrictions, return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Log platform admin action
CREATE OR REPLACE FUNCTION log_platform_action(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO platform_audit_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    company_id,
    previous_value,
    new_value
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_company_id,
    p_previous_value,
    p_new_value
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
