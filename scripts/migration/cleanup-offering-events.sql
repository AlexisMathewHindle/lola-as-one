-- Cleanup script to delete all offering_events and related data
-- This prepares the database for a fresh migration from the themes collection
-- Run this script in Supabase SQL Editor

-- WARNING: This will delete all offering_events, event_capacity, and bookings data
-- Make sure you have a backup before running this script

BEGIN;

-- Step 1: Delete all bookings (references offering_events)
DELETE FROM bookings WHERE offering_event_id IN (
  SELECT id FROM offering_events
);

-- Step 2: Delete all event capacity holds (references event_capacity)
DELETE FROM event_capacity_holds WHERE event_capacity_id IN (
  SELECT id FROM event_capacity WHERE offering_event_id IN (
    SELECT id FROM offering_events
  )
);

-- Step 3: Delete all event capacity records (references offering_events)
DELETE FROM event_capacity WHERE offering_event_id IN (
  SELECT id FROM offering_events
);

-- Step 4: Delete all offering_events
DELETE FROM offering_events;

-- Step 5: Delete all offerings of type 'event' (since we're re-importing)
DELETE FROM offerings WHERE type = 'event';

-- Verify deletion
SELECT 
  (SELECT COUNT(*) FROM offerings WHERE type = 'event') as offerings_count,
  (SELECT COUNT(*) FROM offering_events) as offering_events_count,
  (SELECT COUNT(*) FROM event_capacity) as event_capacity_count,
  (SELECT COUNT(*) FROM bookings) as bookings_count;

-- If everything looks good, commit the transaction
-- Otherwise, rollback with: ROLLBACK;
COMMIT;

