-- ============================================================================
-- MIGRATION: Populate category_id for existing events
-- ============================================================================
-- This migration populates the category_id field in offering_events based on
-- the old metadata.category field in the offerings table.
--
-- Run this migration after add-event-categories.sql has been applied.
-- ============================================================================

-- ============================================================================
-- 1. UPDATE EVENTS BASED ON METADATA CATEGORY
-- ============================================================================

-- Map "Open Studio" category
UPDATE offering_events oe
SET category_id = '11111111-1111-1111-1111-111111111111' -- Open Studio parent
FROM offerings o
WHERE oe.offering_id = o.id
  AND o.type = 'event'
  AND oe.category_id IS NULL
  AND (
    o.metadata->>'category' ILIKE '%open studio%'
    OR o.title ILIKE '%open studio%'
  );

-- Map "Little Ones" category
UPDATE offering_events oe
SET category_id = '22222222-2222-2222-2222-222222222222' -- Little Ones parent
FROM offerings o
WHERE oe.offering_id = o.id
  AND o.type = 'event'
  AND oe.category_id IS NULL
  AND (
    o.metadata->>'category' ILIKE '%little ones%'
    OR o.title ILIKE '%little ones%'
  );

-- Map "Kids" or "Children" category
UPDATE offering_events oe
SET category_id = '33333333-3333-3333-3333-333333333333' -- Kids Workshops parent
FROM offerings o
WHERE oe.offering_id = o.id
  AND o.type = 'event'
  AND oe.category_id IS NULL
  AND (
    o.metadata->>'category' ILIKE '%kids%'
    OR o.metadata->>'category' ILIKE '%children%'
    OR o.title ILIKE '%kids%'
    OR o.title ILIKE '%children%'
  );

-- Map "Adult" category
UPDATE offering_events oe
SET category_id = '44444444-4444-4444-4444-444444444444' -- Adult Workshops parent
FROM offerings o
WHERE oe.offering_id = o.id
  AND o.type = 'event'
  AND oe.category_id IS NULL
  AND (
    o.metadata->>'category' ILIKE '%adult%'
    OR o.title ILIKE '%adult%'
  );

-- Map "Holiday" category
UPDATE offering_events oe
SET category_id = '55555555-5555-5555-5555-555555555555' -- Holiday Programs parent
FROM offerings o
WHERE oe.offering_id = o.id
  AND o.type = 'event'
  AND oe.category_id IS NULL
  AND (
    o.metadata->>'category' ILIKE '%holiday%'
    OR o.title ILIKE '%holiday%'
  );

-- Map "Private" category
UPDATE offering_events oe
SET category_id = '66666666-6666-6666-6666-666666666666' -- Private Events parent
FROM offerings o
WHERE oe.offering_id = o.id
  AND o.type = 'event'
  AND oe.category_id IS NULL
  AND (
    o.metadata->>'category' ILIKE '%private%'
    OR o.title ILIKE '%private%'
  );

-- Map "Storytime" to Special Programs
UPDATE offering_events oe
SET category_id = '77777777-7777-7777-7777-777777777777' -- Special Programs parent
FROM offerings o
WHERE oe.offering_id = o.id
  AND o.type = 'event'
  AND oe.category_id IS NULL
  AND (
    o.metadata->>'category' ILIKE '%storytime%'
    OR o.metadata->>'category' ILIKE '%story time%'
    OR o.title ILIKE '%storytime%'
    OR o.title ILIKE '%story time%'
  );

-- ============================================================================
-- 2. REPORT RESULTS
-- ============================================================================

-- Show how many events were updated
DO $$
DECLARE
  total_events INTEGER;
  categorized_events INTEGER;
  uncategorized_events INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_events FROM offering_events;
  SELECT COUNT(*) INTO categorized_events FROM offering_events WHERE category_id IS NOT NULL;
  SELECT COUNT(*) INTO uncategorized_events FROM offering_events WHERE category_id IS NULL;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Event Category Migration Results';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total events: %', total_events;
  RAISE NOTICE 'Categorized events: %', categorized_events;
  RAISE NOTICE 'Uncategorized events: %', uncategorized_events;
  RAISE NOTICE '============================================';
END $$;

-- Show uncategorized events for manual review
SELECT 
  o.id,
  o.title,
  o.metadata->>'category' as old_category,
  oe.event_date
FROM offerings o
JOIN offering_events oe ON oe.offering_id = o.id
WHERE o.type = 'event'
  AND oe.category_id IS NULL
ORDER BY oe.event_date DESC
LIMIT 20;

