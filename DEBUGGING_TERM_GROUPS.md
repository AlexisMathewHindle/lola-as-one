# Debugging Empty Term Groups

## Issue
`termGroups` is coming back empty in CategoryListingView

## Possible Causes

### 1. Term Columns Not Populated
The `term_season`, `term_half`, and `term_year` columns in the `offerings` table may not be populated yet.

**Check:**
1. Open Supabase SQL Editor
2. Run the queries in `CHECK_TERM_DATA.sql`
3. Look for offerings with `term_season` and `term_half` values

**Fix:**
If the columns are empty, run the migration script:
```bash
cd scripts/migration
node migrate-term-data.js
```

### 2. No Events Match the Category
The category you're viewing might not have any term-based events.

**Check:**
1. Open browser console
2. Navigate to a category page
3. Look for console logs:
   - `📊 Fetched X events for category...`
   - Individual event logs showing term data
   - `📦 Result: X term groups, Y single events`

**What to look for:**
- If "Fetched 0 events" → No events in this category at all
- If events show but all have `term_season: null` → Term columns not populated
- If events show with term data but still empty → Check the grouping logic

### 3. Category ID Mismatch
The `category_id` on `offering_events` might not match the category you're viewing.

**Check:**
In browser console, look for the category ID being used:
```javascript
// Should see logs like:
"📊 Fetched X events for category abc-123-def-456"
```

**Fix:**
Verify events have the correct `category_id`:
```sql
SELECT 
  oe.id,
  oe.category_id,
  c.name as category_name,
  o.title as offering_title
FROM offering_events oe
LEFT JOIN event_categories c ON c.id = oe.category_id
JOIN offerings o ON o.id = oe.offering_id
WHERE oe.event_date >= CURRENT_DATE
LIMIT 20;
```

### 4. Events in the Past
Only future events are fetched (event_date >= today).

**Check:**
Look at the event dates in the console logs.

**Fix:**
If all events are in the past, you need to create new future events or adjust the date filter for testing.

## Quick Debug Steps

1. **Open browser console** (F12 or Cmd+Option+I)

2. **Navigate to a category page** (click any event in calendar)

3. **Check console output:**
   ```
   📊 Fetched X events for category...
   Event 0: { title: "...", term_season: "summer", term_half: "second", ... }
   ✅ Term event found! Key: summer_second_2026
   📦 Result: 1 term groups, 0 single events
   Term groups: { summer_second_2026: [...] }
   ```

4. **If you see "Fetched 0 events":**
   - Check if the category has any events
   - Check if events are in the future
   - Check if events are published

5. **If you see events but term_season is null:**
   - Run the migration script: `node scripts/migration/migrate-term-data.js`

6. **If you see term data but still empty groups:**
   - Check the browser console for errors
   - Verify the grouping logic in `fetchEventsByCategoryGroupedByTerm`

## Testing with Sample Data

If you need to test, create a sample event with term data:

```sql
-- 1. Create or update an offering with term data
UPDATE offerings
SET 
  term_season = 'summer',
  term_half = 'second',
  term_year = 2026
WHERE id = 'YOUR_OFFERING_ID';

-- 2. Verify the event is linked and in the future
SELECT 
  oe.id,
  oe.event_date,
  o.term_season,
  o.term_half,
  o.term_year
FROM offering_events oe
JOIN offerings o ON o.id = oe.offering_id
WHERE o.id = 'YOUR_OFFERING_ID';
```

## Expected Console Output

When working correctly, you should see:
```
📊 Fetched 5 events for category abc-123
Event 0: { title: "Art Club", term_season: "summer", term_half: "second", term_year: 2026, ... }
✅ Term event found! Key: summer_second_2026
Event 1: { title: "Art Club", term_season: "summer", term_half: "second", term_year: 2026, ... }
✅ Term event found! Key: summer_second_2026
...
📦 Result: 1 term groups, 0 single events
Term groups: { summer_second_2026: [Array(5)] }
```

