# Events Data And CMS Readiness

Status: current
Last updated: 2026-05-14
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Risk: critical
Depends on: none

Current execution status: automated production audit is green as of 2026-05-14 with 0 P0 blockers and 0 P1 blockers. Direct SQL policy/RPC verification is green after hardening the event capacity RPC grants and security-definer settings. Automated admin UI edit proof is also green: a temporary admin user edited a non-public draft event, category, and capacity value through the app admin UI, and all proof records were cleaned up. The remaining open gate is business/legal approval of seeded policy and FAQ copy.

Current evidence:

- [Events Data And CMS Readiness Evidence](./events-data-cms-readiness-evidence.md)
- [Events Data And CMS Readiness Fix Log](./events-data-cms-readiness-fix-log.md)
- [Events SQL/RPC Verification](./events-sql-rpc-verification.md)
- [Admin UI Edit Proof](./admin-ui-edit-proof.md)

## Purpose

This document is the active execution plan for the first events launch workstream. It must prove that the launch event catalogue, CMS content, category structure, images, capacity records, and RLS policies are production-ready before public booking, Stripe, email, or admin operations are treated as launch-ready.

This workstream is first because every downstream event launch epic depends on correct Supabase data. Checkout, Stripe webhooks, emails, waitlists, and admin booking screens can only be production-safe if the event rows they consume are complete and consistent.

## Scope

- Confirm the launch event catalogue in Supabase.
- Verify `offerings`, `offering_events`, `event_categories`, `event_capacity`, image storage records, slugs, status fields, and category layout settings.
- Confirm every launch event has date, start time, price, capacity, location, booking copy, cancellation policy, and published state.
- Remove or hide test, duplicate, draft, and stale event records from public surfaces.
- Confirm public read and admin write RLS policies work in the production Supabase project.
- Confirm CMS-managed copy for launch-critical event pages and policy links.

## Acceptance Criteria

- Public pages only show events intended for launch.
- Every bookable event has an `offering_events` row and an `event_capacity` row.
- Capacity values are consistent between `event_capacity.spaces_booked` and `offering_events.current_bookings`.
- Admin can edit launch event content without direct database access.
- Supabase row counts and spot checks are documented before launch.

## Production Data Contract

These are the minimum records and fields that must be verified for the events-first launch.

| Area | Required production state |
|------|---------------------------|
| `offerings` | Each launch event has `type = 'event'`, stable `title`, unique `slug`, public-safe descriptions, image URL where required or a valid category image fallback, `status = 'published'`, SEO metadata where required, and term fields for term-based events where the app expects them. |
| `offering_events` | Each launch event has `offering_id`, `event_date`, `event_start_time`, optional `event_end_time`, location fields, `max_capacity`, sellable capacity or `available_spaces` where deployed, `current_bookings`, `price_gbp`, `vat_rate`, `waitlist_enabled`, and `category_id` where the route/category layout depends on it. |
| `event_categories` | Launch categories are active, have stable `name` and `slug`, correct parent/child relationships, `featured_image_url` where used, and a valid `layout_key`: `standard`, `adult_workshop`, or `enquiry_only`. |
| `event_capacity` | Every bookable `offering_events.id` has exactly one capacity row. `total_capacity` reflects the intended sellable capacity. `spaces_booked` matches `offering_events.current_bookings`. `spaces_reserved` is valid. `spaces_available` is not negative. |
| Storage | Event images resolve from `workshop-images`, category images resolve from `category-images`, and CMS/page imagery resolves from `site-images` where used. |
| CMS pages | Launch-critical event pages, policy pages, FAQs, contact, footer/menu links, and booking policy copy are published or explicitly approved as app routes. |
| RLS | Public users can read only the intended published/public event data. Admin users can create, update, and archive event catalogue data through admin screens. |

Important schema note: the app currently references production fields that are not all represented in the historical `docs/migrations/schema.sql` snapshot, including event category layout fields and event admin capacity fields. The production Supabase schema must be verified directly before sign-off.

## Shipped App Surfaces To Verify

Public surfaces:

