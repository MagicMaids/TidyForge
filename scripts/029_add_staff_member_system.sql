-- Create system for staff members to join companies
-- Includes invite codes and pending join requests

-- Table for company invite codes
CREATE TABLE IF NOT EXISTS company_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'cleaner' CHECK (role IN ('cleaner', 'manager', 'admin')),
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_company_invite_codes_company_id ON company_invite_codes(company_id);
CREATE INDEX idx_company_invite_codes_code ON company_invite_codes(code);

-- Table for pending staff join requests
CREATE TABLE IF NOT EXISTS staff_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_role TEXT DEFAULT 'cleaner' CHECK (requested_role IN ('cleaner', 'manager', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT, -- Optional message from requester
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_staff_join_requests_user_id ON staff_join_requests(user_id);
CREATE INDEX idx_staff_join_requests_company_id ON staff_join_requests(company_id);
CREATE INDEX idx_staff_join_requests_status ON staff_join_requests(status);

-- RLS policies for invite codes
ALTER TABLE company_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_verify_invite_codes"
  ON company_invite_codes FOR SELECT
  TO authenticated
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "company_admins_manage_invite_codes"
  ON company_invite_codes FOR ALL
  TO authenticated
  USING (company_id = get_effective_company_id() OR is_platform_admin())
  WITH CHECK (company_id = get_effective_company_id() OR is_platform_admin());

-- RLS policies for join requests
ALTER TABLE staff_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_join_requests"
  ON staff_join_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR company_id = get_effective_company_id() OR is_platform_admin());

CREATE POLICY "users_create_own_join_requests"
  ON staff_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "company_admins_manage_join_requests"
  ON staff_join_requests FOR UPDATE
  TO authenticated
  USING (company_id = get_effective_company_id() OR is_platform_admin())
  WITH CHECK (company_id = get_effective_company_id() OR is_platform_admin());

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM company_invite_codes WHERE company_invite_codes.code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to join company with invite code
CREATE OR REPLACE FUNCTION join_company_with_code(
  p_invite_code TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_invite company_invite_codes;
  v_result JSON;
BEGIN
  -- Get invite code details
  SELECT * INTO v_invite
  FROM company_invite_codes
  WHERE code = p_invite_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR uses_count < max_uses);
  
  IF v_invite IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Invalid or expired invite code');
  END IF;
  
  -- Update user's company and role
  UPDATE users
  SET 
    company_id = v_invite.company_id,
    role = v_invite.role,
    account_type = 'company_staff'
  WHERE id = p_user_id;
  
  -- Increment invite code usage
  UPDATE company_invite_codes
  SET uses_count = uses_count + 1
  WHERE id = v_invite.id;
  
  RETURN json_build_object(
    'success', TRUE,
    'company_id', v_invite.company_id,
    'role', v_invite.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION join_company_with_code TO authenticated;
