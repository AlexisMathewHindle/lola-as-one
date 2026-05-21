# Admin Booking Operations Readiness Evidence

Status: current
Last updated: 2026-05-19
Parent workstream: [Admin Booking Operations](./admin-booking-operations-readiness.md)
Audit script: `scripts/audit-admin-booking-operations-readiness.mjs`
Supabase project: hubbjhtjyubzczxengyo.supabase.co

## Run Summary

| Check | Result |
| --- | --- |
| Audit date | 2026-05-19 |
| Launch status | green for audited admin booking operations |
| Source checks | 8 |
| Production table checks | 6 |
| Data checks | 5 |
| Failed checks | 0 |
| P0 failures | 0 |
| P1 failures | 0 |
| Future confirmed bookings sampled | 8 |
| Event orders sampled | 627 |

## Check Results

| Status | Severity | Check | Detail | Failure |
| --- | --- | --- | --- | --- |
| passed | - | Admin booking routes | Booking list, event detail, check-in, booking detail, order list, and order detail routes are registered. | - |
| passed | - | Booking list workflow source | Booking list supports event/category/date/status/search workflow and links into booking/event detail. | - |
| passed | - | Booking detail workflow source | Booking detail loads attendees, supports cancellation, and links to the order detail route. | - |
| passed | - | Event detail workflow source | Event detail shows capacity, bookings, attendee rows, check-in entry, and order links. | - |
| passed | - | Check-in workflow source | Check-in screen reads confirmed bookings and toggles booking check-in fields. | - |
| passed | - | Orders list event visibility source | Admin orders list no longer filters event-only orders out of the back office. | - |
| passed | - | Order detail reconciliation source | Order detail exposes payment and Stripe Dashboard reconciliation data. | - |
| passed | - | Check-in migration source | Migration exists for booking check-in fields used by the admin UI. | - |
| passed | - | Production bookings columns | Core booking operations columns are selectable. | - |
| passed | - | Production bookings columns | Event-day check-in columns are selectable in production. | - |
| passed | - | Production booking_attendees columns | Attendee fields needed by admin booking detail are selectable. | - |
| passed | - | Production orders columns | Order reconciliation fields are selectable. | - |
| passed | - | Production order_items columns | Event order item fields are selectable. | - |
| passed | - | Production event_capacity columns | Capacity fields used by admin event detail are selectable. | - |
| passed | - | Future booking integrity | 8 future confirmed booking(s) have linked event, order, capacity, and attendee counts. | - |
| passed | - | Future capacity consistency | 8 future confirmed booking(s) have no future capacity drift. | - |
| warning | P2 | Historical capacity consistency | 44 historical event capacity mismatch(es) found. | Historical drift should be reconciled, but it does not block future launch events unless one of these records is public/bookable. |
| passed | - | Duplicate confirmed bookings | No duplicate confirmed booking business keys were found in the sampled production rows. | - |
| passed | - | Event order visibility data | 627 event order(s) exist in production data and should now be visible in admin Orders. | - |

## Production Row Counts

| Metric | Count |
| --- | --- |
| bookings total | 336 |
| bookings confirmed | 327 |
| bookings cancelled | 9 |
| bookings no_show | 0 |
| booking_attendees total | 488 |
| orders total | 647 |
| orders paid | 638 |
| orders cancelled | 9 |
| event_capacity rows | 352 |

## Future Booking Issues

_No rows._

## Future Capacity Issues

_No rows._

## Historical Capacity Issues

