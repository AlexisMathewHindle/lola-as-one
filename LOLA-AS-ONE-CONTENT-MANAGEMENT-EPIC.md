# Epic: Content-Managed Homepage and Incremental Page Publishing for Lola As One

## Summary

The Lola As One rebuild needs more than a visual homepage refresh. The reference design introduces a richer, editorial homepage structure, and the broader product direction requires pages and menus to be manageable so sections of the site can be launched gradually.

The current app can already manage some content types, such as blog posts and offering metadata, but the public homepage and primary navigation are still defined directly in Vue components. That means every homepage update, menu change, or staged page rollout still requires code changes.

This epic covers:

1. Redesigning the homepage to match the reference direction.
2. Making the homepage content-managed from the admin app.
3. Making header and footer navigation manageable.
4. Introducing page-level publish and navigation controls so pages can be hidden, exposed, or staged incrementally.
5. Reusing existing admin patterns where they already exist instead of building a full CMS from scratch.

## Recommendation

Do not start with a fully generic drag-and-drop page builder.

The right first step is a thin CMS foundation with three primitives:

1. A managed page registry.
2. Managed navigation menus.
3. Typed page sections for the homepage and simple content pages.

This gives the project enough flexibility to ship the new homepage and stage page rollouts, without overcommitting to a complex visual builder before the underlying content model is stable.

## Current Repo State

### Homepage is still mostly hard-coded

- `app/src/views/Home.vue`

The homepage currently contains hard-coded hero copy, hard-coded testimonials, hard-coded newsletter copy, and fixed section structure.

The only dynamic parts today are:

- featured workshop cards, sourced from `offerings` plus `offering_events`
- featured box cards, sourced from `offerings` plus `offering_products`

This is useful, but it is not enough to support the reference homepage layout or ongoing editorial control.

### Primary navigation is hard-coded

- `app/src/components/Navigation.vue`

The header menu items are fixed in the component:

- Workshops
- Adult Workshops
- Boxes
- Blog
- About
- Contact

There is currently no backend-managed menu model, no ordering control, and no hide/show control.

### Routes are application-defined, not content-defined

- `app/src/router/index.js`

All public pages are defined directly in the router. That is expected for commerce and detail pages, but it means there is currently no content layer that says:

- which pages should be visible in navigation
- which pages are draft versus live
- which pages are managed content versus app-driven views

### Admin content editing patterns already exist

- `app/src/components/shared/RichTextEditor.vue`
- `app/src/components/shared/ImageUploader.vue`
- `app/src/views/admin/BlogList.vue`
- `app/src/views/admin/BlogForm.vue`

The new admin app already has useful building blocks:

- a rich text editor
- media upload
- list and form patterns
- Supabase CRUD from the admin UI

These should be reused for page and homepage editing rather than inventing a separate admin approach.

### Admin settings/content management is not implemented yet

- `app/src/views/admin/Settings.vue`
- `app/src/views/Admin.vue`

There are placeholders for settings and content-page management, but no working page CMS, navigation editor, or site settings store yet.

### There is no page/navigation CMS schema in this repo

- `supabase/migrations/`

There are migrations for commerce, offerings, subscriptions, and category layout metadata, but there is no migration in the repo for:

- `site_pages`
- `page_sections`
- `site_menus`
- `site_menu_items`
- `site_settings`

### Existing offering data can support curated homepage sections

- `app/src/views/admin/OfferingsForm.vue`
- `app/src/views/Home.vue`

Offerings already support:

- `featured`
- `featured_image_url`
- published status

That means the homepage CMS does not need to duplicate product and workshop data. It should curate or reference existing offerings where possible.

## Problem Statement

The rebuild currently has a mismatch between design ambition and platform capability:

1. The homepage can be redesigned visually, but without a content model it will become another hard-coded page.
2. The menu cannot be managed by non-developers.
3. Pages cannot be staged cleanly for incremental release.
4. The backend currently has very little structure for page content outside blog posts.

If the team implements the reference homepage directly in `Home.vue` without adding content-management primitives, the result will look better in the short term but still be operationally rigid.

## Goal

Create a lightweight CMS layer inside the existing Supabase-backed admin app so Lola As One can:

- manage the homepage from admin
- manage menu items from admin
- publish pages incrementally
- hide pages from navigation until they are ready
- support both content pages and existing app-driven pages under one site structure

