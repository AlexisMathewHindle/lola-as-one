# Bookings Migration Guide

This guide explains how to migrate bookings and customers from Firebase Firestore to PostgreSQL/Supabase.

## Overview

The migration imports:
- **Customers** from Firebase booking data (parent field)
- **Bookings** for events with attendee information
- **Orders** as tracking records (not product orders)

## Key Design Decisions

### 1. Customers Decoupled from Auth Users

**Problem:** The original schema had `customers.id` referencing `auth.users(id)`, preventing creation of customer records for historical bookings without auth accounts.

**Solution:** Modified schema to decouple customers from auth users:
- `customers.id` is now an independent UUID
- Added `customers.auth_user_id` as optional reference to `auth.users(id)`
- Historical customers have `auth_user_id = NULL`
- When customers create accounts later, `auth_user_id` can be populated

**Migration SQL:** `scripts/migration/decouple-customers-from-auth.sql`

### 2. Orders for Events as Tracking Records

**Approach:** Event bookings create orders, but these are tracking records (not product orders):
- Orders track the financial transaction for the booking
- Order type is `one_time`
- Order items have `item_type = 'event'`
- This maintains referential integrity while distinguishing event bookings from product purchases

## Migration Steps

### Prerequisites

1. **Run schema migrations** (in order):
   ```bash
   # 1. Decouple customers from auth.users
   psql -h <host> -U <user> -d <database> -f scripts/migration/decouple-customers-from-auth.sql
   ```

2. **Ensure events are migrated** - The booking migration requires offering_events to exist in Supabase

### Step 1: Export from Firebase

```bash
npm run export-bookings
```

This exports:
- `firebase-bookings-latest.json` - All bookings from Firestore
- `firebase-customers-latest.json` - Customer data extracted from bookings

### Step 2: Transform Data

```bash
npm run transform-bookings
```

This transforms Firebase data to Supabase format:
- Maps Firebase event_ids to Supabase offering_event_ids
- Groups attendees by workshop/event
- Prepares customer records
- Creates booking and booking_attendee records

Output: `supabase-bookings-latest.json`

### Step 3: Import to Supabase

```bash
npm run import-bookings
```

This imports in order:
1. **Customers** - Creates customer records with generated UUIDs (auth_user_id = NULL)
2. **Orders** - Creates tracking orders for each booking
3. **Order Items** - Creates order items with event details
4. **Bookings** - Creates booking records linked to orders and customers
5. **Booking Attendees** - Creates attendee records for each booking

### Step 4: Verify Import

Check the import results in `logs/booking-import-results-<timestamp>.json`

Query Supabase to verify:
```sql
-- Check customers
SELECT COUNT(*) FROM customers WHERE auth_user_id IS NULL;

-- Check bookings
SELECT COUNT(*) FROM bookings;

-- Check orders for events
SELECT COUNT(*) FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE oi.item_type = 'event';

-- Check event capacity updates
SELECT oe.id, oe.current_bookings, ec.spaces_booked
FROM offering_events oe
LEFT JOIN event_capacity ec ON ec.offering_event_id = oe.id
WHERE oe.current_bookings > 0;
```

## Data Structure

### Firebase Booking
```json
{
  "firebaseId": "abc123",
  "attendees": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "workshop": [
        {
          "event_id": "ht_os_jan_03",
          "workshop_title": "Open Studio",
          "event_date": "2026-01-03"
        }
      ]
    }
  ],
  "parent": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "telephone": "07123456789"
  },
  "timestamp": "2026-01-02T16:09:31.000Z"
}
```

### Supabase Structure
- **Customer**: Jane Doe (parent) with `auth_user_id = NULL`
- **Order**: Tracking order with `order_type = 'one_time'`, `status = 'paid'`
- **Order Item**: Event item with `item_type = 'event'`
- **Booking**: Links to order, customer, and offering_event
- **Booking Attendee**: John Doe (attendee) linked to booking

## Troubleshooting

### Customer already exists
If a customer with the same email already exists, the script will use the existing customer ID.

### Event not found
If a Firebase event_id doesn't map to a Supabase offering_event, the booking is skipped. Check the transform output for unmapped events.

### Capacity constraints
The `update_event_capacity_on_booking` trigger automatically updates event capacity when bookings are inserted.

## Future Enhancements

When customers create accounts:
1. Create auth.users record via Supabase Auth
2. Update `customers.auth_user_id` to link to the new auth user
3. Customer can now log in and view their historical bookings

