-- Check if term columns are populated in the offerings table
-- Run this in Supabase SQL Editor to verify term data exists

-- 1. Check how many offerings have term data
SELECT 
  COUNT(*) as total_offerings,
  COUNT(term_season) as has_term_season,
  COUNT(term_half) as has_term_half,
  COUNT(term_year) as has_term_year
FROM offerings
WHERE type = 'event';

-- 2. Show sample offerings with term data
SELECT 
  id,
  title,
  term_season,
  term_half,
  term_year,
  metadata->>'term' as metadata_term,
  status
FROM offerings
WHERE type = 'event'
  AND term_season IS NOT NULL
LIMIT 10;

-- 3. Show offerings without term data
SELECT 
  id,
  title,
  term_season,
  term_half,
  metadata->>'term' as metadata_term,
  status
FROM offerings
WHERE type = 'event'
  AND term_season IS NULL
  AND metadata->>'term' IS NOT NULL
LIMIT 10;

-- 4. Check events linked to offerings with term data
SELECT 
  oe.id as event_id,
  oe.event_date,
  o.title,
  o.term_season,
  o.term_half,
  o.term_year,
  c.name as category_name,
  c.slug as category_slug
FROM offering_events oe
JOIN offerings o ON o.id = oe.offering_id
LEFT JOIN event_categories c ON c.id = oe.category_id
WHERE o.term_season IS NOT NULL
  AND o.status = 'published'
  AND oe.event_date >= CURRENT_DATE
ORDER BY oe.event_date
LIMIT 20;

