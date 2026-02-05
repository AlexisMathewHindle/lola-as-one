# 🚀 Quick Start Guide - Firebase to Supabase Migration

Get your events migrated in 15 minutes!

## ✅ Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Firebase project access
- [ ] Supabase project with schema applied
- [ ] 15 minutes of time

## 📝 Step-by-Step Instructions

### 1. Install Dependencies (2 minutes)

```bash
cd scripts/migration
npm install
```

### 2. Get Firebase Credentials (3 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ **Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded file as `firebase-service-account.json` in this directory

### 3. Get Supabase Credentials (2 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click ⚙️ **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **service_role** key (under "Project API keys")

### 4. Configure Environment (2 minutes)

```bash
# Copy example file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Minimum required configuration:**
```env
# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_EVENTS_COLLECTION=events

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Safety first!
DRY_RUN=true
```

**Important:** Replace:
- `your-project.supabase.co` with your actual Supabase URL
- `your-service-role-key-here` with your actual service role key
- `events` with your Firebase collection name (if different)

### 5. Test Run (3 minutes)

Run a dry run to test without writing to database:

```bash
npm run migrate
```

**Expected output:**
```
📤 Exporting events from Firebase...
✅ Exported 150 events

🔄 Transforming Firebase data to Supabase schema...
✅ Transformed 150 events

📥 Importing data to Supabase...
🔍 DRY RUN MODE - No data will be written
✅ Import complete!

📊 Validation Report
   Firebase Events: 150
   Supabase Offerings: 0 (dry run)
   ✅ Transformation successful
```

### 6. Review Sample Data (2 minutes)

Check the exported files:

```bash
# View Firebase export
cat exports/firebase-events-latest.json | head -50

# View transformed data
cat exports/supabase-data-latest.json | head -50
```

**Verify:**
- ✅ Event titles look correct
- ✅ Dates are in YYYY-MM-DD format
- ✅ Times are in HH:MM:SS format
- ✅ Prices are correct
- ✅ Slugs are generated properly

### 7. Run Actual Migration (3 minutes)

If everything looks good, run the real migration:

```bash
# Edit .env and set DRY_RUN=false
nano .env

# Run migration
npm run migrate
```

**Expected output:**
```
📥 Importing data to Supabase...

[1/150] Importing: Adult Pottery Workshop
   ✅ Created offering (ID: abc-123)
   ✅ Created offering_event (ID: def-456)
   ✅ Created event_capacity

[2/150] Importing: Kids Art Class
   ✅ Created offering (ID: ghi-789)
   ✅ Created offering_event (ID: jkl-012)
   ✅ Created event_capacity

...

📊 Import Summary:
   Total Events: 150
   ✅ Successful: 150
   ❌ Failed: 0

✅ Migration validation PASSED!
```

### 8. Verify in Supabase (1 minute)

1. Go to Supabase Dashboard → **Table Editor**
2. Check `offerings` table (should see all events)
3. Check `offering_events` table (should see all event details)
4. Check `event_capacity` table (should see capacity records)

**Quick SQL check:**
```sql
-- Count migrated events
SELECT COUNT(*) FROM offerings WHERE type = 'event';

-- View sample events
SELECT 
  o.title,
  oe.event_date,
  oe.event_start_time,
  oe.max_capacity,
  oe.price_gbp
FROM offerings o
JOIN offering_events oe ON oe.offering_id = o.id
WHERE o.type = 'event'
ORDER BY oe.event_date DESC
LIMIT 10;
```

## 🎉 Done!

Your events are now in Supabase!

## 🔍 What to Check

- [ ] Event count matches Firebase
- [ ] Sample events have correct data
- [ ] Dates and times are correct
- [ ] Prices are correct
- [ ] Images URLs are working
- [ ] Event capacity is set correctly

## ⚠️ If Something Goes Wrong

### Problem: "Firebase service account file not found"
**Solution:** Make sure `firebase-service-account.json` is in the migration directory

### Problem: "Missing Supabase configuration"
**Solution:** Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Problem: "Duplicate key value violates unique constraint"
**Solution:** You may have existing data. Either:
1. Delete existing events from Supabase
2. Or use the rollback script: `node rollback.js`

### Problem: Some events failed to import
**Solution:** 
1. Check `logs/import-results-*.json` for error details
2. Fix the data issues in Firebase
3. Re-export and re-run migration

## 🔄 Need to Start Over?

```bash
# Rollback migration (deletes all migrated events)
node rollback.js

# Or manually in Supabase SQL Editor:
DELETE FROM offerings WHERE type = 'event';
```

## 📊 View Migration Logs

```bash
# View import results
cat logs/import-results-*.json

# View validation report
cat logs/validation-report-*.json

# View export summary
cat exports/export-summary-*.json
```

## 🆘 Need Help?

1. Check the full [README.md](./README.md)
2. Review [FIELD_MAPPING.md](./FIELD_MAPPING.md) for field mapping details
3. Check the logs in `logs/` directory
4. Review your Firebase data structure

## 🎯 Next Steps

After successful migration:

1. **Test your application** with Supabase data
2. **Update your legacy website** to use Supabase instead of Firebase
3. **Keep Firebase running** in parallel for a few days
4. **Monitor for issues**
5. **Decommission Firebase** once confident

## 📝 Migration Checklist

- [ ] Installed dependencies
- [ ] Downloaded Firebase service account
- [ ] Configured `.env` file
- [ ] Ran dry run successfully
- [ ] Reviewed sample data
- [ ] Ran actual migration
- [ ] Verified data in Supabase
- [ ] Tested application with Supabase
- [ ] Updated legacy website
- [ ] Monitored for issues
- [ ] Decommissioned Firebase

---

**Estimated Total Time:** 15 minutes  
**Difficulty:** Easy  
**Risk Level:** Low (with dry run first)

