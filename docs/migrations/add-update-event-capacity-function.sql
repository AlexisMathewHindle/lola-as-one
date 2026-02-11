-- ============================================================================
-- ADD UPDATE EVENT CAPACITY RPC FUNCTION
-- ============================================================================
-- Purpose: Create an RPC function to update event_capacity that bypasses RLS
-- Date: 2026-02-09
-- 
-- This function allows authenticated users to update event_capacity.total_capacity
-- without being blocked by RLS policies that require admin role in JWT
-- ============================================================================

-- Create function to update event capacity
CREATE OR REPLACE FUNCTION update_event_capacity_total(
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
  -- Check if event_capacity record exists
  IF EXISTS (
    SELECT 1 FROM public.event_capacity 
    WHERE offering_event_id = p_offering_event_id
  ) THEN
    -- Update existing record
    UPDATE public.event_capacity
    SET 
      total_capacity = p_total_capacity,
      waitlist_enabled = p_waitlist_enabled,
      last_updated_at = NOW()
    WHERE offering_event_id = p_offering_event_id;
  ELSE
    -- Create new record if it doesn't exist
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

-- Add comment
COMMENT ON FUNCTION update_event_capacity_total IS 
'Updates or creates event_capacity record with new total_capacity. Uses SECURITY DEFINER to bypass RLS.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_event_capacity_total TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To test the function:
-- SELECT update_event_capacity_total(
--   'your-event-id-here'::uuid,
--   15,
--   true
-- );

-- To verify it worked:
-- SELECT * FROM event_capacity WHERE offering_event_id = 'your-event-id-here'::uuid;

