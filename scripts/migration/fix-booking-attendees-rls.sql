-- Fix RLS policies on booking_attendees table to work with app_metadata role
-- This matches the fix we did for the bookings table

-- Drop the existing admin policy that doesn't work
DROP POLICY IF EXISTS "Admins can manage all booking attendees" ON booking_attendees;

-- Create new policies that check for admin role in different locations
CREATE POLICY "Admins can view all booking attendees (app_metadata)"
ON booking_attendees FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can insert booking attendees (app_metadata)"
ON booking_attendees FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update booking attendees (app_metadata)"
ON booking_attendees FOR UPDATE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete booking attendees (app_metadata)"
ON booking_attendees FOR DELETE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Verify the policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'booking_attendees'
ORDER BY policyname;

