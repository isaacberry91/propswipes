-- Fix the security issue with function search path
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
      WHEN LOWER(NEW.city) LIKE '%columbus%' THEN
        NEW.latitude := 39.9612;
        NEW.longitude := -82.9988;
      WHEN LOWER(NEW.city) LIKE '%fort worth%' THEN
        NEW.latitude := 32.7555;
        NEW.longitude := -97.3308;
      WHEN LOWER(NEW.city) LIKE '%charlotte%' THEN
        NEW.latitude := 35.2271;
        NEW.longitude := -80.8431;
      WHEN LOWER(NEW.city) LIKE '%indianapolis%' THEN
        NEW.latitude := 39.7684;
        NEW.longitude := -86.1581;
      WHEN LOWER(NEW.city) LIKE '%san jose%' THEN
        NEW.latitude := 37.3382;
        NEW.longitude := -121.8863;
      WHEN LOWER(NEW.city) LIKE '%denver%' THEN
        NEW.latitude := 39.7392;
        NEW.longitude := -104.9903;
      WHEN LOWER(NEW.city) LIKE '%washington%' OR LOWER(NEW.city) LIKE '%dc%' THEN
        NEW.latitude := 38.9072;
        NEW.longitude := -77.0369;
      WHEN LOWER(NEW.city) LIKE '%boston%' THEN
        NEW.latitude := 42.3601;
        NEW.longitude := -71.0589;
      WHEN LOWER(NEW.city) LIKE '%detroit%' THEN
        NEW.latitude := 42.3314;
        NEW.longitude := -83.0458;
      WHEN LOWER(NEW.city) LIKE '%memphis%' THEN
        NEW.latitude := 35.1495;
        NEW.longitude := -90.0490;
      WHEN LOWER(NEW.city) LIKE '%nashville%' THEN
        NEW.latitude := 36.1627;
        NEW.longitude := -86.7816;
      WHEN LOWER(NEW.city) LIKE '%baltimore%' THEN
        NEW.latitude := 39.2904;
        NEW.longitude := -76.6122;
      WHEN LOWER(NEW.city) LIKE '%oklahoma city%' THEN
        NEW.latitude := 35.4676;
        NEW.longitude := -97.5164;
      WHEN LOWER(NEW.city) LIKE '%louisville%' THEN
        NEW.latitude := 38.2527;
        NEW.longitude := -85.7585;
      WHEN LOWER(NEW.city) LIKE '%milwaukee%' THEN
        NEW.latitude := 43.0389;
        NEW.longitude := -87.9065;
      WHEN LOWER(NEW.city) LIKE '%las vegas%' THEN
        NEW.latitude := 36.1699;
        NEW.longitude := -115.1398;
      WHEN LOWER(NEW.city) LIKE '%albuquerque%' THEN
        NEW.latitude := 35.0844;
        NEW.longitude := -106.6504;
      WHEN LOWER(NEW.city) LIKE '%tucson%' THEN
        NEW.latitude := 32.2226;
        NEW.longitude := -110.9747;
      WHEN LOWER(NEW.city) LIKE '%fresno%' THEN
        NEW.latitude := 36.7378;
        NEW.longitude := -119.7871;
      WHEN LOWER(NEW.city) LIKE '%sacramento%' THEN
        NEW.latitude := 38.5816;
        NEW.longitude := -121.4944;
      WHEN LOWER(NEW.city) LIKE '%mesa%' THEN
        NEW.latitude := 33.4152;
        NEW.longitude := -111.8315;
      WHEN LOWER(NEW.city) LIKE '%kansas city%' THEN
        NEW.latitude := 39.0997;
        NEW.longitude := -94.5786;
      WHEN LOWER(NEW.city) LIKE '%atlanta%' THEN
        NEW.latitude := 33.7490;
        NEW.longitude := -84.3880;
      WHEN LOWER(NEW.city) LIKE '%omaha%' THEN
        NEW.latitude := 41.2565;
        NEW.longitude := -95.9345;
      WHEN LOWER(NEW.city) LIKE '%colorado springs%' THEN
        NEW.latitude := 38.8339;
        NEW.longitude := -104.8214;
      WHEN LOWER(NEW.city) LIKE '%raleigh%' THEN
        NEW.latitude := 35.7796;
        NEW.longitude := -78.6382;
      WHEN LOWER(NEW.city) LIKE '%virginia beach%' THEN
        NEW.latitude := 36.8529;
        NEW.longitude := -75.9780;
      WHEN LOWER(NEW.city) LIKE '%long beach%' THEN
        NEW.latitude := 33.7701;
        NEW.longitude := -118.1937;
      WHEN LOWER(NEW.city) LIKE '%minneapolis%' THEN
        NEW.latitude := 44.9778;
        NEW.longitude := -93.2650;
      WHEN LOWER(NEW.city) LIKE '%tulsa%' THEN
        NEW.latitude := 36.1540;
        NEW.longitude := -95.9928;
      WHEN LOWER(NEW.city) LIKE '%arlington%' THEN
        NEW.latitude := 32.7357;
        NEW.longitude := -97.1081;
      WHEN LOWER(NEW.city) LIKE '%new orleans%' THEN
        NEW.latitude := 29.9511;
        NEW.longitude := -90.0715;
      WHEN LOWER(NEW.city) LIKE '%wichita%' THEN
        NEW.latitude := 37.6872;
        NEW.longitude := -97.3301;
      WHEN LOWER(NEW.city) LIKE '%cleveland%' THEN
        NEW.latitude := 41.4993;
        NEW.longitude := -81.6944;
      WHEN LOWER(NEW.city) LIKE '%tampa%' THEN
        NEW.latitude := 27.9506;
        NEW.longitude := -82.4572;
      WHEN LOWER(NEW.city) LIKE '%bakersfield%' THEN
        NEW.latitude := 35.3733;
        NEW.longitude := -119.0187;
      WHEN LOWER(NEW.city) LIKE '%aurora%' THEN
        NEW.latitude := 39.7294;
        NEW.longitude := -104.8319;
      WHEN LOWER(NEW.city) LIKE '%anaheim%' THEN
        NEW.latitude := 33.8366;
        NEW.longitude := -117.9143;
      WHEN LOWER(NEW.city) LIKE '%honolulu%' THEN
        NEW.latitude := 21.3099;
        NEW.longitude := -157.8581;
      WHEN LOWER(NEW.city) LIKE '%santa ana%' THEN
        NEW.latitude := 33.7455;
        NEW.longitude := -117.8677;
      WHEN LOWER(NEW.city) LIKE '%corpus christi%' THEN
        NEW.latitude := 27.8006;
        NEW.longitude := -97.3964;
      WHEN LOWER(NEW.city) LIKE '%riverside%' THEN
        NEW.latitude := 33.9806;
        NEW.longitude := -117.3755;
      WHEN LOWER(NEW.city) LIKE '%lexington%' THEN
        NEW.latitude := 38.0406;
        NEW.longitude := -84.5037;
      WHEN LOWER(NEW.city) LIKE '%stockton%' THEN
        NEW.latitude := 37.9577;
        NEW.longitude := -121.2908;
      WHEN LOWER(NEW.city) LIKE '%saint paul%' OR LOWER(NEW.city) LIKE '%st paul%' OR LOWER(NEW.city) LIKE '%st. paul%' THEN
        NEW.latitude := 44.9537;
        NEW.longitude := -93.0900;
      WHEN LOWER(NEW.city) LIKE '%cincinnati%' THEN
        NEW.latitude := 39.1031;
        NEW.longitude := -84.5120;
      WHEN LOWER(NEW.city) LIKE '%anchorage%' THEN
        NEW.latitude := 61.2181;
        NEW.longitude := -149.9003;
      WHEN LOWER(NEW.city) LIKE '%henderson%' THEN
        NEW.latitude := 36.0395;
        NEW.longitude := -114.9817;
      WHEN LOWER(NEW.city) LIKE '%greensboro%' THEN
        NEW.latitude := 36.0726;
        NEW.longitude := -79.7920;
      WHEN LOWER(NEW.city) LIKE '%plano%' THEN
        NEW.latitude := 33.0198;
        NEW.longitude := -96.6989;
      WHEN LOWER(NEW.city) LIKE '%newark%' THEN
        NEW.latitude := 40.7357;
        NEW.longitude := -74.1724;
      WHEN LOWER(NEW.city) LIKE '%lincoln%' THEN
        NEW.latitude := 40.8136;
        NEW.longitude := -96.7026;
      WHEN LOWER(NEW.city) LIKE '%toledo%' THEN
        NEW.latitude := 41.6528;
        NEW.longitude := -83.5379;
      WHEN LOWER(NEW.city) LIKE '%orlando%' THEN
        NEW.latitude := 28.5383;
        NEW.longitude := -81.3792;
      WHEN LOWER(NEW.city) LIKE '%chula vista%' THEN
        NEW.latitude := 32.6401;
        NEW.longitude := -117.0842;
      WHEN LOWER(NEW.city) LIKE '%jersey city%' THEN
        NEW.latitude := 40.7178;
        NEW.longitude := -74.0431;
      WHEN LOWER(NEW.city) LIKE '%chandler%' THEN
        NEW.latitude := 33.3062;
        NEW.longitude := -111.8413;
      WHEN LOWER(NEW.city) LIKE '%laredo%' THEN
        NEW.latitude := 27.5306;
        NEW.longitude := -99.4803;
      WHEN LOWER(NEW.city) LIKE '%madison%' THEN
        NEW.latitude := 43.0732;
        NEW.longitude := -89.4012;
      WHEN LOWER(NEW.city) LIKE '%lubbock%' THEN
        NEW.latitude := 33.5779;
        NEW.longitude := -101.8552;
      WHEN LOWER(NEW.city) LIKE '%winston-salem%' OR LOWER(NEW.city) LIKE '%winston salem%' THEN
        NEW.latitude := 36.0999;
        NEW.longitude := -80.2442;
      WHEN LOWER(NEW.city) LIKE '%garland%' THEN
        NEW.latitude := 32.9126;
        NEW.longitude := -96.6389;
      WHEN LOWER(NEW.city) LIKE '%glendale%' THEN
        NEW.latitude := 33.5387;
        NEW.longitude := -112.1860;
      WHEN LOWER(NEW.city) LIKE '%hialeah%' THEN
        NEW.latitude := 25.8576;
        NEW.longitude := -80.2781;
      WHEN LOWER(NEW.city) LIKE '%reno%' THEN
        NEW.latitude := 39.5296;
        NEW.longitude := -119.8138;
      WHEN LOWER(NEW.city) LIKE '%baton rouge%' THEN
        NEW.latitude := 30.4515;
        NEW.longitude := -91.1871;
      WHEN LOWER(NEW.city) LIKE '%irvine%' THEN
        NEW.latitude := 33.6846;
        NEW.longitude := -117.8265;
      WHEN LOWER(NEW.city) LIKE '%chesapeake%' THEN
        NEW.latitude := 36.7682;
        NEW.longitude := -76.2875;
      WHEN LOWER(NEW.city) LIKE '%irving%' THEN
        NEW.latitude := 32.8140;
        NEW.longitude := -96.9489;
      WHEN LOWER(NEW.city) LIKE '%scottsdale%' THEN
        NEW.latitude := 33.4942;
        NEW.longitude := -111.9261;
      WHEN LOWER(NEW.city) LIKE '%north las vegas%' THEN
        NEW.latitude := 36.1989;
        NEW.longitude := -115.1175;
      WHEN LOWER(NEW.city) LIKE '%fremont%' THEN
        NEW.latitude := 37.5485;
        NEW.longitude := -121.9886;
      WHEN LOWER(NEW.city) LIKE '%gilbert%' THEN
        NEW.latitude := 33.3528;
        NEW.longitude := -111.7890;
      WHEN LOWER(NEW.city) LIKE '%san bernardino%' THEN
        NEW.latitude := 34.1083;
        NEW.longitude := -117.2898;
      WHEN LOWER(NEW.city) LIKE '%boise%' THEN
        NEW.latitude := 43.6150;
        NEW.longitude := -116.2023;
      WHEN LOWER(NEW.city) LIKE '%birmingham%' THEN
        NEW.latitude := 33.5207;
        NEW.longitude := -86.8025;
      -- New York specific areas
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
DROP TRIGGER IF EXISTS geocode_property_trigger ON properties;
CREATE TRIGGER geocode_property_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION geocode_property_address();