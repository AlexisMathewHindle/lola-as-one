# Stripe Replay And Idempotency Proof Evidence

Status: current
Last updated: 2026-05-19
Parent workstream: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Audit source: signed duplicate webhook posts against production Supabase Edge Function
Checkout Session: `cs_test_a1tK8xbzNzvW85xaecaK4Q4fgiz8yZXbnsXGYtsF7SnkB4RTs4izemO0rV`
Cached replay event ID: `evt_codex_checkout_completed_1779191267974`
Second same-session event ID: `evt_codex_checkout_replay_same_session_1779198788513`

## Run Summary

| Check | Result |
|-------|--------|
| Overall status | green |
| Checks | 10 |
| Checks passed | 10 |
| Failed checks | 0 |
| Same-event replay response | 200 {"received":true,"cached":true} |
| Second same-session response | 200 {"received":true} |

## Proof Checks

| Result | Check | Detail | Failure |
| --- | --- | --- | --- |
| passed | Same event ID replay response | 200; cached=true | - |
| passed | Same event ID creates no duplicate business rows | Orders, items, bookings, attendees, capacity, email logs, and event logs unchanged. | - |
| passed | Second same-session event response | 200 | - |
| passed | No duplicate orders | 1 order row(s) before and after replay. | - |
| passed | No duplicate order item rows | 1 order item row(s) before and after replay. | - |
| passed | No duplicate booking rows | 1 booking row(s) before and after replay. | - |
| passed | No duplicate attendee rows | 1 attendee row(s) before and after replay. | - |
| passed | Capacity is not decremented twice | Capacity rows and offering_events.current_bookings are unchanged after duplicate delivery. | - |
| passed | Duplicate email sends prevented | 5 order-linked email log(s) before and after replay. | - |
| passed | Second same-session event only writes audit event | stripe_events increased by 1 for evt_codex_checkout_replay_same_session_1779198788513. | - |

## Row Counts

| Snapshot | Orders | Order items | Bookings | Attendees | Capacity rows | Email logs | Checkout session event logs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Before replay | 1 | 1 | 1 | 1 | 1 | 5 | 1 |
| After same event ID replay | 1 | 1 | 1 | 1 | 1 | 5 | 1 |
| After second same-session event | 1 | 1 | 1 | 1 | 1 | 5 | 2 |

## Capacity Snapshot

| Offering event ID | Spaces booked | Spaces available | Current bookings | Max capacity |
| --- | --- | --- | --- | --- |
| f275252b-4867-422f-976d-2f8ab32379b0 | 2 | 5 | 2 | 8 |

## Notes

- This is sandbox/test-mode evidence when the Checkout Session starts with `cs_test_`.
- Same Stripe event ID replay must return success from the webhook cache and must not write business rows.
- A different Stripe event ID for the same Checkout Session may add one extra `stripe_events` audit row, but must not create another order, booking, attendee, capacity decrement, or email send.
- Duplicate customer/admin email sends are prevented in this proof because the same-session duplicate exits at the existing-order guard before email invocation.
- Live-mode replay proof must be repeated after live Stripe cutover with a `cs_live_...` session.
