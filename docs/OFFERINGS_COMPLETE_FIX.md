# Complete Fix for Offerings Upload Issues

## Issues Encountered (in order)

### 1. RLS Policy Error
**Error:** `new row violates row-level security policy for table "offerings"`

**Cause:** RLS policies were checking `auth.jwt() ->> 'role'` instead of `(auth.jwt()->>'app_metadata')::jsonb->>'role'`

**Fix:** Run `docs/fix-offerings-rls.sql` in Supabase SQL Editor

---

### 2. Missing Columns Error
**Error:** `Could not find the 'waitlist_enabled' column of 'offering_events' in the schema cache`

**Cause:** The admin UI form includes fields for `waitlist_enabled` and `category_id` that don't exist in the database

**Fix:** Run `docs/add-missing-offering-columns.sql` in Supabase SQL Editor

---

### 3. Duplicate Slug Error
**Error:** `duplicate key value violates unique constraint "offerings_slug_key"`

**Cause:** Trying to create an offering with a slug that already exists

**Fix:** Updated `app/src/views/admin/OfferingsForm.vue` to:
- Check slug availability before submission
- Show visual feedback (green checkmark for available, red X for taken)
- Display helpful error messages
- Added Font Awesome icons (`faExclamationCircle`) to `app/src/main.js`

---

## Complete Fix Steps

### Step 1: Fix RLS Policies
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `docs/fix-offerings-rls.sql`

This fixes RLS policies for:
- `offerings`
- `offering_events`
- `offering_products`
- `offering_digital_products`
- `categories`
- `tags`
- `offering_categories`
- `offering_tags`
- `product_categories`

### Step 2: Add Missing Columns
1. In Supabase SQL Editor
2. Copy and run the contents of `docs/add-missing-offering-columns.sql`

This adds:
- `waitlist_enabled` column to `offering_events`
- `category_id` column to `offering_events`
- `waitlist_enabled` column to `offering_products`

### Step 3: Code Updates (Already Applied)
The following files have been updated:
- `app/src/views/admin/OfferingsForm.vue` - Added slug validation and visual feedback
- `app/src/main.js` - Added missing Font Awesome icon

---

## Verification

After applying all fixes, you should be able to:

1. ✅ Create new offerings as an admin user
2. ✅ See real-time slug availability checking
3. ✅ Get clear error messages if slug is already taken
4. ✅ Save offerings with waitlist settings
5. ✅ Categorize events

---

## Prevention Tips

1. **Always check RLS policies** use the correct path for admin roles:
   ```sql
   (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
   ```

2. **Keep schema in sync** with UI forms - if you add form fields, add the corresponding database columns

3. **Use unique slugs** - the form now helps prevent duplicates with real-time checking

---

## Files Modified

### Database Scripts (Run in Supabase)
- `docs/fix-offerings-rls.sql` - Fixes RLS policies
- `docs/add-missing-offering-columns.sql` - Adds missing columns

### Application Code (Already Updated)
- `app/src/views/admin/OfferingsForm.vue` - Slug validation
- `app/src/main.js` - Font Awesome icons

