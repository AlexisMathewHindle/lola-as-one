-- Capture workshop allergy details and checkout consent decisions.

ALTER TABLE public.booking_attendees
  ADD COLUMN IF NOT EXISTS allergies TEXT;

COMMENT ON COLUMN public.booking_attendees.allergies
IS 'Optional allergy information provided for this attendee at checkout.';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS health_safety_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS health_safety_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS newsletter_opt_in_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.health_safety_accepted
IS 'Whether the customer accepted the workshop health and safety agreement during checkout.';

COMMENT ON COLUMN public.orders.privacy_policy_accepted
IS 'Whether the customer accepted the Privacy Policy during checkout.';

COMMENT ON COLUMN public.orders.newsletter_opt_in
IS 'Whether the customer opted in to newsletters and updates during checkout.';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;

COMMENT ON COLUMN public.customers.marketing_opt_in
IS 'Whether the customer has opted in to marketing newsletters and updates.';