| Event ID | Event | Slug | Event date | Confirmed bookings | Confirmed attendees | Capacity spaces_booked | Event current_bookings | Drift vs attendees |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 764208cf-a589-4455-9d66-3290467739fb | Open Studio Fri | LEDQ9Q-open-studio-fri | 2026-04-24 | 1 | 1 | 2 | 0 | 1 |
| 77ed5c3f-9695-48c3-96c1-903d35f2479e | Experimenting with Abstract Geli, Lino and Block Printing | experimenting-with-abstract-geli-lino-and-block-printing | 2026-04-30 | 1 | 1 | 2 | 0 | 1 |
| 4b0da9e1-18b1-4062-b84d-02d8b0b4b8f8 | Chicks and Bunnies | fri-lo-chicks-and-bunnies | 2026-04-17 | 1 | 1 | 2 | 0 | 1 |
| a9c6d727-e88f-4b28-9548-93888bcdcb95 | Chicks and Bunnies | sat-lo-chicks-and-bunnies | 2026-04-18 | 1 | 1 | 2 | 0 | 1 |
| fb14c333-cca9-44b4-9e78-660a1afe6eba | Celebrating Earth Day - Exploring Junk Modelling | su01_sat01-celebrating-earth-day-exploring-junk-modelling | 2026-04-18 | 1 | 1 | 2 | 0 | 1 |
| e0aeb44f-2629-464e-ae37-76ee848aae7d | Open Studio (all ages) | 09-04-open-studio-all-ages | 2026-04-09 | 1 | 1 | 2 | 0 | 1 |
| c4b2408b-30dc-434c-b0d6-fba8e79e712b | Open Studio Tues 9.30 (all ages) | open-studio-tues-930-all-ages-20260310 | 2026-03-10 | 1 | 1 | -4 | 0 | -5 |
| 52604556-e927-481f-887a-8df9d6e36c41 | Littles Ones Fri (ages 2-4) | littles-ones-fri-ages-2-4-20260313 | 2026-03-13 | 26 | 40 | 2 | 0 | -38 |
| 2fadd239-0e42-404c-b810-b8f9bc9b5a55 | Van Gogh and the Night in Art | van-gogh-and-the-night-in-art-thurs-4-7 | 2026-04-16 | 3 | 3 | 6 | 0 | 3 |
| 2409b5e9-48a7-4588-bbce-4f43bc668f41 | Open Studio Fri 9.30 (all ages) | open-studio-fri-930-all-ages-20260306 | 2026-03-06 | 4 | 5 | 6 | 6 | 1 |
| 84cc534e-5e47-4d7c-a282-4b0933ef2602 | Open Studio Tues 9.30 (all ages) | open-studio-tues-930-all-ages-20260210 | 2026-02-10 | 2 | 3 | 6 | 6 | 3 |
| 2bbb1172-0e76-41ad-83e5-294e2959dc4b | Open Studio Sat 9.30 (all ages) | open-studio-sat-930-all-ages-20260214 | 2026-02-14 | 1 | 1 | -4 | 0 | -5 |
| d37ee00e-5b08-46a4-a8ba-1426a54d809a | Creative Saturdays (ages 5+) | creative-saturdays-ages-5-20260214 | 2026-02-14 | 1 | 2 | 6 | 6 | 4 |
| 7cb65669-60aa-4339-a4ec-e28a3d80d8f0 | Holiday (ages 5+) | holiday-ages-5-20260218 | 2026-02-18 | 2 | 5 | 0 | 0 | -5 |
| 63cc31cf-eab5-4514-952e-0969702477e3 | Art Club (ages 4+) | art-club-ages-4-20260311 | 2026-03-11 | 3 | 3 | -3 | 0 | -6 |
| 2dad26af-bd62-4701-833e-0e1778292567 | Creative Saturdays (ages 5+) | creative-saturdays-ages-5-20260110 | 2026-01-10 | 23 | 49 | 91 | 0 | 42 |
| 361857e1-8514-49ea-ba24-079abc58e777 | Holiday Little Ones (ages 2-4) | holiday-little-ones-ages-2-4-20260220 | 2026-02-20 | 2 | 3 | 0 | 0 | -3 |
| 771cdf49-f6a3-4b2c-9bcc-5e708cbbf747 | Storytime | storytime-20260128 | 2026-01-28 | 10 | 10 | 20 | 1 | 10 |
| 6033ba6f-8627-40ef-952b-ab6fd862fcf5 | Littles Ones Fri (ages 2-4) | littles-ones-fri-ages-2-4-20260130 | 2026-01-30 | 42 | 64 | 122 | 1 | 58 |
| a6409b34-e951-4fd9-8d4e-63429fc31c17 | Littles Ones Sat (ages 2-5) | littles-ones-sat-ages-2-5-20260131 | 2026-01-31 | 17 | 24 | 44 | 10 | 20 |
| 2fa7cc00-7f8b-4f02-be34-de4c70d00eee | Holiday (ages 5+) | holiday-ages-5-20260220 | 2026-02-20 | 3 | 8 | 14 | 0 | 6 |
| d8147221-850e-4a06-9eb6-45f01703fa86 | Holiday (ages 5+) | holiday-ages-5-20260217 | 2026-02-17 | 4 | 10 | 19 | 0 | 9 |
| 26137eed-2d59-485c-b62e-668072299ebb | The Story of Art Club (ages 9-13) | the-story-of-art-club-ages-9-13-20260226 | 2026-02-26 | 2 | 2 | -4 | 0 | -6 |
| 2ca23e3d-555c-4094-8606-1626fa389208 | Holiday Open Studio (all ages) | holiday-open-studio-all-ages-20260219-1 | 2026-02-19 | 4 | 6 | 10 | 0 | 4 |
| b44fb7e3-48f3-4dfd-a527-25cab21dbfd2 | Open Studio Sat 1.00 (all ages) | open-studio-sat-100-all-ages-20260131 | 2026-01-31 | 12 | 16 | 28 | 1 | 12 |
| 73df1868-9980-4304-b672-092534fc72b1 | Little Ones Tues (ages 2-4) | little-ones-tues-ages-2-4-20260324 | 2026-03-24 | 15 | 25 | 49 | 1 | 24 |
| 9570ddc2-0bfb-4b30-8217-ae496caa15f4 | Holiday Open Studio (all ages) | holiday-open-studio-all-ages-20260217-1 | 2026-02-17 | 1 | 1 | -3 | 0 | -4 |
| 97484c56-d095-4c50-94c4-9fdd33e86e31 | Little Ones Tues (ages 2-4) | little-ones-tues-ages-2-4-20260210 | 2026-02-10 | 33 | 47 | 94 | 1 | 47 |
| 2889809c-0be6-4f94-ad49-5ca6797a22a0 | Holiday Little Ones (ages 2-4) | holiday-little-ones-ages-2-4-20260217 | 2026-02-17 | 1 | 1 | -4 | 0 | -5 |
| 6ef489f5-8b05-43ac-81da-fb187170870c | Art Club (ages 4+) | art-club-ages-4-20260211 | 2026-02-11 | 7 | 8 | 10 | 0 | 2 |
| 7dce4200-bed2-4b49-9ce4-8f6a80111877 | Open Studio Sat 9.30 (all ages) | open-studio-sat-930-all-ages-20260131 | 2026-01-31 | 20 | 27 | 54 | 2 | 27 |
| 2db6d22e-bc35-423e-be75-d2cf67ef24d4 | Holiday Open Studio (all ages) | holiday-open-studio-all-ages-20260220 | 2026-02-20 | 1 | 2 | -2 | 0 | -4 |
| 499f990c-c34d-40b4-9bf1-abdd69fdf987 | Holiday Open Studio (all ages) | holiday-open-studio-all-ages-20260220-1 | 2026-02-20 | 2 | 3 | 2 | 0 | -1 |
| 520945dd-00c6-4585-801f-3888f9ca516d | Creative Saturdays (ages 5+) | creative-saturdays-ages-5-20260314 | 2026-03-14 | 11 | 24 | 48 | 1 | 24 |
| ed115549-a9be-48fd-b6c0-a28c1416c3ab | Littles Ones Sat (ages 2-5) | littles-ones-sat-ages-2-5-20260228 | 2026-02-28 | 7 | 12 | 20 | 0 | 8 |
| 412ba839-1ece-401f-9cca-2689689a9214 | Holiday (ages 5+) | holiday-ages-5-20260219 | 2026-02-19 | 6 | 10 | 18 | 0 | 8 |
| f5addbed-f550-4551-943b-5ee080979ebe | The Story of Art Club (ages 4-8) | the-story-of-art-club-ages-4-8-20260326 | 2026-03-26 | 6 | 7 | 15 | 0 | 8 |
| 1473e03e-564a-4a64-ab2b-ccce44d6ea2b | Holiday Open Studio (all ages) | holiday-open-studio-all-ages-20260218 | 2026-02-18 | 3 | 6 | 15 | 0 | 9 |
| 6025931c-a55f-4ac2-a615-cd97ead17b30 | Open Studio Fri 9.30 (all ages) | open-studio-fri-930-all-ages-20260130 | 2026-01-30 | 14 | 17 | 27 | 0 | 10 |
| 8353b4b4-752e-480f-9624-442fc0c118e3 | Open Studio Tues 9.30 (all ages) | open-studio-tues-930-all-ages-20260120 | 2026-01-20 | 6 | 8 | 8 | 0 | 0 |
| b262bc4a-3486-4851-9d3d-56a7ba80af8c | The Story of Art Club (ages 4-8) | the-story-of-art-club-ages-4-8-20260205 | 2026-02-05 | 6 | 7 | 15 | 0 | 8 |
| 141afb5d-d2be-4131-b8d9-f1d2d4178001 | The Story of Art Club (ages 9-13) | the-story-of-art-club-ages-9-13-20260212 | 2026-02-12 | 4 | 4 | 6 | 0 | 2 |
| 94099e14-6de8-4eb8-bdca-755632639676 | Holiday (ages 5+) | holiday-ages-5-20260110 | 2026-01-10 | 4 | 6 | 9 | 0 | 3 |
| 3ee20cc5-38fa-477d-9d12-0f842dbdb8e0 | Open Studio Tues 9.30 (all ages) | open-studio-tues-930-all-ages-20260317 | 2026-03-17 | 2 | 3 | 0 | 0 | -3 |

