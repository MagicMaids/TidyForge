-- Allow clients to create and manage their own properties
-- Clients can add properties without needing a company first

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Admins/Managers can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins/Managers can update properties" ON properties;
DROP POLICY IF EXISTS "Admins/Managers can delete properties" ON properties;
DROP POLICY IF EXISTS "Users can view properties in their company" ON properties;

-- ====================================
-- NEW PROPERTIES POLICIES
-- ====================================

-- SELECT: Companies see their properties, clients see their properties, admins see all
CREATE POLICY "properties_select_policy"
  ON properties FOR SELECT
  TO authenticated
  USING (
    -- Platform admins can see all
    is_platform_admin()
    -- Companies can see properties they manage (where company_id matches)
    OR company_id = get_effective_company_id()
    -- Clients can see their own properties
    OR client_id = get_client_id_for_portal_user()
  );

-- INSERT: Companies and clients can create properties, admins can create any
CREATE POLICY "properties_insert_policy"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Platform admins can insert any property
    is_platform_admin()
    -- Companies can insert properties for their company
    OR (company_id = get_effective_company_id() AND company_id IS NOT NULL)
    -- Clients can insert properties for themselves (company_id will be null initially)
    OR (client_id = get_client_id_for_portal_user() AND client_id IS NOT NULL)
  );

-- UPDATE: Companies can update their properties, clients can update theirs, admins can update all
CREATE POLICY "properties_update_policy"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    -- Platform admins can update all
    is_platform_admin()
    -- Companies can update properties they manage
    OR company_id = get_effective_company_id()
    -- Clients can update their own properties
    OR client_id = get_client_id_for_portal_user()
  )
  WITH CHECK (
    -- Platform admins can update all
    is_platform_admin()
    -- Companies can update properties they manage
    OR company_id = get_effective_company_id()
    -- Clients can update their own properties
    OR client_id = get_client_id_for_portal_user()
  );

-- DELETE: Only companies managing the property or admins can delete
CREATE POLICY "properties_delete_policy"
  ON properties FOR DELETE
  TO authenticated
  USING (
    -- Platform admins can delete all
    is_platform_admin()
    -- Companies can delete properties they manage
    OR company_id = get_effective_company_id()
    -- Clients can delete their own properties
    OR client_id = get_client_id_for_portal_user()
  );
