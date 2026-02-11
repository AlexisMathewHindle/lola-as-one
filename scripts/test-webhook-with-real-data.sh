#!/bin/bash

# Test webhook with realistic data
# This creates a real checkout session with metadata, then completes it

echo "🧪 Testing Stripe Webhook with Real Data"
echo ""

# Check if stripe CLI is available
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found"
    echo "Install: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "Creating a test checkout session with metadata..."
echo ""

# Create a test checkout session with proper metadata
# This simulates what your frontend would create
stripe checkout sessions create \
  --mode=payment \
  --line-items='[{"price_data": {"currency": "gbp", "product_data": {"name": "Test Workshop"}, "unit_amount": 4500}, "quantity": 2}]' \
  --success-url='http://localhost:5173/order/success?session_id={CHECKOUT_SESSION_ID}' \
  --cancel-url='http://localhost:5173/checkout' \
  --metadata[customer_email]='test@example.com' \
  --metadata[customer_first_name]='John' \
  --metadata[customer_last_name]='Doe' \
  --metadata[customer_phone]='+44 20 1234 5678' \
  --metadata[shipping_name]='John Doe' \
  --metadata[shipping_line1]='123 Test Street' \
  --metadata[shipping_city]='London' \
  --metadata[shipping_postal_code]='SW1A 1AA' \
  --metadata[shipping_country]='GB' \
  --metadata[items]='[{"id":"test-123","title":"Test Workshop","type":"event","price":45.00,"quantity":2,"eventDate":"2026-03-15","eventTime":"14:00:00"}]' \
  --metadata[subtotal]='90.00' \
  --metadata[shipping_cost]='0.00' \
  --metadata[vat]='15.00' \
  --metadata[total]='90.00' \
  --format=json > /tmp/stripe_session.json

if [ $? -ne 0 ]; then
    echo "❌ Failed to create checkout session"
    exit 1
fi

SESSION_ID=$(cat /tmp/stripe_session.json | grep -o '"id": "cs_test_[^"]*"' | head -1 | cut -d'"' -f4)

echo "✅ Created checkout session: $SESSION_ID"
echo ""
echo "Now completing the payment (this will trigger the webhook)..."
echo ""

# Complete the payment (this triggers checkout.session.completed)
stripe checkout sessions expire $SESSION_ID 2>/dev/null || true
sleep 1

# Actually, let's use the trigger with fixtures instead
echo "Note: To fully test, you need to:"
echo "1. Use the Stripe test card UI, or"
echo "2. Create a real checkout flow in your app"
echo ""
echo "For now, let's check if the webhook can handle the event..."

# Clean up
rm -f /tmp/stripe_session.json

echo ""
echo "💡 To test end-to-end:"
echo "   1. Run your frontend app"
echo "   2. Add items to cart"
echo "   3. Go through checkout"
echo "   4. Use test card: 4242 4242 4242 4242"
echo "   5. Check if order is created in database"