## Duplicate Confirmed Booking Keys

_No rows._

## Sample Future Confirmed Bookings

| Order | Event | Date | Start | Customer email | Attendees | Attendee rows | Order status | Checked in |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORD-20260506-000823 | Open Studio (All Ages) World Art | 2026-05-26 | 09:30:00 | al***@gmail.com | 2 | 2 | paid | no |
| ORD-20260411-000810 | Modern Sculpture | 2026-07-16 | 16:00:00 | se***@lotsoflovelyart.com | 1 | 1 | paid | no |
| ORD-20260411-000810 | Black Artists | 2026-07-09 | 16:00:00 | se***@lotsoflovelyart.com | 1 | 1 | paid | no |
| ORD-20260411-000810 | Friendship in Art | 2026-07-02 | 16:00:00 | se***@lotsoflovelyart.com | 1 | 1 | paid | no |
| ORD-20260411-000810 | Street Art | 2026-06-25 | 16:00:00 | se***@lotsoflovelyart.com | 1 | 1 | paid | no |
| ORD-20260411-000810 | Women in Art | 2026-06-18 | 16:00:00 | se***@lotsoflovelyart.com | 1 | 1 | paid | no |
| ORD-20260411-000810 | Surrealism and Lobster Telephones | 2026-06-11 | 16:00:00 | se***@lotsoflovelyart.com | 1 | 1 | paid | no |
| ORD-20260411-000810 | Naive Art and the Jungle! | 2026-06-04 | 16:00:00 | se***@lotsoflovelyart.com | 1 | 1 | paid | no |

