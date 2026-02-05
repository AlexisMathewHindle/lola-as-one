-- Clean up the partial booking import
-- Run this to remove the partially imported data before retrying

DELETE FROM booking_attendees;
DELETE FROM bookings;
DELETE FROM order_items;
DELETE FROM orders WHERE order_number LIKE 'ORD-%';

-- Reset event capacity to zero
UPDATE event_capacity SET spaces_booked = 0, spaces_reserved = 0, last_updated_at = NOW();

SELECT 'Partial import cleaned up. Ready to retry.' as status;

