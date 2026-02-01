# How to Apply RLS Policies to Your Supabase Database

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the RLS Policies Script**
   - Click **"New Query"**
   - Open the file `docs/apply-rls-policies.sql` from this repository
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)

3. **Verify Success**
   - You should see "Success. No rows returned" message
   - Go to **Database** → **Tables** in the left sidebar
   - Click on any table (e.g., `offering_events`)
   - You should see RLS is now **enabled** with policies listed

4. **Check for Errors**
   - If you see any errors about policies already existing, that's okay - it means some policies were already applied
   - The important thing is that all tables now have RLS enabled

## What This Does

This script adds Row Level Security (RLS) policies to all 29 tables that were missing them:

### Public Tables (anyone can view)
- Offering-related tables (events, products, digital products)
- Categories, tags, navigation items, site sections
- Blog post categories and tags
- Event capacity

### Customer-Owned Tables (users can only see their own data)
- Carts and cart items
- Orders, order items, payments, fulfillments, refunds
- Subscriptions, subscription items, events, and invoices
- Bookings and booking attendees
- Download links

### Admin-Only Tables
- Inventory items and movements

## Security Benefits

✅ **Prevents unauthorized access** - Users can only see their own data  
✅ **Protects sensitive information** - Payment and order details are private  
✅ **Enables public API** - You can safely expose your database via PostgREST  
✅ **Follows best practices** - Supabase recommends RLS for all tables

## Troubleshooting

**Error: "policy already exists"**
- This is fine! It means that policy was already created
- The script will continue and create the missing ones

**Error: "table does not exist"**
- Make sure you ran the main schema.sql file first
- Check that you're running this in the correct Supabase project

**Still seeing RLS warnings in Supabase**
- Refresh the Supabase dashboard
- Check the Database Linter again (it may take a moment to update)

## Next Steps

After applying RLS policies:
1. Test your application to ensure users can still access their data
2. Verify that admin users have the correct role set in their JWT
3. Consider adding more granular policies as your application grows

---

## Fixing Function Security Warnings (Optional)

If you see warnings about "Function Search Path Mutable", you can fix them:

1. **Open Supabase Dashboard** → Go to **SQL Editor**
2. **Copy & Paste** the contents of `docs/fix-function-security.sql`
3. **Click "Run"**

This adds security settings to all database functions to prevent potential schema injection attacks. These are **WARN** level (not ERROR), so they won't break anything if you skip this step.

