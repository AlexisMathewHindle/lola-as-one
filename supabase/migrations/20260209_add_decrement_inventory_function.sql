-- Create the decrement_inventory RPC function
-- This function is called by the stripe-webhook to decrement inventory when orders are placed

CREATE OR REPLACE FUNCTION decrement_inventory(
  p_offering_id UUID,
  p_quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the inventory_items table to decrement available quantity
  UPDATE inventory_items
  SET
    quantity_available = quantity_available - p_quantity,
    updated_at = NOW()
  WHERE offering_id = p_offering_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found for offering_id: %', p_offering_id;
  END IF;

  -- Also update offering_products.stock_quantity to keep it in sync
  UPDATE offering_products
  SET
    stock_quantity = stock_quantity - p_quantity,
    updated_at = NOW()
  WHERE offering_id = p_offering_id;

  -- Log the inventory movement
  INSERT INTO inventory_movements (
    inventory_item_id,
    movement_type,
    quantity_change,
    reference_type,
    reference_id,
    created_at
  )
  SELECT
    id,
    'sale',
    -p_quantity,
    'offering',
    p_offering_id,
    NOW()
  FROM inventory_items
  WHERE offering_id = p_offering_id;
END;
$$;

-- Add a comment to document the function
COMMENT ON FUNCTION decrement_inventory IS 'Decrements inventory quantity for a product offering and logs the movement';

