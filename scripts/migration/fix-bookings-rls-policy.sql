-- Fix the bookings RLS policy to work with Supabase's typical admin setup
-- This drops the existing admin policy and creates new ones that check multiple locations for the admin role

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

-- Create separate policies for different admin role locations
-- Option 1: Check if role is 'admin' at the top level of JWT
CREATE POLICY "Admins can view all bookings (jwt role)"
ON bookings FOR SELECT
USING (
  (auth.jwt() ->> 'role') = 'admin'
);

-- Option 2: Check if role is 'admin' in app_metadata
CREATE POLICY "Admins can view all bookings (app_metadata)"
ON bookings FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Option 3: Check if user_role is 'admin' in app_metadata (common Supabase pattern)
CREATE POLICY "Admins can view all bookings (user_role)"
ON bookings FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
);

-- Option 4: Service role bypass (for service role key usage)
CREATE POLICY "Service role can view all bookings"
ON bookings FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Also create INSERT/UPDATE/DELETE policies for admins
CREATE POLICY "Admins can insert bookings"
ON bookings FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role') = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
);

CREATE POLICY "Admins can update bookings"
ON bookings FOR UPDATE
USING (
  (auth.jwt() ->> 'role') = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
);

CREATE POLICY "Admins can delete bookings"
ON bookings FOR DELETE
USING (
  (auth.jwt() ->> 'role') = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'user_role') = 'admin'
);

-- Verify the policies were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'bookings' 
ORDER BY policyname;

