# Offering Events Migration Guide

## Overview

This guide explains how to migrate offering_events from Firebase **themes** collection to Supabase.

**Important**: The offering_events migration is now based on the **themes** collection in Firebase Firestore, NOT the events collection.

## Why Themes Collection?

The themes collection contains the actual event instances with:
- Specific dates and times
- Stock/capacity information
- Event titles and theme titles
- Term/season information
- Event type identifiers

This maps better to the `offering_events` table structure than the generic events collection.

## Migration Architecture

```
Firebase Firestore (themes collection)
    ↓
Export Script (1-export-themes.js)
    ↓
Transform Script (2-transform-themes.js)
    ↓
Import Script (3-import-offering-events.js)
    ↓
Supabase (offerings + offering_events + event_capacity)
```

## 🚀 Quick Start

### 1. Clean Up Existing Data

**⚠️ WARNING: This deletes all existing offering_events data!**

Run in Supabase SQL Editor:
```bash
scripts/migration/cleanup-offering-events.sql
```

### 2. Configure Environment

Update `scripts/migration/.env`:
```env
FIREBASE_THEMES_COLLECTION=themes
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Migration

```bash
cd scripts/migration/themes
npm install
npm run migrate
```

## 📁 Directory Structure

```
scripts/migration/
├── cleanup-offering-events.sql    # Cleanup script for Supabase
├── .env                           # Environment configuration
├── .env.example                   # Example configuration
└── themes/                        # Themes migration scripts
    ├── 1-export-themes.js         # Export from Firebase
    ├── 2-transform-themes.js      # Transform to Supabase schema
    ├── 3-import-offering-events.js # Import to Supabase
    ├── package.json               # Dependencies
    ├── README.md                  # Detailed instructions
    └── THEMES_FIELD_MAPPING.md    # Field mapping reference
```

## 🗺️ Data Flow

### Firebase Themes Document
```json
{
  "theme_id": "0YB2P4",
  "term": "spring_first_half_term",
  "event_id": "sp01_os_sat_1",
  "theme_title": "Open Studio",
  "event_title": "Open Studio Sat 1.00 (all ages)",
  "date": "2026-01-24",
  "start_time": "13:00:00",
  "end_time": "14:00:00",
  "originalStock": 2,
  "stock": 0,
  "passed": true
}
```

### Supabase Offerings Record
```json
{
  "type": "event",
  "title": "Open Studio Sat 1.00 (all ages)",
  "slug": "open-studio-sat-100-all-ages-20260124",
  "description_short": "Open Studio",
  "status": "archived",
  "metadata": {
    "theme_id": "0YB2P4",
    "event_id": "sp01_os_sat_1",
    "term": "spring_first_half_term"
  }
}
```

### Supabase Offering Events Record
```json
{
  "event_date": "2026-01-24",
  "event_start_time": "13:00:00",
  "event_end_time": "14:00:00",
  "location_name": "Lola As One Studio",
  "max_capacity": 2,
  "current_bookings": 2,
  "price_gbp": "0.00",
  "vat_rate": "20.00"
}
```

## 📊 What Gets Migrated

### ✅ Included
- Event titles and theme descriptions
- Event dates and times
- Capacity and booking counts
- Event type and term metadata
- Historical status (passed events → archived)

### ❌ Not Included (defaults used)
- Pricing (defaults to £0.00)
- Images (null)
- Long descriptions (null)
- Detailed location info (defaults to "Lola As One Studio")

## 🔍 Validation Queries

After migration, run these in Supabase SQL Editor:

```sql
-- Check counts
SELECT 
  (SELECT COUNT(*) FROM offerings WHERE type = 'event') as offerings,
  (SELECT COUNT(*) FROM offering_events) as events,
  (SELECT COUNT(*) FROM event_capacity) as capacity;

-- Check sample data
SELECT 
  o.title,
  o.status,
  o.metadata->>'term' as term,
  oe.event_date,
  oe.max_capacity,
  oe.current_bookings
FROM offerings o
JOIN offering_events oe ON oe.offering_id = o.id
WHERE o.type = 'event'
ORDER BY oe.event_date DESC
LIMIT 20;

-- Check capacity tracking
SELECT 
  o.title,
  oe.event_date,
  ec.total_capacity,
  ec.spaces_booked,
  ec.spaces_available
FROM offerings o
JOIN offering_events oe ON oe.offering_id = o.id
JOIN event_capacity ec ON ec.offering_event_id = oe.id
WHERE o.type = 'event'
LIMIT 10;
```

## 🐛 Troubleshooting

### "Firebase themes export not found"
- Run step 1 first: `npm run export`
- Check that `exports/firebase-themes-latest.json` exists

### "Transformed data not found"
- Run step 2 first: `npm run transform`
- Check that `exports/supabase-themes-latest.json` exists

### Duplicate slug errors
- Run cleanup script again
- Check for duplicate event titles on the same date

### Missing Supabase credentials
- Verify `.env` file exists and has correct values
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## 📝 Important Notes

1. **One-time migration**: This is designed for initial data migration
2. **Backup first**: Always backup your Supabase data before running cleanup
3. **Test environment**: Test in a development environment first
4. **Pricing**: You'll need to update pricing manually after migration
5. **Images**: You'll need to add images manually after migration

## 🔄 Re-running the Migration

If you need to re-run the migration:

1. Run cleanup script in Supabase
2. Delete old export files (optional)
3. Run migration again: `npm run migrate`

## 📚 Additional Resources

- [Themes Field Mapping](./themes/THEMES_FIELD_MAPPING.md)
- [Themes Migration README](./themes/README.md)
- [Supabase Schema](../docs/schema.sql)

