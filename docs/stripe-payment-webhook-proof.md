# Stripe Payment And Webhook Proof

Status: current
Last updated: 2026-05-14
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Risk: critical
Depends on: [Event Cart And Checkout Readiness](./event-cart-checkout-readiness.md)

Current execution status: sandbox proof is blocked on email proof only as of 2026-05-14. The latest completed `cs_test_...` proof created the order, order item, booking, attendee row, success-page recovery, capacity consistency, and Stripe event log. It created order-linked `email_logs`, but the required email templates were `failed` with `UNAUTHORIZED_INVALID_JWT_FORMAT`. A direct protected `send-email` probe succeeded, so `FUNCTIONS_BASE_URL` was added to the Supabase project and `stripe-webhook` was updated to call `send-email` through that explicit public Functions base URL while keeping the email endpoint JWT-protected. The webhook now uses the Supabase anon JWT for the protected Functions gateway call, keeps the service role key inside `send-email` for database writes, and writes fallback failed `email_logs` rows if the cross-function email call fails. Stripe is still in sandbox/test mode, so this workstream is not live-ready yet. Before go-live, rerun the sandbox proof with a launch-safe verified recipient, then repeat with live Stripe keys, the live webhook endpoint signing secret, production app return URL, and a final live-mode payment proof.

Current evidence:

- [Stripe Payment And Webhook Proof Evidence](./stripe-payment-webhook-proof-evidence.md)
- [Event Cart And Checkout Readiness Evidence](./event-cart-checkout-readiness-evidence.md)

## Purpose

This workstream proves that a paid event checkout creates the durable production records needed for fulfilment, customer support, admin operations, capacity, and email. It is the handoff from "checkout can create a Stripe session" to "Stripe payment creates the correct business state".

## Scope

- Confirm whether the active Stripe environment is sandbox/test mode or live mode.
- Confirm `create-checkout-session` creates event payment sessions with the correct production app success and cancel URLs.
- Confirm Stripe webhook signature verification rejects missing or invalid signatures.
- Confirm the webhook is idempotent by Stripe event ID and checkout session ID.
- Confirm a paid event session creates exactly one order.
- Confirm one event order item is created per event line.
- Confirm one booking is created per event line.
- Confirm attendee rows match the booked quantity.
- Confirm event capacity is decremented and remains consistent with `offering_events.current_bookings`.
- Confirm the order success route can recover the order through `get-order-by-session`.
- Confirm customer receipt, event booking confirmation, and admin notification email paths run after payment.
- Confirm email logs are linked to the order number and Stripe Checkout Session ID.
- Confirm subscription checkout events do not create one-time event orders.

## Stripe Environment Status

Current Stripe environment: sandbox/test mode.

This is acceptable for proving code paths, signatures, idempotency, metadata, and Supabase persistence before launch. It is not sufficient for production go-live.

Before switching events live:

- Set production Supabase Edge Function secrets to Stripe live values: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `CHECKOUT_APP_URL` or `APP_URL`.
- Confirm the live Stripe webhook endpoint points at `https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook`.
- Confirm the live webhook endpoint subscribes to at least `checkout.session.completed` and `checkout.session.expired`.
- Confirm `CHECKOUT_APP_URL` or `APP_URL` points to the production `app/` domain, not a Netlify preview, localhost, sandbox app, or legacy `lola-workshops` domain.
- Run a final live-mode low-value event booking proof or a launch-approved live test booking.
- Capture the live `cs_live_...` session ID, order number, booking row, attendee row, capacity consistency, `stripe_events` row, success-page recovery, and email logs.
- Confirm any live test booking is either operationally valid or explicitly reversed/cancelled with capacity restored and documented.

## Acceptance Criteria

- Missing or invalid Stripe signatures are rejected before event processing.
- A live or test-mode completed event checkout creates one paid order.
- The order has the expected order items, bookings, and booking attendees.
- Capacity is decremented once and does not drift between `event_capacity` and `offering_events`.
- Replayed webhook deliveries do not create duplicate orders, bookings, attendees, or capacity decrements.
- `get-order-by-session` returns the paid order and booking details for the success page.
- Email side effects are logged and do not block webhook persistence if delivery fails.
- Customer and admin email proof uses order-linked `email_logs` rows with `status = 'sent'`.
- The completed session ID, row counts, and spot checks are documented before launch.

## Shipped App And Backend Surfaces To Verify

