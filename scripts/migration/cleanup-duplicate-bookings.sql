-- Cleanup duplicate bookings that don't have attendees
-- These are from failed import attempts where the import stopped before attendees were added

-- STEP 1: First, let's see what we're about to delete (SAFE - just viewing)
SELECT 
  b.id,
  b.customer_email,
  b.customer_name,
  b.number_of_attendees,
  b.created_at,
  o.title as event_title,
  oe.event_date
FROM bookings b
LEFT JOIN booking_attendees ba ON ba.booking_id = b.id
LEFT JOIN offering_events oe ON oe.id = b.offering_event_id
LEFT JOIN offerings o ON o.id = oe.offering_id
WHERE ba.id IS NULL  -- No attendees
ORDER BY b.created_at DESC;

-- STEP 2: Delete the bookings without attendees (DESTRUCTIVE - run only after reviewing above)
-- Uncomment the lines below when you're ready to delete:

/*
DELETE FROM bookings
WHERE id IN (
  SELECT b.id
  FROM bookings b
  LEFT JOIN booking_attendees ba ON ba.booking_id = b.id
  WHERE ba.id IS NULL  -- No attendees
);
*/

-- STEP 3: Verify the cleanup (run after deletion)
/*
SELECT 
  'Total Bookings' as metric,
  COUNT(*) as count
FROM bookings
UNION ALL
SELECT 
  'Bookings with Attendees',
  COUNT(DISTINCT ba.booking_id)
FROM booking_attendees ba
UNION ALL
SELECT 
  'Bookings without Attendees',
  COUNT(*)
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM booking_attendees ba WHERE ba.booking_id = b.id
)
UNION ALL
SELECT 
  'Total Attendee Records',
  COUNT(*)
FROM booking_attendees;
*/

-- STEP 4: Also cleanup orphaned orders (orders that no longer have bookings)
-- Run this AFTER deleting the duplicate bookings

/*
DELETE FROM order_items
WHERE id IN (
  SELECT oi.id
  FROM order_items oi
  LEFT JOIN bookings b ON b.order_item_id = oi.id
  WHERE b.id IS NULL
  AND oi.item_type = 'event'
);

DELETE FROM orders
WHERE id IN (
  SELECT o.id
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE oi.id IS NULL
);
*/

