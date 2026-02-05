-- Migration: Make order_id and order_item_id optional for bookings
-- This allows historical bookings to exist without creating orders
-- Orders should only be for physical and digital products

-- Drop the NOT NULL constraints on order_id and order_item_id
ALTER TABLE bookings 
ALTER COLUMN order_id DROP NOT NULL,
ALTER COLUMN order_item_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN bookings.order_id IS 'Optional reference to order. NULL for standalone bookings (e.g., historical data, direct bookings)';
COMMENT ON COLUMN bookings.order_item_id IS 'Optional reference to order item. NULL for standalone bookings (e.g., historical data, direct bookings)';