- `app/src/views/Workshops.vue`
- `app/src/views/AdultWorkshops.vue`
- `app/src/views/HolidayProgramPage.vue`
- `app/src/views/WorkshopDetail.vue`
- `app/src/views/CmsInfoPage.vue`
- `app/src/views/Checkout.vue`
- `app/src/components/workshops/WorkshopCalendar.vue`

Admin surfaces:

- `app/src/views/admin/OfferingsForm.vue`
- `app/src/components/admin/EventFields.vue`
- `app/src/views/admin/OfferingsList.vue`
- `app/src/views/admin/EventCategoriesList.vue`
- `app/src/components/admin/CategoryModal.vue`

Supporting data and policy references:

- `docs/migrations/schema.sql`
- `supabase/migrations/20260208_fix_bookings_and_functions.sql`
- `supabase/migrations/20260408_sync_event_capacity_and_current_bookings.sql`
- `supabase/migrations/20260313_add_featured_image_to_categories.sql`
- `supabase/migrations/20260313_create_category_images_bucket.sql`
- `supabase/migrations/20260408_add_layout_key_to_event_categories.sql`
- `supabase/migrations/20260408_add_enquiry_only_layout_to_event_categories.sql`
- `supabase/migrations/20260409_create_site_cms_foundation.sql`
- `supabase/migrations/20260514_add_policy_info_pages.sql`
- `supabase/migrations/20260514_harden_event_capacity_rpcs.sql`
- `scripts/migration/fix-event-categories-rls.sql`
- `scripts/audit-events-data-readiness.mjs`
- `scripts/fix-events-data-readiness-blockers.mjs`
- `scripts/upsert-cms-policy-pages.mjs`
- `scripts/verify-events-sql-rpc-readiness.mjs`
- `scripts/apply-production-sql-file.mjs`

## Delivery Stories

### Story 1: Freeze The Launch Event Catalogue

Goal:

Create the approved list of events that should be visible at production launch.

Tasks:

- Export all future event rows from production Supabase.
- Mark each future event as `launch`, `defer`, `archive`, or `needs copy`.
- Confirm the canonical event title, slug, date, start time, category, price, and capacity with the business owner.
- Confirm which events are bookable, enquiry-only, or waitlist-only.
- Confirm which legacy workshop URLs need redirects for these events.

Done when:

- The launch event list is approved.
- Every non-launch event is either `draft`, `scheduled`, or `archived`.
- No duplicate event title/date combinations remain public.

### Story 2: Complete Required Event Fields

Goal:

Ensure every launch event has the minimum data needed for public display, checkout, emails, and admin support.

Tasks:

- Confirm every launch event has a populated `offerings` row.
- Confirm every launch event has exactly one `offering_events` row.
- Confirm title, slug, short copy, long copy, booking copy, cancellation policy, SEO fields, featured image or category image fallback, date, time, location, price, capacity, and category.
- Confirm term data for term-based events: `term_season`, `term_half`, `term_year`, and legacy `metadata.term` where still used.
- Confirm `status = 'published'` only for launch-ready events.

Done when:

- Required-field audit returns no blockers.
- Any intentionally empty optional fields are listed in the evidence pack.

### Story 3: Verify Category And Layout Readiness

Goal:

Ensure event category data drives the correct public pages and templates.

Tasks:

- Confirm active parent and child event categories.
- Confirm category slugs used by public category routes.
- Confirm `layout_key` is valid for each launch category.
- Confirm `enquiry_only` categories cannot accidentally expose paid booking CTAs.
- Confirm category featured images render from storage where the public UI expects them.

Done when:

- Every launch event has the expected category.
- Category pages load the correct events.
- Enquiry-only and adult workshop layouts are verified against production data.

### Story 4: Reconcile Capacity

Goal:

Make capacity safe before paid bookings are switched on.

Tasks:

- Confirm every launch event has an `event_capacity` row.
- Confirm `event_capacity.total_capacity` reflects the intended sellable capacity, not necessarily the physical room limit if fewer spaces should be sold.
- Confirm `event_capacity.spaces_booked` matches `offering_events.current_bookings`.
- Confirm `event_capacity.spaces_reserved` is zero or intentionally explained before launch.
- Confirm `spaces_available` is never negative.
- Confirm the production RPC `update_event_capacity_total` exists if the admin form depends on it.
- Confirm capacity edits from the admin UI update the deployed production data model correctly.

