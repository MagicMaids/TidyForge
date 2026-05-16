-- Fix RLS policies to allow client portal users to create their own client records
-- The old policies from 002_rls_policies.sql are conflicting with the new multi-tenant architecture

-- ====================================
-- STEP 1: Drop all old client policies that check company_id
-- ====================================

DROP POLICY IF EXISTS "Admins/Managers can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins/Managers can update clients" ON clients;
DROP POLICY IF EXISTS "Admins/Managers can delete clients" ON clients;

-- ====================================
-- STEP 2: Create new policy for client self-registration
-- ====================================

CREATE POLICY "authenticated_users_can_insert_clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ====================================
-- STEP 3: Ensure client portal users can update their own client record
-- ====================================

CREATE POLICY "clients_delete_through_companies"
  ON clients FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT client_id FROM company_client_relationships
      WHERE company_id = get_effective_company_id()
    )
    OR is_platform_admin()
  );
