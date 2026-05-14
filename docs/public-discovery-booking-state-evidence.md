# Public Discovery Booking State Evidence

Status: current
Last updated: 2026-05-14
Parent workstream: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)
Audit source: production Supabase plus headless Chrome checks against http://127.0.0.1:5173

## Run Summary

| Check | Result |
|-------|--------|
| Audit date | 2026-05-14 |
| Future published event rows | 117 |
| Booking state targets | 5 |
| Passed states | 5 |
| Failed states | 0 |
| Not present in catalogue | 2 |

## Booking State Checks

| Result | State | Title | Slug | Category | Layout | Spaces | Waitlist enabled | Observed UI | URL | Failure or note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| passed | Bookable standard event | Matisse and Drawing with Scissors | matisse-and-drawing-with-scissors-thurs-4-8 | The Story of Art Club (ages 4-8) | standard | 6 | false | Book your workshops below | http://127.0.0.1:5173/workshops/matisse-and-drawing-with-scissors-thurs-4-8 | - |
| passed | Adult workshop booking | Hand-painted Fabric Wall Hangings | hand-painted-fabric-wall-hangings | Adult Workshops | adult_workshop | 6 | true | Book Now | http://127.0.0.1:5173/workshops/hand-painted-fabric-wall-hangings | - |
| passed | Enquiry-only private party | Private Party | private-party-25-05 | Private Party | enquiry_only | 10 | false | Book By Email | http://127.0.0.1:5173/workshops/private-party-25-05 | - |
| not_present | Sold-out event | - | - | - | - | - | - | - | - | No sold-out future published event exists in the current launch catalogue. |
| not_present | Sold-out waitlist-enabled event | - | - | - | - | - | - | - | - | No future published event is both sold out and waitlist-enabled in the current launch catalogue. |

## Interpretation

- `not_present` is acceptable for sold-out and waitlist states when production has no matching future published launch event.
- Waitlist UI is only expected when an event is sold out and the event row has `waitlist_enabled = true`.
- Enquiry-only events should expose email/contact actions and must not expose instant checkout.