Done when:

- Capacity reconciliation audit returns no mismatches.
- Admin can adjust a non-public event capacity without direct SQL.

### Story 5: Verify Images And Storage

Goal:

Ensure launch event and category imagery renders publicly.

Tasks:

- Confirm required storage buckets exist and are public where needed: `workshop-images`, `category-images`, `site-images`.
- Confirm public read storage policies are active.
- Confirm launch event `featured_image_url` values load in a browser.
- Confirm category `featured_image_url` values load in a browser.
- Confirm missing images are either fixed or accepted with an approved fallback.

Done when:

- Event and category image spot checks pass.
- Broken or missing image URLs are fixed or documented.

### Story 6: Hide Stale, Test, And Duplicate Records

Goal:

Protect public pages from non-launch catalogue data.

Tasks:

- Search for test, dummy, sample, duplicate, old, imported, and stale event records.
- Archive or draft records that should not appear publicly.
- Confirm public queries only return intended launch records.
- Keep deletion as a separate decision. Prefer `archived` unless the record is clearly disposable test data.

Done when:

- Public pages only show approved launch events.
- The cleanup action for each hidden record is documented.

### Story 7: Prove RLS And Admin Edit Access

Goal:

Confirm public read and admin write permissions work against production.

Tasks:

- Review production policies for `offerings`, `offering_events`, `event_categories`, `event_capacity`, `site_pages`, and storage buckets.
- Test anonymous/public reads for published launch event data.
- Test anonymous/public reads do not expose draft or archived offerings.
- Test admin edit from the admin UI, ideally on a non-public draft event or a safe reversible field.
- Confirm admin category edit works without direct SQL.

Done when:

- RLS policy review is captured.
- Admin UI edit proof is captured.
- Any production policy drift is fixed or assigned as a launch blocker.

### Story 8: Confirm CMS Copy And Policy Links

Goal:

Ensure launch-critical event pages and policies are managed or approved before bookings open.

Implementation status:

- Public app routes now exist for `/faqs`, `/privacy-policy`, and `/terms-and-conditions`.
- `site_pages` production records are published for all three policy/info pages.
- Each policy/info page has one enabled `rich_text` `page_sections` record.
- Footer secondary menu items now link to FAQs, Privacy Policy, and Terms and Conditions.
- Checkout includes Terms, Privacy, and FAQs links before Stripe handoff.
- Seeded CMS copy is backed by CMS data. Business/legal approval should still be captured before launch.

Tasks:

- Confirm event landing copy and category copy are correct.
- Confirm booking terms, cancellation policy, refund policy, privacy policy, FAQs, and contact links are present.
- Confirm CMS page records exist where the launch decision requires CMS-driven content.
- Confirm header/footer links point to production `app/` routes or CMS pages.
- Confirm policy links are visible during the customer booking journey where required.

Done when:

- Launch-critical copy can be updated from admin/CMS or is explicitly accepted as an app route for this phase.
- Policy links are approved by the business owner.

### Story 9: Create Evidence Pack

Goal:

Leave a clear audit trail for launch readiness.

Tasks:

- Save row counts by status and category.
- Save launch event catalogue export.
- Save missing-field audit result.
- Save capacity reconciliation result.
- Save RLS policy review result.
- Save image spot-check list.
- Save admin edit proof.
- Save final business sign-off.

Done when:

- Evidence exists for every acceptance criterion.
- Any accepted exceptions have an owner, date, and follow-up epic.

## Supabase Audit Queries

Run these against the production Supabase project before sign-off. Save results in the launch evidence pack.

### 1. Event Counts By Status

```sql
select
  o.status,
  count(*) as event_count
from offerings o
join offering_events oe on oe.offering_id = o.id
where o.type = 'event'
group by o.status
order by o.status;
```

### 2. Launch Catalogue Review

