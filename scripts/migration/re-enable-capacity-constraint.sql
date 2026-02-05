-- Re-enable the capacity constraint and trigger after migration
-- This also recalculates the actual booked spaces based on imported bookings

-- Step 1: Recalculate spaces_booked for all events based on actual bookings
UPDATE event_capacity ec
SET spaces_booked = COALESCE((
  SELECT SUM(b.number_of_attendees)
  FROM bookings b
  WHERE b.offering_event_id = ec.offering_event_id
    AND b.status = 'confirmed'
), 0),
last_updated_at = NOW();

-- Step 2: Update total_capacity to accommodate all bookings (if needed)
-- This ensures we don't violate the constraint for historical data
UPDATE event_capacity ec
SET total_capacity = GREATEST(total_capacity, spaces_booked + spaces_reserved)
WHERE spaces_booked + spaces_reserved > total_capacity;

-- Step 3: Re-add the constraint
ALTER TABLE event_capacity 
ADD CONSTRAINT valid_capacity 
CHECK (spaces_booked + spaces_reserved <= total_capacity);

-- Step 4: Re-enable the trigger
ALTER TABLE bookings ENABLE TRIGGER update_event_capacity_on_booking_trigger;

-- Step 5: Verify the results
SELECT 
  oe.id,
  o.title as event_title,
  ec.total_capacity,
  ec.spaces_booked,
  ec.spaces_reserved,
  ec.spaces_available
FROM event_capacity ec
JOIN offering_events oe ON oe.id = ec.offering_event_id
JOIN offerings o ON o.id = oe.offering_id
ORDER BY ec.spaces_booked DESC
LIMIT 20;

SELECT 'Constraint and trigger re-enabled. Capacity recalculated.' as status;