## Non-Goals

- A full visual page builder in the first release.
- Replacing the existing blog system.
- Replacing the existing offerings or commerce data model.
- Full preview, revisions, and approval workflows in v1.
- Reworking every existing public page into CMS-driven content before the homepage ships.

## Success Criteria

1. Admin users can edit homepage content without changing code.
2. Admin users can manage header and footer navigation without changing code.
3. Pages can be marked as draft or published.
4. Published pages can be shown or hidden from navigation independently.
5. The new homepage matches the reference direction while remaining driven by managed content.
6. Existing offering and blog systems are reused instead of duplicated.
7. The implementation supports incremental rollout of future pages rather than only solving the homepage once.

## Content Scope for the First Homepage

Based on the reference image, the first homepage should likely support a structured mix of editorial and catalog-driven content. The exact copy can be refined later, but the section model should be designed for at least:

1. Header navigation and utility links.
2. Hero banner or carousel.
3. Introductory brand/message block.
4. A timetable or schedule section.
5. Curated class or programme highlight sections with image, copy, icons, and CTAs.
6. Social proof or testimonial content.
7. Footer navigation and contact blocks.

Recommendation:

Treat the timetable section as a dedicated homepage section type rather than blocking the project on fully automated event-to-grid logic. A manual or semi-managed schedule block is the fastest way to match the design and can later be upgraded to derive from structured event data if needed.

## Proposed Content Model

## Page registry

Create a `site_pages` table to define the public information architecture.

Suggested fields:

- `id`
- `page_key`
- `title`
- `slug`
- `page_kind`
- `template_key`
- `route_name`
- `status`
- `show_in_navigation`
- `seo_title`
- `seo_description`
- `published_at`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Suggested meanings:

- `page_kind`
  - `cms_page` for rendered content pages
  - `app_route` for existing Vue-driven pages such as workshops, boxes, cart, or account
- `status`
  - `draft`
  - `published`
  - `archived`

Important behavior:

- `draft` pages are not public.
- `published` pages may still be hidden from menus using `show_in_navigation = false`.
- `app_route` lets the team manage menu visibility and rollout for existing pages without rewriting every page into CMS content immediately.

## Page sections

Create a `page_sections` table for typed sections attached to a page.

Suggested fields:

- `id`
- `page_id`
- `section_key`
- `section_type`
- `sort_order`
- `is_enabled`
- `config_json`
- `created_at`
- `updated_at`

Recommended first-release section types:

- `hero_banner`
- `rich_text`
- `schedule_grid`
- `featured_offerings`
- `feature_split`
- `testimonial_strip`
- `newsletter_cta`
- `image_gallery`

Recommendation:

Use typed section components plus `config_json`, not free-form arbitrary HTML blocks. This keeps frontend rendering predictable and makes admin forms clearer.

## Menus

Create:

- `site_menus`
- `site_menu_items`

Suggested menu locations:

- `header_primary`
- `footer_primary`
- `footer_secondary`

Suggested menu item fields:

- `id`
- `menu_id`
- `label`
- `item_type`
- `page_id`
- `url`
- `open_in_new_tab`
- `sort_order`
- `is_enabled`

Suggested meanings:

- `item_type = page` links to a managed `site_pages` record
- `item_type = external` links to a URL

## Site settings

Create a lightweight `site_settings` table for global configuration that does not belong to a page.

Suggested first-release settings:

- site name
- site strapline
- primary logo
- footer contact text
- social links
- default SEO title/description

## Access model

For v1, the simplest safe approach is:

1. Public read access for published page, section, menu, and settings data.
2. Admin-only create, update, and delete access.
3. Draft page content should not be exposed to anonymous clients.

## Delivery Plan

## Phase 0: Define the MVP CMS Scope

### Step 0.1: Confirm which pages need management in wave one

Recommended wave one:

- Home
- About
- Contact
- Header navigation
- Footer navigation

Defer full CMS conversion for:

- workshops listing pages
- product listings
- detail pages
- account flows
- checkout flows

Acceptance criteria:

- There is an agreed list of pages the first CMS release must control.

### Step 0.2: Map the reference homepage into concrete section types

Tasks:

1. Break the reference design into reusable section types.
2. Decide which sections are manually authored versus derived from existing offering data.
3. Define the admin fields required for each section type.

