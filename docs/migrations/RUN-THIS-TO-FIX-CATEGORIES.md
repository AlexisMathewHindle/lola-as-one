# Fix Event Categories - Quick Instructions

## The Problem
All 158 events in the database have `category_id = NULL`, which is why the category filter on the Event Bookings page shows "N/A" for all events.

## The Solution
Run the SQL script to populate categories for all events based on their offering titles.

## Steps

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Copy and paste the SQL script:**
   - Open the file: `docs/migrations/populate-event-categories-fix.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor

3. **Run the script:**
   - Click the **Run** button (or press Cmd/Ctrl + Enter)
   - Wait for it to complete

4. **Verify the results:**
   - The script will show you:
     - How many events were categorized
     - The distribution of events across categories
     - Any remaining uncategorized events (if any)

5. **Refresh the Event Bookings page:**
   - Go back to your app
   - Refresh the Event Bookings page
   - The category filter should now work!

## What the script does

The script updates the `category_id` field for all events based on pattern matching:

- **Open Studio** → Events with "open studio" in title (not holiday)
- **Little Ones** → Events with "little ones" or "littles ones" in title
- **Adult Workshops** → Events with "creative saturday" or "adult" in title
- **Kids Workshops** → Events with "story of art club" or "art club" in title
- **Special Programs** → Events with "storytime" in title
- **Holiday Programs** → Events with "holiday" in title
- **Private Events** → Events with "private" or "party" in title

## Expected Results

After running the script, all 158 events should have a `category_id` assigned, and the Event Bookings page filter will work correctly.

