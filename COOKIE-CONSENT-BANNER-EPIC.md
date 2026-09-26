# Epic: Cookie Consent Banner (UK GDPR + PECR compliant)

> **This is the foundation epic. Build it first, or at least land Ticket 8 (the
> consent gate) before either tag goes live.**
>
> **Companion epics** (the two tags that plug into this one's gate):
> - [GOOGLE-ANALYTICS-EPIC.md](./GOOGLE-ANALYTICS-EPIC.md) — analytics category.
> - [META-PIXEL-EPIC.md](./META-PIXEL-EPIC.md) — marketing category.
>
> All three are being built alongside each other. The dependency runs one way: the
> tags depend on the gate here, not the reverse.

## Status (2026-09-26)

Code-complete and building. Tickets 1 to 8 are done in code. Remaining: run the
three migrations against the database, do the live private-window QA, and Ticket 9
(Google Fonts) if wanted. See per-ticket markers below.

## Summary

The site currently sets **only essential cookies** (Supabase login session, Stripe
checkout). It runs **no third-party analytics or marketing trackers today**. Two are
planned, each in its own epic: a **Meta Pixel** (marketing) and **Google Analytics**
(analytics).

Under UK law both a Meta Pixel and Google Analytics are non-essential cookies (one
marketing, one analytics). Neither may fire until the visitor has actively agreed. This epic builds a **custom, first-party
consent banner** in the existing Vue app (no plugin, no third-party CMP) that:

1. Blocks all non-essential tags until consent is given.
2. Offers Accept and Reject with equal ease.
3. Lets the visitor choose by category.
4. Defaults everything non-essential to **off** (no pre-ticked boxes).
5. Leaves essential cookies untouched and un-toggleable.
6. Lets the visitor change or withdraw consent at any time.
7. Links to a plain-language cookie policy listing every cookie.
8. Stores a dated record of each consent decision as proof.

Those eight points are the ICO's requirements. The build is designed so the Meta
Pixel can be switched on later behind the marketing toggle with no rework.

## Why custom, and the honest trade-off

**Confidence: high.** A hand-built banner is reasonable here **because the scope is
tiny**: today there are zero non-essential tags to gate, and the near-term plan is a
single marketing tag (Meta Pixel). The project already has Supabase, so storing
consent records (point 8) is a small table, not new infrastructure.

The trade-off to accept knowingly: a hosted consent tool (Cookiebot, CookieYes and
similar) auto-scans for new cookies, keeps consent logs, and updates itself as the
law changes. With a custom build, **that maintenance is on us**. Every time a new
third-party tag is added later (a new pixel, a chat widget, a video embed that sets
cookies), someone must remember to route it through the consent gate built here and
add it to the cookie policy. Ticket 8 makes that a written rule.

If the shop later adds several trackers, revisit whether a hosted tool is cheaper
than the upkeep. For one pixel, custom is fine.

## Confirmed decisions

- **Custom first-party build** in the Vue app. No WordPress plugin, no hosted CMP.
- **Three consent categories:**
  - **Necessary** (always on, cannot be switched off): Supabase session, Stripe
    checkout, and the consent-preference cookie itself.
  - **Analytics** (off by default): Google Analytics, once added (separate epic).
  - **Marketing** (off by default): the Meta Pixel, once added (separate epic).
- **UK law is the standard:** UK GDPR + PECR, per current ICO guidance.
- **No tag fires before consent.** The Meta Pixel loads only after the visitor
  turns the Marketing toggle on and saves.
- **Consent records are stored** in Supabase as proof.
- **Google Fonts** is a separate, lower-priority item (it is not a cookie but does
  send IP to Google). Tracked as an optional ticket, not part of the banner.

## Current Repo State

- **App entry / mount:** `app/src/App.vue`, bootstrapped in `app/src/main.js`. The
  banner mounts once, app-wide, in `App.vue` so it shows on every route.
- **Router:** `app/src/router/index.js`. A new `/cookie-policy` route is added here
  (or created as a content-managed page, matching the existing pattern).
- **Footer legal links:** `app/src/components/Footer.vue` already lists
  `/privacy-policy` and `/terms-and-conditions` (content-managed, `itemType: 'page'`).
  A **Cookie Policy** link and a **Cookie settings** action are added alongside.
- **Essential cookie/storage sources (do not gate):**
  - `app/src/lib/supabase.js` (auth session, stored by `@supabase/supabase-js`).
  - Stripe on the checkout flow (`app/src/views/Checkout.vue`).
- **No analytics/marketing tags** anywhere in `app/src`, `app/index.html`, or env
  files. `app/index.html` head contains only icons, meta tags, and Google Fonts.
- **Migrations pattern:** dated files in `supabase/migrations/` (e.g.
  `20260921_*.sql`). The consent-records table follows this.

---

## Tickets

### Ticket 1 — Cookie inventory and policy content ✅ DONE
<!-- Inventory captured as the seeded cookie policy content in
     supabase/migrations/20260926_seed_cookie_policy_page.sql (Necessary: Supabase
     session, Stripe checkout, consent cookie; Analytics: _ga/_ga_*; Marketing: _fbp). -->


**Goal:** know exactly what the site sets, so the banner and policy are truthful.

- List every cookie and browser-storage item the site sets today, by category:
  name, who sets it (Supabase / Stripe / us), purpose in one plain sentence, and
  how long it lasts.
- Add the planned tags: **Google Analytics** under Analytics (GA4 sets `_ga` and
  `_ga_*` cookies), and the **Meta Pixel** under Marketing (`_fbp`). Mark both
  "loads only after consent".
- Draft the cookie policy text from this list (used in Ticket 7).

**Acceptance criteria:**
- A written table exists covering all current cookies plus the planned Pixel.
- Every row has a purpose a non-technical reader understands.

---

### Ticket 2 — Consent store (the single source of truth) ✅ DONE
<!-- Built as stores/consent.js (Pinia, matching repo convention) plus
     lib/cookieConsent.js for the cookie, visitor id, and policy version. -->


**Goal:** one place that records and reports the visitor's current choices.

- Create a composable, `app/src/composables/useConsent.js`, exposing:
  - reactive state `{ necessary: true, analytics: false, marketing: false }`,
  - `hasDecided` (has the visitor ever chosen?),
  - `acceptAll()`, `rejectAll()`, `save(choices)`, `openPreferences()`.
- Persist the choice in a **first-party cookie** named `lola_cookie_consent`,
  holding JSON: `{ version, timestamp, analytics, marketing }`. Use a cookie (not
  just localStorage) so the choice survives and is standard. Expiry: 6 months, then
  re-ask.
- Include a **policy version** constant. Bumping it re-prompts everyone (used when
  the cookie list materially changes).
- On save, emit a `consent-updated` event (or expose the reactive state) so tag
  loaders react immediately without a page reload.
- Default state before any decision: everything non-essential **false**.

**Acceptance criteria:**
- Non-essential categories are `false` until the visitor explicitly accepts.
- Reloading the page keeps the saved choice.
- Changing a choice updates state live, no refresh needed.

---

### Ticket 3 — Consent records table (proof) ✅ DONE (migration needs applying)
<!-- supabase/migrations/20260926_create_cookie_consents.sql. Written to the table
     by recordConsent() in lib/cookieConsent.js. Migration not yet run on the DB. -->


**Goal:** satisfy point 8 (be able to prove who consented to what, and when).

- New migration `supabase/migrations/<date>_create_cookie_consents.sql`:
  table `cookie_consents` with: `id`, `created_at`, `analytics` (bool),
  `marketing` (bool), `policy_version` (text), `user_agent` (text), and an
  **anonymous visitor id** (a random id generated client-side, not the person's
  name or email). Do not store IP unless legal advice says to.
- Insert one row on every save / accept / reject via `app/src/lib/supabase.js`.
- Row-level security: inserts allowed for anonymous visitors; reads restricted to
  admin only.

**Acceptance criteria:**
- Each Accept, Reject, or Save writes exactly one dated row.
- No personal identity is stored in the row.
- A normal visitor cannot read the table.

---

### Ticket 4 — The banner (first-visit prompt) ✅ DONE
<!-- components/cookies/CookieBanner.vue, mounted site-wide in App.vue. -->


**Goal:** the first-screen choice, with Reject as easy as Accept (point 2).

- New component `app/src/components/cookies/CookieBanner.vue`, mounted once in
  `app/src/App.vue`.
- Shows only when `hasDecided` is false.
- Three actions of **equal visual weight** (same size, same prominence, same row):
  - **Accept all**
  - **Reject all**
  - **Manage preferences** (opens Ticket 5)
- Suggested copy (plain language, edit to taste):
  > We use cookies to run this site and, if you agree, to measure our advertising.
  > You can accept them, reject them, or choose which ones. Necessary cookies keep
  > the site working and are always on.
- Does **not** block the whole page (no forced action beyond the buttons). No
  cookie wall.
- Keyboard accessible and readable on mobile.

**Acceptance criteria:**
- Accept and Reject are visually equal; Reject is not hidden, greyed, or smaller.
- Banner disappears after any choice and does not reappear until expiry or a
  version bump.
- Works at phone width with a 16px side gutter and no horizontal scroll.

---

### Ticket 5 — Preferences panel (choose by category) ✅ DONE
<!-- components/cookies/CookiePreferences.vue. Local copy starts off; saves on Save. -->


**Goal:** granular control, no pre-ticked non-essential boxes (points 3 and 4).

- New component `app/src/components/cookies/CookiePreferences.vue`.
- One toggle per category:
  - **Necessary:** shown, locked on, labelled "always on".
  - **Analytics:** off by default.
  - **Marketing:** off by default.
- Each category has a one-line plain description and a link to the full cookie
  policy.
- A single **Save preferences** button writes the exact toggle states.
- Opens from the banner and from the footer link (Ticket 6).

**Acceptance criteria:**
- Non-essential toggles start off every time the panel is first opened.
- Saving records precisely what the visitor set, nothing assumed on.
- Necessary cannot be turned off.

---

### Ticket 6 — Re-open and withdraw path (footer) ✅ DONE
<!-- "Cookie settings" button + "Cookie Policy" link added to Footer.vue Information
     section. Withdrawing marketing stops the Pixel on the next visit and stops
     page-view sending live (trackPageView guards on current consent). -->


**Goal:** consent can be changed or withdrawn anytime (point 6).

- Add a **Cookie settings** link in `app/src/components/Footer.vue`, next to
  Privacy Policy and Terms. It calls `openPreferences()`.
- Withdrawing marketing consent must **stop the Meta Pixel from firing on the next
  page load** and ideally clear its cookies where possible.

**Acceptance criteria:**
- The link appears on every page and reopens the preferences panel.
- Turning Marketing off and saving prevents the Pixel loading thereafter.

---

### Ticket 7 — Cookie policy page ✅ DONE (migration needs applying)
<!-- Route /cookie-policy (alias /cookies) via CmsInfoPage, page seeded by
     20260926_seed_cookie_policy_page.sql, editable in admin Information Pages.
     Linked from banner, preferences, and footer. Migration not yet run on the DB. -->


**Goal:** the plain-language policy the banner and toggles link to (point 7).

- Create `/cookie-policy`, either as a route in `app/src/router/index.js` or as a
  content-managed page matching the existing `/privacy-policy` pattern (preferred,
  so non-developers can edit it).
- Content from Ticket 1: the cookie table, what each does, who sets it, how long it
  lasts, and how to change consent.
- Link it from the footer and from the Privacy Policy.

**Acceptance criteria:**
- The page lists every cookie the site sets, in plain English.
- It explains how to change or withdraw consent.
- Linked from the banner, the preferences panel, and the footer.

---

### Ticket 8 — Consent gate for tags (and the rule for future tags) ✅ DONE
<!-- lib/consentedTags.js, initialised from main.js, page views via router.afterEach.
     Reads consent store AND admin config. The "route new tags through here" rule is
     the module's header comment. -->


**Goal:** non-essential tags load **only** after matching consent, forever.

- Create a single tag-loader, `app/src/lib/consentedTags.js`, that reads **both**
  the consent store and the admin's tag config (public site settings, via
  `getPublicSettingsMap()` in `app/src/lib/cms.js`), and:
  - loads **Google Analytics (GA4)** only if the admin `analytics_ga` switch is on,
    a Measurement ID is set, **and** `analytics === true`,
  - loads the **Meta Pixel** only if the admin `marketing_meta_pixel` switch is on,
    a Pixel ID is set, **and** `marketing === true`,
  - reacts to `consent-updated` so a change takes effect without a full reload
    where feasible, and does nothing on load if consent is absent.
