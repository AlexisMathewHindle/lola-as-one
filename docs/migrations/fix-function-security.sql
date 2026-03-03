-- ============================================================================
-- FIX FUNCTION SECURITY WARNINGS
-- Run this script in Supabase SQL Editor to fix search_path warnings
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-decrement inventory on order
CREATE OR REPLACE FUNCTION decrement_inventory_on_order()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  product_sku TEXT;
  product_quantity INTEGER;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    FOR product_sku, product_quantity IN
      SELECT oi.sku, oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.item_type = 'product_physical'
    LOOP
      UPDATE public.inventory_items
      SET quantity_available = quantity_available - product_quantity
      WHERE sku = product_sku;

      INSERT INTO public.inventory_movements (inventory_item_id, movement_type, quantity_change, reference_type, reference_id)
      SELECT id, 'sale', -product_quantity, 'order', NEW.id
      FROM public.inventory_items
      WHERE sku = product_sku;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update event capacity on booking
CREATE OR REPLACE FUNCTION update_event_capacity_on_booking()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE public.event_capacity
    SET spaces_booked = spaces_booked + NEW.number_of_attendees,
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update event capacity on cancellation
CREATE OR REPLACE FUNCTION update_event_capacity_on_cancel()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE public.event_capacity
    SET spaces_booked = spaces_booked - NEW.number_of_attendees,
        last_updated_at = NOW()
    WHERE offering_event_id = NEW.offering_event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-clean expired capacity holds (run via cron/scheduled function)
CREATE OR REPLACE FUNCTION clean_expired_capacity_holds()
RETURNS void 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.event_capacity_holds
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

