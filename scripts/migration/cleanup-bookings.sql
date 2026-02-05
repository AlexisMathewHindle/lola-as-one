-- Cleanup script to remove all existing bookings and offering_events before re-importing
-- This prepares the database for fresh migration from themes collection
-- WARNING: This will delete all bookings, orders, offering_events, and event offerings!

BEGIN;

-- Step 1: Delete all booking attendees (will be cascaded anyway, but being explicit)
DELETE FROM booking_attendees;

-- Step 2: Delete all bookings (references offering_events)
DELETE FROM bookings;

-- Step 3: Delete all order items
DELETE FROM order_items;

-- Step 4: Delete all orders
DELETE FROM orders;

-- Step 5: Delete all event capacity holds (references event_capacity)
DELETE FROM event_capacity_holds WHERE event_capacity_id IN (
  SELECT id FROM event_capacity WHERE offering_event_id IN (
    SELECT id FROM offering_events
  )
);

-- Step 6: Delete all event capacity records (references offering_events)
DELETE FROM event_capacity;

-- Step 7: Delete all offering_events
DELETE FROM offering_events;

-- Step 8: Delete all offerings of type 'event' (since we're re-importing from themes)
DELETE FROM offerings WHERE type = 'event';

-- Verify deletion
SELECT
  (SELECT COUNT(*) FROM offerings WHERE type = 'event') as offerings_count,
  (SELECT COUNT(*) FROM offering_events) as offering_events_count,
  (SELECT COUNT(*) FROM event_capacity) as event_capacity_count,
  (SELECT COUNT(*) FROM bookings) as bookings_count,
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM order_items) as order_items_count;

-- If everything looks good, commit the transaction
-- Otherwise, rollback with: ROLLBACK;
COMMIT;

-- Verify cleanup
SELECT 
  'orders' as table_name, 
  COUNT(*) as count 
FROM orders
UNION ALL
SELECT 
  'order_items' as table_name, 
  COUNT(*) as count 
FROM order_items
UNION ALL
SELECT 
  'bookings' as table_name, 
  COUNT(*) as count 
FROM bookings
UNION ALL
SELECT 
  'booking_attendees' as table_name, 
  COUNT(*) as count 
FROM booking_attendees;

