-- Add detailed access control fields to properties table
-- This enables comprehensive tracking of all property access methods

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS gate_code TEXT,
  ADD COLUMN IF NOT EXISTS building_code TEXT,
  ADD COLUMN IF NOT EXISTS door_code TEXT,
  ADD COLUMN IF NOT EXISTS supply_closet_code TEXT,
  ADD COLUMN IF NOT EXISTS fob_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS additional_access_instructions TEXT;

-- Migrate existing access_code to door_code if it exists
UPDATE properties 
SET door_code = access_code 
WHERE access_code IS NOT NULL AND door_code IS NULL;

-- Keep access_code for backward compatibility but mark as deprecated
COMMENT ON COLUMN properties.access_code IS 'DEPRECATED: Use door_code instead. Kept for backward compatibility.';
