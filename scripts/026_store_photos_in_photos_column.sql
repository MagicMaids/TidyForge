-- Ensure photos from Airbnb import are stored in the photos column for cleaners to reference

-- Update existing properties to copy photos from airbnb_data to photos column
UPDATE properties 
SET photos = airbnb_data->'photos'
WHERE airbnb_data->'photos' IS NOT NULL 
  AND (photos IS NULL OR photos = '[]'::jsonb);

-- Add a trigger to automatically sync photos when airbnb_data is updated
CREATE OR REPLACE FUNCTION sync_airbnb_photos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.airbnb_data ? 'photos' THEN
    NEW.photos := NEW.airbnb_data->'photos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_photos_on_insert ON properties;
DROP TRIGGER IF EXISTS sync_photos_on_update ON properties;

CREATE TRIGGER sync_photos_on_insert
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION sync_airbnb_photos();

CREATE TRIGGER sync_photos_on_update
  BEFORE UPDATE OF airbnb_data ON properties
  FOR EACH ROW
  EXECUTE FUNCTION sync_airbnb_photos();
