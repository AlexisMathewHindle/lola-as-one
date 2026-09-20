-- ============================================================================
-- FIX WAITLIST PUBLIC INSERT
-- ============================================================================
-- Date: 2026-09-20
-- Purpose:
-- The public "Join Waitlist" modals insert directly via the Supabase anon key
-- for visitors who are almost always logged out. The original insert policies
-- (from docs/migrations/add-waitlist-support.sql) required
--   auth.jwt() ->> 'email' = customer_email
-- which is NULL for anonymous visitors, so every public submission was rejected
-- with a row-level security violation ("gives an error when adding name").
--
-- This migration replaces those insert policies with public insert policies that
-- mirror the contact form pattern (see 20260615_create_contact_submissions.sql):
-- anon + authenticated may create rows, but only with status = 'waiting', so the
-- public cannot fabricate notified/converted entries. All existing SELECT,
-- UPDATE and admin policies are left unchanged.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Event waitlist entries
-- ----------------------------------------------------------------------------
ALTER TABLE public.event_waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can insert their own event waitlist entries"
  ON public.event_waitlist_entries;
DROP POLICY IF EXISTS "Public can join event waitlist"
  ON public.event_waitlist_entries;

CREATE POLICY "Public can join event waitlist"
  ON public.event_waitlist_entries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'waiting');

-- ----------------------------------------------------------------------------
-- Product waitlist entries
-- ----------------------------------------------------------------------------
-- The JoinProductWaitlistModal collects a phone number and inserts customer_phone,
-- but the original product_waitlist_entries schema never added that column (only
-- the event table has it). Add it so the public insert matches the form.
ALTER TABLE public.product_waitlist_entries
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

ALTER TABLE public.product_waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can insert their own product waitlist entries"
  ON public.product_waitlist_entries;
DROP POLICY IF EXISTS "Public can join product waitlist"
  ON public.product_waitlist_entries;

CREATE POLICY "Public can join product waitlist"
  ON public.product_waitlist_entries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'waiting');
