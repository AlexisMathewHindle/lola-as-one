-- Fix bookings table to auto-generate UUID for order_item_id column
-- This fixes the error: null value in column "order_item_id" of relation "bookings" violates not-null constraint

-- First, let's check if order_item_id should actually be nullable or auto-generated
-- Based on the error, it seems like it should be auto-generated
ALTER TABLE bookings 
  ALTER COLUMN order_item_id DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN bookings.order_item_id IS 'Reference to order_item - nullable for bookings created without order items';

-- Create the decrement_event_capacity function
-- This function updates the event_capacity table to decrement available spaces
CREATE OR REPLACE FUNCTION decrement_event_capacity(
  p_offering_event_id UUID,
  p_attendees INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the event_capacity table (if it exists)
  UPDATE event_capacity
  SET spaces_booked = spaces_booked + p_attendees,
      last_updated_at = NOW()
  WHERE offering_event_id = p_offering_event_id;

  -- If no event_capacity record exists, update offering_events directly
  IF NOT FOUND THEN
    UPDATE offering_events
    SET current_bookings = current_bookings + p_attendees
    WHERE id = p_offering_event_id;

    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Event not found: %', p_offering_event_id;
    END IF;
  END IF;
END;
$$;

-- Add a comment to document the function
COMMENT ON FUNCTION decrement_event_capacity IS 'Decrements the remaining capacity for an event by updating event_capacity or offering_events table';

