# Email Confirmations And Notifications Readiness

Status: current
Last updated: 2026-05-19
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Risk: critical
Depends on: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Current execution status: deferred until the missing production email variables and sender/domain configuration are available.

## Decision

This workstream is intentionally paused for now. Sandbox Stripe proof already confirmed that the webhook can create order-linked `email_logs` rows with `status = 'sent'` for:

- `order-confirmation`
- `event-booking-confirmation`
- `new-order-admin`

That proves the event checkout email code path in sandbox. It does not yet prove production email operations, sender reputation, reminder scheduling, or waitlist notification readiness.

## Missing Before This Can Go Green

- Production `RESEND_API_KEY` must be confirmed in Supabase Edge Function secrets.
- Production sender domain and from address must be approved. The current `send-email` implementation sends from `Lola As One <onboarding@resend.dev>`, which is not a production sender.
- Launch admin recipients must be confirmed through `ADMIN_EMAILS`.
- Event reminder scheduler ownership must be confirmed, including `EVENT_EMAIL_CRON_SECRET`.
- Event email runtime URLs should be confirmed where used, including `SITE_URL`, `EVENT_FEEDBACK_URL`, and `EVENT_EMAIL_TIME_ZONE`.
- Waitlist notification ownership must be confirmed before `waitlist-event-available` is treated as production-ready.

## Scope To Resume

- Verify sender domain, from address, reply-to behavior, and deliverability setup in Resend.
- Confirm customer receipt email content for `order-confirmation`.
- Confirm customer event confirmation content for `event-booking-confirmation`.
- Confirm admin notification content and recipients for `new-order-admin`.
- Confirm failed email attempts write visible `email_logs` rows and do not fail webhook persistence.
- Confirm 7-day and 24-hour event reminders are either scheduled or explicitly deferred with owner sign-off.
- Confirm waitlist notification template and trigger ownership if waitlists are enabled for launch.

## Acceptance Criteria

- Customer receipt and event confirmation emails render correct event name, date, time, location, attendees, order number, and booking reference.
- Admin notification reaches all configured launch recipients.
- Email tests are run against the production-equivalent environment before launch.
- Reminder and waitlist notification ownership is documented before launch.
- Any reminders or waitlist notifications not shipping at events launch have explicit owner sign-off and a follow-up epic.

## Current Next Action

Do not continue this workstream until the missing variables and sender/domain decisions are available.

Continue the events launch with [Admin Booking Operations](./events-production-launch-epic.md#6-admin-booking-operations).
