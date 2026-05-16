-- Add calendar sync tracking and automatic job creation system

-- Add sync tracking fields to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS last_calendar_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT;

-- Add field to track if job was auto-created from Airbnb
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual', -- manual, airbnb_sync, api
ADD COLUMN IF NOT EXISTS airbnb_reservation_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_airbnb_reservation_id ON jobs(airbnb_reservation_id);

-- Table to track calendar sync history
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  sync_type TEXT DEFAULT 'manual', -- manual, scheduled, automatic
  status TEXT DEFAULT 'success', -- success, failed, partial
  events_found INTEGER DEFAULT 0,
  jobs_created INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_sync_logs_company_id ON calendar_sync_logs(company_id);
CREATE INDEX idx_calendar_sync_logs_property_id ON calendar_sync_logs(property_id);
CREATE INDEX idx_calendar_sync_logs_synced_at ON calendar_sync_logs(synced_at);

-- RLS policies
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_view_own_sync_logs"
  ON calendar_sync_logs FOR SELECT
  TO authenticated
  USING (company_id = get_effective_company_id() OR is_platform_admin());

CREATE POLICY "companies_insert_sync_logs"
  ON calendar_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_effective_company_id() OR is_platform_admin());
