# Feedback form

A content-manageable feedback form for the Lola As One website. The studio
controls the questions from the admin area, visitors fill it in on a public page,
and every response is saved and emailed to hello@lotsoflovelyart.com.

Built in the [FEEDBACK-FORM-EPIC.md](../FEEDBACK-FORM-EPIC.md) (phases 1 to 6).
This doc is the operating guide and technical reference.

Status: live. Functions deployed to the LOLA project, tables applied, and the
submit path smoke-tested on 2026-09-26 (see Verification at the bottom).

---

## For the studio team

### Where to manage the questions

Admin area, left menu, under Content:

- **Feedback Questions** (`/admin/feedback`): the list of questions shown on the
  public form.
- **Feedback Responses** (`/admin/feedback/submissions`): everything visitors
  have sent.

The public form itself is at **`/feedback`**, linked from the footer menu.

### Adding, changing, and removing questions

On the Feedback Questions screen:

- **Add question** adds a new blank question at the bottom. There is no limit on
  how many you can have.
- The arrows on each question move it up or down. That order is the order visitors
  see.
- **Shown on page / Hidden** (the tick box at the top of each question) controls
  whether visitors see that question. Hiding a question keeps it and its past
  answers, it just takes it off the form.
- **Required** means a visitor cannot send the form until they answer that
  question. Leave it off for optional questions.
- The bin icon removes a question. Removing a question does not change or delete
  responses people already gave to it, those stay readable in Feedback Responses.
- Nothing is saved until you press **Save changes**.

### Answer types

Pick the type from the Answer type dropdown on each question:

- **Star rating (1 to 5)**: the visitor taps one to five stars. Good for questions
  like "How would you rate your child's enjoyment?"
- **Short text**: a single line, for a brief answer.
- **Long text**: a bigger box, for comments and suggestions.
- **Single choice**: the visitor picks one option from a list you set. Choosing
  this reveals an Options box where you type each choice.
- **Multiple choice**: the visitor can tick several options from a list you set.
- **Email address**: a single line that must be a valid email.

You can change a question's type whenever you like, even after people have
answered it. Old answers keep the wording and type they were given under, so your
history stays correct.

Name and email are already built in as separate optional boxes at the bottom of
the form, so you do not need to add them as questions. Visitors can leave them
blank to send feedback anonymously.

### Editing the intro text

The heading and paragraph above the questions live in the normal
**Information Pages** screen (`/admin/pages`), under the **Feedback** page. Edit
the title and body there and press save, the same way you edit the About or
Contact pages.

### Where responses go

Two places, every time:

1. **Feedback Responses** in the admin area. Newest first. Click a response to
   read every answer. You can filter by status, search the text, mark a response
   as New, Read, Archived, or Spam, and delete one.
2. **An email to hello@lotsoflovelyart.com** listing every question and its
   answer. If the visitor left their email, they also get a short thank-you.

If an email ever fails to send, the response is still saved in the admin area, so
nothing is lost.

---

## How it works (technical reference)

### Database

Two tables, both with row level security.

**`feedback_questions`** (the question list)

| Column | Notes |
|---|---|
| `question_key` | stable snake_case key, stored with each answer |
| `label` | the question text shown to visitors |
| `help_text` | optional hint under the question |
| `field_type` | `short_text`, `long_text`, `rating`, `single_choice`, `multi_choice`, `email` |
| `options` | JSON array of choices for the two choice types, else `[]` |
| `is_required`, `is_active`, `sort_order` | required flag, shown/hidden flag, display order |

Security: the public can read only rows where `is_active = true`. Only admins
(`app_metadata.role = 'admin'`) can add, edit, or delete.

**`feedback_submissions`** (the private inbox)

| Column | Notes |
|---|---|
| `respondent_name`, `respondent_email` | both optional |
| `answers` | JSON array of `{question_key, label, field_type, answer}` snapshots |
| `status` | `new`, `read`, `archived`, `spam` |
| `metadata` | source and user agent |

Answers are stored as snapshots, each carrying its own question label and type, so
editing or removing a question later never changes what a past response says.

Security: the public can only insert a row with `status = 'new'`. Only admins can
read, update, or delete. The public cannot read submissions at all.

Migrations (in `supabase/migrations/`):

- `20260926_create_feedback_questions.sql`
- `20260926_create_feedback_submissions.sql`
- `20260926_seed_feedback_page.sql` (the `/feedback` page, intro, the eight
  starter questions, and the footer link)

### Submit function

