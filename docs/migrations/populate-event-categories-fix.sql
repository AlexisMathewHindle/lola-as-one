-- Populate category_id for all offering_events based on offering title patterns
-- Run this in Supabase SQL Editor

-- First, let's see what we're working with
SELECT 
  o.title,
  COUNT(*) as event_count,
  COUNT(oe.category_id) as categorized_count
FROM offering_events oe
JOIN offerings o ON o.id = oe.offering_id
GROUP BY o.title
ORDER BY event_count DESC;

-- Now update the events with appropriate categories

-- 1. Open Studio events
UPDATE offering_events
SET category_id = '11111111-1111-1111-1111-111111111111'
WHERE category_id IS NULL
AND offering_id IN (
  SELECT id FROM offerings 
  WHERE LOWER(title) LIKE '%open studio%'
  AND LOWER(title) NOT LIKE '%holiday%'
);

-- 2. Little Ones / Littles Ones events (including typo)
UPDATE offering_events
SET category_id = '22222222-2222-2222-2222-222222222222'
WHERE category_id IS NULL
AND offering_id IN (
  SELECT id FROM offerings 
  WHERE LOWER(title) LIKE '%little ones%'
  OR LOWER(title) LIKE '%littles ones%'
  AND LOWER(title) NOT LIKE '%holiday%'
);

-- 3. Creative Saturdays → Adult Workshops
UPDATE offering_events
SET category_id = '44444444-4444-4444-4444-444444444444'
WHERE category_id IS NULL
AND offering_id IN (
  SELECT id FROM offerings 
  WHERE LOWER(title) LIKE '%creative saturday%'
  OR LOWER(title) LIKE '%adult%'
);

-- 4. Story of Art Club → Kids Workshops (parent category)
UPDATE offering_events
SET category_id = '33333333-3333-3333-3333-333333333333'
WHERE category_id IS NULL
AND offering_id IN (
  SELECT id FROM offerings 
  WHERE LOWER(title) LIKE '%story of art club%'
  OR LOWER(title) LIKE '%art club%'
);

-- 5. Storytime → Special Programs (parent category)
UPDATE offering_events
SET category_id = '77777777-7777-7777-7777-777777777777'
WHERE category_id IS NULL
AND offering_id IN (
  SELECT id FROM offerings 
  WHERE LOWER(title) LIKE '%storytime%'
  OR LOWER(title) LIKE '%story time%'
);

-- 6. Holiday programs
UPDATE offering_events
SET category_id = '55555555-5555-5555-5555-555555555555'
WHERE category_id IS NULL
AND offering_id IN (
  SELECT id FROM offerings 
  WHERE LOWER(title) LIKE '%holiday%'
);

-- 7. Private parties
UPDATE offering_events
SET category_id = '66666666-6666-6666-6666-666666666666'
WHERE category_id IS NULL
AND offering_id IN (
  SELECT id FROM offerings 
  WHERE LOWER(title) LIKE '%private%'
  OR LOWER(title) LIKE '%party%'
  OR LOWER(title) LIKE '%parties%'
);

-- Verify the results
SELECT 
  ec.name as category,
  COUNT(*) as event_count
FROM offering_events oe
JOIN event_categories ec ON ec.id = oe.category_id
GROUP BY ec.name
ORDER BY event_count DESC;

-- Check for any remaining uncategorized events
SELECT 
  o.title,
  oe.event_date,
  oe.id
FROM offering_events oe
LEFT JOIN offerings o ON o.id = oe.offering_id
WHERE oe.category_id IS NULL
ORDER BY oe.event_date DESC
LIMIT 20;

