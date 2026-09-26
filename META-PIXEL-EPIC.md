# Epic: Meta Pixel

> **Prerequisite:** [COOKIE-CONSENT-BANNER-EPIC.md](./COOKIE-CONSENT-BANNER-EPIC.md).
> The Meta Pixel is a non-essential **marketing** cookie under UK law. It must load
> **only** through the consent gate that epic builds (`consentedTags.js`, behind the
> **marketing** toggle). Do not ship this before the gate exists, or the Pixel will
> fire without consent and the site will be non-compliant.
>
> **Companion:** [GOOGLE-ANALYTICS-EPIC.md](./GOOGLE-ANALYTICS-EPIC.md) (the
> analytics tag). The two are built the same way and share the SPA page-view
> mechanism below.

## Status (2026-09-26)

Code-complete and building: the admin controls (PX-2), the loader behind the gate
(PX-3), and SPA page views (PX-4) are done, and the Pixel cookie is in the policy
(PX-6). Remaining, and yours to do: create the Pixel and get its ID (PX-1), paste it
into admin Settings and switch the Pixel on, run the live QA (PX-7). PX-5 (conversion
events) is phase 2.

## Summary

Add the **Meta Pixel** so Facebook and Instagram advertising can be measured and
audiences retargeted. The Pixel sets a marketing cookie (`_fbp`), so it may run only
after the visitor turns the **Marketing** toggle on. As with GA, this is a
single-page Vue app, so a page-view must be sent manually on each route change; the
Pixel does not see in-app navigation on its own.

## Confirmed decisions

- **Admin-controlled, not env vars.** The Pixel ID and an on/off switch live in the
  existing admin **Site Settings** (`site_settings` table, `is_public: true`),
  editable from `app/src/views/admin/Settings.vue`. The front end reads them at
  runtime via `getPublicSettingsMap()` (`app/src/lib/cms.js`). No deploy needed to
  change or disable the Pixel. (The Pixel ID is not secret, so a public setting is
  fine.)
- **Loaded only via `consentedTags.js`** (from the banner epic) when **all** of: the
  admin switch is on, a Pixel ID is set, and `marketing === true`. No Pixel snippet
  in `app/index.html`.
- **The admin switch is not a consent override.** With the switch on but marketing
  consent absent, the Pixel still does not fire. Both must be true.
- **Manual `PageView` on route change**, hooked into the existing
  `router.afterEach` (`app/src/router/index.js:576`).
- **Advanced Matching (sending hashed email/phone) is OFF** at launch. It sends
  personal data to Meta and needs its own privacy and legal review before use.
  **Confidence: high** that it should stay off until reviewed.
- **Conversions API (server-side) is out of scope** for now; browser Pixel only.

## Current Repo State

- **No Pixel anywhere.** The only Facebook references are a footer link to the
  Facebook page (`app/src/components/Footer.vue:213`) and an admin social-URL field
  (`app/src/views/admin/Settings.vue`). Neither is a tracker.
- **The home for the loader** is `app/src/lib/consentedTags.js`, created in the
  banner epic (Ticket 8). This epic fills in the Meta branch.
- **Admin settings mechanism already exists:** `site_settings` table with
  `setting_key`, `setting_group`, `value_json`, `is_public`; managed by
  `getAllSiteSettings` / `upsertSiteSettings` and read publicly by
  `getPublicSettingsMap` (all in `app/src/lib/cms.js`). The admin form is
  `app/src/views/admin/Settings.vue`.
- **Route hook already exists:** `router.afterEach` at `app/src/router/index.js:576`.
- **Cart action for AddToCart:** `addItem()` in `app/src/stores/cart.js:47`.
- **Checkout:** `app/src/views/Checkout.vue`; authoritative purchase is the Stripe
  webhook (`supabase/functions/stripe-webhook/index.ts`).

---

## Tickets

### PX-1 — Create the Pixel (external, Meta account) ⬜ TODO (you)

**Goal:** a Meta Pixel and its ID.

- In Meta Events Manager, create or locate the Pixel and copy the **Pixel ID**.
- Accept Meta's terms. Confirm the business/ad account is linked.

**Acceptance criteria:**
- A Pixel ID exists, ready to paste into the admin (PX-2).

