-- Fix RLS policies for event_categories table
-- The issue is that the policy tries to query auth.users table which causes permission denied
-- Instead, we should check the JWT directly like other fixed policies

-- Drop the existing admin policy that queries auth.users
DROP POLICY IF EXISTS "Admins can manage event categories" ON event_categories;

-- Create new policies that check app_metadata in JWT directly
-- This matches the pattern used in fix-all-admin-rls-policies.sql

-- Allow admins to INSERT categories
CREATE POLICY "Admins can insert event categories (app_metadata)"
ON event_categories FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Allow admins to UPDATE categories
CREATE POLICY "Admins can update event categories (app_metadata)"
ON event_categories FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Allow admins to DELETE categories
CREATE POLICY "Admins can delete event categories (app_metadata)"
ON event_categories FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Verify the policies were created
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'event_categories'
ORDER BY policyname;

