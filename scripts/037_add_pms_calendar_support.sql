-- Add support for Property Management System (PMS) calendar integrations
-- Supports Hostaway, Guesty, and other multi-platform calendar systems

-- ====================================
-- STEP 1: Add calendar source fields to properties
-- ====================================

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS calendar_source_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS calendar_url TEXT,
ADD COLUMN IF NOT EXISTS calendar_last_synced TIMESTAMPTZ;

-- Update existing properties with airbnb_ical_url
UPDATE properties 
SET calendar_source_type = 'airbnb',
    calendar_url = airbnb_ical_url
WHERE airbnb_ical_url IS NOT NULL;

-- Create enum-like constraint for calendar source types
-- manual, airbnb, vrbo, booking_com, hostaway, guesty, hospitable, other_pms
COMMENT ON COLUMN properties.calendar_source_type IS 'Source of calendar sync: manual, airbnb, vrbo, booking_com, hostaway, guesty, hospitable, other_pms';
COMMENT ON COLUMN properties.calendar_url IS 'iCal URL for calendar sync from platform or PMS';
COMMENT ON COLUMN properties.calendar_last_synced IS 'Last time calendar was successfully synced';

-- ====================================
-- STEP 2: Add booking platform tracking to jobs
-- ====================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS booking_platform TEXT;

COMMENT ON COLUMN jobs.booking_platform IS 'Platform where booking originated: airbnb, vrbo, booking_com, direct, etc.';

-- Add index for filtering by platform
CREATE INDEX IF NOT EXISTS idx_jobs_booking_platform ON jobs(booking_platform);

-- ====================================
-- STEP 3: Update calendar sync tracking
-- ====================================

CREATE INDEX IF NOT EXISTS idx_properties_calendar_source ON properties(calendar_source_type);
CREATE INDEX IF NOT EXISTS idx_properties_calendar_last_synced ON properties(calendar_last_synced);
