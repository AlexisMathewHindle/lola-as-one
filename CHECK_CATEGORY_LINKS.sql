-- Check if offering_events have category_id set
-- This helps debug why termGroups might be empty

-- 1. Check how many events have category_id
SELECT 
  COUNT(*) as total_events,
  COUNT(category_id) as has_category_id,
  COUNT(*) - COUNT(category_id) as missing_category_id
FROM offering_events
WHERE event_date >= CURRENT_DATE;

-- 2. Show events with term data but no category_id
SELECT 
  oe.id as event_id,
  oe.event_date,
  oe.category_id,
  o.title,
  o.term_season,
  o.term_half,
  o.term_year
FROM offering_events oe
JOIN offerings o ON o.id = oe.offering_id
WHERE o.term_season IS NOT NULL
  AND oe.category_id IS NULL
  AND oe.event_date >= CURRENT_DATE
LIMIT 10;

-- 3. Show events WITH category_id and term data
SELECT 
  oe.id as event_id,
  oe.event_date,
  oe.category_id,
  c.name as category_name,
  c.slug as category_slug,
  o.title,
  o.term_season,
  o.term_half,
  o.term_year
FROM offering_events oe
JOIN offerings o ON o.id = oe.offering_id
LEFT JOIN event_categories c ON c.id = oe.category_id
WHERE o.term_season IS NOT NULL
  AND oe.event_date >= CURRENT_DATE
ORDER BY oe.event_date
LIMIT 20;

-- 4. Check what categories exist
SELECT 
  id,
  name,
  slug,
  parent_id
FROM event_categories
ORDER BY name;

