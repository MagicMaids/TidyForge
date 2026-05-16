-- Fix RLS policy to allow companies to remove property associations (set company_id to null)
-- The issue is that the WITH CHECK clause prevents setting company_id to null

-- Drop existing update policies
DROP POLICY IF EXISTS "Admins/Managers can update properties" ON properties;
DROP POLICY IF EXISTS "properties_update_policy" ON properties;

-- Create updated policy that allows setting company_id to null when removing association
CREATE POLICY "properties_update_policy"
ON properties FOR UPDATE
TO authenticated
USING (
  -- Platform admins can update all
  is_platform_admin()
  -- Companies can update properties they manage
  OR (company_id IS NOT NULL AND company_id = get_user_company_id() AND is_admin_or_manager())
  -- Clients can update their own properties
  OR (client_id IS NOT NULL AND client_id = get_client_id_for_portal_user())
)
WITH CHECK (
  -- Platform admins can set any value
  is_platform_admin()
  -- Companies can update to keep company_id the same OR set it to null (removal)
  OR (
    is_admin_or_manager()
    AND (
      -- Keep company_id the same (regular update)
      (company_id IS NOT NULL AND company_id = get_user_company_id())
      -- Or set company_id to null (removal from company)
      OR company_id IS NULL
    )
  )
  -- Clients can only update their own properties and cannot change ownership
  OR (client_id IS NOT NULL AND client_id = get_client_id_for_portal_user())
);
