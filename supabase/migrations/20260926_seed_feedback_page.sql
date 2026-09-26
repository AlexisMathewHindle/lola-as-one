-- ============================================================================
-- SEED FEEDBACK PAGE
-- ============================================================================
-- Date: 2026-09-26
-- Purpose:
-- 1. Register the public /feedback page in the CMS page registry.
-- 2. Seed editable intro copy above the questions.
-- 3. Seed a small starter set of feedback questions.
-- 4. Link the page into the content-manageable footer secondary menu.
-- Depends on: 20260926_create_feedback_questions.sql
-- Part of: FEEDBACK-FORM-EPIC.md (Phase 1).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PAGE REGISTRY
-- ----------------------------------------------------------------------------

INSERT INTO site_pages (
  page_key,
  title,
  slug,
  path,
  page_kind,
  template_key,
  route_name,
  status,
  show_in_navigation,
  seo_title,
  seo_description,
  published_at
)
VALUES (
  'feedback',
  'Feedback',
  'feedback',
  '/feedback',
  'cms_page',
  'feedback_page',
  NULL,
  'published',
  TRUE,
  'Feedback | Lola As One',
  'Tell us about your visit to Lola As One. Your feedback helps us improve our workshops, art boxes, and creative space.',
  NOW()
)
ON CONFLICT (page_key) DO UPDATE SET
  title = EXCLUDED.title,
  slug = COALESCE(NULLIF(site_pages.slug, ''), EXCLUDED.slug),
  path = COALESCE(NULLIF(site_pages.path, ''), EXCLUDED.path),
  page_kind = EXCLUDED.page_kind,
  template_key = COALESCE(site_pages.template_key, EXCLUDED.template_key),
  route_name = NULL,
  status = CASE
    WHEN site_pages.status = 'archived' THEN EXCLUDED.status
    ELSE site_pages.status
  END,
  show_in_navigation = COALESCE(site_pages.show_in_navigation, EXCLUDED.show_in_navigation),
  seo_title = COALESCE(NULLIF(site_pages.seo_title, ''), EXCLUDED.seo_title),
  seo_description = COALESCE(NULLIF(site_pages.seo_description, ''), EXCLUDED.seo_description),
  published_at = COALESCE(site_pages.published_at, EXCLUDED.published_at);

-- ----------------------------------------------------------------------------
-- 2. EDITABLE INTRO SECTION
-- Seed only when absent, so later admin edits are not overwritten on re-run.
-- ----------------------------------------------------------------------------

INSERT INTO page_sections (
  page_id,
  section_key,
  section_type,
  sort_order,
  is_enabled,
  config_json
)
SELECT
  p.id,
  'feedback_content',
  'rich_text',
  10,
  TRUE,
  jsonb_build_object(
    'title', 'We would love your feedback',
    'body_html', $$
      <p>Thank you for spending time with us at Lola As One. Tell us what you thought of your visit, workshop, or art box. Your answers go straight to our team and help us make the space better.</p>
      <p>Questions marked as required need an answer. Everything else is optional, and you can leave your name and email blank if you would rather stay anonymous.</p>
    $$
  )
FROM site_pages p
WHERE p.page_key = 'feedback'
  AND NOT EXISTS (
    SELECT 1
    FROM page_sections existing
    WHERE existing.page_id = p.id
      AND existing.section_key = 'feedback_content'
  );

-- ----------------------------------------------------------------------------
-- 3. STARTER QUESTIONS
-- Seed only when the key is absent, so admin edits and removals persist.
-- Name and email are built-in optional fields on the form, not questions.
-- There is no cap on the number of questions; admins can add as many as needed.
-- Answer types below are sensible defaults and can be changed in admin.
-- ----------------------------------------------------------------------------

INSERT INTO feedback_questions (
  question_key,
  label,
  help_text,
  field_type,
  options,
  is_required,
  is_active,
  sort_order
)
SELECT
  seed.question_key,
  seed.label,
  seed.help_text,
  seed.field_type,
  seed.options,
  seed.is_required,
  TRUE,
  seed.sort_order
FROM (
  VALUES
    (
      'booking_straightforward',
      'Did you find the booking process straightforward?',
      NULL,
      'rating',
      '[]'::jsonb,
      FALSE,
      10
    ),
    (
      'welcomed_warmly',
      'Were you and your family welcomed warmly at the studio?',
      NULL,
      'rating',
      '[]'::jsonb,
      FALSE,
      20
    ),
    (
      'child_enjoyment',
      'How would you rate your child''s overall enjoyment of the workshop?',
      NULL,
      'rating',
      '[]'::jsonb,
      FALSE,
      30
    ),
    (
      'felt_supported',
      'Did your child feel comfortable and supported during the session?',
      NULL,
      'rating',
      '[]'::jsonb,
      FALSE,
      40
    ),
    (
      'challenged_inspired',
      'Did your child feel challenged and inspired by the theme of the workshop?',
      NULL,
      'rating',
      '[]'::jsonb,
      FALSE,
      50
    ),
    (
      'needs_during_session',
      'Was there anything your child needed throughout the session?',
      'For example more structure or more freedom, less time or more time.',
      'long_text',
      '[]'::jsonb,
      FALSE,
      60
    ),
    (
      'themes_or_techniques_wanted',
      'Is there any particular art theme or technique you would like LoLA to offer that we do not already?',
      NULL,
      'long_text',
      '[]'::jsonb,
      FALSE,
      70
    ),
    (
      'other_comments',
      'Do you have any other comments, suggestions or feedback for us?',
      NULL,
      'long_text',
      '[]'::jsonb,
      FALSE,
      80
    )
) AS seed(question_key, label, help_text, field_type, options, is_required, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM feedback_questions existing
  WHERE existing.question_key = seed.question_key
);

-- ----------------------------------------------------------------------------
-- 4. FOOTER MENU LINK
-- Add to the content-manageable footer secondary menu, after the policy pages.
-- ----------------------------------------------------------------------------

INSERT INTO site_menu_items (menu_id, label, item_type, page_id, sort_order, is_enabled)
SELECT
  m.id,
  'Feedback',
  'page',
  p.id,
  60,
  TRUE
FROM site_menus m
JOIN site_pages p
  ON p.page_key = 'feedback'
WHERE m.menu_key = 'footer_secondary'
  AND NOT EXISTS (
    SELECT 1
    FROM site_menu_items existing
    WHERE existing.menu_id = m.id
      AND existing.page_id = p.id
  );
