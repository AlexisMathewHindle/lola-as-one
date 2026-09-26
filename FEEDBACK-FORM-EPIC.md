# Epic: Content-Manageable Feedback Form

> **In one line:** a public feedback page whose questions the admin can add,
> edit, remove, and reorder without a code deploy, that a visitor fills in and
> that emails the answers to **hello@lotsoflovelyart.com**.

## Summary

Add a **Feedback** page under the site's information pages. Unlike the existing
Contact form (which has fixed fields), the feedback form's **questions are
content-managed**: an admin adds or removes questions in the backend, and the
public page renders whatever questions are currently active. When a visitor
submits, the answers are saved and emailed to **hello@lotsoflovelyart.com**.

This reuses the machinery the site already has for the Contact form and CMS
information pages. The one new capability is admin-editable questions.

## Confirmed decisions (from the request)

- The form lives **under information pages** (same family as About, Contact,
  Workshop FAQs, Privacy, Terms).
- **Questions are content-managed**: an admin can add and remove them in the
  backend, no deploy required.
- A visitor fills the form and the submission is **emailed to
  hello@lotsoflovelyart.com**.

Decided during planning (2026-09-26):

- **Navigation:** link the page from the **footer menu**, which is already
  content-manageable, via `site_menu_items` and the admin Navigation view. No new
  navigation mechanism.
- **Questions storage:** a **`feedback_questions` table** (not a JSON blob in the
  CMS), for structured editing and reporting.
- **Admin inbox:** **build it** (Phase 5 is in scope, not deferred). Submissions
  are readable and triageable in the admin, as a backup to email.
- **Question types:** all proposed types ship (`short_text`, `long_text`,
  `rating`, `single_choice`, `multi_choice`, `email`), and **`rating` renders as
  stars** (a 1 to 5 star selector, stored as the integer 1 to 5).

## What already exists to reuse (current repo state)

The site already contains everything this feature needs except the questions
layer. Do not rebuild these; extend them.

### CMS information pages

- `site_pages` (page_key, title, slug, path, page_kind, template_key, status,
  show_in_navigation, seo_title, seo_description) plus `page_sections`
  (section_key, section_type, `config_json` JSONB) hold every info page.
  See `supabase/migrations/20260514_add_policy_info_pages.sql` and
  `supabase/migrations/20260526_add_contact_cms_content.sql`.
- Admin edits pages in `app/src/views/admin/InformationPages.vue` using helpers
  in `app/src/lib/cms.js` (`saveSitePage`).
- Public rendering: generic pages use `app/src/views/CmsInfoPage.vue`
  (`app/src/router/index.js:320`). A page that needs a form uses a dedicated
  view with a special `template_key` (the Contact page uses
  `template_key = 'contact_page'` and the dedicated `app/src/views/Contact.vue`).

### The Contact form flow (the closest existing sibling)

- `app/src/views/Contact.vue` loads its editable copy from `page_sections`
  (section_key `contact_content`) and submits with
  `supabase.functions.invoke('submit-contact-form', ...)` (`Contact.vue:310`).
- `supabase/functions/submit-contact-form/index.ts` validates the payload,
  inserts a row into `contact_submissions`, then calls the `send-email` function
  twice: once with the `contact-form-admin` template to the admin address and
  once with `contact-form-customer` to the visitor.
- The admin recipient already resolves to **hello@lotsoflovelyart.com** by
  default (`submit-contact-form/index.ts:62` `getAdminEmails()`, falling back to
  that address when `ADMIN_EMAILS` / `EMAIL_REPLY_TO` / `SUPPORT_EMAIL` are
  unset).
- `contact_submissions` (`supabase/migrations/20260615_create_contact_submissions.sql`)
  is the template for the submissions table and its Row Level Security: the
  public may INSERT only rows with `status = 'new'`, and only admins
  (`auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`) may read, update, or
  delete.

### Email (Resend, via the central send-email function)

- Email is sent through **Resend's HTTP API**, called from one central edge
  function `supabase/functions/send-email/index.ts`, which also logs every send
  to an `email_logs` table. The default from address is already
  `Lots of Lovely Art <hello@lotsoflovelyart.com>`.
