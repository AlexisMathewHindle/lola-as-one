# Offerings Database Fixes

## Problem 1: RLS Policy Error

When trying to upload/create an offering, you get this error:
```
Error: new row violates row-level security policy for table "offerings"
```

## Problem 2: Missing Columns Error

After fixing the RLS policy, you get this error:
```
Could not find the 'waitlist_enabled' column of 'offering_events' in the schema cache
```

## Root Cause 1: Incorrect RLS Policies

The RLS (Row-Level Security) policies for the `offerings` table and related tables were checking for admin role using the wrong JWT path:

**Incorrect:**
```sql
auth.jwt() ->> 'role' = 'admin'
```

**Correct:**
```sql
(auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
```

In Supabase, custom user roles are stored in `app_metadata`, not at the root level of the JWT. This is the same issue that was previously fixed for the `customers` table (see `docs/fix-customers-rls.sql`).

## Root Cause 2: Missing Database Columns

The admin UI components (`EventFields.vue` and `ProductFields.vue`) include form fields for:
- `waitlist_enabled` - Allows customers to join a waitlist when events are full or products are out of stock
- `category_id` (for events) - Allows categorizing events (e.g., Adult Workshops, Kids Classes)

However, these columns were never added to the database tables (`offering_events` and `offering_products`).

## Affected Tables

The following tables had incorrect RLS policies:
1. `offerings`
2. `offering_events`
3. `offering_products`
4. `offering_digital_products`
5. `categories`
6. `tags`
7. `offering_categories`
8. `offering_tags`
9. `product_categories`

## Solution

Run the SQL script `docs/fix-offerings-rls.sql` in your Supabase SQL Editor to fix all the policies.

This script will:
1. Drop the incorrectly configured policies
2. Recreate them with the correct `app_metadata` check

## How to Apply the Fix

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `docs/fix-offerings-rls.sql`
4. Paste and run the script
5. Verify the policies are updated correctly

## Verification

After applying the fix, you should be able to:
- Create new offerings as an admin user
- Update existing offerings
- Delete offerings
- Manage all related data (events, products, categories, tags, etc.)

## Prevention

When creating new RLS policies in the future, always use the correct path for checking admin roles:
```sql
auth.role() = 'authenticated'
AND (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
```

