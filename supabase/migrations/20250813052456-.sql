-- Create admin user account
-- First, let's create a proper admin user in the auth system
-- This will be done through a SQL insert that mimics what Supabase Auth does

-- Generate a proper UUID for the admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@propswipes.com',
  crypt('admin123password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"display_name": "PropSwipes Admin"}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Also ensure we have the admin profile
INSERT INTO public.profiles (
  user_id,
  display_name,
  user_type
) 
SELECT 
  id,
  'PropSwipes Admin',
  'buyer'
FROM auth.users 
WHERE email = 'admin@propswipes.com'
ON CONFLICT (user_id) DO NOTHING;