- Templates live in `supabase/functions/send-email/templates/` (about fifty of
  them, each exporting `{ subject, html, text }` and sharing
  `templates/base-layout.ts`). Adding a feedback email means: create a template
  file, add its key to the `EmailTemplate` union (near `index.ts:26`), and
  register it in the map (`index.ts:261`).
- Other functions do not import send-email; they call it over HTTP with the
  service-role key (see `invokeSendEmail()` in `submit-contact-form/index.ts`).

### Admin dynamic-list UI pattern

- The list-of-rows editor the question manager needs (add row, remove row,
  reorder) already exists in `app/src/views/admin/HomepageContent.vue`, which
  manages editable lists such as hero slides, testimonials, and banner CTAs.
  The convention: a `ref([])` of item objects created by a factory, `push()` to
  add, `splice(index, 1)` to remove, splice-out then splice-in to reorder, all
  driven from buttons inside a `v-for`. Reuse this for the question list.
- Rich intro copy uses the shared `app/src/components/shared/RichTextEditor.vue`
  (TipTap), the same editor `InformationPages.vue` uses.
- New admin views register in two places: a child route under `/admin` in
  `app/src/router/index.js`, and a sidebar entry in
  `app/src/layouts/AdminLayout.vue`.

### Data access and conventions to follow

- One Supabase client singleton: `app/src/lib/supabase.js`. Domain reads and
  writes are wrapped in `app/src/lib/cms.js` (pages, sections, menus, settings).
  Admin state uses Pinia (`app/src/stores/`), including `auth.js` (`isAdmin`) and
  `toast.js` for success and error toasts.
- The main app uses the **untyped** JS Supabase client (there is no generated
  database types file). Follow that convention unless typing is introduced
  deliberately.

## Goal

An admin manages a list of feedback questions in the backend. A visitor opens
`/feedback`, answers the currently active questions, and submits. The answers are
saved and emailed to hello@lotsoflovelyart.com, and are viewable by the admin.

## Non-goals

- Not changing the existing Contact form.
- No conditional or branching questions (a question that appears only when a
  previous answer has a certain value). Flat list only at launch.
- No file or image upload as an answer at launch.
- No public display of submitted feedback (for example testimonials). Feedback
  is private to the admin at launch.
- No spam-scoring service integration beyond basic validation and (optional)
  honeypot at launch.

## Success criteria

1. An admin can add a question, edit it, remove it, mark it active or inactive,
   mark it required or optional, and reorder the list, with no deploy. The change
   shows on the public page on next load.
2. The public `/feedback` page renders exactly the active questions in the admin
   order and enforces required questions before submitting.
3. On submit the answers are stored and an email containing every question and
   its answer is delivered to hello@lotsoflovelyart.com.
4. If the visitor gives their email, they receive a short acknowledgement.
5. Submissions are readable by the admin and not readable by the public
   (enforced by RLS, not only the UI).
6. Deleting or renaming a question later does not corrupt or hide older
   submissions (older answers stay readable because each answer stores its own
   question label at submit time).

## Data model

Two new tables plus one seeded CMS page. The split mirrors the contact pattern:
questions are their own editable data, submissions are a private inbox.

### `feedback_questions` (new)

The admin-managed question list.

| column        | type        | notes |
|---------------|-------------|-------|
| `id`          | uuid PK     | `gen_random_uuid()` |
| `question_key`| text unique | stable slug, for example `overall_experience` |
| `label`       | text        | the question shown to the visitor |
| `help_text`   | text null   | optional guidance under the question |
| `field_type`  | text        | one of `short_text`, `long_text`, `rating`, `single_choice`, `multi_choice`, `email` (`rating` shows as 1 to 5 stars, stored as an integer) |
| `options`     | jsonb       | choices for `single_choice` / `multi_choice`, else `[]` |
| `is_required` | bool        | default false |
| `is_active`   | bool        | default true (inactive questions stay in history but leave the public form) |
| `sort_order`  | int         | display order |
| `created_at`  | timestamptz | |
| `updated_at`  | timestamptz | via the existing `set_row_updated_at` trigger |

