-- ============================================================================
-- FEEDBACK SUBMISSIONS
-- ============================================================================
-- Date: 2026-09-26
-- Purpose:
-- 1. Add the private inbox for feedback form submissions.
-- 2. Allow the public to create new submissions.
-- 3. Keep submitted answers private; only admins can read and manage them.
-- Modelled on 20260615_create_contact_submissions.sql.
-- Part of: FEEDBACK-FORM-EPIC.md (Phase 1).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_name TEXT,
  respondent_email TEXT,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_submissions_answers_is_array CHECK (
    jsonb_typeof(answers) = 'array'
  ),
  CONSTRAINT feedback_submissions_status_check CHECK (
    status IN ('new', 'read', 'archived', 'spam')
  )
);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at
  ON public.feedback_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_submissions_status
  ON public.feedback_submissions (status);

COMMENT ON TABLE public.feedback_submissions IS 'Public feedback form submissions from the website';
COMMENT ON COLUMN public.feedback_submissions.answers IS 'Array of answer snapshots {question_key, label, field_type, answer}, self-describing so history survives question edits';
COMMENT ON COLUMN public.feedback_submissions.status IS 'Workflow status for admin triage of feedback';
COMMENT ON COLUMN public.feedback_submissions.metadata IS 'Source, user agent, and other structured context captured at submit time';

DROP TRIGGER IF EXISTS trg_feedback_submissions_set_updated_at ON public.feedback_submissions;

CREATE TRIGGER trg_feedback_submissions_set_updated_at
  BEFORE UPDATE ON public.feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create feedback submissions" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Admins can read feedback submissions" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Admins can create feedback submissions" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Admins can update feedback submissions" ON public.feedback_submissions;
DROP POLICY IF EXISTS "Admins can delete feedback submissions" ON public.feedback_submissions;

CREATE POLICY "Public can create feedback submissions"
  ON public.feedback_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new');

CREATE POLICY "Admins can read feedback submissions"
  ON public.feedback_submissions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can create feedback submissions"
  ON public.feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update feedback submissions"
  ON public.feedback_submissions
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete feedback submissions"
  ON public.feedback_submissions
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
