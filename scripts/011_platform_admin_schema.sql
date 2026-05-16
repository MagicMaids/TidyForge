-- Platform Administration System Schema
-- This adds system-level roles and administration capabilities to TidyForge

-- =============================================
-- SYSTEM ROLES & PERMISSIONS
-- =============================================

-- Define available system roles for TidyForge platform administrators
CREATE TABLE IF NOT EXISTS system_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('super_admin', 'platform_admin', 'support', 'developer', 'analyst')),
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assign system roles to users (users can have multiple system roles)
CREATE TABLE IF NOT EXISTS user_system_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  system_role_id UUID REFERENCES system_roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(user_id, system_role_id)
);

-- =============================================
-- AUDIT LOGGING
-- =============================================

-- Track all platform-level administrative actions
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  company_id UUID REFERENCES companies(id),
  previous_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_admin_user ON platform_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON platform_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON platform_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON platform_audit_log(action);

-- =============================================
-- IMPERSONATION SYSTEM
-- =============================================

-- Track support staff impersonation sessions with full audit trail
CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id) NOT NULL,
  target_user_id UUID REFERENCES users(id) NOT NULL,
  target_company_id UUID REFERENCES companies(id) NOT NULL,
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  actions_taken JSONB DEFAULT '[]',
  ip_address INET,
  CONSTRAINT active_session_check CHECK (
    (is_active = TRUE AND ended_at IS NULL) OR 
    (is_active = FALSE AND ended_at IS NOT NULL)
  )
);

-- Index for active impersonation lookups
CREATE INDEX IF NOT EXISTS idx_impersonation_active ON impersonation_sessions(admin_user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_impersonation_target ON impersonation_sessions(target_user_id);

-- =============================================
-- FEATURE FLAGS
-- =============================================

-- Control feature rollout across the platform
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_for_companies UUID[] DEFAULT '{}',
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PLATFORM SETTINGS
-- =============================================

-- Global platform configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEED DEFAULT SYSTEM ROLES
-- =============================================

INSERT INTO system_roles (name, description, permissions) VALUES
  ('super_admin', 'Full system access - TidyForge founders and CTO', 
   '{"can_delete_companies": true, "can_manage_billing": true, "can_grant_roles": true, "can_view_all_data": true, "can_modify_infrastructure": true}'::JSONB),
  
  ('platform_admin', 'Platform operations team - manage companies and users',
   '{"can_view_all_companies": true, "can_suspend_companies": true, "can_manage_users": true, "can_view_billing": true, "can_impersonate": true}'::JSONB),
  
  ('support', 'Customer success team - limited data access for troubleshooting',
   '{"can_view_companies": true, "can_impersonate": true, "can_view_support_tickets": true, "can_fix_data": true}'::JSONB),
  
  ('developer', 'Engineering team - logs, metrics, and debugging',
   '{"can_view_logs": true, "can_view_metrics": true, "can_manage_feature_flags": true, "can_view_schemas": true}'::JSONB),
  
  ('analyst', 'Business intelligence - cross-company analytics',
   '{"can_view_analytics": true, "can_export_reports": true, "can_view_anonymized_data": true}'::JSONB)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- ENABLE RLS ON NEW TABLES
-- =============================================

ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT ON system_roles TO authenticated;
GRANT SELECT ON user_system_roles TO authenticated;
GRANT SELECT ON platform_audit_log TO authenticated;
GRANT SELECT ON impersonation_sessions TO authenticated;
GRANT SELECT ON feature_flags TO authenticated;
GRANT SELECT ON platform_settings TO authenticated;
