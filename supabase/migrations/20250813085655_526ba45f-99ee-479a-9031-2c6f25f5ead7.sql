-- Update admin policies to include ankur@furrisic.com

-- Update properties policies
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;
DROP POLICY IF EXISTS "Admins can update any property" ON properties;
DROP POLICY IF EXISTS "Admins can delete any property" ON properties;

CREATE POLICY "Admins can view all properties" ON properties
  FOR SELECT USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'admin@propswipes.com'::text, 
      'support@propswipes.com'::text, 
      'isaacberry91@yahoo.com'::text,
      'ankur@furrisic.com'::text
    ])
  );

CREATE POLICY "Admins can update any property" ON properties
  FOR UPDATE USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'admin@propswipes.com'::text, 
      'support@propswipes.com'::text, 
      'isaacberry91@yahoo.com'::text,
      'ankur@furrisic.com'::text
    ])
  );

CREATE POLICY "Admins can delete any property" ON properties
  FOR DELETE USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'admin@propswipes.com'::text, 
      'support@propswipes.com'::text, 
      'isaacberry91@yahoo.com'::text,
      'ankur@furrisic.com'::text
    ])
  );

-- Update matches policies
DROP POLICY IF EXISTS "Admins can view all matches" ON matches;

CREATE POLICY "Admins can view all matches" ON matches
  FOR SELECT USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'admin@propswipes.com'::text, 
      'support@propswipes.com'::text, 
      'isaacberry91@yahoo.com'::text,
      'ankur@furrisic.com'::text
    ])
  );

-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    (auth.jwt() ->> 'email'::text) = ANY (ARRAY[
      'admin@propswipes.com'::text, 
      'support@propswipes.com'::text, 
      'isaacberry91@yahoo.com'::text,
      'ankur@furrisic.com'::text
    ])
  );