Acceptance criteria:

- Every visible homepage block in the reference design has a named section type and data source.

### Step 0.3: Decide rollout behavior

Recommended rollout rules:

1. `draft` means not publicly resolvable.
2. `published` plus `show_in_navigation = false` means live but hidden from menus.
3. Menus only render enabled items whose linked pages are published.

Acceptance criteria:

- The team agrees how hide/show and staged release should work before implementation starts.

## Phase 1: Build the CMS Schema in Supabase

### Step 1.1: Create the page, section, menu, and settings tables

Tasks:

1. Add migrations for `site_pages`.
2. Add migrations for `page_sections`.
3. Add migrations for `site_menus` and `site_menu_items`.
4. Add a migration for `site_settings`.

Acceptance criteria:

- The core content schema exists in `supabase/migrations/`.

### Step 1.2: Add constraints and indexes

Tasks:

1. Enforce unique `page_key`.
2. Enforce unique live slugs where applicable.
3. Enforce valid enums for `page_kind`, `status`, and `section_type`.
4. Add indexes for:
   - page lookup by slug or key
   - section lookup by `page_id`
   - menu item lookup by `menu_id`

Acceptance criteria:

- The schema supports predictable reads for public rendering and admin CRUD.

### Step 1.3: Add RLS policies

Tasks:

1. Public clients can read:
   - published pages
   - enabled sections attached to published pages
   - enabled menus and menu items
   - approved site settings
2. Only admin users can write content tables.

Acceptance criteria:

- Anonymous users cannot modify CMS data.
- Admins can manage content through the new app.

### Step 1.4: Seed the initial site structure

Seed at least:

- Home
- About
- Contact
- header menu
- footer menu

Acceptance criteria:

- The app has real records to render against before the admin UI is completed.

## Phase 2: Build the Public Content Read Layer

### Step 2.1: Add frontend CMS services and composables

Tasks:

1. Create a small content service for:
   - site settings
   - menus
   - page lookup by key or slug
   - section lookup
2. Keep data-fetching concerns out of the render components.

Acceptance criteria:

- Public pages can load CMS data through a single frontend abstraction rather than ad hoc queries.

### Step 2.2: Make navigation data-driven

Tasks:

1. Replace hard-coded links in `app/src/components/Navigation.vue`.
2. Load header menu items from the CMS.
3. Keep cart, auth, and admin controls app-driven.

Acceptance criteria:

- Menu labels, order, and visibility can be changed without editing Vue code.

### Step 2.3: Add page resolution rules

Tasks:

1. Resolve CMS-backed pages by slug or page key.
2. Support menu items that map to existing app routes.
3. Prevent draft CMS pages from rendering publicly.

Acceptance criteria:

- The router and CMS model can coexist cleanly.

### Step 2.4: Add footer content resolution

Tasks:

1. Move footer links and contact/meta content into CMS-backed data.
2. Keep any payment or legal badges app-controlled if needed.

Acceptance criteria:

- Footer content no longer requires code edits for routine copy or link changes.

## Phase 3: Build Admin Management for Content and Navigation

### Step 3.1: Add admin routes and screens

Suggested admin areas:

- `Content Pages`
- `Homepage`
- `Navigation`
- `Site Settings`

Acceptance criteria:

- Admin users can reach dedicated UI for each CMS concern.

### Step 3.2: Build a page list and page form

Tasks:

1. List pages with status and navigation visibility.
2. Edit title, slug, SEO, publish status, and menu visibility.
3. Support both `cms_page` and `app_route` records.

Acceptance criteria:

- Editors can manage page availability without touching code.

### Step 3.3: Build a homepage section editor

Tasks:

1. List homepage sections in render order.
2. Allow sections to be added, edited, reordered, enabled, or disabled.
3. Reuse:
   - `RichTextEditor.vue`
   - `ImageUploader.vue`
4. Support section-specific forms for hero, schedule, curated cards, and testimonials.

Acceptance criteria:

- The homepage can be edited entirely from admin.

### Step 3.4: Build a menu editor

Tasks:

1. Manage header and footer menus.
2. Reorder items.
3. Link items to:
   - a managed page
   - an external URL
4. Enable or disable items without deleting them.

Acceptance criteria:

- Navigation structure is managed from admin.

### Step 3.5: Build a site settings screen

