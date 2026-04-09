-- Keep offering_events.current_bookings aligned with event_capacity.spaces_booked
-- so admin screens and capacity checks report the same booking counts.

CREATE OR REPLACE FUNCTION decrement_event_capacity(
  p_offering_event_id UUID,
  p_attendees INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_spaces_booked INTEGER;
BEGIN
  UPDATE event_capacity
  SET spaces_booked = spaces_booked + p_attendees,
      last_updated_at = NOW()
  WHERE offering_event_id = p_offering_event_id
  RETURNING spaces_booked INTO v_spaces_booked;

  IF FOUND THEN
    UPDATE offering_events
    SET current_bookings = v_spaces_booked
    WHERE id = p_offering_event_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Event not found: %', p_offering_event_id;
    END IF;

    RETURN;
  END IF;

  UPDATE offering_events
  SET current_bookings = current_bookings + p_attendees
  WHERE id = p_offering_event_id
  RETURNING current_bookings INTO v_spaces_booked;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_offering_event_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION decrement_event_capacity IS 'Updates event_capacity and mirrors the booked count into offering_events.current_bookings.';

UPDATE offering_events AS oe
SET current_bookings = ec.spaces_booked
FROM event_capacity AS ec
WHERE ec.offering_event_id = oe.id
  AND oe.current_bookings IS DISTINCT FROM ec.spaces_booked;