- The admin switches (built in the GA and Pixel epics) are an on/off master for each
  tag; they are **not** a consent override. A tag needs admin-on **and** consent.
- Both snippets (GA and the Pixel) live **here, behind the gate**, never hardcoded
  in `app/index.html`.
- Add a short **CONTRIBUTING note / code comment**: any new third-party tag must be
  added through `consentedTags.js` and listed in the cookie policy. This is the
  rule that keeps a custom build compliant over time.

**Cross-epic dependency (Google Analytics):** the GA epic must add Google Analytics
**only through `consentedTags.js` under the analytics check**, not with a hardcoded
`gtag` snippet in `index.html`. Two ways to do that, pick one and note it in the GA
epic:
- **Simplest and fully compliant:** do not load GA at all until analytics consent,
  then load it. This is the approach this epic assumes.
- **Google Consent Mode v2:** load GA up front but in a "denied" state so it sets no
  cookies and sends only cookieless signals until consent, then upgrade to "granted"
  on the `consent-updated` event. More moving parts; only worth it if the GA epic
  needs Google's consent-aware modelling. Either way the trigger is the same
  analytics toggle built here.

**Acceptance criteria:**
- With no consent, neither Google Analytics nor the Pixel appears in the network
  requests, and no `_ga`, `_ga_*`, or `_fbp` cookie is set.
