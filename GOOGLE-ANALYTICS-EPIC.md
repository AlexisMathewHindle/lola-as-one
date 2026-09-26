# Epic: Google Analytics (GA4)

> **Prerequisite:** [COOKIE-CONSENT-BANNER-EPIC.md](./COOKIE-CONSENT-BANNER-EPIC.md).
> Google Analytics is a non-essential **analytics** cookie under UK law. It must
> load **only** through the consent gate that epic builds (`consentedTags.js`,
> behind the **analytics** toggle). Do not ship this before the gate exists, or GA
> will fire without consent and the site will be non-compliant.
>
> **Companion:** [META-PIXEL-EPIC.md](./META-PIXEL-EPIC.md) (the marketing tag).
> The two are built the same way and share the SPA page-view mechanism below.

## Status (2026-09-26)

Code-complete and building: the admin controls (GA-2), the loader behind the gate
(GA-3), and SPA page views (GA-4) are done, and the GA cookies are in the policy
(GA-6). Remaining, and yours to do: create the GA4 property and get the Measurement
ID (GA-1), paste it into admin Settings and switch GA on, run the live QA (GA-7). GA-5
(ecommerce events) is phase 2.

## Summary

Add **Google Analytics 4 (GA4)** to measure how people use the site (pages viewed,
journeys, and later key actions like add-to-cart and purchase). GA4 sets analytics
cookies (`_ga`, `_ga_*`), so it may run only after the visitor turns the **Analytics**
toggle on. Because this is a single-page Vue app, GA will **not** see most page views
on its own; navigation changes the URL without a full page reload, so page views must
be sent manually on each route change.

## Confirmed decisions

- **GA4**, not the retired Universal Analytics.
- **Admin-controlled, not env vars.** The Measurement ID and an on/off switch live
  in the existing admin **Site Settings** (`site_settings` table, `is_public: true`),
  editable from `app/src/views/admin/Settings.vue`. The front end reads them at
  runtime via `getPublicSettingsMap()` (`app/src/lib/cms.js`). No deploy needed to
  change or disable GA. (The Measurement ID is not secret, so a public setting is
  fine.)
- **Loaded only via `consentedTags.js`** (from the banner epic) when **all** of:
  the admin switch is on, a Measurement ID is set, and `analytics === true`. No
  `gtag` snippet in `app/index.html`.
- **The admin switch is not a consent override.** With the switch on but analytics
  consent absent, GA still does not fire. Both must be true.
- **Manual page views on route change**, hooked into the existing
  `router.afterEach` (`app/src/router/index.js:576`).
- **Google Signals left OFF** at launch. Signals adds advertising/cross-device
  cookies, which would make GA a **marketing** tag, not analytics. If Signals is
  ever turned on, GA moves under the Marketing toggle and the cookie policy is
  updated. **Confidence: high.**
- **UK data handling:** GA4 does not log full IP addresses, and Google's data
  processing terms must be accepted in the GA admin. Set a sensible data-retention
  period (for example 14 months).

## Current Repo State

- **No GA anywhere.** No `gtag`, no GTM, no measurement ID in code or env.
- **The home for the loader** is `app/src/lib/consentedTags.js`, created in the
  banner epic (Ticket 8). This epic fills in the GA branch.
- **Admin settings mechanism already exists:** `site_settings` table with
  `setting_key`, `setting_group`, `value_json`, `is_public`; managed by
  `getAllSiteSettings` / `upsertSiteSettings` and read publicly by
  `getPublicSettingsMap` (all in `app/src/lib/cms.js`). The admin form is
  `app/src/views/admin/Settings.vue` (it already stores JSON values, e.g.
  `social_links`).
- **Route hook already exists:** `router.afterEach((to) => { ... })` at
  `app/src/router/index.js:576`. Page-view sends attach here.
- **Cart action for a future add-to-cart event:** `addItem()` in
  `app/src/stores/cart.js:47`, called from the shop, workshops, boxes, and
  subscription views.

---

## Tickets

### GA-1 — Create the GA4 property (external, Google account) ⬜ TODO (you)

**Goal:** a GA4 property and its Measurement ID, configured for UK use.

- Create (or locate) the GA4 property in Google Analytics admin.
- Copy the **Measurement ID** (format `G-XXXXXXX`).
- Accept Google's **data processing terms**.
- Set **data retention** (for example 14 months).
- Confirm **Google Signals is off**.

**Acceptance criteria:**
- A Measurement ID exists, ready to paste into the admin (GA-2).
- Data processing terms accepted; Signals off; retention set.

---

### GA-2 — Admin control in Site Settings ✅ DONE

