# Lola As One CMS Phase 0 and Phase 1 Tasks

## Purpose

This task list turns the content-management epic into immediate implementation work for the first two phases:

- Phase 0: lock the MVP CMS scope and rollout rules
- Phase 1: create the Supabase schema and seed data needed to start building against it

## Decisions Locked In

These decisions are now concrete enough to implement against:

1. Start with a thin CMS, not a drag-and-drop page builder.
2. Manage the homepage first.
3. Manage header and footer menus from data.
4. Represent existing hard-coded pages in the page registry as `app_route` records.
5. Represent the new homepage as a `cms_page`.
6. Use:
   - page `status` for draft versus live
   - page `show_in_navigation` for page-level menu visibility
   - menu item `is_enabled` for placement-level control
7. Store homepage and content-page sections as typed records with `config_json`.
8. Use a dedicated public `site-images` bucket for CMS-managed images.

## Phase 0: MVP Scope and Rollout Rules

### Task 0.1: Confirm wave-one managed scope

Status: `in_progress`

Implemented assumption:

- Homepage becomes CMS-backed first.
- Existing nav pages are seeded into the CMS as `app_route` records so the menu can be managed without rewriting those pages immediately.

Decision still needed:

- whether `About` and `Contact` should be converted into `cms_page` records in the same wave as `Home`, or remain `app_route` records until Phase 5

### Task 0.2: Confirm homepage section taxonomy

Status: `in_progress`

Initial section types now supported by schema:

- `hero_banner`
- `rich_text`
- `schedule_grid`
- `featured_offerings`
- `feature_split`
- `testimonial_strip`
- `newsletter_cta`
- `image_gallery`

Next action:

- map the reference design into these section types and decide whether any extra type is needed before admin UI work starts

### Task 0.3: Confirm rollout behavior

Status: `done`

Locked behavior:

1. `draft` pages are not public-readable.
2. `published` pages are public-readable.
3. `published` pages with `show_in_navigation = false` stay live but are suppressed from page-linked menu output.
4. Menu items must also be `is_enabled = true` to render publicly.

### Task 0.4: Confirm homepage data ownership boundaries

Status: `done`

Locked behavior:

1. Homepage editorial content lives in `page_sections.config_json`.
2. Product and workshop catalog data remains in `offerings`, `offering_events`, and `offering_products`.
3. Homepage sections may reference existing offering data rather than duplicating price/title/image content.

### Task 0.5: Decide timetable v1 strategy

Status: `pending`

Recommendation:

- launch with a manually managed `schedule_grid` section
- only automate timetable generation later if recurring class data becomes clean enough to support it

## Phase 1: Supabase Schema and Seed Data

### Task 1.1: Add CMS foundation migration

Status: `done`

Created:

- [20260409_create_site_cms_foundation.sql](/Users/alexishindle/repos/projects/lola-as-one/supabase/migrations/20260409_create_site_cms_foundation.sql)

Included:

- `site_pages`
- `page_sections`
- `site_menus`
- `site_menu_items`
- `site_settings`
- `site-images` storage bucket
- public read and admin write RLS
- initial page and menu seed data
- initial homepage section seed data

### Task 1.2: Seed the page registry with current public IA

Status: `done`

Seeded pages:

- Home as `cms_page`
- Workshops as `app_route`
- Adult Workshops as `app_route`
- Boxes as `app_route`
- Blog as `app_route`
- About as `app_route`
- Contact as `app_route`

### Task 1.3: Seed menu structures

Status: `done`

Seeded menus:

- `header_primary`
- `footer_primary`
- `footer_secondary`

Seeded menu items mirror the current hard-coded navigation so Phase 2 can swap to data-driven menus without inventing IA from scratch.

### Task 1.4: Seed homepage section records

Status: `done`

Seeded homepage sections currently model the existing homepage structure so the read layer can be built incrementally:

- hero
- featured workshops
- featured boxes
- about intro
- testimonials
- newsletter CTA

### Task 1.5: Run migration against local Supabase

Status: `pending`

Next action:

1. apply the migration to the local project
2. inspect generated tables and policies
3. verify seed rows exist

### Task 1.6: Smoke-test RLS behavior

Status: `pending`

Verify:

1. anonymous users can read only published public CMS data
2. anonymous users cannot read drafts
3. authenticated non-admin users cannot write CMS tables
4. admin users can create, update, and delete CMS tables

## Immediate Next Build Tasks

These are the next implementation items after the migration is applied locally:

1. Add a CMS read service in the Vite app for pages, menus, settings, and homepage sections.
2. Replace hard-coded links in [Navigation.vue](/Users/alexishindle/repos/projects/lola-as-one/app/src/components/Navigation.vue) with `header_primary` menu data.
3. Add a basic footer component backed by seeded footer menus and site settings.
4. Create admin list/form screens for pages and menus.
5. Create a dedicated homepage editor backed by `page_sections`.

## Notes

Two deliberate choices in the schema are worth carrying forward into the frontend work:

1. `site_pages` includes both `path` and optional `slug`.
   `path` handles `/` cleanly for the homepage and also supports existing app routes without special casing.
2. `About` and `Contact` are currently seeded as `app_route`.
   That keeps the first rollout aligned with the current router, while still allowing those records to be converted into `cms_page` entries later.
