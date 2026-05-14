# Admin UI Edit Proof

Status: current
Last updated: 2026-05-14
Parent workstream: [Events Data And CMS Readiness](./events-data-cms-readiness.md)
Proof status: Verified and cleaned up

## Scope

This proof verifies that an authenticated admin can edit event, category, and capacity data through the app admin UI, without direct SQL for the edit actions.

## Test Records

| Record | ID | Public risk |
|--------|----|-------------|
| Temporary admin user | d165030e-7313-478c-8423-f9fa9690c064 | Deleted during cleanup |
| Draft event offering | 7968189b-408e-4c40-8df9-0c9833f4cbdb | `status = draft`; not public |
| Event details row | a7aa7e40-5f86-4bf4-a605-aeb3a73fb1fa | Attached to draft offering |
| Event capacity row | 81f1602d-75dc-43f3-afe4-436e2c0dcac4 | Attached to draft event |
| Inactive category | 3e7d9b1b-bdb8-41a9-b587-1ca9a7c8cab6 | `is_active = false`; not public |

## UI Actions Verified

| Area | Before | After |
| --- | --- | --- |
| Offering title | Codex Proof Event 20260514094800 | Codex Proof Event 20260514094800 UI Edited |
| Offering short copy | Temporary draft event for admin UI proof. | Edited through the admin offering UI proof. |
| Event max capacity | 8 | 9 |
| Event available spaces | 8 | 9 |
| Capacity total | 8 | 9 |
| Category name | Codex Proof Category 20260514094800 | Codex Proof Category 20260514094800 UI Edited |
| Category description | Temporary inactive category for admin UI proof. | Edited through the admin category UI proof. |
| Category layout | standard | enquiry_only |

## Verification Checks

| Check | Expected | Actual | Result |
| --- | --- | --- | --- |
| Offering title | Codex Proof Event 20260514094800 UI Edited | Codex Proof Event 20260514094800 UI Edited | passed |
| Offering short copy | Edited through the admin offering UI proof. | Edited through the admin offering UI proof. | passed |
| Offering remains draft | draft | draft | passed |
| Event max capacity | 9 | 9 | passed |
| Event available spaces | 9 | 9 | passed |
| Capacity total | 9 | 9 | passed |
| Category name | Codex Proof Category 20260514094800 UI Edited | Codex Proof Category 20260514094800 UI Edited | passed |
| Category description | Edited through the admin category UI proof. | Edited through the admin category UI proof. | passed |
| Category layout | enquiry_only | enquiry_only | passed |
| Category remains inactive | false | false | passed |

## Cleanup

| Action | Result | Error |
| --- | --- | --- |
| delete event_capacity | passed | - |
| delete offering_events | passed | - |
| delete offerings | passed | - |
| delete event_categories | passed | - |
| delete proof admin user | passed | - |

## Notes

- Setup and cleanup used the service role to create and remove temporary proof data.
- The edit actions were performed through the admin UI using a temporary authenticated admin user.
- The proof event remained draft and the proof category remained inactive throughout the test.
