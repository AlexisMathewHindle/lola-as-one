-- Check for duplicate bookings and identify which ones have attendees
-- This helps clean up after multiple import runs

-- 1. Find bookings with the same customer email, event, and date (potential duplicates)
SELECT 
  customer_email,
  offering_event_id,
  DATE(created_at) as booking_date,
  COUNT(*) as booking_count,
  STRING_AGG(id::text, ', ') as booking_ids
FROM bookings
GROUP BY customer_email, offering_event_id, DATE(created_at)
HAVING COUNT(*) > 1
ORDER BY booking_count DESC, customer_email;

-- 2. Check which bookings have attendees
SELECT 
  b.id as booking_id,
  b.customer_email,
  b.customer_name,
  b.number_of_attendees,
  b.created_at,
  oe.event_date,
  o.title as event_title,
  COUNT(ba.id) as actual_attendee_count
FROM bookings b
LEFT JOIN booking_attendees ba ON ba.booking_id = b.id
LEFT JOIN offering_events oe ON oe.id = b.offering_event_id
LEFT JOIN offerings o ON o.id = oe.offering_id
GROUP BY b.id, b.customer_email, b.customer_name, b.number_of_attendees, b.created_at, oe.event_date, o.title
ORDER BY b.created_at DESC
LIMIT 50;

-- 3. Find bookings that claim to have attendees but don't have attendee records
SELECT 
  b.id as booking_id,
  b.customer_email,
  b.customer_name,
  b.number_of_attendees as claimed_attendees,
  COUNT(ba.id) as actual_attendees,
  b.created_at,
  oe.event_date,
  o.title as event_title
FROM bookings b
LEFT JOIN booking_attendees ba ON ba.booking_id = b.id
LEFT JOIN offering_events oe ON oe.id = b.offering_event_id
LEFT JOIN offerings o ON o.id = oe.offering_id
GROUP BY b.id, b.customer_email, b.customer_name, b.number_of_attendees, b.created_at, oe.event_date, o.title
HAVING COUNT(ba.id) = 0 AND b.number_of_attendees > 0
ORDER BY b.created_at DESC;

-- 4. Summary statistics
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

