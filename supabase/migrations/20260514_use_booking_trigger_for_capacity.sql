-- ============================================================================
-- USE BOOKING TRIGGER AS THE SINGLE EVENT CAPACITY SOURCE
-- ============================================================================
-- Date: 2026-05-14
-- Purpose:
-- 1. Avoid double-counting event capacity when the Stripe webhook creates bookings
-- 2. Keep event_capacity.spaces_booked and offering_events.current_bookings aligned
-- 3. Preserve admin/manual booking behaviour by updating capacity from confirmed bookings
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_event_capacity_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_spaces_booked INTEGER;
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE public.event_capacity
    SET spaces_booked = spaces_booked + NEW.number_of_attendees,
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id
    RETURNING spaces_booked INTO v_spaces_booked;

    IF FOUND THEN
      UPDATE public.offering_events
      SET current_bookings = v_spaces_booked
      WHERE id = NEW.offering_event_id;
    ELSE
      UPDATE public.offering_events
      SET current_bookings = current_bookings + NEW.number_of_attendees
      WHERE id = NEW.offering_event_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_event_capacity_on_booking()
IS 'Single source for confirmed booking capacity increments; mirrors event_capacity.spaces_booked into offering_events.current_bookings.';

CREATE OR REPLACE FUNCTION public.update_event_capacity_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_spaces_booked INTEGER;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE public.event_capacity
    SET spaces_booked = GREATEST(spaces_booked - NEW.number_of_attendees, 0),
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id
    RETURNING spaces_booked INTO v_spaces_booked;

    IF FOUND THEN
      UPDATE public.offering_events
      SET current_bookings = v_spaces_booked
      WHERE id = NEW.offering_event_id;
    ELSE
      UPDATE public.offering_events
      SET current_bookings = GREATEST(current_bookings - NEW.number_of_attendees, 0)
      WHERE id = NEW.offering_event_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_event_capacity_on_cancel()
IS 'Single source for confirmed booking capacity cancellation; mirrors event_capacity.spaces_booked into offering_events.current_bookings.';
