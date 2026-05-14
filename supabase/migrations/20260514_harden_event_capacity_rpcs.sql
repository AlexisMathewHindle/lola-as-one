-- ============================================================================
-- HARDEN EVENT CAPACITY RPCS
-- ============================================================================
-- Date: 2026-05-14
-- Purpose:
-- 1. Require an admin JWT or service role for admin capacity edits
-- 2. Restrict booking capacity decrement to service-role webhook execution
-- 3. Add explicit search_path settings to SECURITY DEFINER functions
-- 4. Remove broad PUBLIC execute grants from mutating capacity RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_event_capacity_total(
  p_offering_event_id UUID,
  p_total_capacity INTEGER,
  p_waitlist_enabled BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can update event capacity'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_capacity
    WHERE offering_event_id = p_offering_event_id
  ) THEN
    UPDATE public.event_capacity
    SET
      total_capacity = p_total_capacity,
      waitlist_enabled = p_waitlist_enabled,
      last_updated_at = NOW()
    WHERE offering_event_id = p_offering_event_id;
  ELSE
    INSERT INTO public.event_capacity (
      offering_event_id,
      total_capacity,
      spaces_booked,
      spaces_reserved,
      waitlist_enabled
    )
    SELECT
      p_offering_event_id,
      p_total_capacity,
      COALESCE(oe.current_bookings, 0),
      0,
      p_waitlist_enabled
    FROM public.offering_events oe
    WHERE oe.id = p_offering_event_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_event_capacity_total(UUID, INTEGER, BOOLEAN)
IS 'Updates or creates event_capacity records. Requires admin JWT role or service role.';

REVOKE ALL ON FUNCTION public.update_event_capacity_total(UUID, INTEGER, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_event_capacity_total(UUID, INTEGER, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.update_event_capacity_total(UUID, INTEGER, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_event_capacity_total(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_event_capacity_total(UUID, INTEGER, BOOLEAN) TO service_role;

CREATE OR REPLACE FUNCTION public.decrement_event_capacity(
  p_offering_event_id UUID,
  p_attendees INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_spaces_booked INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only service role can decrement event capacity'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.event_capacity
  SET spaces_booked = spaces_booked + p_attendees,
      last_updated_at = NOW()
  WHERE offering_event_id = p_offering_event_id
  RETURNING spaces_booked INTO v_spaces_booked;

  IF FOUND THEN
    UPDATE public.offering_events
    SET current_bookings = v_spaces_booked
    WHERE id = p_offering_event_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Event not found: %', p_offering_event_id;
    END IF;

    RETURN;
  END IF;

  UPDATE public.offering_events
  SET current_bookings = current_bookings + p_attendees
  WHERE id = p_offering_event_id
  RETURNING current_bookings INTO v_spaces_booked;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_offering_event_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.decrement_event_capacity(UUID, INTEGER)
IS 'Service-role webhook RPC that increments event_capacity.spaces_booked and mirrors the count into offering_events.current_bookings.';

REVOKE ALL ON FUNCTION public.decrement_event_capacity(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_event_capacity(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_event_capacity(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_event_capacity(UUID, INTEGER) TO service_role;