```sql
select
  o.id as offering_id,
  oe.id as offering_event_id,
  o.title,
  o.slug,
  o.status,
  oe.event_date,
  oe.event_start_time,
  oe.event_end_time,
  oe.price_gbp,
  oe.max_capacity,
  coalesce(oe.available_spaces, oe.max_capacity) as intended_sellable_capacity,
  oe.current_bookings,
  ec.total_capacity,
  ec.spaces_booked,
  ec.spaces_reserved,
  ec.spaces_available,
  c.name as category_name,
  c.slug as category_slug,
  c.layout_key
from offerings o
join offering_events oe on oe.offering_id = o.id
left join event_capacity ec on ec.offering_event_id = oe.id
left join event_categories c on c.id = oe.category_id
where o.type = 'event'
  and oe.event_date >= current_date
order by oe.event_date, oe.event_start_time, o.title;
```

### 3. Missing Required Launch Fields

```sql
select
  o.id as offering_id,
  oe.id as offering_event_id,
  o.title,
  o.slug,
  o.status,
  oe.event_date,
  oe.event_start_time,
  oe.price_gbp,
  oe.max_capacity,
  oe.location_name,
  oe.location_address,
  oe.location_city,
  oe.location_postcode,
  o.description_short,
  o.description_long,
  o.featured_image_url,
  oe.category_id
from offerings o
join offering_events oe on oe.offering_id = o.id
where o.type = 'event'
  and o.status = 'published'
  and oe.event_date >= current_date
  and (
    o.slug is null
    or o.slug = ''
    or oe.event_date is null
    or oe.event_start_time is null
    or oe.price_gbp is null
    or oe.max_capacity is null
    or oe.max_capacity <= 0
    or oe.location_name is null
    or oe.location_name = ''
    or coalesce(nullif(o.description_short, ''), nullif(o.description_long, '')) is null
    or o.featured_image_url is null
    or o.featured_image_url = ''
    or oe.category_id is null
  )
order by oe.event_date, o.title;
```

### 4. Missing Capacity Rows

```sql
select
  o.id as offering_id,
  oe.id as offering_event_id,
  o.title,
  o.slug,
  oe.event_date,
  oe.max_capacity
from offerings o
join offering_events oe on oe.offering_id = o.id
left join event_capacity ec on ec.offering_event_id = oe.id
where o.type = 'event'
  and o.status = 'published'
  and oe.event_date >= current_date
  and ec.id is null
order by oe.event_date, o.title;
```

### 5. Capacity Mismatches

```sql
select
  o.title,
  o.slug,
  oe.id as offering_event_id,
  oe.event_date,
  oe.max_capacity,
  coalesce(oe.available_spaces, oe.max_capacity) as intended_sellable_capacity,
  oe.current_bookings,
  ec.total_capacity,
  ec.spaces_booked,
  ec.spaces_reserved,
  ec.spaces_available
from offerings o
join offering_events oe on oe.offering_id = o.id
join event_capacity ec on ec.offering_event_id = oe.id
where o.type = 'event'
  and o.status = 'published'
  and oe.event_date >= current_date
  and (
    ec.total_capacity is distinct from coalesce(oe.available_spaces, oe.max_capacity)
    or ec.spaces_booked is distinct from oe.current_bookings
    or ec.spaces_available < 0
    or ec.spaces_booked + ec.spaces_reserved > ec.total_capacity
  )
order by oe.event_date, o.title;
```

### 6. Duplicate Or Suspicious Public Events

```sql
select
  lower(o.title) as normalized_title,
  oe.event_date,
  oe.event_start_time,
  count(*) as duplicate_count,
  array_agg(o.slug order by o.slug) as slugs
from offerings o
join offering_events oe on oe.offering_id = o.id
where o.type = 'event'
  and o.status = 'published'
  and oe.event_date >= current_date
group by lower(o.title), oe.event_date, oe.event_start_time
having count(*) > 1
order by oe.event_date, normalized_title;
```

```sql
select
  o.id,
  o.title,
  o.slug,
  o.status,
  oe.event_date
from offerings o
join offering_events oe on oe.offering_id = o.id
where o.type = 'event'
  and o.status = 'published'
  and oe.event_date >= current_date
  and (
    lower(o.title) like '%test%'
    or lower(o.title) like '%dummy%'
    or lower(o.title) like '%sample%'
    or lower(o.title) like '%duplicate%'
    or lower(o.title) like '%copy%'
    or lower(o.slug) like '%test%'
    or lower(o.slug) like '%dummy%'
  )
order by oe.event_date, o.title;
```

