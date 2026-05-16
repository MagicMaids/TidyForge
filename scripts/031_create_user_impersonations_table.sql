-- Create user_impersonations table for admin impersonation feature
-- This table was referenced in helper functions but never created

CREATE TABLE IF NOT EXISTS user_impersonations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_impersonations_impersonator_id ON user_impersonations(impersonator_id);
CREATE INDEX IF NOT EXISTS idx_user_impersonations_company_id ON user_impersonations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_impersonations_is_active ON user_impersonations(is_active);

-- RLS policies for impersonations
ALTER TABLE user_impersonations ENABLE ROW LEVEL SECURITY;

-- Only platform admins can create and manage impersonations
CREATE POLICY "platform_admins_manage_impersonations"
  ON user_impersonations FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Users can view their own active impersonations
CREATE POLICY "users_view_own_impersonations"
  ON user_impersonations FOR SELECT
  TO authenticated
  USING (impersonator_id = auth.uid());
