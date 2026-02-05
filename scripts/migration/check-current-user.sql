-- Check your user's metadata and role
-- Replace 'your-email@example.com' with your actual admin email
SELECT
  id,
  email,
  role,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE email = 'your-email@example.com';  -- REPLACE THIS WITH YOUR EMAIL

-- Also check if there's a custom role field in app_metadata
SELECT
  id,
  email,
  raw_app_meta_data ->> 'role' as role_in_app_metadata,
  raw_user_meta_data ->> 'role' as role_in_user_metadata
FROM auth.users
WHERE email = 'your-email@example.com';  -- REPLACE THIS WITH YOUR EMAIL

