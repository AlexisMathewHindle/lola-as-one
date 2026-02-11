-- Enable RLS on inventory_items if not already enabled
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow service role full access to inventory_items" ON inventory_items;

-- Allow public (anon) users to read inventory items
-- This is needed for the frontend to display stock status
CREATE POLICY "Allow public read access to inventory_items"
ON inventory_items
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow service role full access for admin operations
CREATE POLICY "Allow service role full access to inventory_items"
ON inventory_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also ensure authenticated users can read (for logged-in customers)
CREATE POLICY "Allow authenticated read access to inventory_items"
ON inventory_items
FOR SELECT
TO authenticated
USING (true);

