# Public Discovery And Event Detail Flow

Status: current
Last updated: 2026-05-14
Parent epic: [Events Production Launch Epic](./events-production-launch-epic.md)
Risk: high
Depends on: [Events Data And CMS Readiness](./events-data-cms-readiness.md)

Current execution status: green as of 2026-05-14. Detail render audit checked 117 future published event slugs: 117 passed, 0 failed, and 0 duplicate slug groups. Manual in-app browser spot checks passed for `/workshops`, `/adult-workshops`, `/half-term`, and `/summer-holiday`. Automated responsive screenshot capture passed for desktop and mobile views across core public routes plus standard, adult, and enquiry-only detail pages. Automated booking-state checks passed for bookable standard, adult workshop, and enquiry-only pages; sold-out and waitlist states are documented as not present in the current launch catalogue. Legacy workshop route handling passed 14/14 headless browser checks.

Current evidence:

- [Public Discovery And Event Detail Flow Evidence](./public-discovery-event-detail-flow-evidence.md)
- [Public Discovery Responsive Screenshots](./public-discovery-responsive-screenshots.md)
- [Public Discovery Booking State Evidence](./public-discovery-booking-state-evidence.md)
- [Public Discovery Legacy Route Evidence](./public-discovery-legacy-route-evidence.md)
- [Events Data And CMS Readiness Evidence](./events-data-cms-readiness-evidence.md)

## Purpose

This workstream proves that customers can discover all launch events from the public `app/` routes and that every published launch event detail page renders with the correct booking state.

This must be completed before Event Cart And Checkout because checkout can only be trusted after the public surfaces show the correct event, capacity, sold-out, waitlist, and enquiry-only states.

## Scope

- Verify `/workshops`, `/adult-workshops`, `/half-term`, `/summer-holiday`, and `/workshops/:slug`.
- Confirm category filters, date grouping, event cards, image loading, unavailable states, and empty states.
- Confirm every event detail page shows accurate title, date, time, location, price, capacity, copy, and call to action.
- Confirm sold-out events do not allow checkout and route customers to waitlist where enabled.
- Confirm enquiry-only events do not expose paid checkout controls.
- Confirm responsive behavior on mobile and desktop.
- Confirm legacy event URLs redirect to the correct `app/` route or a useful fallback.

## Acceptance Criteria

- Customers can find all launch events from public navigation.
- Every published future event slug renders a non-error `/workshops/:slug` detail page.
- No published launch event has a broken detail page, image, date, price, or booking action.
- Sold-out and enquiry-only events cannot be accidentally purchased.
- Category pages render the expected layout and current production event data.
- Legacy routes do not strand customers on the old app.

## Shipped App Surfaces To Verify

Public routes:

- `app/src/views/Workshops.vue`
- `app/src/components/workshops/WorkshopCalendar.vue`
- `app/src/views/AdultWorkshops.vue`
- `app/src/views/HolidayProgramPage.vue`
- `app/src/views/WorkshopDetail.vue`

Supporting display components:

- `app/src/components/workshops/WorkshopContentDefault.vue`
- `app/src/components/workshops/WorkshopContentAdult.vue`
- `app/src/components/workshops/WorkshopContentSingleSeries.vue`
- `app/src/components/JoinEventWaitlistModal.vue`
- `app/src/utils/workshopDisplay.js`

Audit automation:

- `scripts/audit-public-event-detail-flow.mjs`
- `scripts/audit-public-booking-states.mjs`
- `scripts/audit-legacy-workshop-routes.mjs`

## Delivery Stories

### Story 1: Prove All Event Detail Slugs Render

Goal:

Every published future event slug should open a usable public detail page.

Tasks:

- Pull all future published event slugs from production Supabase.
- Launch the local `app/` route in a real browser.
- Visit each `/workshops/:slug` URL.
- Fail the audit if the page shows loading forever, an error state, "Workshop not found", or no booking/detail marker.
- Save results in the evidence pack.

Done when:

- The detail render audit passes for every published future event slug.
- Any duplicate slug or render failure is either fixed or documented as a blocker.

### Story 2: Spot-Check Public Category Pages

Goal:

The main event discovery routes should show the correct public catalogue experience.

Tasks:

- Spot-check `/workshops` for the calendar/listing experience.
- Spot-check `/adult-workshops` for adult workshop cards, prices, images, and booking controls.
- Spot-check `/half-term` for holiday series display and plus/minus booking controls.
- Spot-check `/summer-holiday` for either valid sessions or a deliberate empty/unavailable state.
- Confirm each visible event links to the intended detail route where applicable.

Done when:

- Category route screenshots or notes are captured.
- No route shows stale/test content, broken layout, or a misleading booking action.

### Story 3: Verify Booking State Presentation

Goal:

Public CTAs should match the production event state before checkout validation.

Tasks:

- Confirm bookable events show booking controls.
- Confirm sold-out events show sold-out or waitlist state.
- Confirm waitlist-enabled events expose the waitlist modal.
- Confirm enquiry-only categories show email/contact CTAs and do not expose instant checkout.
- Confirm capacity text matches the production capacity row.

Done when:

- At least one example of each launch booking state is verified.
- Any missing state is documented before Event Cart And Checkout begins.

### Story 4: Verify Responsive Public Discovery

Goal:

Customers should be able to find and open events on mobile and desktop.

Tasks:

- Check desktop rendering for the core routes.
- Check mobile rendering for the core routes.
- Confirm text does not overlap controls or cards.
- Confirm calendar/list interactions remain usable on a small viewport.

Done when:

- Mobile and desktop spot checks pass or have documented fixes.

### Story 5: Confirm Legacy Route Handling

Goal:

Customers arriving from old workshop links should not be stranded.

Tasks:

- Identify legacy workshop URL patterns still likely to be indexed or linked.
- Confirm redirects or useful fallbacks exist.
- Document any route that needs a redirect rule before production launch.
- Run the legacy route browser audit script against the local app.

Done when:

- Legacy route behavior is approved for events launch and the browser audit passes.

## Evidence Pack Template

| Evidence item | Required contents | Status |
|---------------|-------------------|--------|
| Event detail render audit | Output from `node scripts/audit-public-event-detail-flow.mjs`. | Done |
| `/workshops` spot check | Browser note or screenshot showing the calendar/listing route. | Done |
| `/adult-workshops` spot check | Browser note or screenshot showing adult workshop route and controls. | Done |
| `/half-term` spot check | Browser note or screenshot showing holiday programme route and controls. | Done |
| `/summer-holiday` spot check | Browser note or screenshot showing valid state or accepted empty state. | Done |
| Booking state examples | Bookable, sold-out/waitlist, and enquiry-only examples. | Done |
| Responsive checks | Mobile and desktop route checks. | Done |
| Legacy route handling | Redirect/fallback notes and browser audit output. | Done |

## Go/No-Go Rule

This workstream is green. If any published event detail page fails in a future catalogue update, checkout validation should not start for that event until discovery is fixed.