Tasks:

1. Move the current settings placeholder into a working site settings form.
2. Support logo, strapline, footer details, and social links.

Acceptance criteria:

- Global site settings exist outside application code.

## Phase 4: Implement the New Homepage Experience

### Step 4.1: Build homepage section components

Create public render components for the agreed section types.

At minimum:

- hero banner
- intro text block
- schedule grid
- curated feature split rows
- featured offerings section
- testimonial section
- newsletter CTA

Acceptance criteria:

- The homepage is composed from reusable section components rather than a single hard-coded template.

### Step 4.2: Integrate offering-based content where appropriate

Tasks:

1. Allow homepage sections to reference existing offerings.
2. Continue using existing published and featured catalog data where it makes sense.
3. Avoid duplicating price, title, and image data into CMS records.

Acceptance criteria:

- Curated workshop and product sections reuse the existing source of truth.

### Step 4.3: Implement the timetable block pragmatically

Recommended first release:

1. Model the timetable as admin-managed structured rows or columns.
2. Do not block homepage launch on perfect automation from recurring event data.

Possible later enhancement:

- derive timetable cells from recurring class metadata if the event model is expanded to support that cleanly

Acceptance criteria:

- The homepage can ship with the timetable section matching the design direction.

### Step 4.4: Apply responsive polish

Tasks:

1. Match desktop and mobile behavior against the reference design intent.
2. Ensure the content model supports image-first editorial layouts without fragile CSS assumptions.

Acceptance criteria:

- The new homepage is production-ready on mobile and desktop.

## Phase 5: Incremental Rollout of Managed Pages

### Step 5.1: Migrate simple pages first

Recommended first pages after Home:

- About
- Contact

These are better first CMS pages than workshop or product flows because they are mostly editorial.

Acceptance criteria:

- At least one non-home editorial page is CMS-managed.

### Step 5.2: Introduce hidden-but-live pages where needed

Use case:

- a page is published for QA or direct sharing
- the page should not yet appear in the main menu

Acceptance criteria:

- Editors can stage pages without exposing them globally.

### Step 5.3: Decide whether to add a standard content-page template

Recommended first-release template set:

- `home`
- `standard_content`

Acceptance criteria:

- The team can create simple future pages without new frontend code each time.

## Phase 6: QA, Launch, and Operational Hardening

### Step 6.1: Verify content permissions

Tasks:

1. Confirm anonymous users only see published content.
2. Confirm draft content is not exposed via direct queries.
3. Confirm only admins can write CMS tables.

### Step 6.2: Verify navigation safety

Tasks:

1. Disabled menu items do not render.
2. Menu links to draft pages do not leak.
3. External links behave correctly.

### Step 6.3: Verify rollout behavior

Tasks:

1. Draft pages are not public.
2. Published but hidden pages are reachable when intended.
3. Existing app routes still work while the CMS layer is introduced.

### Step 6.4: Content-entry dry run

Tasks:

1. Populate the new homepage with real content.
2. Populate header and footer menus.
3. Confirm non-developers can make routine edits without code changes.

Acceptance criteria:

- The homepage and basic site structure can be operated from admin.

## Recommended Delivery Order

To keep this incremental and low-risk, implement in this order:

1. Schema and RLS.
2. Public read layer for menus, pages, and settings.
3. Data-driven header and footer navigation.
4. Admin page and menu management.
5. Homepage section editor and homepage render components.
6. About and Contact migration into the same CMS model.

This sequence gives value early:

- menu management arrives before the full homepage rebuild is finished
- homepage editing arrives before a broader page-builder discussion
- simple editorial pages prove the model before it is applied more widely

## Open Questions

These should be resolved before or during Phase 0:

1. Which public pages need to be fully CMS-managed in wave one?
2. Should the timetable be manual in v1, or is there a clean recurring-data model already planned?
3. Do we need preview links in v1, or is draft plus published enough for now?
4. Should hidden pages be publicly reachable by direct URL, or only visible after a later publish action?

## Final Recommendation

Treat this as a content-platform epic, not just a homepage ticket.

The homepage redesign is the visible driver, but the real product need is:

- managed navigation
- managed editorial content
- staged page publishing

If those primitives are built first, the homepage redesign becomes the first consumer of a system the team can keep using. If they are skipped, the redesign will ship faster but the site will remain code-operated.
