-- Fix clients RLS policies and make properties.client_id nullable

-- =============================================
-- STEP 1: Make client_id nullable in properties
-- =============================================

ALTER TABLE properties ALTER COLUMN client_id DROP NOT NULL;

-- =============================================
-- STEP 2: Fix clients INSERT RLS policy
-- =============================================

DROP POLICY IF EXISTS "companies_manage_their_clients" ON clients;
DROP POLICY IF EXISTS "Admins/Managers can insert clients" ON clients;

-- Allow companies to insert clients (will create relationship separately)
CREATE POLICY "authenticated_users_can_insert_clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Any authenticated company staff can create a client
    -- The relationship must be created separately through company_client_relationships
    get_effective_company_id() IS NOT NULL
    OR is_platform_admin()
  );

-- =============================================
-- STEP 3: Update properties policies for nullable client_id
-- =============================================

DROP POLICY IF EXISTS "companies_access_their_properties" ON properties;

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

-- Update client property access to handle null client_id
DROP POLICY IF EXISTS "clients_view_own_properties" ON properties;
DROP POLICY IF EXISTS "clients_update_own_properties" ON properties;

CREATE POLICY "clients_view_own_properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    client_id IS NOT NULL 
    AND client_id = get_client_id_for_portal_user()
  );

CREATE POLICY "clients_update_own_properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    client_id IS NOT NULL
    AND client_id = get_client_id_for_portal_user()
  )
  WITH CHECK (
    client_id IS NOT NULL
    AND client_id = get_client_id_for_portal_user()
  );
