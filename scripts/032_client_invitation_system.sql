CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Set after client is created
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE, -- Property to link
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  sent_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_invitations_company_id ON client_invitations(company_id);
CREATE INDEX idx_client_invitations_email ON client_invitations(email);
CREATE INDEX idx_client_invitations_invite_code ON client_invitations(invite_code);
CREATE INDEX idx_client_invitations_status ON client_invitations(status);

-- RLS policies
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_manage_own_invitations"
  ON client_invitations FOR ALL
  TO authenticated
  USING (company_id = get_effective_company_id() OR is_platform_admin())
  WITH CHECK (company_id = get_effective_company_id() OR is_platform_admin());

CREATE POLICY "anyone_can_view_valid_invitation"
  ON client_invitations FOR SELECT
  TO authenticated
  USING (
    status = 'pending' 
    AND expires_at > NOW()
  );

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_client_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
    SELECT EXISTS(SELECT 1 FROM client_invitations WHERE invite_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
