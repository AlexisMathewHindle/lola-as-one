-- Check existing RLS policies on customers table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customers';

-- Check if there are any customers in the table
SELECT COUNT(*) as customer_count FROM customers;

-- Check current user's role
SELECT 
  auth.uid() as user_id,
  auth.jwt() ->> 'role' as user_role,
  auth.jwt() as full_jwt;
