-- Check what events are available in the database
SELECT 
  oe.id as offering_event_id,
  o.title as event_title,
  oe.event_date,
  oe.event_start_time,
  oe.max_capacity,
  oe.current_bookings,
  (oe.max_capacity - oe.current_bookings) as spaces_available,
  o.status
FROM offering_events oe
JOIN offerings o ON o.id = oe.offering_id
WHERE o.status = 'published'
  AND o.type = 'event'
ORDER BY oe.event_date;