**Goal:** the admin turns GA on/off and sets the Measurement ID from the backend,
no deploy or developer needed.

- Add an **Analytics and Marketing** section to `app/src/views/admin/Settings.vue`
  with, for GA: an **enabled** toggle and a **Measurement ID** text field.
- Store as a public site setting, key `analytics_ga`, `setting_group` `analytics`,
  `is_public: true`, `value_json: { enabled: boolean, measurement_id: string }`
  (via `upsertSiteSettings`).
- Validate the ID format lightly (starts with `G-`); show a hint that changes take
  effect on the visitor's next page load.
- The consent gate reads it through `getPublicSettingsMap()`.

**Acceptance criteria:**
- Admin can set, change, and clear the Measurement ID and toggle GA on/off.
- With the switch off or the ID blank, GA never loads, even with analytics consent.
- No code deploy is needed to change any of this.

---

### GA-3 — GA loader behind analytics consent ✅ DONE

**Goal:** GA loads only when `analytics === true`, live-reacting to changes.

- In `app/src/lib/consentedTags.js`, add the GA4 branch: inject the `gtag.js`
  script and initialise it **only** when all are true: the admin `analytics_ga`
  switch is on, a Measurement ID is set, and the consent store reports
  `analytics === true`. Read the admin values via `getPublicSettingsMap()`.
- React to the banner's `consent-updated` event: if analytics is later turned on,
  load GA then; if turned off, do not load it on the next visit.
- Choose the loading model (per the banner epic's note) and record it here:
  - **Simplest:** do nothing until consent, then load. (Recommended for launch.)
  - **Consent Mode v2:** load `gtag` with `analytics_storage: denied` up front,
    upgrade to `granted` on consent. Only if Google's consent modelling is wanted.

**Acceptance criteria:**
- No `_ga` / `_ga_*` cookie and no request to Google before analytics consent.
- After analytics consent, GA initialises.
- After withdrawing analytics consent, GA does not load on the next visit.

---

### GA-4 — Page views on route change (SPA) ✅ DONE

**Goal:** GA records each in-app navigation, not just the first load.

- In `router.afterEach` (`app/src/router/index.js:576`), send a GA `page_view`
  event with the new path and title, **only if GA is loaded** (analytics consent
  given). Guard it so it is a no-op when GA is absent.

**Acceptance criteria:**
- With consent, moving between pages produces one page view each in GA real-time.
- With no consent, navigation sends nothing.
- No duplicate first-load page view.

---

### GA-5 (phase 2, optional) — Key ecommerce events ⬜ TODO (phase 2)

**Goal:** measure the funnel, not just page views.

- Send GA4 recommended events where they already happen in code:
  - `add_to_cart` on `cart.js:47` (`addItem`).
  - `begin_checkout` at the checkout entry (`app/src/views/Checkout.vue`).
  - `purchase` on the order-confirmation view, with value and `currency: 'GBP'`.
    Note: the **authoritative** purchase record is the Stripe webhook
    (`supabase/functions/stripe-webhook/index.ts`); the client event is for GA
    measurement only and should fire once per confirmed order.
- All of these are gated the same way (no-op without analytics consent).

**Acceptance criteria:**
- Each event fires once, with correct value and GBP currency, only after consent.
- No purchase event fires on a failed or abandoned checkout.

---

### GA-6 — Cookie inventory and policy update ✅ DONE

**Goal:** the cookie policy tells the truth about GA.

- Add `_ga` and `_ga_*` to the banner epic's cookie inventory (Ticket 1) and the
  cookie policy page (Ticket 7): purpose (measure site usage), provider (Google),
  duration.

**Acceptance criteria:**
- The published cookie policy lists the GA cookies before GA goes live.

---

### GA-7 — QA and go-live ⬜ TODO (live QA)

**Acceptance criteria (fresh private-window test):**
- Reject all, or ignore the banner: no GA request, no `_ga` cookie.
- Accept analytics: GA loads, real-time shows the visit, navigation sends page
  views.
- Withdraw analytics via footer Cookie settings: GA stops on next visit.
- Admin switch off (or ID blank): GA does not load even with analytics consent.
- Admin changes the Measurement ID: the new ID is used on the next page load, no
  deploy.

## Not in scope

- Server-side GA / Measurement Protocol.
- Google Tag Manager (this is direct gtag.js).
- Google Signals and cross-device advertising features (would reclassify GA as
  marketing).

## Suggested build order

GA-1 → GA-2 → GA-3 → GA-4 → GA-6 → GA-7, then GA-5 as a phase 2. GA-3 depends on
the banner epic's Ticket 8 loader existing.
