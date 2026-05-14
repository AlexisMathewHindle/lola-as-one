# Events Data And CMS Readiness Fix Log

Status: current
Last updated: 2026-05-14
Parent workstream: [Events Data And CMS Readiness](./events-data-cms-readiness.md)
Evidence pack: [Events Data And CMS Readiness Evidence](./events-data-cms-readiness-evidence.md)

## 2026-05-13 Production Data Fixes

Fix method:

- Dry-run script: `node scripts/fix-events-data-readiness-blockers.mjs`
- Apply script: `APPLY_FIXES=true node scripts/fix-events-data-readiness-blockers.mjs`
- Verification script: `node scripts/audit-events-data-readiness.mjs`

Applied fixes:

| Area | Record | Before | After |
|------|--------|--------|-------|
| Event category | `fri-lo-vases-of-flowers` | No `category_id`; no category image fallback | Set category to `little-ones-fri-2-4` |
| Capacity reconciliation | `women-in-art-thurs-4-8` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `street-art-thurs-4-8` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `friendship-in-art-thurs-4-8` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `black-artists-thurs-4-8` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `naive-art-and-the-jungle-thurs-4-8` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `modern-sculpture-thurs-4-8` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `surrealism-and-lobster-telephones-thus-4-8` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `ht_os_tues930` | `current_bookings = 0`, `spaces_booked = 4` | `current_bookings = 2`, `spaces_booked = 2` |

Verification result after fixes:

- Future event rows: 118.
- Published future launch candidates: 118.
- P0 blockers: 0.
- Required fields: passed.
- Missing capacity rows: passed.
- Capacity reconciliation: passed.
- Duplicate and suspicious public records: passed.
- Category layout audit: passed.
- Storage and image checks: passed.

## 2026-05-14 CMS Policy Page And Capacity Fixes

Fix method:

- CMS dry-run script: `node scripts/upsert-cms-policy-pages.mjs`
- CMS apply script: `APPLY_CMS_POLICY_PAGES=true node scripts/upsert-cms-policy-pages.mjs`
- Capacity dry-run script: `AUDIT_DATE=2026-05-14 node scripts/fix-events-data-readiness-blockers.mjs`
- Capacity apply script: `AUDIT_DATE=2026-05-14 APPLY_FIXES=true node scripts/fix-events-data-readiness-blockers.mjs`
- Verification script: `AUDIT_DATE=2026-05-14 node scripts/audit-events-data-readiness.mjs`

Applied CMS fixes:

| Area | Record | Result |
|------|--------|--------|
| App route | `/faqs` | Added Vue route backed by `CmsInfoPage.vue` and CMS `page_key = 'faqs'` |
| App route | `/privacy-policy` | Added Vue route backed by `CmsInfoPage.vue` and CMS `page_key = 'privacy-policy'` |
| App route | `/terms-and-conditions` | Added Vue route backed by `CmsInfoPage.vue` and CMS `page_key = 'terms-and-conditions'` |
| CMS registry | `site_pages` | Published all three policy/info pages in production Supabase |
| CMS content | `page_sections` | Added one enabled `rich_text` section for each policy/info page |
| Navigation | `footer_secondary` | Added FAQs, Privacy Policy, and Terms and Conditions links |
| Checkout | `app/src/views/Checkout.vue` | Added Terms, Privacy, and FAQs links before Stripe handoff |

Applied capacity fixes:

| Area | Record | Before | After |
|------|--------|--------|-------|
| Capacity reconciliation | `su01_sat01-exploring-cyanotype-and-sun-printed-flowers` | `current_bookings = 0`, `spaces_booked = 2` | `current_bookings = 1`, `spaces_booked = 1` |
| Capacity reconciliation | `502SSW-open-studio-fri` | `current_bookings = 0`, `spaces_booked = 4` | `current_bookings = 2`, `spaces_booked = 2` |

Verification result after fixes:

- Audit date: 2026-05-14.
- Future event rows: 117.
- Published future launch candidates: 117.
- P0 blockers: 0.
- P1 blockers: 0.
- CMS policy links: passed with 0 missing paths, 0 unpublished paths, and 0 CMS pages without enabled sections.
- Required fields, capacity rows, capacity reconciliation, duplicate/stale records, category layouts, storage, and image checks: passed.

Follow-up note:

- The seeded policy/FAQ copy is CMS-managed data. Business/legal approval of final wording should still be captured before bookings open.

## 2026-05-14 SQL/RPC Verification And Hardening

Verification method:

- Direct SQL verifier: `AUDIT_DATE=2026-05-14 SQL_VERIFICATION_METHOD=pg node scripts/verify-events-sql-rpc-readiness.mjs`
- Apply script: `SQL_FILE=supabase/migrations/20260514_harden_event_capacity_rpcs.sql APPLY_SQL=true node scripts/apply-production-sql-file.mjs`
- Evidence: [Events SQL/RPC Verification](./events-sql-rpc-verification.md)

Findings before fix:

| Severity | Area | Detail |
|----------|------|--------|
| P0 | RPC admin authorization | `update_event_capacity_total` was callable by a broad role without an internal admin check |
| P0 | RPC execute grant | `decrement_event_capacity` was callable by a broad role |
| P1 | RPC search path | `decrement_event_capacity` did not set an explicit `search_path` |

Applied fixes:

| RPC | Fix |
|-----|-----|
| `update_event_capacity_total` | Added admin-or-service-role guard, kept explicit empty `search_path`, revoked broad execute, granted execute to `authenticated` and `service_role` |
| `decrement_event_capacity` | Added service-role guard, added explicit empty `search_path`, revoked broad execute, granted execute to `service_role` |

Verification result after fixes:

- RLS tables checked: 7.
- RPCs checked: 2.
- P0 findings: 0.
- P1 findings: 0.
- Event data readiness audit remained green after hardening: 0 P0 blockers and 0 P1 blockers.

## 2026-05-14 Admin UI Edit Proof

Verification method:

- Setup script: `node scripts/admin-ui-edit-proof-data.mjs setup`
- Browser proof: authenticated through the local app admin UI as a temporary admin user and edited non-public production proof records.
- Verification script: `node scripts/admin-ui-edit-proof-data.mjs verify`
- Cleanup script: `node scripts/admin-ui-edit-proof-data.mjs cleanup`
- Evidence: [Admin UI Edit Proof](./admin-ui-edit-proof.md)

Proof coverage:

| Area | Result |
|------|--------|
| Offering edit | Passed: title and short copy changed through admin UI on a draft event offering |
| Event capacity edit | Passed: max capacity, available spaces, and capacity total changed through admin UI |
| Category edit | Passed: name, description, and layout changed through admin UI on an inactive category |
| Public risk control | Passed: proof event remained `draft` and proof category remained inactive |
| Cleanup | Passed: proof admin user and all proof data rows were deleted |

Verification result:

- Admin UI edit proof is complete.
- The proof was automated with browser-driven UI actions plus service-role setup/cleanup.
- No direct SQL was used for the edit actions themselves.

## Follow-Up Risks

These were discovered while reconciling capacity but are not part of the data/catalogue acceptance gate:

- Seven existing bookings have `booking.number_of_attendees = 1` but no matching `booking_attendees` rows.
- The capacity counters were reconciled to the `bookings.number_of_attendees` source of truth.
- The missing attendee-detail rows should be carried into the event bookings/admin readiness workstream before day-of-event operations are signed off.

## Remaining Gates

The data P0s are cleared, SQL/RPC verification is green, and admin UI edit proof is complete. This workstream is not fully green until:

- Business/legal approval is captured for the seeded CMS policy and FAQ copy.
