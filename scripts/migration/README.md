# Firebase to Supabase Event Migration

Complete migration toolkit for migrating events from Firebase Firestore to Supabase.

## 📋 Overview

This migration toolkit consists of 4 scripts that handle the complete migration process:

1. **Export** - Export events from Firebase Firestore to JSON
2. **Transform** - Transform Firebase data to match Supabase schema
3. **Import** - Import transformed data into Supabase
4. **Validate** - Verify migration success and data integrity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase service account JSON file
- Supabase project with schema applied
- Supabase service role key

### Installation

```bash
cd scripts/migration
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_EVENTS_COLLECTION=events

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Migration Settings
DRY_RUN=true
BATCH_SIZE=10
```

3. Download your Firebase service account key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `firebase-service-account.json` in this directory

### Run Migration

**Option 1: Run all steps at once**
```bash
npm run migrate
```

**Option 2: Run steps individually**
```bash
npm run export      # Step 1: Export from Firebase
npm run transform   # Step 2: Transform data
npm run import      # Step 3: Import to Supabase
npm run validate    # Step 4: Validate migration
```

## 📖 Detailed Steps

### Step 1: Export Firebase Data

```bash
npm run export
```

**What it does:**
- Connects to Firebase Firestore
- Exports all events from the configured collection
- Converts Firebase Timestamps to ISO strings
- Saves to `exports/firebase-events-{timestamp}.json`
- Creates symlink `exports/firebase-events-latest.json`

**Output:**
```
exports/
  firebase-events-2026-02-02T10-30-00.json
  firebase-events-latest.json (symlink)
  export-summary-2026-02-02T10-30-00.json
```

### Step 2: Transform Data

```bash
npm run transform
```

**What it does:**
- Reads Firebase export
- Transforms each event to Supabase schema:
  - Creates `offerings` record (content shell)
  - Creates `offering_events` record (event details)
- Generates unique slugs
- Handles date/time formatting
- Saves to `exports/supabase-data-{timestamp}.json`

**Field Mapping:**

| Firebase Field | Supabase Table | Supabase Field |
|---------------|----------------|----------------|
| `title` | `offerings` | `title` |
| `description` | `offerings` | `description_long` |
| `shortDescription` | `offerings` | `description_short` |
| `imageUrl` | `offerings` | `featured_image_url` |
| `category` | `offerings` | `metadata.category` |
| `published` | `offerings` | `status` |
| `eventDate` | `offering_events` | `event_date` |
| `startTime` | `offering_events` | `event_start_time` |
| `endTime` | `offering_events` | `event_end_time` |
| `locationName` | `offering_events` | `location_name` |
| `address` | `offering_events` | `location_address` |
| `city` | `offering_events` | `location_city` |
| `postcode` | `offering_events` | `location_postcode` |
| `maxCapacity` | `offering_events` | `max_capacity` |
| `currentBookings` | `offering_events` | `current_bookings` |
| `price` | `offering_events` | `price_gbp` |

**Output:**
```
exports/
  supabase-data-2026-02-02T10-35-00.json
  supabase-data-latest.json (symlink)
```

### Step 3: Import to Supabase

```bash
npm run import
```

**What it does:**
- Reads transformed data
- For each event:
  1. Creates `offerings` record
  2. Creates `offering_events` record (linked to offering)
  3. Creates `event_capacity` record (optional)
- Handles errors gracefully (rollback on failure)
- Saves results to `logs/import-results-{timestamp}.json`

**DRY RUN Mode:**
Set `DRY_RUN=true` in `.env` to test without writing to database.

**Output:**
```
logs/
  import-results-2026-02-02T10-40-00.json
```

### Step 4: Validate Migration

```bash
npm run validate
```

**What it does:**
- Counts records in Firebase vs Supabase
- Verifies data integrity:
  - All `offering_events` have valid `offering_id`
  - All event `offerings` have corresponding `offering_events`
  - Required fields are not null
- Samples data for manual review
- Generates validation report

**Output:**
```
logs/
  validation-report-2026-02-02T10-45-00.json
```

## 🔧 Customization

### Custom Firebase Field Mapping

If your Firebase structure is different, edit `2-transform-data.js`:

```javascript
// Example: Add custom field mapping
const offering = {
  // ... existing fields ...
  metadata: {
    category: firebaseEvent.category || null,
    age_group: firebaseEvent.ageGroup || null,
    // Add your custom fields here
    instructor: firebaseEvent.instructor || null,
    materials: firebaseEvent.materials || [],
  },
};
```

### Custom Validation Rules

Edit `4-validate-migration.js` to add custom validation checks:

```javascript
// Example: Check for events in the past
const { data: pastEvents } = await supabase
  .from('offering_events')
  .select('id, event_date')
  .lt('event_date', new Date().toISOString().split('T')[0]);

if (pastEvents.length > 0) {
  issues.push(`Found ${pastEvents.length} events in the past`);
}
```

## 📊 Monitoring Progress

All scripts provide detailed console output:

```
📤 Exporting events from Firebase...
✅ Exported 150 events to exports/firebase-events-2026-02-02.json

🔄 Transforming Firebase data to Supabase schema...
   Transformed 10/150 events...
   Transformed 20/150 events...
✅ Transformed 150 events

📥 Importing data to Supabase...
[1/150] Importing: Adult Pottery Workshop
   ✅ Created offering (ID: abc-123)
   ✅ Created offering_event (ID: def-456)
   ✅ Created event_capacity
```

## 🚨 Troubleshooting

### Error: "Firebase service account file not found"
- Download service account JSON from Firebase Console
- Save as `firebase-service-account.json` in migration directory

### Error: "Missing Supabase configuration"
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Get service role key from Supabase Dashboard → Settings → API

### Error: "Failed to create offering: duplicate key value violates unique constraint"
- Slug already exists in database
- Either delete existing data or modify slug generation logic

### Validation fails: "Counts don't match"
- Check `logs/import-results-*.json` for failed imports
- Review error messages and fix data issues
- Re-run import for failed events only

## 📁 Directory Structure

```
scripts/migration/
├── 1-export-firebase.js      # Export from Firebase
├── 2-transform-data.js        # Transform data
├── 3-import-supabase.js       # Import to Supabase
├── 4-validate-migration.js    # Validate migration
├── package.json               # Dependencies
├── .env.example               # Environment template
├── .env                       # Your configuration (gitignored)
├── firebase-service-account.json  # Firebase credentials (gitignored)
├── README.md                  # This file
├── exports/                   # Exported data
│   ├── firebase-events-*.json
│   └── supabase-data-*.json
└── logs/                      # Migration logs
    ├── import-results-*.json
    └── validation-report-*.json
```

## ⚠️ Important Notes

1. **Backup First**: Always backup your Firebase data before migration
2. **Service Role Key**: Keep your Supabase service role key secure (never commit to git)
3. **Test First**: Run with `DRY_RUN=true` before actual migration
4. **Incremental Migration**: Test with a small batch first (set `BATCH_SIZE=5`)
5. **Rollback Plan**: Keep Firebase running until migration is verified

## 🔐 Security

Files that should **NOT** be committed to git:
- `.env`
- `firebase-service-account.json`
- `exports/*.json`
- `logs/*.json`

These are already in `.gitignore`.

## 📞 Support

If you encounter issues:
1. Check the logs in `logs/` directory
2. Review the validation report
3. Check Supabase Dashboard for data
4. Review Firebase export for data quality issues

