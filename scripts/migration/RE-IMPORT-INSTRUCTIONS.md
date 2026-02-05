# Re-Import Bookings with Fixed Transformation

## Problem Summary

The original transformation script created **duplicate bookings** because it created one booking per attendee per workshop, instead of one booking per workshop with multiple attendees.

**Example:**
- Firebase: 1 order with 4 attendees for the same workshop
- ❌ Old transformation: 4 separate bookings (one per attendee)
- ✅ New transformation: 1 booking with `number_of_attendees = 4` and 4 `booking_attendees` records

## What Was Fixed

### Transformation Script (`6-transform-bookings.js`)
- **Before:** Created 427 bookings (one per attendee-workshop combination)
- **After:** Creates 282 bookings (one per workshop, grouped by event_id)
- **Attendees:** Still creates 427 `booking_attendees` records (correct!)

### Key Changes:
1. Groups attendees by workshop (event_id) before creating bookings
2. Sets `number_of_attendees` to the actual count of attendees for that workshop
3. Creates multiple `booking_attendees` records linked to a single booking
4. Updates order item `quantity` to match the number of attendees

## Re-Import Steps

### Step 1: Clean Up Existing Data
Run this SQL in Supabase SQL Editor:
```
scripts/migration/cleanup-bookings.sql
```

This will:
- Delete all existing orders, order_items, bookings, and booking_attendees
- Reset event capacity to 0
- Verify the cleanup

### Step 2: Re-run Transformation (Already Done!)
The transformation has already been run with the fixed script:
```bash
npm run transform-bookings
```

Output: `exports/supabase-bookings-2026-02-02T19-50-44-345Z.json`

### Step 3: Import with Capacity Constraints Disabled
Run this SQL first:
```
scripts/migration/disable-capacity-constraint.sql
```

### Step 4: Import the Data
```bash
npm run import-bookings
```

Expected results:
- 259 orders
- 282 order items
- 282 bookings
- 427 booking attendees

### Step 5: Re-enable Capacity Constraints
Run this SQL:
```
scripts/migration/re-enable-capacity-constraint.sql
```

This will:
- Recalculate `spaces_booked` based on actual bookings
- Re-enable the capacity constraint
- Adjust `total_capacity` if needed to accommodate historical bookings

### Step 6: Validate
```bash
npm run validate-bookings
```

## Expected Results

After re-import, you should see:
- **No duplicate bookings** for the same customer + event
- **Correct attendee counts** (e.g., 4 attendees shows as "4 people", not 4 separate bookings)
- **Attendee names** visible in the booking details page
- **Correct capacity** calculations for each event

## Verification Query

Run this in Supabase SQL Editor to verify no duplicates:
```sql
SELECT 
  customer_email,
  offering_event_id,
  COUNT(*) as booking_count,
  SUM(number_of_attendees) as total_attendees
FROM bookings
GROUP BY customer_email, offering_event_id
HAVING COUNT(*) > 1
ORDER BY booking_count DESC;
```

Should return **0 rows** (no duplicates).