- With analytics consent, GA loads; with marketing consent, the Pixel loads;
  consenting to one does not load the other.
- After withdrawing a category, its tag does not load on the next visit.

---

### Ticket 9 (optional, lower priority) — Google Fonts ⬜ TODO (optional)

**Goal:** reduce data sent to Google before consent.

- Google Fonts in `app/index.html` sends visitor IP to Google. It is not a cookie,
  so it is not strictly a PECR consent item, but self-hosting the fonts removes the
  transfer entirely.
- Option: download the Source Sans Pro files and serve them from the site.

**Acceptance criteria:**
- Fonts render identically with no request to `fonts.googleapis.com` /
  `fonts.gstatic.com`.

---

## Compliance check (map to the ICO's eight points)

| # | Requirement | Delivered by |
|---|---|---|
| 1 | Nothing non-essential fires before consent | Tickets 2, 8 |
| 2 | Reject as easy as Accept | Ticket 4 |
| 3 | Choice by category | Ticket 5 |
| 4 | Nothing pre-ticked | Tickets 2, 5 |
| 5 | Essential cookies exempt and locked on | Tickets 2, 5 |
| 6 | Consent can be withdrawn anytime | Ticket 6, 8 |
| 7 | Plain-language cookie policy | Tickets 1, 7 |
| 8 | Record of consent kept | Ticket 3 |

## Definition of done

- All eight points above pass a manual test in a fresh browser (private window):
  no analytics or marketing tag before consent, Reject equal to Accept, toggles
  start off, choice persists, withdrawal works, policy reachable, a consent row
  written each time.
- Google Analytics and the Meta Pixel can each be added later by placing their
  snippet only inside `consentedTags.js` behind the matching check (analytics /
  marketing), with no other change.

## Not in scope

- A hosted consent management platform (revisit if many trackers are added).
- Cookie handling for any tag not yet planned.
- Legal sign-off: this build follows current ICO guidance, but a solicitor should
  confirm the final wording. **Confidence: high on the mechanism, and this is not
  legal advice.**

## Suggested build order

Ticket 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8, then 9 if wanted. Tickets 4 and 5 (the UI)
can be built in parallel with 2 and 3 (the store and records) once the category
shape from the decisions above is fixed.
