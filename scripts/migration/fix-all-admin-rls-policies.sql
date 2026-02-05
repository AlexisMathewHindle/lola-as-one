-- Fix ALL admin RLS policies to check app_metadata instead of top-level role
-- This fixes the issue where admin role is stored in auth.jwt() -> 'app_metadata' ->> 'role'

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

CREATE POLICY "Admins can view all orders (app_metadata)"
ON orders FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can manage all orders (app_metadata)"
ON orders FOR ALL
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- ORDER_ITEMS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "Admins can view all order items (app_metadata)"
ON order_items FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can manage all order items (app_metadata)"
ON order_items FOR ALL
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- BOOKING_ATTENDEES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all booking attendees" ON booking_attendees;

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

-- ============================================================================
-- VERIFY ALL POLICIES
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'bookings', 'booking_attendees')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