`supabase/functions/submit-feedback-form/index.ts`. When a visitor sends the
form it:

1. Loads the live active questions with the service role. It never trusts the
   list the browser sends.
2. Checks each answer against its question: a star rating must be a whole number
   1 to 5, a choice answer must be one of the options you set, an email answer
   must be a valid address, and text is trimmed and length-capped.
3. Blocks the send if a required question is missing or if nothing was answered.
4. Saves the submission with the answer snapshots.
5. Emails the admin address, and the visitor too if they gave an email. If email
   fails, the submission is still saved and the response reports the failure.

### Emails

Sent through the existing `send-email` function (Resend), which logs every send.
Two templates in `supabase/functions/send-email/templates/`:

- `feedback-form-admin.ts`: the internal notification, listing every question and
  answer, with a reply link when the visitor gave an email.
- `feedback-form-customer.ts`: the visitor thank-you.

The admin recipient defaults to hello@lotsoflovelyart.com. It can be overridden
with the `ADMIN_EMAILS` environment variable on the function.

### Public page and admin screens

| File | What it is |
|---|---|
| `app/src/views/Feedback.vue` | the public `/feedback` page |
| `app/src/views/admin/FeedbackQuestions.vue` | the question manager |
| `app/src/views/admin/FeedbackSubmissionsList.vue` | the responses inbox |
| `app/src/lib/feedback.js` | all the data reads and writes |
| `app/src/router/index.js` | routes for `/feedback`, `/admin/feedback`, `/admin/feedback/submissions` |
| `app/src/layouts/AdminLayout.vue` | the two sidebar links |
| `app/src/views/admin/InformationPages.vue`, `app/src/constants/infoPageDefaults.js` | intro editing |

---

## Operations

### Applying database changes

This project applies schema through the Supabase Dashboard SQL Editor, not the
CLI. The `supabase db push` command is not safe here, because the remote
migration history is sparse and a push would try to replay many old migrations.

To apply feedback tables to a fresh environment, open the SQL Editor for the
project and run the three `20260926_*` migration files in order (questions, then
submissions, then seed). `docs/apply-feedback-migrations.sql` is a local
convenience file that combines all three into one paste, if it is present. It is
git-ignored, so it may not exist in a fresh checkout, in which case use the three
migration files directly.

After creating tables in the SQL Editor, PostgREST refreshes its schema cache
automatically within a few seconds. If you see "Could not find the table ... in
the schema cache", wait a moment or run `NOTIFY pgrst, 'reload schema';`.

### Deploying or redeploying the functions

The Supabase CLI is installed at `/opt/homebrew/bin/supabase` but may not be on
your shell PATH (so `supabase ...` alone can say "command not found"). Use the
full path, or add `/opt/homebrew/bin` to your PATH.

```
/opt/homebrew/bin/supabase functions deploy submit-feedback-form
/opt/homebrew/bin/supabase functions deploy send-email
```

Redeploy `send-email` whenever you change a template. Redeploy
`submit-feedback-form` whenever you change its logic. The project is already
linked to the LOLA project (ref `hubbjhtjyubzczxengyo`) and you are logged in, so
no extra flags are needed. If it asks you to log in, run
`/opt/homebrew/bin/supabase login`.

### Troubleshooting

- **Admin or public page shows a "schema cache" table error**: the tables are not
  applied in that environment. Run the SQL, then reload.
- **Form will not send, "Feedback is not being collected right now"**: there are
  no active questions. Add at least one and mark it Shown on page.
- **Response saved but no email arrived**: check the `send-email` function logs
  and that `RESEND_API_KEY` is set. The response is still in Feedback Responses.
- **A question type change looks wrong on old responses**: it will not be. Old
  responses keep the type and wording they were captured with.

---

## Verification

- Table DDL and every CHECK constraint tested in a rolled-back transaction on a
  local Postgres (bad key, bad type, choice without options, bad status, non-array
  answers all rejected).
- Seed migration asserted to create the page, intro, eight questions, and footer
  link, and to be idempotent on re-run.
- Submit-function validation logic exercised with 22 Node test cases, all passing.
- Frontend compiles cleanly (`vite build`).
- Live smoke test (2026-09-26): calling the deployed `submit-feedback-form` with
  an empty submission returned HTTP 400 and "Please answer at least one question
  before sending.", which confirms the function is live and reading the questions
  table with no schema error.

Not yet done: a full click-through of a real submission landing in the inbox and
the hello@ mailbox. Worth doing once from the live site to confirm the email
delivery end to end.
