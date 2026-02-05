# 🚀 Firebase to Supabase Event Migration - START HERE

Welcome! This toolkit will help you migrate your events from Firebase to Supabase.

## 📁 What's in This Folder?

```
scripts/migration/
├── START_HERE.md              ← You are here!
├── QUICKSTART.md              ← 15-minute quick start guide
├── README.md                  ← Complete technical documentation
├── FIELD_MAPPING.md           ← Field mapping reference
├── MIGRATION_GUIDE.md         ← Comprehensive migration strategy
│
├── 1-export-firebase.js       ← Step 1: Export from Firebase
├── 2-transform-data.js        ← Step 2: Transform data
├── 3-import-supabase.js       ← Step 3: Import to Supabase
├── 4-validate-migration.js    ← Step 4: Validate migration
├── rollback.js                ← Rollback script (if needed)
│
├── package.json               ← Dependencies
├── .env.example               ← Environment template
├── sample-firebase-data.json  ← Sample data for testing
│
└── (You'll create these)
    ├── .env                   ← Your configuration
    ├── firebase-service-account.json  ← Firebase credentials
    ├── exports/               ← Exported data
    └── logs/                  ← Migration logs
```

## 🎯 Choose Your Path

### 👉 New to Migration? Start Here!
**Read:** [QUICKSTART.md](./QUICKSTART.md)  
**Time:** 15 minutes  
**Best for:** First-time users who want to get started quickly

### 📖 Want Full Details?
**Read:** [README.md](./README.md)  
**Time:** 30 minutes  
**Best for:** Users who want to understand every detail

### 🗺️ Planning a Large Migration?
**Read:** [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)  
**Time:** 45 minutes  
**Best for:** Large datasets, production systems, risk-averse teams

### 🔍 Need Field Mapping Details?
**Read:** [FIELD_MAPPING.md](./FIELD_MAPPING.md)  
**Time:** 20 minutes  
**Best for:** Custom Firebase structures, complex data

## ⚡ Quick Start (TL;DR)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Download Firebase service account
# Save as firebase-service-account.json

# 4. Run migration (dry run first!)
npm run migrate

# 5. If successful, set DRY_RUN=false and run again
npm run migrate
```

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ Node.js 18+ installed
- ✅ Firebase project access
- ✅ Supabase project with schema applied
- ✅ Firebase service account JSON
- ✅ Supabase service role key
- ✅ 15-30 minutes of time

## 🎓 Migration Process Overview

```
┌─────────────────┐
│  1. EXPORT      │  Export events from Firebase Firestore
│  Firebase → JSON│  Output: exports/firebase-events-*.json
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. TRANSFORM   │  Transform Firebase data to Supabase schema
│  JSON → JSON    │  Output: exports/supabase-data-*.json
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. IMPORT      │  Import transformed data to Supabase
│  JSON → Supabase│  Creates: offerings + offering_events
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. VALIDATE    │  Verify migration success
│  Check & Report │  Output: logs/validation-report-*.json
└─────────────────┘
```

## 🔧 What Gets Migrated?

### From Firebase:
- Event title, description, images
- Event dates, times, location
- Capacity, bookings, pricing
- Categories, tags, metadata
- Publication status

### To Supabase:
- **`offerings`** table (content shell)
  - Title, slug, descriptions
  - Images, status, metadata
  - SEO fields

- **`offering_events`** table (event details)
  - Date, time, location
  - Capacity, bookings, pricing

- **`event_capacity`** table (capacity tracking)
  - Total capacity, spaces booked
  - Waitlist settings

## ⚠️ Important Notes

1. **Always backup your Firebase data first!**
2. **Run with DRY_RUN=true first** to test without writing to database
3. **Test with sample data** before migrating everything
4. **Keep Firebase running** until you're confident in Supabase
5. **Have a rollback plan** ready

## 🆘 Need Help?

### Common Questions

**Q: Will this delete my Firebase data?**  
A: No! This only reads from Firebase. Your Firebase data is safe.

**Q: What if something goes wrong?**  
A: Use the rollback script: `npm run rollback`

**Q: Can I test without affecting production?**  
A: Yes! Set `DRY_RUN=true` in `.env`

**Q: How long does migration take?**  
A: Depends on data size. Typically 5-30 minutes for most datasets.

**Q: What if my Firebase structure is different?**  
A: Check [FIELD_MAPPING.md](./FIELD_MAPPING.md) for customization guide.

### Troubleshooting

- **Error messages?** Check `logs/` directory
- **Data issues?** Review `exports/` files
- **Validation fails?** Check `logs/validation-report-*.json`
- **Still stuck?** Review the full [README.md](./README.md)

## 📞 Support Resources

1. **[QUICKSTART.md](./QUICKSTART.md)** - Fast 15-minute guide
2. **[README.md](./README.md)** - Complete documentation
3. **[FIELD_MAPPING.md](./FIELD_MAPPING.md)** - Field mapping details
4. **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration strategy
5. **Sample data** - `sample-firebase-data.json` for testing

## ✅ Success Checklist

After migration, verify:

- [ ] Event count matches Firebase
- [ ] Sample events have correct data
- [ ] Dates and times are correct
- [ ] Images display properly
- [ ] Bookings work correctly
- [ ] Admin CMS works
- [ ] No errors in logs

## 🎉 Ready to Start?

### Recommended Path:

1. **Read** [QUICKSTART.md](./QUICKSTART.md) (15 min)
2. **Install** dependencies: `npm install`
3. **Configure** environment: `cp .env.example .env`
4. **Test** with dry run: `DRY_RUN=true npm run migrate`
5. **Review** exported data in `exports/`
6. **Run** actual migration: `DRY_RUN=false npm run migrate`
7. **Validate** in Supabase Dashboard
8. **Celebrate!** 🎊

---

**Questions?** Start with [QUICKSTART.md](./QUICKSTART.md)  
**Issues?** Check the logs in `logs/` directory  
**Need details?** Read [README.md](./README.md)

**Good luck with your migration! 🚀**

