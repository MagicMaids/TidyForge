-- Multi-Company Client Architecture Migration
-- This restructures the system to allow clients to work with multiple companies

-- =============================================
-- STEP 1: Backup existing client-company relationships
-- =============================================

CREATE TABLE IF NOT EXISTS client_company_migration_backup AS
SELECT id as client_id, company_id, created_at
FROM clients
WHERE company_id IS NOT NULL;

-- =============================================
-- STEP 2: Create client portal authentication table
-- =============================================

CREATE TABLE IF NOT EXISTS client_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_client_portal_users_email ON client_portal_users(email);
CREATE INDEX idx_client_portal_users_client_id ON client_portal_users(client_id);

-- =============================================
-- STEP 3: Create company-client junction table
-- =============================================

CREATE TABLE IF NOT EXISTS company_client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  client_id UUID NOT NULL,
  
  -- Relationship metadata
  relationship_status TEXT DEFAULT 'active' CHECK (relationship_status IN ('active', 'inactive', 'pending')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Company-specific client settings
  pricing_tier TEXT DEFAULT 'standard',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  payment_terms TEXT DEFAULT 'net_30',
  internal_notes TEXT,
  
  -- Contact preferences
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'portal')),
  billing_email TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT unique_company_client UNIQUE (company_id, client_id)
);

CREATE INDEX idx_ccr_company_id ON company_client_relationships(company_id);
CREATE INDEX idx_ccr_client_id ON company_client_relationships(client_id);
CREATE INDEX idx_ccr_status ON company_client_relationships(relationship_status);

-- =============================================
-- STEP 4: Migrate existing client-company relationships
-- =============================================

INSERT INTO company_client_relationships (company_id, client_id, created_at)
SELECT company_id, id, created_at
FROM clients
WHERE company_id IS NOT NULL
ON CONFLICT (company_id, client_id) DO NOTHING;

-- =============================================
-- STEP 5: Remove company_id from clients table
-- =============================================

ALTER TABLE clients DROP COLUMN IF EXISTS company_id;

-- =============================================
-- STEP 6: Ensure properties has both client_id and company_id
-- =============================================

-- Properties already have company_id and client_id, verify constraints
ALTER TABLE properties 
  DROP CONSTRAINT IF EXISTS fk_client,
  ADD CONSTRAINT fk_client 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE properties 
  DROP CONSTRAINT IF EXISTS fk_company,
  ADD CONSTRAINT fk_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- =============================================
-- STEP 7: Create helper functions
-- =============================================

-- Check if user has access to a client through any company relationship
CREATE OR REPLACE FUNCTION has_client_access(target_client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_company UUID;
  impersonated_company UUID;
  effective_company UUID;
BEGIN
  -- Get effective company (impersonated or actual)
  effective_company := get_effective_company_id();
  
  IF effective_company IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the company has a relationship with the client
  RETURN EXISTS (
    SELECT 1 FROM company_client_relationships
    WHERE company_id = effective_company
      AND client_id = target_client_id
      AND relationship_status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if authenticated user is a client portal user
CREATE OR REPLACE FUNCTION is_client_portal_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_portal_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get client ID for the current portal user
CREATE OR REPLACE FUNCTION get_client_id_for_portal_user()
RETURNS UUID AS $$
DECLARE
  client_id UUID;
BEGIN
  SELECT cpu.client_id INTO client_id
  FROM client_portal_users cpu
  JOIN auth.users au ON au.email = cpu.email
  WHERE au.id = auth.uid()
    AND cpu.is_active = TRUE;
  
  RETURN client_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- STEP 8: Create RLS policies for new tables
-- =============================================

-- Enable RLS
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_client_relationships ENABLE ROW LEVEL SECURITY;

-- Client Portal Users Policies
CREATE POLICY "users_view_own_client_portal_account"
  ON client_portal_users FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "platform_admins_view_client_portal_users"
  ON client_portal_users FOR SELECT
  TO authenticated
  USING (is_platform_admin());

CREATE POLICY "companies_view_their_client_portal_users"
  ON client_portal_users FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
  );

-- Company-Client Relationships Policies
CREATE POLICY "companies_view_own_client_relationships"
  ON company_client_relationships FOR SELECT
  TO authenticated
  USING (
    company_id = get_effective_company_id()
    OR is_platform_admin()
  );

CREATE POLICY "companies_manage_own_client_relationships"
  ON company_client_relationships FOR ALL
  TO authenticated
  USING (company_id = get_effective_company_id())
  WITH CHECK (company_id = get_effective_company_id());

CREATE POLICY "clients_view_own_relationships"
  ON company_client_relationships FOR SELECT
  TO authenticated
  USING (
    client_id = get_client_id_for_portal_user()
  );

-- =============================================
-- STEP 9: Update existing RLS policies
-- =============================================

-- Update clients table policies to work without company_id
DROP POLICY IF EXISTS "clients_access_company" ON clients;

CREATE POLICY "companies_view_their_clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
    OR is_platform_admin()
    OR id = get_client_id_for_portal_user()
  );

CREATE POLICY "companies_manage_their_clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Company can insert if they're creating the relationship too
    TRUE
  );

CREATE POLICY "companies_update_their_clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
    OR is_platform_admin()
  );

CREATE POLICY "clients_view_own_profile"
  ON clients FOR SELECT
  TO authenticated
  USING (
    id = get_client_id_for_portal_user()
  );

CREATE POLICY "clients_update_own_profile"
  ON clients FOR UPDATE
  TO authenticated
  USING (id = get_client_id_for_portal_user())
  WITH CHECK (id = get_client_id_for_portal_user());

-- Update properties policies to ensure both client and company access
DROP POLICY IF EXISTS "properties_access_company" ON properties;

CREATE POLICY "companies_access_their_properties"
  ON properties FOR ALL
  TO authenticated
  USING (
    company_id = get_effective_company_id()
    OR is_platform_admin()
  )
  WITH CHECK (
    company_id = get_effective_company_id()
    OR is_platform_admin()
  );

CREATE POLICY "clients_view_own_properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    client_id = get_client_id_for_portal_user()
  );

CREATE POLICY "clients_update_own_properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    client_id = get_client_id_for_portal_user()
  )
  WITH CHECK (
    client_id = get_client_id_for_portal_user()
  );

-- Update jobs policies to ensure proper access
DROP POLICY IF EXISTS "jobs_access_company" ON jobs;

CREATE POLICY "companies_access_their_jobs"
  ON jobs FOR ALL
  TO authenticated
  USING (
    company_id = get_effective_company_id()
    OR is_platform_admin()
  )
  WITH CHECK (
    company_id = get_effective_company_id()
    OR is_platform_admin()
  );

CREATE POLICY "clients_view_own_jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties
      WHERE client_id = get_client_id_for_portal_user()
    )
  );

-- =============================================
-- STEP 10: Create updated_at trigger for relationships
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_client_relationships_updated_at ON company_client_relationships;
CREATE TRIGGER update_company_client_relationships_updated_at
  BEFORE UPDATE ON company_client_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
