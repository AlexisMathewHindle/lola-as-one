-- ============================================================================
-- COOKIE CONSENTS (consent record / audit log)
-- ============================================================================
-- Date: 2026-09-26
-- Purpose:
-- 1. Keep a dated, append-only record of every cookie-consent decision, so the
--    site can prove who consented to what and when (UK GDPR + PECR point 8).
-- 2. Allow the public (anonymous visitors) to write their own consent record.
-- 3. Keep those records private; only admins can read and manage them.
-- Modelled on 20260926_create_feedback_submissions.sql.
-- Part of: COOKIE-CONSENT-BANNER-EPIC.md (Ticket 3).
--
-- Privacy note: this table stores NO personal identity. `visitor_id` is a random
-- id generated in the browser purely to group a visitor's own decisions over time.
-- No name, email, or IP address is stored here.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Random, anonymous, browser-generated id. Not a person's identity.
  visitor_id TEXT NOT NULL,

  -- The categories the visitor agreed to at this decision. Necessary cookies are
  -- always on and are not recorded as a choice.
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,

  -- Which cookie-policy version this decision was made against. Bumping the policy
  -- version re-prompts everyone, and old records stay tied to the version they saw.
  policy_version TEXT NOT NULL,

  -- How the decision was made, for context when reviewing records.
  action TEXT NOT NULL DEFAULT 'save'
    CONSTRAINT cookie_consents_action_check
    CHECK (action IN ('accept_all', 'reject_all', 'save')),

  -- Coarse context captured at decision time. No IP address.
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cookie_consents_created_at
  ON public.cookie_consents (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cookie_consents_visitor_id
  ON public.cookie_consents (visitor_id);

COMMENT ON TABLE public.cookie_consents IS 'Append-only record of cookie-consent decisions (UK GDPR + PECR proof of consent). No personal identity stored.';
COMMENT ON COLUMN public.cookie_consents.visitor_id IS 'Random anonymous browser id grouping a visitor''s own decisions; not a personal identifier';
COMMENT ON COLUMN public.cookie_consents.policy_version IS 'Cookie-policy version the decision was made against';
COMMENT ON COLUMN public.cookie_consents.action IS 'How the decision was made: accept_all, reject_all, or save (per-category)';

DROP TRIGGER IF EXISTS trg_cookie_consents_set_updated_at ON public.cookie_consents;

CREATE TRIGGER trg_cookie_consents_set_updated_at
  BEFORE UPDATE ON public.cookie_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create cookie consents" ON public.cookie_consents;
DROP POLICY IF EXISTS "Admins can read cookie consents" ON public.cookie_consents;
DROP POLICY IF EXISTS "Admins can delete cookie consents" ON public.cookie_consents;

-- Anyone may record their own consent decision. The record is append-only for the
-- public: they can insert, but never read or change what is stored.
CREATE POLICY "Public can create cookie consents"
  ON public.cookie_consents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(policy_version) > 0 AND char_length(visitor_id) > 0);

CREATE POLICY "Admins can read cookie consents"
  ON public.cookie_consents
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete cookie consents"
  ON public.cookie_consents
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
