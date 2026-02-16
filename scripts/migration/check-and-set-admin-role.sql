-- Check and set admin role for your user
-- Run this in Supabase SQL Editor

-- Step 1: Check current users and their roles
SELECT 
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Set admin role in app_metadata (replace with your email)
-- UNCOMMENT and replace 'your-email@example.com' with your actual email:

-- UPDATE auth.users 
-- SET raw_app_meta_data = 
--   COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-email@example.com';

-- Step 3: Verify the role was set
-- SELECT 
--   email,
--   raw_app_meta_data->>'role' as role
-- FROM auth.users
-- WHERE email = 'your-email@example.com';

-- IMPORTANT: After running this, you MUST sign out and sign back in 
-- for the JWT to be refreshed with the new role!

