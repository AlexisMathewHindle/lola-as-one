-- Add event-day check-in fields used by the admin attendee check-in screen.

SET lock_timeout = '10s';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bookings.checked_in
IS 'Whether this booking has been checked in by an admin on event day.';

COMMENT ON COLUMN public.bookings.checked_in_at
IS 'Timestamp when this booking was last checked in. Cleared when check-in is undone.';

CREATE INDEX IF NOT EXISTS idx_bookings_event_status_checkin
  ON public.bookings (offering_event_id, status, checked_in);

RESET lock_timeout;
