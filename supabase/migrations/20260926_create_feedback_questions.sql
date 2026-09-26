-- ============================================================================
-- FEEDBACK QUESTIONS
-- ============================================================================
-- Date: 2026-09-26
-- Purpose:
-- 1. Add the admin-managed question list for the public feedback form.
-- 2. Allow the public to read only the active questions.
-- 3. Keep add, edit, remove, and reorder of questions admin-only.
-- Part of: FEEDBACK-FORM-EPIC.md (Phase 1).
-- ============================================================================

-- set_row_updated_at() is created by 20260409_create_site_cms_foundation.sql.
-- Re-create defensively so this migration is safe to run in isolation.
CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.feedback_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  help_text TEXT,
  field_type TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_questions_key_format_check CHECK (
    question_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
  ),
  CONSTRAINT feedback_questions_label_not_blank CHECK (LENGTH(TRIM(label)) >= 2),
  CONSTRAINT feedback_questions_field_type_check CHECK (
    field_type IN ('short_text', 'long_text', 'rating', 'single_choice', 'multi_choice', 'email')
  ),
  CONSTRAINT feedback_questions_options_is_array CHECK (
    jsonb_typeof(options) = 'array'
  ),
  CONSTRAINT feedback_questions_choice_needs_options CHECK (
    field_type NOT IN ('single_choice', 'multi_choice')
    OR jsonb_array_length(options) >= 1
  )
);

CREATE INDEX IF NOT EXISTS idx_feedback_questions_active_sort
  ON public.feedback_questions (is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_feedback_questions_sort
  ON public.feedback_questions (sort_order);

COMMENT ON TABLE public.feedback_questions IS 'Admin-managed questions rendered on the public feedback form';
COMMENT ON COLUMN public.feedback_questions.question_key IS 'Stable snake_case key stored with each answer so history survives question edits';
COMMENT ON COLUMN public.feedback_questions.field_type IS 'Input type: short_text, long_text, rating (1 to 5 stars), single_choice, multi_choice, email';
COMMENT ON COLUMN public.feedback_questions.options IS 'Array of choice values for single_choice and multi_choice, otherwise an empty array';
COMMENT ON COLUMN public.feedback_questions.is_active IS 'Inactive questions stay in history but leave the public form';

DROP TRIGGER IF EXISTS trg_feedback_questions_set_updated_at ON public.feedback_questions;

CREATE TRIGGER trg_feedback_questions_set_updated_at
  BEFORE UPDATE ON public.feedback_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.feedback_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active feedback questions" ON public.feedback_questions;
DROP POLICY IF EXISTS "Admins can view all feedback questions" ON public.feedback_questions;
DROP POLICY IF EXISTS "Admins can insert feedback questions" ON public.feedback_questions;
DROP POLICY IF EXISTS "Admins can update feedback questions" ON public.feedback_questions;
DROP POLICY IF EXISTS "Admins can delete feedback questions" ON public.feedback_questions;

CREATE POLICY "Public can view active feedback questions"
  ON public.feedback_questions
  FOR SELECT
  TO public
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all feedback questions"
  ON public.feedback_questions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert feedback questions"
  ON public.feedback_questions
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update feedback questions"
  ON public.feedback_questions
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete feedback questions"
  ON public.feedback_questions
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
