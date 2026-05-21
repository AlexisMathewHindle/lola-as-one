# Admin Booking Attendee Backfill Evidence

Status: current
Last updated: 2026-05-19
Parent workstream: [Admin Booking Operations](./admin-booking-operations-readiness.md)
Script: `scripts/backfill-admin-booking-attendees.mjs`
Supabase project: hubbjhtjyubzczxengyo.supabase.co

## Run Summary

| Check | Result |
| --- | --- |
| Mode | applied |
| Future confirmed bookings with missing attendees | 7 |
| Missing attendee rows identified | 7 |
| Attendee rows inserted | 7 |

## Target Bookings

| Booking ID | Order | Event | Date | Customer email | Existing attendees | Required attendees | Missing attendees |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6b4bd215-9163-4e80-b63f-2d8baa60e616 | ORD-20260411-000810 | Modern Sculpture | 2026-07-16 | se***@lotsoflovelyart.com | 0 | 1 | 1 |
| 7ecc1a08-12f8-49c9-a2b0-b790f900eb57 | ORD-20260411-000810 | Black Artists | 2026-07-09 | se***@lotsoflovelyart.com | 0 | 1 | 1 |
| 9e768b73-9756-4dce-a3d7-daf59e70f3e2 | ORD-20260411-000810 | Friendship in Art | 2026-07-02 | se***@lotsoflovelyart.com | 0 | 1 | 1 |
| c4911c11-0850-424d-a7ca-1a4dfa4b38eb | ORD-20260411-000810 | Street Art | 2026-06-25 | se***@lotsoflovelyart.com | 0 | 1 | 1 |
| 8a5816b9-22d8-4d38-89a4-a7de31ba0573 | ORD-20260411-000810 | Women in Art | 2026-06-18 | se***@lotsoflovelyart.com | 0 | 1 | 1 |
| a6767556-2ec4-49fa-b72f-cd3cfe1ccac8 | ORD-20260411-000810 | Surrealism and Lobster Telephones | 2026-06-11 | se***@lotsoflovelyart.com | 0 | 1 | 1 |
| 21fcdf04-40eb-4f98-a60a-3338f06f5399 | ORD-20260411-000810 | Naive Art and the Jungle! | 2026-06-04 | se***@lotsoflovelyart.com | 0 | 1 | 1 |

## Inserted Attendees

| Booking ID | Attendee ID | Backfilled name |
| --- | --- | --- |
| 6b4bd215-9163-4e80-b63f-2d8baa60e616 | 4d802303-a4d2-448a-a9b2-e69f4cc889dc | T*** T*** |
| 7ecc1a08-12f8-49c9-a2b0-b790f900eb57 | 233060bb-4a18-4b1f-9d3c-a6edfb701565 | T*** T*** |
| 9e768b73-9756-4dce-a3d7-daf59e70f3e2 | 7c4e3540-8ccc-490f-8064-f6a13144db5a | T*** T*** |
| c4911c11-0850-424d-a7ca-1a4dfa4b38eb | 31fc4965-39fe-4578-930d-423d2ca13e50 | T*** T*** |
| 8a5816b9-22d8-4d38-89a4-a7de31ba0573 | c75e65eb-0e57-4e00-b564-459d4a807f8d | T*** T*** |
| a6767556-2ec4-49fa-b72f-cd3cfe1ccac8 | 249c9251-cbad-4b28-808f-2083099b81f9 | T*** T*** |
| 21fcdf04-40eb-4f98-a60a-3338f06f5399 | 9c8b49ed-29d0-422e-af95-803936151763 | T*** T*** |

## Notes

- This backfill is idempotent by count. Rerunning it only inserts rows for bookings where `booking_attendees.length < bookings.number_of_attendees`.
- Backfilled attendee rows use the booking customer name and customer email because the original attendee rows were missing.
- Allergy data is left empty; staff should confirm any allergies manually if needed for these legacy/imported bookings.
