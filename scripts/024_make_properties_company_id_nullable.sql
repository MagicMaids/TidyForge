-- Allow properties to be created without a company_id
-- This is necessary for client-owned properties that haven't been linked to a cleaning company yet

-- Remove NOT NULL constraint from company_id
ALTER TABLE properties 
  ALTER COLUMN company_id DROP NOT NULL;

-- Add a check constraint to ensure either company_id or client_id is set
ALTER TABLE properties
  ADD CONSTRAINT properties_must_have_owner 
  CHECK (company_id IS NOT NULL OR client_id IS NOT NULL);

-- Update existing properties to have proper constraints
-- (This is just a safety check, should not affect existing data)
