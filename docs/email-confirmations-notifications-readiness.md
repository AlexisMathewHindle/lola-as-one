# Email Confirmations And Notifications Readiness

Status: current
Last updated: 2026-06-05
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Risk: critical
Depends on: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Current execution status: production sender/reply/support inbox should be `hello@lotsoflovelyart.com`; `lotsoflovelyart.com` must be verified in Resend before `EMAIL_FROM` can use that domain; the latest email config/template updates still need `send-email` redeployment; final delivery proof remains.

## Decision

This workstream is unblocked from the Resend domain side. Sandbox Stripe proof already confirmed that the webhook can create order-linked `email_logs` rows with `status = 'sent'` for:

- `order-confirmation`
- `event-booking-confirmation`
- `new-order-admin`

That proves the event checkout email code path in sandbox. It does not yet prove production email operations, sender reputation, reminder scheduling, or waitlist notification readiness.

Current production-like log evidence from 2026-05-26 and 2026-05-27 shows `order-confirmation`, `event-booking-confirmation`, and `new-order-admin` attempts failing for non-owner recipients with Resend `403 validation_error`: Resend only allows test sends to the account owner address until a domain is verified and the `from` address uses that domain. Admin sends to the owner email succeeded, which confirms the API key/function path works for permitted recipients.

## Missing Before This Can Go Green

- Production `RESEND_API_KEY` must be confirmed in Supabase Edge Function secrets.
- Production sender domain `lotsoflovelyart.com` must be verified in Resend before changing `EMAIL_FROM`.
- `EMAIL_FROM` must be set in Supabase Edge Function secrets to `Lots of Lovely Art <hello@lotsoflovelyart.com>` only after `lotsoflovelyart.com` is verified.
- `EMAIL_REPLY_TO` should be set to the launch support inbox: `hello@lotsoflovelyart.com`.
- `SUPPORT_EMAIL` should be set to the customer support inbox rendered inside templates: `hello@lotsoflovelyart.com`.
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

Verify `lotsoflovelyart.com` in Resend, confirm the Supabase Edge Function secrets use `EMAIL_FROM="Lots of Lovely Art <hello@lotsoflovelyart.com>"`, `EMAIL_REPLY_TO=hello@lotsoflovelyart.com`, and `SUPPORT_EMAIL=hello@lotsoflovelyart.com`, redeploy `send-email` for the email config/template updates, then rerun a real checkout/email proof against the launch environment.

Continue the events launch with [Admin Booking Operations](./events-production-launch-epic.md#6-admin-booking-operations).

## Rollout Log

| Order | Step | Status | Evidence / notes |
| --- | --- | --- | --- |
| 1 | Verify Resend sending domain `lotsoflovelyart.com` | Pending | `lolacreativespace.com` was confirmed verified on 2026-06-05. Sender choice changed to `hello@lotsoflovelyart.com`, so `lotsoflovelyart.com` must be verified before production sends use this sender. |
| 2 | Align repository email defaults and setup docs to `hello@lotsoflovelyart.com` | Done | `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SUPPORT_EMAIL`, and template contact links use `hello@lotsoflovelyart.com`; app and checkout URLs remain `https://lolacreativespace.com`. |
| 3 | Run local syntax/build checks | Done | `bash -n scripts/set-supabase-secrets.sh` and `bash -n scripts/set-email-go-live-secrets.sh` passed; `npm run build` in `app/` passed on 2026-06-05. |
| 4 | Confirm sender/admin/support inboxes | In progress | Sender is `EMAIL_FROM="Lots of Lovely Art <hello@lotsoflovelyart.com>"`. Reply-to and rendered support contact should be `hello@lotsoflovelyart.com`. Confirm whether `ADMIN_EMAILS` should also be `hello@lotsoflovelyart.com` or a comma-separated admin list. |
| 5 | Set Supabase Edge Function email secrets | Done | Launch owner confirmed all required secrets were added manually in Supabase Dashboard on 2026-06-05. |
| 6 | Deploy `send-email` | Pending | Launch owner confirmed a previous `send-email` deployment on 2026-06-05. Redeploy is required after the reply/support fallback and template contact-link updates. |
| 7 | Deploy checkout/webhook functions if URL or Stripe settings change | Pending | Required for checkout cutover to `https://lolacreativespace.com`; optional for email-only fix. |
| 8 | Direct email proof to non-owner recipient | Pending | Proof helpers prepared at `scripts/proof-send-email.mjs` and `scripts/proof-email-templates.mjs`. Must produce `email_logs.status = sent`, Resend accepted/delivered status, and reply action addressed to `hello@lotsoflovelyart.com`. |
| 9 | Checkout email proof | Pending | Must prove customer order confirmation, customer event booking confirmation, and admin new-order email. |
| 10 | Decide event reminder and waitlist notification ownership | Pending | Schedule now or explicitly defer/manual with owner sign-off. |

## Email Proof Commands

Run these from the repo root after `send-email` has been deployed.

Core launch proof, covering the emails used by event checkout:

```bash
TEST_EMAIL=your-test-inbox@example.com EMAIL_TEST_SCOPE=core node scripts/proof-email-templates.mjs
```

Full registered-template proof, covering every template wired in `send-email`:

```bash
TEST_EMAIL=your-test-inbox@example.com EMAIL_TEST_SCOPE=all node scripts/proof-email-templates.mjs
```

The full proof sends 45 emails to the target inbox. Use a real inbox on an address you control, and check both Supabase `email_logs` and the Resend dashboard after the run.
