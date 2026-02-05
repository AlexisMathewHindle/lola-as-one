# Themes to Offering Events Migration

This directory contains scripts to migrate Firebase `themes` collection to Supabase `offering_events` table.

## 📋 Prerequisites

Before starting the migration, you need to:

1. **Clean up existing offering_events data** in Supabase
2. **Configure environment variables** in the parent `.env` file
3. **Install dependencies**

## 🧹 Step 0: Clean Up Existing Data

**⚠️ WARNING: This will delete all existing offering_events, event_capacity, and bookings data!**

Run the cleanup SQL script in your Supabase SQL Editor:

```bash
# The script is located at:
../cleanup-offering-events.sql
```

This script will:
- Delete all bookings linked to offering_events
- Delete all event_capacity_holds
- Delete all event_capacity records
- Delete all offering_events
- Delete all offerings of type 'event'

## 🔧 Configuration

Ensure your parent `.env` file (in `scripts/migration/.env`) contains:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=lola-workshops
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_THEMES_COLLECTION=themes

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Migration Settings
BATCH_SIZE=10
EXPORT_DIR=../exports
LOGS_DIR=../logs
```

## 📦 Installation

```bash
npm install
```

Or use the parent directory's node_modules:
```bash
cd ..
npm install
```

## 🚀 Migration Steps

### Option 1: Run All Steps at Once

```bash
npm run migrate
```

This will execute all three steps in sequence:
1. Export themes from Firebase
2. Transform to Supabase schema
3. Import to Supabase

### Option 2: Run Steps Individually

#### Step 1: Export Themes from Firebase

```bash
npm run export
# or
node 1-export-themes.js
```

This will:
- Connect to Firebase Firestore
- Export all documents from the `themes` collection
- Save to `exports/firebase-themes-{timestamp}.json`
- Create a symlink `exports/firebase-themes-latest.json`

#### Step 2: Transform Data

```bash
npm run transform
# or
node 2-transform-themes.js
```

This will:
- Read `exports/firebase-themes-latest.json`
- Transform each theme to Supabase schema
- Generate unique slugs
- Save to `exports/supabase-themes-{timestamp}.json`
- Create a symlink `exports/supabase-themes-latest.json`

#### Step 3: Import to Supabase

```bash
npm run import
# or
node 3-import-offering-events.js
```

This will:
- Read `exports/supabase-themes-latest.json`
- Import offerings and offering_events in batches
- Create event_capacity records
- Save results to `logs/offering-events-import-{timestamp}.json`

## 📊 Field Mapping

See [THEMES_FIELD_MAPPING.md](./THEMES_FIELD_MAPPING.md) for detailed field mapping between Firebase themes and Supabase schema.

### Key Mappings:

| Firebase | Supabase |
|----------|----------|
| `event_title` | `offerings.title` |
| `theme_title` | `offerings.description_short` |
| `date` | `offering_events.event_date` |
| `start_time` | `offering_events.event_start_time` |
| `end_time` | `offering_events.event_end_time` |
| `originalStock` | `offering_events.max_capacity` |
| `originalStock - stock` | `offering_events.current_bookings` |
| `passed` | `offerings.status` (archived/published) |

## 📁 Output Files

### Exports
- `exports/firebase-themes-{timestamp}.json` - Raw Firebase export
- `exports/firebase-themes-latest.json` - Symlink to latest export
- `exports/supabase-themes-{timestamp}.json` - Transformed data
- `exports/supabase-themes-latest.json` - Symlink to latest transform

### Logs
- `logs/offering-events-import-{timestamp}.json` - Import results

## 🔍 Validation

After migration, verify the data:

```sql
-- Check total counts
SELECT 
  (SELECT COUNT(*) FROM offerings WHERE type = 'event') as offerings_count,
  (SELECT COUNT(*) FROM offering_events) as offering_events_count,
  (SELECT COUNT(*) FROM event_capacity) as event_capacity_count;

-- Check sample data
SELECT 
  o.title,
  o.status,
  oe.event_date,
  oe.event_start_time,
  oe.max_capacity,
  oe.current_bookings
FROM offerings o
JOIN offering_events oe ON oe.offering_id = o.id
WHERE o.type = 'event'
LIMIT 10;
```

## 🐛 Troubleshooting

### Import Fails with "offering already exists"
- Run the cleanup script again
- Check for duplicate slugs in the transformed data

### Missing Firebase credentials
- Ensure `firebase-service-account.json` exists in parent directory
- Check `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`

### Supabase connection errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check network connectivity

## 📝 Notes

1. **Pricing**: Themes collection doesn't include pricing, so all events default to £0.00
2. **Images**: No images in themes collection, so `featured_image_url` is null
3. **Location**: All events default to "Lola As One Studio"
4. **Slugs**: Auto-generated from `event_title` + `date` for uniqueness
5. **Historical Events**: Events with `passed: true` are marked as 'archived'