### 7. Category Layout Audit

```sql
select
  id,
  parent_id,
  name,
  slug,
  is_active,
  layout_key,
  featured_image_url
from event_categories
order by parent_id nulls first, name;
```

```sql
select
  id,
  name,
  slug,
  layout_key
from event_categories
where layout_key not in ('standard', 'adult_workshop', 'enquiry_only')
   or layout_key is null
order by name;
```

### 8. Storage Bucket And Image Checks

```sql
select
  id,
  name,
  public
from storage.buckets
where id in ('workshop-images', 'category-images', 'site-images')
order by id;
```

```sql
select
  o.title,
  o.slug,
  o.featured_image_url,
  o.secondary_images
from offerings o
join offering_events oe on oe.offering_id = o.id
where o.type = 'event'
  and o.status = 'published'
  and oe.event_date >= current_date
  and (
    o.featured_image_url is null
    or o.featured_image_url = ''
  )
order by oe.event_date, o.title;
```

### 9. RLS Policy Review

```sql
select
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'offerings',
    'offering_events',
    'event_categories',
    'event_capacity',
    'site_pages',
    'page_sections',
    'site_menus',
    'site_menu_items'
  )
order by tablename, policyname;
```

### 10. Required RPC Verification

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'update_event_capacity_total',
    'decrement_event_capacity'
  )
order by p.proname;
```

## Evidence Pack Template

Create one launch evidence note or spreadsheet with these rows:

| Evidence item | Required contents | Status |
|---------------|-------------------|--------|
| Catalogue export | Query 2 output plus business owner approval. | Pending |
| Row counts | Query 1 output. | Pending |
| Required fields | Query 3 output with no unresolved blockers. | Pending |
| Capacity rows | Query 4 output with no unresolved blockers. | Pending |
| Capacity reconciliation | Query 5 output with no unresolved blockers. | Pending |
| Duplicates and stale records | Query 6 output plus hide/archive decisions. | Pending |
| Category audit | Query 7 output and category page spot checks. | Pending |
| Image audit | Query 8 output plus public image spot checks. | Pending |
| RLS review | Query 9 output plus anonymous/admin access proof. | Pending |
| RPC review | Query 10 output. | Pending |
| Admin edit proof | Screenshot or note showing admin edit without direct SQL. | Done |
| CMS policy links | Approved list of event policy, FAQ, contact, and cancellation links. | Pending |

## Go/No-Go Rule

This workstream is green only when all acceptance criteria are backed by evidence. If any of these remain unresolved, the events launch should not move to paid checkout validation:

- Missing `event_capacity` rows for launch events.
- Capacity mismatch between `event_capacity.spaces_booked` and `offering_events.current_bookings`.
- Public published test or duplicate records.
- Broken category layout configuration.
- Broken launch event images.
- Admin cannot edit event or category data through the app.
- RLS exposes draft/archive event content or blocks intended public read access.
- Booking, cancellation, policy, FAQ, or contact copy is missing from the customer journey.

## Current Gate Status

As of the 2026-05-14 production audit and admin UI proof:

- P0 data blockers are cleared.
- Public launch catalogue row counts are captured.
- Required launch fields pass.
- Every bookable event has an `offering_events` row and an `event_capacity` row.
- Capacity is reconciled between `event_capacity.spaces_booked` and `offering_events.current_bookings`.
- Duplicate, stale, and suspicious public records pass.
- Event category layout, storage bucket, and image checks pass.
- Anonymous REST probes show public users can read published event offerings and cannot read non-published event offerings.
- Direct SQL verification of production `pg_policies`, `update_event_capacity_total`, and `decrement_event_capacity` passes.
- Automated admin UI proof confirms a temporary admin can edit one safe draft event, one category, and one capacity value without direct SQL; cleanup passed.

Remaining before green:

- Business/legal approval of seeded CMS policy and FAQ copy.
- Follow-up booking/admin readiness task for seven existing bookings with no `booking_attendees` rows.