## Sample Event Orders

| Order | Status | Customer email | Total | Stripe checkout session | Stripe payment intent | Created |
| --- | --- | --- | --- | --- | --- | --- |
| ORD-20260519-000833 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-19T11:47:48.420Z |
| ORD-20260519-000832 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-19T11:27:09.433Z |
| ORD-20260514-000831 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-14T15:49:10.335Z |
| ORD-20260514-000830 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-14T15:46:47.722Z |
| ORD-20260514-000829 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-14T15:40:07.001Z |
| ORD-20260514-000828 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-14T15:30:18.756Z |
| ORD-20260514-000827 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-14T14:24:49.600Z |
| ORD-20260514-000826 | cancelled | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-05-14T13:57:41.913Z |
| ORD-20260514-000825 | cancelled | st***@example.com | 12 | cs_test_... | pi_... | 2026-05-14T13:22:01.746Z |
| ORD-20260513-000824 | paid | se***@lotsoflovelyart.com | 86 | cs_test_... | pi_... | 2026-05-13T14:29:49.917Z |
| ORD-20260506-000823 | paid | al***@gmail.com | 21.6 | cs_test_... | pi_... | 2026-05-06T16:36:11.850Z |
| ORD-20260411-000810 | paid | se***@lotsoflovelyart.com | 84 | cs_test_... | pi_... | 2026-04-11T09:02:45.164Z |
| ORD-20260411-000809 | paid | se***@lotsoflovelyart.com | 12 | cs_test_... | pi_... | 2026-04-11T08:51:49.769Z |
| ORD-20260410-000808 | paid | se***@lotsoflovelyart.com | 12 | cs_test_... | pi_... | 2026-04-10T14:17:35.175Z |
| ORD-20260410-000807 | paid | se***@lotsoflovelyart.com | 39 | cs_test_... | pi_... | 2026-04-10T13:24:58.962Z |
| ORD-20260312-000806 | paid | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-03-12T16:50:25.177Z |
| ORD-20260311-000805 | paid | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-03-11T21:17:18.855Z |
| ORD-20260311-000804 | paid | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-03-11T21:12:12.867Z |
| ORD-20260311-000803 | paid | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-03-11T21:03:42.372Z |
| ORD-20260311-000802 | paid | al***@gmail.com | 12 | cs_test_... | pi_... | 2026-03-11T20:59:44.170Z |

## Interpretation

- The audit is read-only against Supabase. It does not cancel bookings, mark check-ins, issue refunds, or change capacity.
- Source checks confirm the admin code paths needed for booking list, booking detail, event detail, check-in, order list, and Stripe reconciliation are present.
- Production table checks verify the columns the admin UI depends on are actually selectable in the configured production Supabase project.
- Capacity consistency compares confirmed booking attendee totals, `event_capacity.spaces_booked`, and `offering_events.current_bookings`.
- Refund handling is not automated by this audit. If a booking is cancelled in admin, the operational refund still needs a documented Stripe/manual process unless refund automation is added.
