-- Seed the internal automatic sibling discount record used for reporting.
-- Checkout eligibility is still enforced server-side in create-checkout-session.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.coupons
    WHERE UPPER(code) = 'SIBLING10'
  ) THEN
    UPDATE public.coupons
    SET
      name = 'Sibling discount',
      description = 'Automatic 10% discount for sibling places on eligible child workshops.',
      discount_type = 'percentage',
      discount_value = 10,
      applies_to = 'events',
      metadata = metadata || jsonb_build_object(
        'automatic_discount', true,
        'rule', 'sibling_discount',
        'excludes_layout_key', 'adult_workshop'
      ),
      updated_at = NOW()
    WHERE UPPER(code) = 'SIBLING10';
  ELSE
    INSERT INTO public.coupons (
      code,
      name,
      description,
      discount_type,
      discount_value,
      is_active,
      applies_to,
      metadata
    )
    VALUES (
      'SIBLING10',
      'Sibling discount',
      'Automatic 10% discount for sibling places on eligible child workshops.',
      'percentage',
      10,
      true,
      'events',
      jsonb_build_object(
        'automatic_discount', true,
        'rule', 'sibling_discount',
        'excludes_layout_key', 'adult_workshop'
      )
    );
  END IF;
END $$;