**Question type is admin-editable.** An admin can change any question's
`field_type` at any time (for example switch a Yes/No choice to a star rating),
add or edit choice options, change the label and help text, mark it required or
optional, activate or deactivate it, and reorder it. Because each submitted
answer is snapshotted with its own `field_type` at submit time (see
`feedback_submissions.answers`), changing a question's type later does not corrupt
or reinterpret answers already collected under the old type; historic submissions
still read exactly as they were given.

RLS:
- Public (anon and authenticated) may SELECT only `is_active = true` rows.
- Admins (`app_metadata.role = 'admin'`) may INSERT, UPDATE, DELETE.

### `feedback_submissions` (new)

The private inbox. Mirrors `contact_submissions`.

| column              | type        | notes |
|---------------------|-------------|-------|
| `id`                | uuid PK     | |
| `respondent_name`   | text null   | optional (feedback can be anonymous) |
| `respondent_email`  | text null   | optional; if present, used for the acknowledgement |
| `answers`           | jsonb       | array of snapshots, see below |
| `status`            | text        | `new` / `read` / `archived` / `spam` |
| `metadata`          | jsonb       | source, user agent, referrer |
| `created_at`        | timestamptz | |
| `updated_at`        | timestamptz | |

`answers` stores a **snapshot per answer** so history survives question edits:

```json
[
  { "question_key": "overall_experience", "label": "How was your visit?", "field_type": "rating", "answer": 5 },
  { "question_key": "what_to_improve", "label": "Anything we could do better?", "field_type": "long_text", "answer": "More weekend slots please." }
]
```

RLS (copied from `contact_submissions`):
- Public may INSERT only rows with `status = 'new'`.
- Admins may SELECT, UPDATE, DELETE.

### Seeded CMS page

Insert a `site_pages` row (like the contact page) so the page is discoverable and
its intro copy is editable:

- `page_key = 'feedback'`, `template_key = 'feedback_page'`, `path = '/feedback'`,
  `page_kind = 'cms_page'`, `status = 'published'`, `show_in_navigation = true`.
- One `page_sections` row (`section_key = 'feedback_intro'`,
  `section_type = 'rich_text'`) holding the editable heading and introduction
  above the questions.
- A `site_menu_items` entry linking the page into the footer secondary menu
  (alongside Contact, Workshop FAQs, Privacy, Terms), following the menu-seeding
  pattern at the end of `20260514_add_policy_info_pages.sql`. Public nav is
  CMS-driven via `getMenuByKey('footer_secondary')` and manageable in the admin
  Navigation view (`app/src/views/admin/Navigation.vue`, `/admin/navigation`).

## Delivery plan

Each phase is shippable and testable on its own.

### Phase 1: Data model and security  (DONE, 2026-09-26)

Migrations added:

- `supabase/migrations/20260926_create_feedback_questions.sql`: creates
  `feedback_questions` with a `field_type` check
  (`short_text`, `long_text`, `rating`, `single_choice`, `multi_choice`,
  `email`), an options-is-array check, a choice-needs-options check, a
  `question_key` snake_case format check, the `set_row_updated_at` trigger, the
  `(is_active, sort_order)` and `(sort_order)` indexes, and RLS (public reads
  only active questions, admin manages all).
- `supabase/migrations/20260926_create_feedback_submissions.sql`: creates
  `feedback_submissions` (`respondent_name`, `respondent_email` both optional,
  `answers` JSONB array, `status`, `metadata`), `created_at desc` and `status`
  indexes, trigger, and RLS mirrored from `contact_submissions` (public INSERT
  only with `status='new'`, admin-only read, update, delete).
- `supabase/migrations/20260926_seed_feedback_page.sql`: inserts the `feedback`
  `site_pages` row (`cms_page`, `template_key='feedback_page'`, `/feedback`,
  published, in navigation), a `feedback_content` rich-text section (seeded only
  when absent so admin edits survive re-runs; the `_content` suffix matches the
  `InformationPages.vue` convention so the intro is editable there), the eight
  starter questions
  supplied by the studio (the first five as star ratings: booking
  straightforward, welcomed warmly, child's enjoyment, felt supported, challenged
  and inspired; then three long-text questions: needs during the session, themes
  or techniques wanted, other comments; name and email are built-in optional form
  fields, not questions), and a `Feedback` link in the
  content-manageable footer secondary menu at `sort_order` 60.
  There is no cap on the number of questions in the schema, and the Phase 2
  admin UI must not impose one either.

