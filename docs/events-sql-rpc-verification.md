# Events SQL/RPC Verification

Status: current
Last updated: 2026-05-14
Parent workstream: [Events Data And CMS Readiness](./events-data-cms-readiness.md)
Audit source: production Supabase direct SQL through `supabase-cli-pg`

## Run Summary

| Check | Result |
|-------|--------|
| Audit date | 2026-05-14 |
| Project | hubbjhtjyubzczxengyo.supabase.co |
| Policy tables checked | 7 |
| RPCs checked | 2 |
| Findings | 0 |
| P0 findings | 0 |
| P1 findings | 0 |

## RLS Policy Summary

| Table | Exists | RLS enabled | Policies | SELECT policies | Mutation policies |
| --- | --- | --- | --- | --- | --- |
| public.event_capacity | yes | yes | 2 | 1 | 1 |
| public.event_categories | yes | yes | 5 | 2 | 3 |
| public.offering_events | yes | yes | 4 | 1 | 3 |
| public.offerings | yes | yes | 2 | 1 | 1 |
| public.page_sections | yes | yes | 5 | 2 | 3 |
| public.site_pages | yes | yes | 5 | 2 | 3 |
| storage.objects | yes | yes | 8 | 2 | 6 |

## RLS Policy Names

| Table | Command | Policy | Roles |
| --- | --- | --- | --- |
| public.event_capacity | ALL | Admins can manage event capacity | public |
| public.event_capacity | SELECT | Public can view event capacity | public |
| public.event_categories | DELETE | Admins can delete event categories (app_metadata) | authenticated |
| public.event_categories | INSERT | Admins can insert event categories (app_metadata) | authenticated |
| public.event_categories | UPDATE | Admins can update event categories (app_metadata) | authenticated |
| public.event_categories | SELECT | Authenticated users can view all event categories | authenticated |
| public.event_categories | SELECT | Public can view active event categories | public |
| public.offering_events | DELETE | Admins can delete offering events | public |
| public.offering_events | INSERT | Admins can insert offering events | public |
| public.offering_events | UPDATE | Admins can update offering events | public |
| public.offering_events | SELECT | Public can view offering events | public |
| public.offerings | ALL | Admins can manage all offerings | public |
| public.offerings | SELECT | Public can view published offerings | public |
| public.page_sections | DELETE | Admins can delete page sections | authenticated |
| public.page_sections | INSERT | Admins can insert page sections | authenticated |
| public.page_sections | UPDATE | Admins can update page sections | authenticated |
| public.page_sections | SELECT | Admins can view all page sections | authenticated |
| public.page_sections | SELECT | Public can view enabled sections for published pages | public |
| public.site_pages | DELETE | Admins can delete site pages | authenticated |
| public.site_pages | INSERT | Admins can insert site pages | authenticated |
| public.site_pages | UPDATE | Admins can update site pages | authenticated |
| public.site_pages | SELECT | Admins can view all site pages | authenticated |
| public.site_pages | SELECT | Public can view published site pages | public |
| storage.objects | DELETE | Admins can delete images | public |
| storage.objects | DELETE | Admins can delete site images | authenticated |
| storage.objects | UPDATE | Admins can update images | public |
| storage.objects | UPDATE | Admins can update site images | authenticated |
| storage.objects | INSERT | Admins can upload images | public |
| storage.objects | INSERT | Admins can upload site images | authenticated |
| storage.objects | SELECT | Public can view images | public |
| storage.objects | SELECT | Public read access for site images | public |

## RPC Summary

| RPC | Found | Signature | Returns | Security definer | Fixed search_path | Grantees | Admin guard | Capacity body terms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| update_event_capacity_total | yes | p_offering_event_id uuid, p_total_capacity integer, p_waitlist_enabled boolean | void | yes | yes | authenticated, postgres, service_role | yes | yes |
| decrement_event_capacity | yes | p_offering_event_id uuid, p_attendees integer | void | yes | yes | postgres, service_role | no | yes |

## Findings

_No rows._

## Interpretation

- Direct SQL can read `pg_policies`, `pg_proc`, and routine grants in production.
- RLS table checks confirm whether the target tables have RLS enabled and policies present; they do not prove every policy expression is semantically correct.
- RPC verification checks production function signatures, `SECURITY DEFINER`, explicit `search_path`, routine grants, and whether the function definitions include the expected capacity synchronization terms.
- Mutating RPCs were not executed against live event rows during this audit.
