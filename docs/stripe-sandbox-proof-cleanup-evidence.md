# Stripe Sandbox Proof Cleanup Evidence

Status: current
Last updated: 2026-05-19
Parent workstream: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Audit source: production Supabase sandbox/test Checkout Session orders and event capacity rows

## Run Summary

| Check | Result |
|-------|--------|
| Overall status | green |
| Mode | confirmed cleanup |
| Candidate sandbox orders | 9 |
| Confirmed bookings before cleanup | 9 |
| Confirmed attendee spaces before cleanup | 9 |
| Orders cancelled by this run | 9 |
| Bookings cancelled by this run | 9 |
| Failed checks | 0 |

## Checks

| Result | Check | Detail | Failure |
| --- | --- | --- | --- |
| passed | Sandbox proof orders identified | 9 order(s) with cs_test checkout sessions. | - |
| passed | Cleanup execution confirmed | CONFIRM_STRIPE_SANDBOX_CLEANUP=1 was set. | - |
| passed | Confirmed proof bookings cancelled | 9 booking(s) cancelled. | - |
| passed | Proof orders marked inactive | 9 order(s) marked cancelled. | - |
| passed | No active proof bookings remain | 0 confirmed candidate proof bookings remain. | - |
| passed | Proof attendee spaces restored | 9 proof space(s) removed from active capacity. | - |
| passed | Capacity consistency after cleanup | 3 event capacity row(s) consistent. | - |
| passed | Capacity consistency before cleanup | 3 event capacity row(s) started consistent. | - |

## Candidate Orders Before Cleanup

| Order | Status | Customer | Total | Checkout Session | Created | Bookings | Confirmed bookings | Confirmed spaces | Attendee rows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ORD-20260514-000825 | paid | stripe-proof+20260514-1778764917614@example.com | 12 | cs_test_a1GpjrR3eMMIyH1gXQsPdsnPyZBAhqBXaIthY9AfS9nVLgSxwOOJW8XM8I | 2026-05-14T13:22:01.746069+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260514-000826 | paid | alexishindle@gmail.com | 12 | cs_test_a1LIlH05XeH9jR64w4c49SsJkN8J7uWPaamrLwwJWmOJQeXi06JAWONqOY | 2026-05-14T13:57:41.913506+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260514-000827 | paid | alexishindle@gmail.com | 12 | cs_test_a1DMMbvmfqbzojE1OUmMWFQrRSzwLKsqIkEmZfysJDQj3JwPKWLPgJkhZi | 2026-05-14T14:24:49.600002+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260514-000828 | paid | alexishindle@gmail.com | 12 | cs_test_a10nZJusNnz7omB5YWWJlc0rWCbiP9XaSMPMGMWEJoH49T6iez9w9ewKU8 | 2026-05-14T15:30:18.756614+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260514-000829 | paid | alexishindle@gmail.com | 12 | cs_test_a1OALpgUntnGRuLMGWWjJV214ZEcu8FGdOdDT15uPYokwuXHI1uNRAGIqU | 2026-05-14T15:40:07.001961+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260514-000830 | paid | alexishindle@gmail.com | 12 | cs_test_a1RWqPGXxz9rH48ptYhVfgjgi9KxQOkl6iXGuYkF48yQQbHBL37fKuqztP | 2026-05-14T15:46:47.722989+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260514-000831 | paid | alexishindle@gmail.com | 12 | cs_test_a173TvpOTq3MvAKutiM30p8Xh2t7D5UYY4hxaeIaIKN4oqQzB7y10VjB3q | 2026-05-14T15:49:10.335202+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260519-000832 | paid | alexishindle@gmail.com | 12 | cs_test_a1w7WMpV8KYoWKFVv9Usg7ZCkIXtYXNzwZ0RlyKDhhw5jITHeBt8Lk2Cab | 2026-05-19T11:27:09.433461+00:00 | 1 | 1 | 1 | 1 |
| ORD-20260519-000833 | paid | alexishindle@gmail.com | 12 | cs_test_a1tK8xbzNzvW85xaecaK4Q4fgiz8yZXbnsXGYtsF7SnkB4RTs4izemO0rV | 2026-05-19T11:47:48.420054+00:00 | 1 | 1 | 1 | 1 |

