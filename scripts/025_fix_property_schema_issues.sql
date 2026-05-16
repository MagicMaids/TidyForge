-- Fix duplicate foreign key constraints and prepare for Airbnb import
-- This resolves the "more than one relationship" error and ensures correct column names

-- ====================================
-- STEP 1: Remove duplicate foreign key constraint
-- ====================================

-- The properties table has both 'properties_company_id_fkey' and 'fk_company' pointing to companies
-- Keep the named one (fk_company) and drop the auto-generated one
ALTER TABLE properties 
  DROP CONSTRAINT IF EXISTS properties_company_id_fkey;

-- ====================================
-- STEP 2: Ensure all Airbnb-related columns exist
-- ====================================

-- These should already exist from script 022, but we'll ensure they're present
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS airbnb_listing_url TEXT,
  ADD COLUMN IF NOT EXISTS airbnb_listing_id TEXT,
  ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT,
  ADD COLUMN IF NOT EXISTS airbnb_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT FALSE;

-- Add unique constraint to airbnb_listing_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'properties_airbnb_listing_id_key'
  ) THEN
    ALTER TABLE properties ADD CONSTRAINT properties_airbnb_listing_id_key UNIQUE (airbnb_listing_id);
  END IF;
END $$;

-- ====================================
-- STEP 3: Create index for faster Airbnb ID lookups if not exists
-- ====================================

CREATE INDEX IF NOT EXISTS idx_properties_airbnb_listing_id ON properties(airbnb_listing_id);
