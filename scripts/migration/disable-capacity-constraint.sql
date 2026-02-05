-- Temporarily disable the capacity constraint and trigger for migration
-- This allows us to import historical bookings that may exceed current capacity

-- Step 1: Drop the constraint temporarily
ALTER TABLE event_capacity DROP CONSTRAINT IF EXISTS valid_capacity;

-- Step 2: Disable the trigger temporarily
ALTER TABLE bookings DISABLE TRIGGER update_event_capacity_on_booking_trigger;

-- Verify changes
SELECT 'Constraint and trigger disabled for migration' as status;

