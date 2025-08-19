-- Fix the security issue with function search path by properly dropping trigger first
DROP TRIGGER IF EXISTS geocode_property_trigger ON properties;
DROP FUNCTION IF EXISTS geocode_property_address();

CREATE OR REPLACE FUNCTION geocode_property_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_address TEXT;
BEGIN
  -- Construct full address
  full_address := NEW.address || ', ' || NEW.city || ', ' || NEW.state || ' ' || COALESCE(NEW.zip_code, '');
  
  -- For now, set some default coordinates based on city/state
  -- In production, you'd call a real geocoding service here
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    -- Example coordinates for some major cities (you'll want to expand this or use real geocoding)
    CASE 
      WHEN LOWER(NEW.city) LIKE '%seattle%' THEN
        NEW.latitude := 47.6062;
        NEW.longitude := -122.3321;
      WHEN LOWER(NEW.city) LIKE '%portland%' THEN
        NEW.latitude := 45.5152;
        NEW.longitude := -122.6784;
      WHEN LOWER(NEW.city) LIKE '%san francisco%' THEN
        NEW.latitude := 37.7749;
        NEW.longitude := -122.4194;
      WHEN LOWER(NEW.city) LIKE '%los angeles%' THEN
        NEW.latitude := 34.0522;
        NEW.longitude := -118.2437;
      WHEN LOWER(NEW.city) LIKE '%new york%' OR LOWER(NEW.city) LIKE '%nyc%' THEN
        NEW.latitude := 40.7128;
        NEW.longitude := -74.0060;
      WHEN LOWER(NEW.city) LIKE '%chicago%' THEN
        NEW.latitude := 41.8781;
        NEW.longitude := -87.6298;
      WHEN LOWER(NEW.city) LIKE '%miami%' THEN
        NEW.latitude := 25.7617;
        NEW.longitude := -80.1918;
      WHEN LOWER(NEW.city) LIKE '%dallas%' THEN
        NEW.latitude := 32.7767;
        NEW.longitude := -96.7970;
      WHEN LOWER(NEW.city) LIKE '%houston%' THEN
        NEW.latitude := 29.7604;
        NEW.longitude := -95.3698;
      WHEN LOWER(NEW.city) LIKE '%phoenix%' THEN
        NEW.latitude := 33.4484;
        NEW.longitude := -112.0740;
      WHEN LOWER(NEW.city) LIKE '%philadelphia%' THEN
        NEW.latitude := 39.9526;
        NEW.longitude := -75.1652;
      WHEN LOWER(NEW.city) LIKE '%san antonio%' THEN
        NEW.latitude := 29.4241;
        NEW.longitude := -98.4936;
      WHEN LOWER(NEW.city) LIKE '%san diego%' THEN
        NEW.latitude := 32.7157;
        NEW.longitude := -117.1611;
      WHEN LOWER(NEW.city) LIKE '%austin%' THEN
        NEW.latitude := 30.2672;
        NEW.longitude := -97.7431;
      -- New York specific areas including Woodmere and Oceanside
      WHEN LOWER(NEW.city) LIKE '%woodmere%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.6321;
        NEW.longitude := -73.7287;
      WHEN LOWER(NEW.city) LIKE '%oceanside%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.6387;
        NEW.longitude := -73.6407;
      WHEN LOWER(NEW.city) LIKE '%hempstead%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.7062;
        NEW.longitude := -73.6187;
      WHEN LOWER(NEW.city) LIKE '%freeport%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.6576;
        NEW.longitude := -73.5832;
      WHEN LOWER(NEW.city) LIKE '%long beach%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.5884;
        NEW.longitude := -73.6579;
      WHEN LOWER(NEW.city) LIKE '%rockville centre%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.6584;
        NEW.longitude := -73.6418;
      WHEN LOWER(NEW.city) LIKE '%valley stream%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.6643;
        NEW.longitude := -73.7085;
      WHEN LOWER(NEW.city) LIKE '%lynbrook%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.6548;
        NEW.longitude := -73.6718;
      WHEN LOWER(NEW.city) LIKE '%malverne%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.6787;
        NEW.longitude := -73.6718;
      WHEN LOWER(NEW.city) LIKE '%west hempstead%' AND LOWER(NEW.state) LIKE '%ny%' THEN
        NEW.latitude := 40.7048;
        NEW.longitude := -73.6501;
      ELSE
        -- Default to null if city not found - you'd want to call a real geocoding service here
        NEW.latitude := NULL;
        NEW.longitude := NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER geocode_property_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION geocode_property_address();