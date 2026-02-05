# Booking Migration Summary

## Overview

We're migrating **1,686 bookings** with **2,837 workshop bookings** from Firebase to Supabase.

## Challenge: Missing Historical Events

- **Total events referenced in bookings:** 362
- **Events already in Supabase:** 45 (recently migrated)
- **Missing historical events:** 330

The 330 missing events no longer exist in Firebase (they're past events), but the bookings still reference them.

## Solution: Placeholder Events

We'll create **placeholder offerings** for the 330 missing historical events using data from the bookings themselves:
- Event title (from booking data)
- Event date and time (from booking data)
- Price (from booking data)
- Status: `archived` (marked as historical)
- Metadata: `is_historical: true`, `migrated_from_firebase: true`

## Migration Structure

### What Gets Created:

1. **330 Placeholder Offerings** (type='event', status='archived')
2. **330 Placeholder Offering Events** (with dates/times from bookings)
3. **330 Event Capacity Records** (for the placeholder events)
4. **1,686 Orde4. **1,686 Orde4. **1,686 Orde4. **1,686 Orde4. **1,686 Orde4. **1,686 Orde4. **1,686 Orde4837 Bookings** (linked to offering_events)
7. **2,837 Booking Attendees** (with attendee deta7. **2,837 Booking Attendees** (with attendee deta7. ***g7. **2,837 Booking Attendees** (witNULL (no auth.users record)
- `customer_email` = parent email from Firebase
- `customer_name` = parent first + last name from Firebase

### Event Capacity Auto-Update

The Supabase trigger `update_event_capacity_on_booking()` will automatically update `event_capacity.spaces_booked` when bookings are iThe Supabase trigger `update_event_capacorThe Supabase trigger `updaookings from Firebase ✅ DONE
2. **6-transform-bookings.js** - Transform to Supabase format ✅ DONE
3. **7-impo3. **7-impo3. **7-impport to Supabase (READY TO RUN)
4. **8-validate-bookings.js** - Validate migration (READY TO RUN)

## Current Status

✅ Exported 1,686 bookings from Firebase
✅ Transformed to Supabase format
✅ Identified 330 missing historical events
✅ DRY_RUN validation passed

## Next Steps

1. Review this summary
2. Run actual import: `npm run import-bookings`
3. Validate results: 3. Validate results: 3. Validate results: 3. Validate results: 3. Validate results: 3. Validate results: 3. Validate results: 3. Validate results: 3. Validate results: e
npm run transform-bookings # Already done
npm run import-bookings    # Ready to run
npm run validate-bookingnpm run validate-bookingnpm r Expected Results

- 1,686 orders created
- 2,837 bookings created
- 2,837 attendees created
- 330 historical events created
- Event capacity automatically updated for all events
