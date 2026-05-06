-- ============================================================================
-- COUPONS AND COUPON REDEMPTIONS
-- ============================================================================
-- Date: 2026-05-04
-- Purpose:
-- 1. Make Supabase the source of truth for app-managed coupons.
-- 2. Track coupon redemptions from Stripe checkout webhooks.
-- 3. Store coupon summary data on orders for admin reporting.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.normalize_coupon_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code = UPPER(TRIM(NEW.code));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  per_customer_limit INTEGER CHECK (per_customer_limit IS NULL OR per_customer_limit > 0),
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'events', 'products', 'subscriptions')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_code_not_blank CHECK (LENGTH(TRIM(code)) > 0),
  CONSTRAINT coupons_percentage_value_check CHECK (
    discount_type <> 'percentage' OR discount_value <= 100
  ),
  CONSTRAINT coupons_valid_date_window_check CHECK (
    valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_unique
  ON public.coupons (UPPER(code));

CREATE INDEX IF NOT EXISTS idx_coupons_active
  ON public.coupons (is_active);

CREATE INDEX IF NOT EXISTS idx_coupons_valid_until
  ON public.coupons (valid_until);

DROP TRIGGER IF EXISTS trg_coupons_normalize_code ON public.coupons;

CREATE TRIGGER trg_coupons_normalize_code
  BEFORE INSERT OR UPDATE OF code ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_coupon_code();

DROP TRIGGER IF EXISTS trg_coupons_set_updated_at ON public.coupons;

CREATE TRIGGER trg_coupons_set_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email TEXT,
  coupon_code TEXT NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL CHECK (discount_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'gbp',
  stripe_checkout_session_id TEXT,
  stripe_coupon_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon
  ON public.coupon_redemptions (coupon_id);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_customer_email
  ON public.coupon_redemptions (LOWER(customer_email));

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order
  ON public.coupon_redemptions (order_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_session_coupon_unique
  ON public.coupon_redemptions (stripe_checkout_session_id, coupon_id)
  WHERE stripe_checkout_session_id IS NOT NULL AND coupon_id IS NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_gbp NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_coupon_id
  ON public.orders (coupon_id);

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = p_coupon_id;
$$;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read coupons"
  ON public.coupons
  FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can create coupons"
  ON public.coupons
  FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update coupons"
  ON public.coupons
  FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete coupons"
  ON public.coupons
  FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can read coupon redemptions"
  ON public.coupon_redemptions
  FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMENT ON TABLE public.coupons IS 'Supabase-managed coupons used by checkout edge functions';
COMMENT ON TABLE public.coupon_redemptions IS 'Audit trail of coupon usage recorded after successful Stripe checkout';