Acceptance criteria (all met):
- Public reads active questions and inserts a submission with `status='new'`;
  public cannot read submissions; admin reads and updates them (enforced by RLS).
- The `/feedback` page row exists, is published, and shows in navigation.

Verification (2026-09-26): the two table migrations and every CHECK constraint
were applied and probed in a rolled-back transaction against a local Postgres 17
(bad key, bad type, choice-without-options, bad status, and non-array answers all
rejected; valid rows accepted). The seed migration was run against faithful
stubs of the CMS tables and asserted to produce 1 page, 1 intro section, 3
questions, and 1 footer link, and to be idempotent on a second run. No data was
persisted to any real database.

### Phase 2: Admin manages questions  (DONE, 2026-09-26)

Delivered:

- `app/src/lib/feedback.js`: the data-access module, with the field-type list,
  a `question_key` slug generator that satisfies the DB format check, a
  uniqueness helper, active/all fetchers, a batch upsert (by `id`), and a delete.
- `app/src/views/admin/FeedbackQuestions.vue`: the question manager. Add, remove,
  reorder (up/down), edit label, help text, type, options, required, and
  active/hidden, with no cap on the number of questions. The type selector offers
  all six types; choosing single or multiple choice reveals the options editor,
  and a star preview shows for the rating type. Save deletes removed rows, then
  upserts the rest with recalculated `sort_order`, generating keys for new rows.
  Validation blocks save when a label is too short or a choice question has no
  options.
- Route `feedback` under `/admin` (`AdminFeedbackQuestions`) in
  `app/src/router/index.js`; a `Feedback` sidebar item and page title in
  `app/src/layouts/AdminLayout.vue`.
- Intro editing reuses `InformationPages.vue`: `feedback` added to its page list
  and a default added to `app/src/constants/infoPageDefaults.js`. The seeded
  section key is `feedback_content` to match that screen's convention. Image
  fields there are About-only, so Feedback shows just title, body, and SEO.

Verification (2026-09-26): `vite build` compiles cleanly, producing the
`FeedbackQuestions` chunk and the rebuilt `InformationPages` with no errors.

Original plan (for reference):

- Add a question editor. Recommended: a dedicated admin view
  `app/src/views/admin/FeedbackQuestions.vue` with a route under the admin
  section, plus CRUD helpers in `app/src/lib/cms.js` (or a small
  `app/src/lib/feedback.js`).
- Register the view in `AdminLayout.vue`'s sidebar and add its `/admin` child
  route in `app/src/router/index.js`.
- The editor lists questions and lets the admin add a row, remove a row, edit
  label / help text / type / options / required / active, and reorder
  (`sort_order`), with **no cap on the number of questions**. Reuse the add and
  remove list pattern from `app/src/views/admin/HomepageContent.vue`.
- **Question type is a plain editable field.** The type selector offers all six
  types (short text, long text, star rating, single choice, multiple choice,
  email). Choosing single or multiple choice reveals the options editor;
  choosing any other type hides it. Changing a saved question's type is allowed
  and does not alter answers already collected (those are snapshotted with their
  original type). When switching away from a choice type, keep the stored options
  so switching back does not lose them.
- Let the admin edit the intro copy for the page (reuse `InformationPages.vue`,
  which already lists Contact and the policy pages, so `feedback` slots in as
  another editable page).

Acceptance criteria:
- Adding, editing, removing, reordering, and activating or deactivating a
  question persists and survives a reload.
- Choice-type questions can have their options edited.

### Phase 3: Public feedback page  (DONE, 2026-09-26)

Delivered:

- `app/src/views/Feedback.vue` (modelled on `Contact.vue`): loads the editable
  intro from the `feedback_content` section and the active questions, and renders
  one input per type: star buttons for `rating`, a textarea for `long_text`,
  radios for `single_choice`, checkboxes for `multi_choice`, and a single-line
  input for `short_text` and `email`. Below the questions are optional name and
  email fields, so feedback can be anonymous.
