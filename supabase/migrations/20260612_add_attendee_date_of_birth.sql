-- Capture attendee date of birth so admin screens can calculate age at event date.

ALTER TABLE public.booking_attendees
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN public.booking_attendees.date_of_birth
IS 'Attendee date of birth captured at checkout for event age visibility. Nullable for legacy and imported attendee rows.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_attendees_date_of_birth_not_future'
      AND conrelid = 'public.booking_attendees'::regclass
  ) THEN
    ALTER TABLE public.booking_attendees
      ADD CONSTRAINT booking_attendees_date_of_birth_not_future
      CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE);
  END IF;
END $$;
