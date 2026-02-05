# Populate Event Categories Migration

This migration populates the `category_id` field in the `offering_events` table based on the old `metadata.category` field in the `offerings` table.

## Background

Previously, event categories were stored as text in the `offerings.metadata` JSONB field (e.g., `{"category": "Adult Workshops"}`). The new system uses a dedicated `event_categories` table with proper foreign key relationships.

This migration maps the old text-based categories to the new category IDs.

## Prerequisites

1. The `add-event-categories.sql` migration must be applied first
2. Event categories must be seeded in the database
3. Node.js and npm must be installed
4. Supabase credentials must be configured in `app/.env`

## Running the Migration

### Option 1: Node.js Script (Recommended)

The Node.js script provides detailed feedback and handles edge cases:

```bash
# From the project root
node scripts/populate-event-categories.js
```

**What it does:**
- Fetches all events from the database
- Analyzes the `metadata.category` and `title` fields
- Maps events to appropriate categories using pattern matching
- Updates the `category_id` field in `offering_events`
- Reports which events were categorized and which need manual review

**Output example:**
```
🚀 Starting event category population...

📥 Fetching events from database...
   Found 45 events

📊 Events needing categorization: 32

✅ Matched 28 events to categories
⚠️  4 events could not be auto-categorized

📝 Updates to be applied:
   Open Studio: 12 events
   Little Ones: 8 events
   Adult Workshops: 5 events
   Kids Workshops: 3 events

💾 Updating database...

✅ Successfully updated 28 events

⚠️  Uncategorized events (4):
   These events need manual categorization:

   - "Special Art Session"
     Old category: Custom Event
   ...
```

### Option 2: SQL Script

For direct database access, you can run the SQL script:

```bash
# Using psql
psql -h <host> -U <user> -d <database> -f docs/migrations/populate-event-category-ids.sql

# Or using Supabase SQL Editor
# Copy and paste the contents of populate-event-category-ids.sql
```

## Category Mapping Logic

The script uses the following patterns to match events to categories:

| Category | Patterns Matched |
|----------|-----------------|
| **Open Studio** | "open studio", "open-studio", "openstudio" |
| **Little Ones** | "little ones", "little-ones", "littleones", "toddler" |
| **Kids Workshops** | "kids", "children", "child" |
| **Adult Workshops** | "adult", "grown-up" |
| **Holiday Programs** | "holiday" |
| **Private Events** | "private", "party", "parties" |
| **Special Programs** | "storytime", "story time", "club", "special" |

The script searches both the `metadata.category` field and the event `title` for these patterns.

## Manual Categorization

Events that cannot be automatically categorized will need to be updated manually:

1. Go to the **Admin > Offerings** page
2. Find and edit the uncategorized event
3. Select the appropriate category from the dropdown
4. Save the event

## Verification

After running the migration, verify the results:

```sql
-- Check how many events have categories
SELECT 
  COUNT(*) FILTER (WHERE category_id IS NOT NULL) as categorized,
  COUNT(*) FILTER (WHERE category_id IS NULL) as uncategorized,
  COUNT(*) as total
FROM offering_events;

-- See category distribution
SELECT 
  ec.name,
  COUNT(*) as event_count
FROM offering_events oe
JOIN event_categories ec ON ec.id = oe.category_id
GROUP BY ec.name
ORDER BY event_count DESC;
```

## Troubleshooting

### "Missing Supabase credentials"
Make sure `app/.env` contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### "Categories not found"
Run the `add-event-categories.sql` migration first to create and seed the categories.

### Events still showing as uncategorized
Some events may have unique category names that don't match the patterns. These need to be categorized manually through the admin interface.

## Rollback

To rollback this migration:

```sql
-- Clear all category_id values
UPDATE offering_events SET category_id = NULL;
```

Note: This only clears the `category_id` field. The original `metadata.category` values are preserved.

