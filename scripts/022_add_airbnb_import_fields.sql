-- Add fields to support Airbnb property import and calendar sync

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS airbnb_listing_url TEXT,
  ADD COLUMN IF NOT EXISTS airbnb_listing_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT,
  ADD COLUMN IF NOT EXISTS airbnb_data JSONB DEFAULT '{}', -- Store complete Airbnb data
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT FALSE;

-- Create index for faster Airbnb ID lookups
CREATE INDEX IF NOT EXISTS idx_properties_airbnb_listing_id ON properties(airbnb_listing_id);

-- Create a table to store Airbnb calendar events/bookings
CREATE TABLE IF NOT EXISTS airbnb_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Booking details from Airbnb
  airbnb_booking_id TEXT,
  guest_name TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  nights INTEGER,
  guests INTEGER,
  
  -- Sync status
  is_synced BOOLEAN DEFAULT FALSE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL, -- Link to auto-created cleaning job
  
  -- Raw data from calendar
  raw_calendar_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_property_id ON airbnb_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_check_in_date ON airbnb_bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_airbnb_bookings_is_synced ON airbnb_bookings(is_synced);

-- RLS policies for airbnb_bookings
ALTER TABLE airbnb_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_access_their_airbnb_bookings"
  ON airbnb_bookings FOR ALL
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE company_id = get_effective_company_id()
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE company_id = get_effective_company_id()
    )
    OR is_platform_admin()
  );

CREATE POLICY "clients_view_own_property_bookings"
  ON airbnb_bookings FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties WHERE client_id = get_client_id_for_portal_user()
    )
  );