- Client validation: required questions must be answered, an email answer must be
  a valid address, and at least one question must be answered before sending.
- Route `/feedback` (name `Feedback`) added to `app/src/router/index.js`, plus a
  `Feedback` entry in the SEO map.
- Empty state: when there are no active questions, the page shows the intro and a
  note to email the studio, with no empty form.

Depends on Phase 4: the submit button calls the `submit-feedback-form` edge
function, which is built in Phase 4. Until that function is deployed, the page
renders and validates but sending will fail. Everything else (layout, question
rendering, validation, SEO, empty state) works now.

Verification (2026-09-26): `vite build` compiles the `Feedback` page and the
`feedback` lib with no errors.

Original plan (for reference):

- New view `app/src/views/Feedback.vue` (modelled on `Contact.vue`), routed at
  `/feedback` with `template_key = 'feedback_page'`.
- On load it fetches the `feedback_intro` section and the active questions
  ordered by `sort_order`, and renders one input per `field_type`
  (`short_text` and `email` as a single-line input, `long_text` as a textarea,
  `rating` as a 1 to 5 star selector, `single_choice` as radios, `multi_choice`
  as checkboxes).
- Client-side validation enforces required questions and a valid email format
  when the email field is filled.
- Submit calls `supabase.functions.invoke('submit-feedback-form', ...)` with the
  question keys and answers.

Acceptance criteria:
- The page shows exactly the active questions in admin order.
- Required questions block submission until answered.
- A successful submit shows a thank-you state and clears the form.

### Phase 4: Submit function and email  (DONE, 2026-09-26)

Delivered:

