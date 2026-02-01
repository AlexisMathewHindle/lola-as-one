-- ============================================================================
-- APPLY RLS POLICIES TO EXISTING TABLES
-- Run this script in Supabase SQL Editor to add RLS to all tables
-- ============================================================================

-- Offering Events: Public can view, admins can manage
ALTER TABLE offering_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering events"
ON offering_events FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering events"
ON offering_events FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Products: Public can view, admins can manage
ALTER TABLE offering_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering products"
ON offering_products FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering products"
ON offering_products FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Digital Products: Public can view, admins can manage
ALTER TABLE offering_digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering digital products"
ON offering_digital_products FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering digital products"
ON offering_digital_products FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Categories: Public can view, admins can manage
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories"
ON categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Tags: Public can view, admins can manage
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tags"
ON tags FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage tags"
ON tags FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Categories: Public can view, admins can manage
ALTER TABLE offering_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering categories"
ON offering_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering categories"
ON offering_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Offering Tags: Public can view, admins can manage
ALTER TABLE offering_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view offering tags"
ON offering_tags FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage offering tags"
ON offering_tags FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Product Categories: Public can view, admins can manage
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product categories"
ON product_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage product categories"
ON product_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Navigation Items: Public can view active items, admins can manage all
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active navigation items"
ON navigation_items FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can manage navigation items"
ON navigation_items FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Site Sections: Public can view active sections, admins can manage all
ALTER TABLE site_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active site sections"
ON site_sections FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can manage site sections"
ON site_sections FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Blog Post Categories: Public can view, admins can manage
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view blog post categories"
ON blog_post_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage blog post categories"
ON blog_post_categories FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Blog Post Tags: Public can view, admins can manage
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view blog post tags"
ON blog_post_tags FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage blog post tags"
ON blog_post_tags FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Carts: Users can manage their own carts, or session-based carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own carts"
ON carts FOR SELECT
USING (auth.uid() = customer_id OR session_id IS NOT NULL);

CREATE POLICY "Users can manage their own carts"
ON carts FOR ALL
USING (auth.uid() = customer_id OR session_id IS NOT NULL);

CREATE POLICY "Admins can view all carts"
ON carts FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Cart Items: Users can manage items in their own carts
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
    AND (carts.customer_id = auth.uid() OR carts.session_id IS NOT NULL)
  )
);

CREATE POLICY "Users can manage their own cart items"
ON cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
    AND (carts.customer_id = auth.uid() OR carts.session_id IS NOT NULL)
  )
);

CREATE POLICY "Admins can view all cart items"
ON cart_items FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Order Items: Customers can view their own order items, admins can view all
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Payments: Customers can view their own payments, admins can manage all
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = payments.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all payments"
ON payments FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Fulfillments: Customers can view their own fulfillments, admins can manage all
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own fulfillments"
ON fulfillments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = fulfillments.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all fulfillments"
ON fulfillments FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Refunds: Customers can view their own refunds, admins can manage all
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own refunds"
ON refunds FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = refunds.order_id
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all refunds"
ON refunds FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscription Items: Customers can view their own subscription items, admins can manage all
ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own subscription items"
ON subscription_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.id = subscription_items.subscription_id
    AND subscriptions.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscription items"
ON subscription_items FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscription Events: Customers can view their own subscription events, admins can manage all
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own subscription events"
ON subscription_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.id = subscription_events.subscription_id
    AND subscriptions.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscription events"
ON subscription_events FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Subscription Invoices: Customers can view their own invoices, admins can manage all
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own subscription invoices"
ON subscription_invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.id = subscription_invoices.subscription_id
    AND subscriptions.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all subscription invoices"
ON subscription_invoices FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Inventory Items: Admin-only access
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory items"
ON inventory_items FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Inventory Movements: Admin-only access
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory movements"
ON inventory_movements FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Event Capacity: Public can view, admins can manage
ALTER TABLE event_capacity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view event capacity"
ON event_capacity FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage event capacity"
ON event_capacity FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Event Capacity Holds: Users can view their own holds, admins can manage all
ALTER TABLE event_capacity_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capacity holds"
ON event_capacity_holds FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage event capacity holds"
ON event_capacity_holds FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Bookings: Customers can view their own bookings, admins can manage all
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own bookings"
ON bookings FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage all bookings"
ON bookings FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Booking Attendees: Customers can view attendees for their own bookings, admins can manage all
ALTER TABLE booking_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own booking attendees"
ON booking_attendees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_attendees.booking_id
    AND bookings.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all booking attendees"
ON booking_attendees FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Download Links: Customers can view their own download links, admins can manage all
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own download links"
ON download_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM digital_downloads
    WHERE digital_downloads.id = download_links.digital_download_id
    AND digital_downloads.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all download links"
ON download_links FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

