# Google Analytics Readiness

Status: current
Last updated: 2026-05-19
Parent checklist: [Events Pre-Launch Checklist](./events-pre-launch-checklist.md)
Risk: medium
Current execution status: pending implementation and production configuration.

## Current Code State

The current `app/` source search found admin analytics screens, but no Google Analytics or Google Tag Manager runtime wiring such as `gtag`, `dataLayer`, `G-...`, or `GTM-...`.

Legacy documentation references a Firebase measurement ID, but Firebase is not part of the target production platform. Do not treat the legacy Firebase analytics setup as sufficient for the new `app/` launch.

## Launch Decision Needed

Choose one implementation path:

- Direct GA4 `gtag.js`.
- Google Tag Manager with a GA4 tag.

The lower-friction path for the events launch is direct GA4 unless marketing needs GTM-managed tags before launch.

## Required Variables

| Variable | Purpose | Status |
| --- | --- | --- |
| `VITE_GA_MEASUREMENT_ID` | GA4 Measurement ID used by the Vue app. | Pending |
| `VITE_ENABLE_ANALYTICS` | Optional production-only guard to avoid sending analytics from local/dev builds. | Pending |
| `VITE_GTM_CONTAINER_ID` | Only needed if using Google Tag Manager instead of direct GA4. | Pending decision |

## Required Tracking

| Event | Where | Required data |
| --- | --- | --- |
| `page_view` | Vue Router after each route change. | Path, title, route name if available. |
| `view_item` | Event detail page. | Event slug, title, event ID, category, price. |
| `add_to_cart` | Event booking CTA/cart add. | Event ID, title, price, quantity, date. |
| `begin_checkout` | Checkout submit before Stripe session creation. | Cart value, item count, event IDs. |
| `purchase` | Order success page after `get-order-by-session` returns paid order. | Order number, total, currency, event items. |
| `join_waitlist` | Waitlist modal success. | Event ID, title, category, date. |

Do not send attendee names, customer email, phone number, notes, allergies, or full address to Google Analytics.

## Privacy And Consent Checks

- Confirm whether analytics requires an opt-in cookie/consent banner before launch.
- Confirm privacy policy copy mentions analytics usage.
- Confirm analytics is disabled until consent where required by the launch privacy decision.
- Confirm no personally identifiable information is included in GA event names, params, page titles, or URLs.

## Verification Checklist

- GA4 property exists and Measurement ID is known.
- Production env var is set in the app deployment environment.
- Analytics script is only enabled for production or explicitly allowed environments.
- SPA route changes create page views.
- Event detail, add-to-cart, begin-checkout, purchase, and waitlist events fire.
- GA4 DebugView or Realtime shows test traffic.
- Test booking/order success event does not include PII.
- Analytics state is documented in [Events Pre-Launch Checklist](./events-pre-launch-checklist.md).

## Acceptance Criteria

- GA4 is visible on the live production app without depending on Firebase.
- The booking funnel can be inspected from event view through purchase.
- Customer privacy constraints are met.
- Analytics can be disabled quickly by removing or blanking the production measurement ID.