## Candidate Orders After Cleanup

| Order | Status | Customer | Checkout Session | Bookings | Confirmed bookings | Confirmed spaces | Attendee rows |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ORD-20260514-000825 | cancelled | stripe-proof+20260514-1778764917614@example.com | cs_test_a1GpjrR3eMMIyH1gXQsPdsnPyZBAhqBXaIthY9AfS9nVLgSxwOOJW8XM8I | 1 | 0 | 0 | 1 |
| ORD-20260514-000826 | cancelled | alexishindle@gmail.com | cs_test_a1LIlH05XeH9jR64w4c49SsJkN8J7uWPaamrLwwJWmOJQeXi06JAWONqOY | 1 | 0 | 0 | 1 |
| ORD-20260514-000827 | cancelled | alexishindle@gmail.com | cs_test_a1DMMbvmfqbzojE1OUmMWFQrRSzwLKsqIkEmZfysJDQj3JwPKWLPgJkhZi | 1 | 0 | 0 | 1 |
| ORD-20260514-000828 | cancelled | alexishindle@gmail.com | cs_test_a10nZJusNnz7omB5YWWJlc0rWCbiP9XaSMPMGMWEJoH49T6iez9w9ewKU8 | 1 | 0 | 0 | 1 |
| ORD-20260514-000829 | cancelled | alexishindle@gmail.com | cs_test_a1OALpgUntnGRuLMGWWjJV214ZEcu8FGdOdDT15uPYokwuXHI1uNRAGIqU | 1 | 0 | 0 | 1 |
| ORD-20260514-000830 | cancelled | alexishindle@gmail.com | cs_test_a1RWqPGXxz9rH48ptYhVfgjgi9KxQOkl6iXGuYkF48yQQbHBL37fKuqztP | 1 | 0 | 0 | 1 |
| ORD-20260514-000831 | cancelled | alexishindle@gmail.com | cs_test_a173TvpOTq3MvAKutiM30p8Xh2t7D5UYY4hxaeIaIKN4oqQzB7y10VjB3q | 1 | 0 | 0 | 1 |
| ORD-20260519-000832 | cancelled | alexishindle@gmail.com | cs_test_a1w7WMpV8KYoWKFVv9Usg7ZCkIXtYXNzwZ0RlyKDhhw5jITHeBt8Lk2Cab | 1 | 0 | 0 | 1 |
| ORD-20260519-000833 | cancelled | alexishindle@gmail.com | cs_test_a1tK8xbzNzvW85xaecaK4Q4fgiz8yZXbnsXGYtsF7SnkB4RTs4izemO0rV | 1 | 0 | 0 | 1 |

## Capacity Before Cleanup

| Event | Slug | Date | Spaces booked | Spaces available | Current bookings | Drift |
| --- | --- | --- | --- | --- | --- | --- |
| Open Studio Fri | 502SSW-open-studio-fri | 2026-05-15 | 6 | 0 | 6 | no |
| Flower Shapes | fri-lo-flower-shapes | 2026-05-15 | 3 | 1 | 3 | no |
| A Vase full of Van Gogh’s Flowers | su01_wed_artclub-a-vase-full-of-van-goghs-flowers | 2026-05-20 | 2 | 5 | 2 | no |

## Capacity After Cleanup

| Event | Slug | Date | Spaces booked | Spaces available | Current bookings | Drift |
| --- | --- | --- | --- | --- | --- | --- |
| Open Studio Fri | 502SSW-open-studio-fri | 2026-05-15 | 2 | 4 | 2 | no |
| Flower Shapes | fri-lo-flower-shapes | 2026-05-15 | 0 | 4 | 0 | no |
| A Vase full of Van Gogh’s Flowers | su01_wed_artclub-a-vase-full-of-van-goghs-flowers | 2026-05-20 | 0 | 7 | 0 | no |

## Notes

- Cleanup preserves order, order item, booking, attendee, Stripe event, and email log evidence.
- Confirmed proof bookings are marked `cancelled`, with a cancellation reason, so the booking cancellation trigger restores capacity.
- Orders touched by the cleanup are marked `cancelled` to keep admin order lists from treating sandbox payments as active launch revenue.
- Live Stripe cutover still requires a separate `cs_live_...` proof and live-mode replay/idempotency proof.