- `app/src/views/Checkout.vue`
- `app/src/views/OrderSuccess.vue`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/get-order-by-session/index.ts`
- `supabase/functions/send-email/index.ts`
- `public.orders`
- `public.order_items`
- `public.bookings`
- `public.booking_attendees`
- `public.event_capacity`
- `public.offering_events`
- `public.stripe_events`
- `public.email_logs`

Audit automation:

- `scripts/audit-stripe-payment-webhook-proof.mjs`
- `scripts/run-stripe-checkout-webhook-proof.mjs`

## Safe Preflight

The safe preflight does not create a Stripe Checkout session and does not process a payment. It verifies source-level guarantees, production table reachability, and endpoint behavior that cannot create business records.

Run:

```bash
node scripts/audit-stripe-payment-webhook-proof.mjs
```

Done when:

- Source checks pass.
- Production table reachability checks pass.
- The webhook endpoint rejects unsigned requests.
- The checkout function responds to CORS preflight.

## Sandbox Payment Proof

The sandbox proof should be run with a deliberate Stripe test-mode checkout session. Use a low-risk future event with available capacity and record the exact `cs_test_...` session ID.

There are two supported paths.

### Automated Signed Webhook Proof

This path creates a real Stripe Checkout Session through the deployed `create-checkout-session` function, retrieves the session from Stripe, posts a correctly signed `checkout.session.completed` event to the deployed webhook, waits for the Supabase order, and then runs the evidence audit automatically. By default it chooses a future paid event with available capacity; set `STRIPE_PROOF_EVENT_SLUG` to target a specific event.

It is guarded because it creates order, booking, attendee, capacity, Stripe event, and email-log side effects in Supabase. By default it refuses live-mode sessions.

Dry run:

```bash
node scripts/run-stripe-checkout-webhook-proof.mjs
```

Execute against Stripe test mode:

```bash
CONFIRM_STRIPE_PROOF_RUN=1 node scripts/run-stripe-checkout-webhook-proof.mjs
```

The runner signs a webhook probe before it creates a Checkout Session. If the probe fails with `Invalid Stripe signature`, the local secret does not match the deployed Supabase `STRIPE_WEBHOOK_SECRET`. Re-run with the deployed Stripe endpoint signing secret:

```bash
STRIPE_WEBHOOK_SECRET=whsec_deployed_endpoint_secret CONFIRM_STRIPE_PROOF_RUN=1 node scripts/run-stripe-checkout-webhook-proof.mjs
```

If the command fails before session creation, check the copied secret value for trailing punctuation. A full stop after the `whsec_...` value is treated as part of the secret and will fail signature verification.

Optional targeting:

```bash
STRIPE_PROOF_EVENT_SLUG=event-slug STRIPE_PROOF_EMAIL=test@example.com STRIPE_WEBHOOK_SECRET=whsec_deployed_endpoint_secret CONFIRM_STRIPE_PROOF_RUN=1 node scripts/run-stripe-checkout-webhook-proof.mjs
```

For email proof, use a recipient that Resend is allowed to deliver to in the current sandbox/test configuration. Do not use a disposable `example.com` proof address for the green run; that is useful for failed-email logging, but it does not prove customer receipt delivery.

Live-mode sessions are blocked unless `ALLOW_LIVE_STRIPE_PAYMENT_PROOF=1` is explicitly set. Do not set that flag until the live Stripe cutover checklist above is complete and approved.

## Latest Sandbox Proof Result

Run date: 2026-05-14
Checkout Session: `cs_test_a1OALpgUntnGRuLMGWWjJV214ZEcu8FGdOdDT15uPYokwuXHI1uNRAGIqU`
Order: `ORD-20260514-000829`
Target event: `fri-lo-flower-shapes`

Result:

- Passed: order lookup, event order item, booking row, attendee row, order success recovery, Stripe event log.
- Fixed after failure: capacity drift caused by both the webhook and the booking trigger updating capacity. The webhook now leaves event capacity to the confirmed-booking database trigger, and the trigger mirrors `event_capacity.spaces_booked` back into `offering_events.current_bookings`.
- Repaired data: the first affected proof event was corrected from `event_capacity.spaces_booked = 4` back to `3`, matching `offering_events.current_bookings = 3`.
- Latest blocker: the latest proof order has order-linked `order-confirmation`, `event-booking-confirmation`, and `new-order-admin` logs, but all required templates are `failed` with `UNAUTHORIZED_INVALID_JWT_FORMAT`. A direct protected `send-email` probe succeeded and logged metadata. `FUNCTIONS_BASE_URL` is set, and `stripe-webhook` version 40 now uses the Supabase anon JWT for the protected Functions gateway call. This needs a fresh sandbox proof with a deliverable recipient to go green.

### Completed Checkout Session Audit

If a sandbox or live payment is completed manually through Stripe Checkout, run the audit directly with the resulting session ID.

Run after completing payment:

```bash
STRIPE_CHECKOUT_SESSION_ID=cs_... node scripts/audit-stripe-payment-webhook-proof.mjs
```

Done when:

- The session has one paid order.
- The order item, booking, attendee, capacity, success-page recovery, and email log checks pass.
- A duplicate webhook replay has been tested or explicitly documented as Stripe-dashboard/CLI evidence.

## Evidence Pack Template

| Evidence item | Required contents | Status |
|---------------|-------------------|--------|
| Source hardening | Signature rejection, no dev signature fallback, no secret-prefix logging. | Done: 11/11 source checks passed on 2026-05-14 |
| Endpoint preflight | Unsigned webhook request rejected, invalid-signature probe rejected without writing `stripe_events`, checkout CORS preflight available. | Done: 3/3 endpoint checks passed |
| Production table reachability | Orders, items, bookings, attendees, capacity, Stripe events, email logs. | Done: 9/9 table checks passed |
| Sandbox payment session | Completed `cs_test_...` session ID and order number. | Done: `cs_test_a1OALpgUntnGRuLMGWWjJV214ZEcu8FGdOdDT15uPYokwuXHI1uNRAGIqU`, `ORD-20260514-000829` |
| Persistence proof | Order, item, booking, attendee rows. | Done for sandbox proof |
| Capacity proof | Before/after or post-payment consistency check. | Done after fixing webhook/trigger double-count and repairing proof-event drift |
| Success-page proof | `get-order-by-session` returns booking details. | Done for sandbox proof |
| Email proof | Customer receipt, event booking confirmation, admin notification logs. | Blocked for existing proof; rerun required with order-linked sent logs |
| Replay/idempotency proof | Duplicate delivery does not duplicate business rows. | Pending |
| Live Stripe cutover proof | Live keys, live webhook endpoint, production return URL, and completed `cs_live_...` booking proof before launch. | Required before go-live |

## Go/No-Go Rule

This workstream can be sandbox-green when safe preflight and a completed `cs_test_...` payment session prove order, booking, attendee, capacity, success-page, email, and idempotency behavior without data drift. It is production-green only after the live Stripe cutover proof is completed and documented.
