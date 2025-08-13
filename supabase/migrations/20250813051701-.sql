-- Create admin user if not exists
-- Note: In production, use Supabase Auth UI to create this user properly
-- This is just for development/testing

-- Create admin profile
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role
) VALUES (
  'admin-user-uuid',
  'admin@propswipes.com',
  crypt('admin123password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"display_name": "Admin User"}',
  'authenticated'
) ON CONFLICT (email) DO NOTHING;