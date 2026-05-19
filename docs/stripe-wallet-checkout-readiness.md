# Stripe Wallet Checkout Readiness

**Last checked:** 2026-05-19

This project uses Stripe-hosted Checkout for one-time cart purchases and subscription purchases. Apple Pay and Google Pay are wallet options inside Stripe Checkout, not custom in-app payment buttons.

## Code Readiness

- `supabase/functions/create-checkout-session/index.ts` creates a hosted Checkout Session with `mode: 'payment'`.
- `supabase/functions/create-subscription-checkout-session/index.ts` creates a hosted Checkout Session with `mode: 'subscription'`.
- Neither Checkout Session sets `payment_method_types`, so Stripe can dynamically choose eligible payment methods from the Stripe Dashboard configuration.
- Neither Checkout Session sets per-session payment method exclusions.
- The default app return URL is HTTPS: `https://lola-as-one.netlify.app`.

Run this source-level check before deploying checkout changes:

```sh
npm run audit:stripe-wallets
```

## Stripe Account Requirements

Wallet visibility still depends on Stripe account and customer-device eligibility:

- Enable Apple Pay and Google Pay in Stripe Dashboard payment method settings.
- Register/verify the production domain used for Checkout wallet payments in Stripe payment method domains.
- Serve the app over HTTPS in production and in any wallet test environment.
- Keep card payments enabled, because Apple Pay and Google Pay are card-wallet payment methods in Checkout.
- Test in the same Stripe mode you plan to launch with. Test-mode wallet readiness does not prove live-mode Dashboard settings.

## Manual Validation Matrix

Use a real Stripe Checkout Session created by the deployed Edge Function.

| Wallet | Device/browser | Expected result |
| --- | --- | --- |
| Apple Pay | Safari on a supported iPhone, iPad, or Mac with an active Apple Pay card | Apple Pay button appears on Stripe Checkout |
| Google Pay | Chrome 61+ with an active Google Pay card | Google Pay button appears on Stripe Checkout |
| Card fallback | Any supported browser | Standard card payment remains available |

If a wallet button does not appear, check Dashboard wallet enablement, live/test mode, domain verification, HTTPS, customer country/account restrictions, and whether the test device has a valid wallet card.
