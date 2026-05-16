-- Add comprehensive booking fields to jobs table and property check-in/out times

-- ====================================
-- STEP 1: Add booking date fields to jobs
-- ====================================

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS booking_date DATE,
ADD COLUMN IF NOT EXISTS check_in_date DATE,
ADD COLUMN IF NOT EXISTS check_out_date DATE,
ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_check_in_date ON jobs(check_in_date);
CREATE INDEX IF NOT EXISTS idx_jobs_check_out_date ON jobs(check_out_date);
CREATE INDEX IF NOT EXISTS idx_jobs_booking_date ON jobs(booking_date);

-- ====================================
-- STEP 2: Add check-in/out times to properties
-- ====================================

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '15:00:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '11:00:00';

COMMENT ON COLUMN properties.check_in_time IS 'Default check-in time for this property';
COMMENT ON COLUMN properties.check_out_time IS 'Default check-out time for this property';

-- ====================================
-- STEP 3: Update jobs table comments
-- ====================================

COMMENT ON COLUMN jobs.booking_date IS 'Date the reservation was made';
COMMENT ON COLUMN jobs.check_in_date IS 'Date guest checks in';
COMMENT ON COLUMN jobs.check_out_date IS 'Date guest checks out (cleaning should happen on this day)';
COMMENT ON COLUMN jobs.scheduled_date IS 'Date cleaning is scheduled (typically matches check_out_date)';
COMMENT ON COLUMN jobs.guest_name IS 'Name of the guest (from Airbnb reservation if available)';
