-- Make client_id nullable in jobs table to allow jobs for properties without clients
-- (e.g., Airbnb properties managed directly by the company)

ALTER TABLE jobs ALTER COLUMN client_id DROP NOT NULL;

-- Add index for better query performance on nullable client_id
CREATE INDEX IF NOT EXISTS idx_jobs_client_id_null ON jobs(client_id) WHERE client_id IS NULL;

-- Update RLS policies to handle null client_id
DROP POLICY IF EXISTS "clients_view_own_jobs" ON jobs;
DROP POLICY IF EXISTS "clients_update_own_jobs" ON jobs;

CREATE POLICY "clients_view_own_jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    client_id IS NOT NULL 
    AND client_id = get_client_id_for_portal_user()
  );

CREATE POLICY "clients_update_own_jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    client_id IS NOT NULL
    AND client_id = get_client_id_for_portal_user()
  )
  WITH CHECK (
    client_id IS NOT NULL
    AND client_id = get_client_id_for_portal_user()
  );
