-- RLS Policies for Platform Administration
-- These policies control access to system role tables and admin features

-- =============================================
-- SYSTEM ROLES TABLE POLICIES
-- =============================================

-- Only platform admins can view system roles
CREATE POLICY "platform_admins_view_system_roles"
  ON system_roles FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- =============================================
-- USER SYSTEM ROLES TABLE POLICIES
-- =============================================

-- Users can view their own system roles
CREATE POLICY "users_view_own_system_roles"
  ON user_system_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Platform admins can view all system role assignments
CREATE POLICY "platform_admins_view_all_system_roles"
  ON user_system_roles FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Only super admins can grant system roles
CREATE POLICY "super_admins_grant_system_roles"
  ON user_system_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- Only super admins can revoke system roles
CREATE POLICY "super_admins_revoke_system_roles"
  ON user_system_roles FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- =============================================
-- PLATFORM AUDIT LOG POLICIES
-- =============================================

-- Platform admins can view all audit logs
CREATE POLICY "platform_admins_view_audit_logs"
  ON platform_audit_log FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- System automatically creates audit logs (no manual insert policy needed)
CREATE POLICY "system_insert_audit_logs"
  ON platform_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid() AND is_platform_admin());

-- =============================================
-- IMPERSONATION SESSIONS POLICIES
-- =============================================

-- Support staff and admins can view impersonation sessions
CREATE POLICY "admins_view_impersonation_sessions"
  ON impersonation_sessions FOR SELECT
  TO authenticated
  USING (can_impersonate());

-- Support staff and admins can create impersonation sessions
CREATE POLICY "admins_create_impersonation_sessions"
  ON impersonation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid() AND can_impersonate());

-- Support staff and admins can end impersonation sessions
CREATE POLICY "admins_end_impersonation_sessions"
  ON impersonation_sessions FOR UPDATE
  TO authenticated
  USING (admin_user_id = auth.uid() AND can_impersonate())
  WITH CHECK (admin_user_id = auth.uid() AND can_impersonate());

-- =============================================
-- FEATURE FLAGS POLICIES
-- =============================================

-- Everyone can view feature flags (needed to check if features are enabled)
CREATE POLICY "authenticated_view_feature_flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only developers and admins can manage feature flags
CREATE POLICY "admins_manage_feature_flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (has_system_role('developer') OR is_platform_admin());

-- =============================================
-- PLATFORM SETTINGS POLICIES
-- =============================================

-- Everyone can view public settings
CREATE POLICY "authenticated_view_public_settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

-- Platform admins can view all settings
CREATE POLICY "admins_view_all_settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Only super admins can modify platform settings
CREATE POLICY "super_admins_manage_settings"
  ON platform_settings FOR ALL
  TO authenticated
  USING (is_super_admin());

-- =============================================
-- UPDATE EXISTING TABLES FOR PLATFORM ADMIN ACCESS
-- =============================================

-- Allow platform admins to view all companies
CREATE POLICY "platform_admins_view_all_companies"
  ON companies FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Allow platform admins to view all users
CREATE POLICY "platform_admins_view_all_users"
  ON users FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Allow platform admins to modify companies (for support purposes)
CREATE POLICY "platform_admins_modify_companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (is_platform_admin());

-- Allow platform admins to view all jobs across companies
CREATE POLICY "platform_admins_view_all_jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Allow platform admins to view all properties
CREATE POLICY "platform_admins_view_all_properties"
  ON properties FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Allow platform admins to view all clients
CREATE POLICY "platform_admins_view_all_clients"
  ON clients FOR SELECT
  TO authenticated
  USING (is_platform_admin());
