-- Fix missing is_public column in platform_settings table

-- Add the missing column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_settings' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE platform_settings ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
