-- TidyForge Row Level Security Policies
-- Ensures data isolation between companies and proper access controls

-- ====================================
-- ENABLE RLS ON ALL TABLES
-- ====================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ====================================
-- HELPER FUNCTION: Get user's company_id
-- ====================================
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ====================================
-- HELPER FUNCTION: Check if user is admin/manager
-- ====================================
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- ====================================
-- COMPANIES POLICIES
-- ====================================
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = get_user_company_id());

CREATE POLICY "Admins can update their own company"
  ON companies FOR UPDATE
  USING (id = get_user_company_id() AND is_admin_or_manager());

-- ====================================
-- USERS POLICIES
-- ====================================
CREATE POLICY "Users can view users in their company"
  ON users FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins/Managers can insert users"
  ON users FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admins/Managers can update users in their company"
  ON users FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admins/Managers can delete users in their company"
  ON users FOR DELETE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

-- ====================================
-- CLIENTS POLICIES
-- ====================================
CREATE POLICY "Users can view clients in their company"
  ON clients FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins/Managers can insert clients"
  ON clients FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admins/Managers can update clients"
  ON clients FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admins/Managers can delete clients"
  ON clients FOR DELETE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

-- ====================================
-- PROPERTIES POLICIES
-- ====================================
CREATE POLICY "Users can view properties in their company"
  ON properties FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins/Managers can insert properties"
  ON properties FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admins/Managers can update properties"
  ON properties FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admins/Managers can delete properties"
  ON properties FOR DELETE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

-- ====================================
-- JOBS POLICIES
-- ====================================
CREATE POLICY "Users can view jobs in their company"
  ON jobs FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins/Managers can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admins/Managers can update any job"
  ON jobs FOR UPDATE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Cleaners can update their assigned jobs"
  ON jobs FOR UPDATE
  USING (assigned_cleaner_id = auth.uid());

CREATE POLICY "Admins/Managers can delete jobs"
  ON jobs FOR DELETE
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

-- ====================================
-- CHECKLISTS POLICIES
-- ====================================
CREATE POLICY "Users can view checklists in their company"
  ON checklists FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins/Managers can manage checklists"
  ON checklists FOR ALL
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

-- ====================================
-- CHECKLIST ITEMS POLICIES
-- ====================================
CREATE POLICY "Users can view checklist items"
  ON checklist_items FOR SELECT
  USING (
    checklist_id IN (
      SELECT id FROM checklists WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Admins/Managers can manage checklist items"
  ON checklist_items FOR ALL
  USING (
    checklist_id IN (
      SELECT id FROM checklists WHERE company_id = get_user_company_id() AND is_admin_or_manager()
    )
  );

-- ====================================
-- JOB CHECKLIST ITEMS POLICIES
-- ====================================
CREATE POLICY "Users can view job checklist items"
  ON job_checklist_items FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Cleaners can update their job checklist items"
  ON job_checklist_items FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE assigned_cleaner_id = auth.uid()
    )
  );

CREATE POLICY "Admins/Managers can manage job checklist items"
  ON job_checklist_items FOR ALL
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE company_id = get_user_company_id() AND is_admin_or_manager()
    )
  );

-- ====================================
-- SUPPLIES POLICIES
-- ====================================
CREATE POLICY "Users can view supplies in their company"
  ON supplies FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins/Managers can manage supplies"
  ON supplies FOR ALL
  USING (company_id = get_user_company_id() AND is_admin_or_manager());

-- ====================================
-- SUPPLY USAGE POLICIES
-- ====================================
CREATE POLICY "Users can view supply usage in their company"
  ON supply_usage FOR SELECT
  USING (
    supply_id IN (
      SELECT id FROM supplies WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert supply usage"
  ON supply_usage FOR INSERT
  WITH CHECK (
    supply_id IN (
      SELECT id FROM supplies WHERE company_id = get_user_company_id()
    )
  );

-- ====================================
-- NOTIFICATIONS POLICIES
-- ====================================
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);
