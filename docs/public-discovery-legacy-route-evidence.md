# Public Discovery Legacy Route Evidence

Status: current
Last updated: 2026-05-14
Parent workstream: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)
Audit source: headless Chrome route checks against http://127.0.0.1:5173

## Run Summary

| Check | Result |
|-------|--------|
| Legacy routes checked | 14 |
| Passed | 14 |
| Failed | 0 |

## Route Checks

| Result | Legacy URL | Expected target | Actual target | Required marker | Failure |
| --- | --- | --- | --- | --- | --- |
| passed | /adult-art-workshops | /adult-workshops | /adult-workshops | Adult Art Workshops | - |
| passed | /summer-workshops | /summer-holiday | /summer-holiday | Summer Holiday | - |
| passed | /holiday-workshops | /half-term | /half-term | Half Term | - |
| passed | /behaviour-policy | /terms-and-conditions | /terms-and-conditions | Terms and Conditions | - |
| passed | /basket | /cart | /cart | Shopping Cart | - |
| passed | /registration | /workshops | /workshops | Workshops | - |
| passed | /private-parties | /workshops/private-party-* | /workshops/private-party-25-05 | Private Party, Book By Email | - |
| passed | /category/story-of-art-club-4-8 | /workshops/* | /workshops/matisse-and-drawing-with-scissors-thurs-4-8 | Book your workshops below | - |
| passed | /event-details/ht_lo_tues | /workshops/ht_lo_tues | /workshops/ht_lo_tues | Book your workshops below | - |
| passed | /event-details/su02_story_of_art_club_9_13 | /workshops/su02_story_of_art_club_9_13-* | /workshops/su02_story_of_art_club_9_13-naive-art-and-the-jungle | Book your workshops below | - |
| passed | /event-details/aw01_story_of_art_club_4_8 | /workshops/* | /workshops/matisse-and-drawing-with-scissors-thurs-4-8 | Book your workshops below | - |
| passed | /event-details/aw01_lo_tues | /workshops/* | /workshops/tues-lo-vases-of-flowers | Book your workshops below | - |
| passed | /booking/aw01_sat | /workshops/* | /workshops/su01_sat01-exploring-cyanotype-and-sun-printed-flowers | Book your workshops below | - |
| passed | /event-details/legacy-missing-route-proof | /workshops | /workshops | Workshops | - |

## Handling Rules

| Legacy pattern | Handling |
|---|---|
| /adult-art-workshops | Static redirect to /adult-workshops |
| /summer-workshops | Static redirect to /summer-holiday |
| /holiday-workshops | Static redirect to /half-term |
| /behaviour-policy | Static redirect to /terms-and-conditions |
| /basket | Static redirect to /cart |
| /registration | Static redirect to /workshops because old registration/cart state cannot be recovered safely |
| /private-parties | Resolves to the next published Private Party event detail page |
| /category/:categorySlug | Resolves direct programme categories or the next published event for that category |
| /event-details/:id | Resolves exact current event IDs, current slug prefixes, or known old homepage event IDs to the next relevant published event |
| /booking/:id | Uses the same event resolver as /event-details/:id, then falls back to /workshops |

## Notes

- Known old homepage IDs such as aw01_story_of_art_club_4_8 and aw01_lo_tues no longer exist as production event IDs. They are handled as course/category hints and route to the next matching published event.
- Unknown legacy event IDs fall back to /workshops instead of showing a dead page.
- Static redirects are also present in netlify.toml for the legacy routes that do not require Supabase lookup.
