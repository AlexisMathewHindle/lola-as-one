# Admin Booking Staff Browser Proof

Status: current
Last updated: 2026-05-19
Parent workstream: [Admin Booking Operations](./admin-booking-operations-readiness.md)
Script: `scripts/audit-admin-booking-staff-browser-proof.mjs`
Mode: non-destructive browser proof

## Run Summary

| Check | Result |
| --- | --- |
| App URL | http://127.0.0.1:5173 |
| Viewports | 390x844, 1024x768 |
| Target booking | 17e75044-47da-4453-b821-d6f8b38bfacb |
| Target order | ORD-20260506-000823 |
| Target event | Open Studio (All Ages) World Art |
| Target event date | 2026-05-26 |
| Target customer | al***@gmail.com |
| Checks run | 22 |
| Failed checks | 0 |

## Results

| Viewport | Route | Check | Status | Observed | Failure |
| --- | --- | --- | --- | --- | --- |
| 390x844 | /admin/events/bookings | Admin login | passed | Signed in and reached Event Bookings. | - |
| 390x844 | /admin/events/bookings | Booking search | passed | Search finds al***@gmail.com. | - |
| 390x844 | /admin/bookings/17e75044-47da-4453-b821-d6f8b38bfacb | Page content | passed | Booking detail shows customer, order, and attendee data. | - |
| 390x844 | /admin/bookings/:id | Cancellation modal | passed | Cancellation modal opens and can be dismissed without cancelling. | - |
| 390x844 | /admin/events/1434bcab-9099-407c-9b3a-0bd0850c0843 | Page content | passed | Event detail shows operating counters and attendee list. | - |
| 390x844 | /admin/events/1434bcab-9099-407c-9b3a-0bd0850c0843/checkin | Page content | passed | Check-in screen shows event-day counters and search. | - |
| 390x844 | /admin/events/:id/checkin | Check-in control | passed | Check-in action is visible. The proof did not toggle a real booking. | - |
| 390x844 | /admin/orders | Page content | passed | Orders list loads for reconciliation. | - |
| 390x844 | /admin/orders | Order search | passed | Order ORD-20260506-000823 is visible in admin Orders. | - |
| 390x844 | /admin/orders/2f5ac93e-ea58-42cb-9946-f847a4dd4b1e | Page content | passed | Order detail shows payment, order item, and customer reconciliation data. | - |
| 390x844 | /admin/orders/:id | Stripe reconciliation link | passed | View in Stripe link is visible. | - |
| 1024x768 | /admin/events/bookings | Admin login | passed | Signed in and reached Event Bookings. | - |
| 1024x768 | /admin/events/bookings | Booking search | passed | Search finds al***@gmail.com. | - |
| 1024x768 | /admin/bookings/17e75044-47da-4453-b821-d6f8b38bfacb | Page content | passed | Booking detail shows customer, order, and attendee data. | - |
| 1024x768 | /admin/bookings/:id | Cancellation modal | passed | Cancellation modal opens and can be dismissed without cancelling. | - |
| 1024x768 | /admin/events/1434bcab-9099-407c-9b3a-0bd0850c0843 | Page content | passed | Event detail shows operating counters and attendee list. | - |
| 1024x768 | /admin/events/1434bcab-9099-407c-9b3a-0bd0850c0843/checkin | Page content | passed | Check-in screen shows event-day counters and search. | - |
| 1024x768 | /admin/events/:id/checkin | Check-in control | passed | Check-in action is visible. The proof did not toggle a real booking. | - |
| 1024x768 | /admin/orders | Page content | passed | Orders list loads for reconciliation. | - |
| 1024x768 | /admin/orders | Order search | passed | Order ORD-20260506-000823 is visible in admin Orders. | - |
| 1024x768 | /admin/orders/2f5ac93e-ea58-42cb-9946-f847a4dd4b1e | Page content | passed | Order detail shows payment, order item, and customer reconciliation data. | - |
| 1024x768 | /admin/orders/:id | Stripe reconciliation link | passed | View in Stripe link is visible. | - |

## Boundaries

- The proof logs in through the app using credentials supplied through environment variables.
- It verifies real admin routes and production-backed booking data through the local app runtime.
- It opens and dismisses the cancellation modal, but does not confirm cancellation.
- It verifies the check-in action is visible, but does not toggle a real booking.
- It does not capture screenshots because admin pages contain customer data.
