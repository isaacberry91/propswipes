-- Create admin role
CREATE ROLE admin_role;

-- Create admin RLS policy for properties that allows admins to see all properties
CREATE POLICY "Admins can view all properties" 
ON public.properties 
FOR SELECT 
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'email')::text IN (
    'admin@propswipes.com',
    'support@propswipes.com',
    'isaacberry91@yahoo.com'
  )
);

-- Create admin policy for updating any property status
CREATE POLICY "Admins can update any property"
ON public.properties
FOR UPDATE
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'email')::text IN (
    'admin@propswipes.com', 
    'support@propswipes.com',
    'isaacberry91@yahoo.com'
  )
);

-- Create admin policy for deleting any property
CREATE POLICY "Admins can delete any property"
ON public.properties
FOR DELETE
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'email')::text IN (
    'admin@propswipes.com',
    'support@propswipes.com', 
    'isaacberry91@yahoo.com'
  )
);

-- Create admin policy for profiles table to see all users
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'email')::text IN (
    'admin@propswipes.com',
    'support@propswipes.com',
    'isaacberry91@yahoo.com'
  )
);

-- Create admin policy for matches table to see all matches
CREATE POLICY "Admins can view all matches"
ON public.matches
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' OR
  (auth.jwt() ->> 'email')::text IN (
    'admin@propswipes.com',
    'support@propswipes.com',
    'isaacberry91@yahoo.com'
  )
);