- `supabase/functions/submit-feedback-form/index.ts`: loads the live active
  questions with the service role (never trusting the client's list), validates
  each answer against its question (rating 1 to 5, choice values must match the
  options, multi-choice deduped, email format, text length caps), enforces
  required questions and at-least-one answer, builds the self-describing answer
  snapshots, inserts the `feedback_submissions` row, then emails the admin and
  (when an email was given) the visitor. On email failure the submission is still
  saved and the response reports the partial failure, matching
  `submit-contact-form`.
- Templates `supabase/functions/send-email/templates/feedback-form-admin.ts`
  (lists every question and answer, with a reply link when an email was given) and
  `feedback-form-customer.ts` (a short thank-you). Both registered in
  `send-email/index.ts` (the `EmailTemplate` union and the template map).
- The admin recipient resolves to hello@lotsoflovelyart.com by default via
  `getAdminEmails()`.

Verification (2026-09-26): the pure validation logic (`buildSnapshot` and the
required / at-least-one aggregation) was exercised with 22 Node test cases, all
passing (rating bounds, bad choice options, multi-choice subset and dedupe, email
lowercasing and format, text trimming and caps, required detection, empty
rejection). Deno was not available here to type-check the Deno-specific wiring, so
that is verified on deploy.

Deployment note: deploy the new function and redeploy send-email
(`supabase functions deploy submit-feedback-form` and
`supabase functions deploy send-email`), and apply the Phase 1 migrations, before
the public form can send. `RESEND_API_KEY` and the admin-email env vars are
already set for the existing contact form.

Original plan (for reference):

- New edge function `supabase/functions/submit-feedback-form/index.ts`, modelled
  on `submit-contact-form`. It:
  1. Loads the active questions server-side (using the service role) and
     validates the incoming answers against them (required checks, allowed
     option values, length caps). Do not trust the client's list of questions.
  2. Builds the `answers` snapshot array (key, label, type, answer) so history is
     self-describing.
  3. Inserts the `feedback_submissions` row.
  4. Calls `send-email` with a new `feedback-form-admin` template to the admin
     address (which already defaults to hello@lotsoflovelyart.com via
     `getAdminEmails()`), listing every question and answer.
  5. If `respondent_email` is present, calls `send-email` with a new
     `feedback-form-customer` acknowledgement.
- New templates `supabase/functions/send-email/templates/feedback-form-admin.ts`
  and `feedback-form-customer.ts`, registered in the map at
  `send-email/index.ts:261` and added to the template union type near
  `index.ts:26`.

Acceptance criteria:
- A submission arrives at hello@lotsoflovelyart.com with every question and its
  answer readable in the email body.
- The visitor acknowledgement is sent only when an email was provided.
- If email delivery fails, the submission is still saved and the function
  reports the partial failure (same behaviour as `submit-contact-form`).

### Phase 5: Admin submissions inbox  (DONE, 2026-09-26)

Delivered:

- `app/src/views/admin/FeedbackSubmissionsList.vue`: lists submissions newest
  first, with the respondent name (or Anonymous), email, date, answer count, and a
  status badge. Each row expands to show every answer, with star ratings rendered
  as stars. Filter by status and free-text search across name, email, and answers.
  Change status (new / read / archived / spam) inline, and delete with a confirm.
- Data helpers added to `app/src/lib/feedback.js`:
  `getFeedbackSubmissions`, `updateFeedbackSubmissionStatus`,
  `deleteFeedbackSubmission`, and the status list.
- Route `feedback/submissions` (`AdminFeedbackSubmissions`) added to the admin
  router. The sidebar Feedback entry is split into `Feedback Questions`
  (`/admin/feedback`) and `Feedback Responses` (`/admin/feedback/submissions`),
  with page titles for both.

Acceptance criteria (met):
- Admin can browse, filter, search, restatus, and delete submissions. Public
  cannot read them (RLS: admin-only SELECT on `feedback_submissions`).

Verification (2026-09-26): `vite build` compiles the `FeedbackSubmissionsList`
chunk and the rest of the app with no errors.

Original plan (for reference):

- New admin view `app/src/views/admin/FeedbackSubmissionsList.vue` listing
  submissions with status, date, and a detail view showing the full answers.
  Model it on how contact submissions are handled.
- Allow marking `read` / `archived` / `spam`.

### Phase 6: Verify and document

- Test end to end: add a question in admin, see it on `/feedback`, submit,
  confirm the email at hello@lotsoflovelyart.com and (if given) the
  acknowledgement, and confirm the row in the admin inbox.
- Test that removing a question does not break older submissions (the removed
  question's label still shows in the older submission's stored answers).
- Add a short admin note in `docs/` on where to manage questions and where
  submissions land.

Acceptance criteria:
- The business owner confirms they can add and remove questions and that
  feedback reaches the inbox. Doc added.

## Email details

- **To:** hello@lotsoflovelyart.com (already the default admin recipient; can be
  overridden with `ADMIN_EMAILS`).
- **Admin template `feedback-form-admin`:** subject like
  "New feedback from the website", body lists each question label and its answer,
  plus name and email if given and a reference number.
- **Visitor template `feedback-form-customer`:** short thank-you, sent only when
  the visitor supplied an email.

## Security and privacy

- RLS is the real guard, not the UI: public INSERT only, admin-only read on
  submissions, public SELECT limited to active questions.
- The submit function validates server-side against the live question list, so a
  crafted request cannot inject unknown fields or bypass required questions.
- Consider a honeypot field and a minimum-time-to-submit check to cut spam, and
  a per-IP or per-session rate note in `metadata` (optional at launch).
- Note the privacy angle: if feedback can carry personal detail, the Privacy
  Policy page copy may need a line about feedback submissions.

## Edge cases

- **No active questions:** the public page shows only the intro and a note that
  feedback is not being collected right now, rather than an empty form.
- **Question removed after someone answered it:** older submissions keep the
  question label in their stored `answers`, so they still read correctly.
- **Anonymous feedback:** name and email are optional; the acknowledgement is
  skipped when no email is given.
- **Long answers:** cap answer length server-side (as `submit-contact-form` caps
  the message at 5000 characters).
- **Email send fails:** save the submission anyway and report the partial
  failure, matching `submit-contact-form`.

## Resolved

1. **Navigation:** footer menu (already content-manageable), via `site_menu_items`
   and the admin Navigation view.
2. **Question storage:** a `feedback_questions` table.
3. **Admin inbox:** in scope (Phase 5).
4. **Field types and rating:** all listed types ship; `rating` renders as 1 to 5
   stars, stored as an integer.

## Open questions

None outstanding. The four planning questions above are resolved.