---

### PX-2 — Admin control in Site Settings ✅ DONE

**Goal:** the admin turns the Pixel on/off and sets the Pixel ID from the backend,
no deploy or developer needed.

- Add the Pixel controls to the **Analytics and Marketing** section of
  `app/src/views/admin/Settings.vue` (the same section GA-2 creates): an **enabled**
  toggle and a **Pixel ID** text field.
- Store as a public site setting, key `marketing_meta_pixel`, `setting_group`
  `marketing`, `is_public: true`, `value_json: { enabled: boolean, pixel_id: string }`
  (via `upsertSiteSettings`).
- Show a hint that changes take effect on the visitor's next page load.
- The consent gate reads it through `getPublicSettingsMap()`.

**Acceptance criteria:**
- Admin can set, change, and clear the Pixel ID and toggle the Pixel on/off.
- With the switch off or the ID blank, the Pixel never loads, even with marketing
  consent.
- No code deploy is needed to change any of this.

---

### PX-3 — Pixel loader behind marketing consent ✅ DONE

**Goal:** the Pixel loads only when `marketing === true`, live-reacting to changes.

- In `app/src/lib/consentedTags.js`, add the Meta branch: inject the Pixel base code
  and fire the initial `PageView` **only** when all are true: the admin
  `marketing_meta_pixel` switch is on, a Pixel ID is set, and the consent store
  reports `marketing === true`. Read the admin values via `getPublicSettingsMap()`.
- React to `consent-updated`: load on later opt-in; do not load on next visit after
  opt-out.

**Acceptance criteria:**
- No `_fbp` cookie and no request to `connect.facebook.net` before marketing
  consent.
- After marketing consent, the Pixel initialises and fires one `PageView`.
- After withdrawing marketing consent, the Pixel does not load on the next visit.

---

### PX-4 — Page views on route change (SPA) ✅ DONE

**Goal:** the Pixel records each in-app navigation.

- In `router.afterEach` (`app/src/router/index.js:576`), send `fbq('track',
  'PageView')` on navigation, **only if** the Pixel is loaded. No-op otherwise.

**Acceptance criteria:**
- With consent, each navigation sends one PageView (visible in Meta Test Events).
- With no consent, navigation sends nothing.

---

### PX-5 (phase 2, optional) — Standard conversion events ⬜ TODO (phase 2)

**Goal:** measure ad-driven actions.

- Fire Meta standard events where they already happen:
  - `AddToCart` on `cart.js:47` (`addItem`).
  - `InitiateCheckout` at checkout entry (`app/src/views/Checkout.vue`).
  - `Purchase` on order confirmation, with `value` and `currency: 'GBP'`, once per
    confirmed order (authoritative record stays the Stripe webhook).
- All gated the same way (no-op without marketing consent).

**Acceptance criteria:**
- Each event fires once, correct value and GBP currency, only after consent.
- No Purchase on a failed or abandoned checkout.

---

### PX-6 — Cookie inventory and policy update ✅ DONE

**Goal:** the cookie policy tells the truth about the Pixel.

- Add `_fbp` (and any other Pixel cookie) to the banner epic's cookie inventory
  (Ticket 1) and the cookie policy page (Ticket 7): purpose (advertising
  measurement), provider (Meta), duration.

**Acceptance criteria:**
- The published cookie policy lists the Pixel cookies before the Pixel goes live.

---

### PX-7 — QA and go-live ⬜ TODO (live QA)

**Acceptance criteria (fresh private-window test, using Meta Test Events):**
- Reject all, or ignore the banner: no Pixel request, no `_fbp` cookie.
- Accept marketing: Pixel loads, PageView fires, navigation sends more.
- Withdraw marketing via footer Cookie settings: Pixel stops on next visit.
- Admin switch off (or ID blank): Pixel does not load even with marketing consent.
- Admin changes the Pixel ID: the new ID is used on the next page load, no deploy.

## Not in scope

- Conversions API / server-side events.
- Advanced Matching (hashed personal data) until separately reviewed.

## Suggested build order

PX-1 → PX-2 → PX-3 → PX-4 → PX-6 → PX-7, then PX-5 as a phase 2. PX-3 depends on the
banner epic's Ticket 8 loader existing.
