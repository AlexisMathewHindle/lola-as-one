-- ============================================================================
-- CONTACT SUBMISSIONS
-- ============================================================================
-- Date: 2026-06-15
-- Purpose:
-- 1. Add the table used by the public contact form.
-- 2. Allow anonymous visitors to create new submissions.
-- 3. Keep submitted contact details private; only admins can read and manage them.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_submissions_name_not_blank CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT contact_submissions_email_not_blank CHECK (LENGTH(TRIM(email)) > 0),
  CONSTRAINT contact_submissions_message_not_blank CHECK (LENGTH(TRIM(message)) >= 10),
  CONSTRAINT contact_submissions_status_check CHECK (
    status IN ('new', 'read', 'replied', 'archived', 'spam')
  )
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON public.contact_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status
  ON public.contact_submissions (status);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email
  ON public.contact_submissions (LOWER(email));

DROP TRIGGER IF EXISTS trg_contact_submissions_set_updated_at ON public.contact_submissions;

CREATE TRIGGER trg_contact_submissions_set_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can read contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can create contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_submissions;

CREATE POLICY "Public can create contact submissions"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'new');

CREATE POLICY "Admins can read contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can create contact submissions"
  ON public.contact_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update contact submissions"
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete contact submissions"
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMENT ON TABLE public.contact_submissions IS 'Public contact form submissions from the website';
COMMENT ON COLUMN public.contact_submissions.status IS 'Workflow status for admin handling of contact enquiries';
COMMENT ON COLUMN public.contact_submissions.metadata IS 'Optional structured metadata for future contact form fields or source tracking';
