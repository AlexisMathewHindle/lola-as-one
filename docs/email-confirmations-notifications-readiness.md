# Email Confirmations And Notifications Readiness

Status: current
Last updated: 2026-06-02
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Risk: critical
Depends on: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Current execution status: blocked until the Resend production sender domain is verified and production email variables are available.

## Decision

This workstream is blocked on sender-domain configuration. Sandbox Stripe proof already confirmed that the webhook can create order-linked `email_logs` rows with `status = 'sent'` for:

- `order-confirmation`
- `event-booking-confirmation`
- `new-order-admin`

That proves the event checkout email code path in sandbox. It does not yet prove production email operations, sender reputation, reminder scheduling, or waitlist notification readiness.

Current production-like log evidence from 2026-05-26 and 2026-05-27 shows `order-confirmation`, `event-booking-confirmation`, and `new-order-admin` attempts failing for non-owner recipients with Resend `403 validation_error`: Resend only allows test sends to the account owner address until a domain is verified and the `from` address uses that domain. Admin sends to the owner email succeeded, which confirms the API key/function path works for permitted recipients.

## Missing Before This Can Go Green

- Production `RESEND_API_KEY` must be confirmed in Supabase Edge Function secrets.
- Production sender domain and from address must be approved and verified in Resend.
- `EMAIL_FROM` must be set in Supabase Edge Function secrets to an address on the verified sending domain.
- `EMAIL_REPLY_TO` should be set to the launch support inbox.
- `SUPPORT_EMAIL` should be set to the customer support inbox rendered inside templates.
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

Verify the production sending domain in Resend, set `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SUPPORT_EMAIL`, and `ADMIN_EMAILS`, redeploy `send-email`, then rerun a real checkout/email proof against the launch environment.

Continue the events launch with [Admin Booking Operations](./events-production-launch-epic.md#6-admin-booking-operations).
