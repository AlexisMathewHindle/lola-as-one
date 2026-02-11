#!/bin/bash

# Test Order-Related Email Templates

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "📦 Testing Order Email Templates"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

# Test 1: Order Confirmation
echo "1️⃣  Testing: Order Confirmation"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"order-confirmation\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"orderNumber\": \"TEST-001\",
      \"customerName\": \"Test User\",
      \"orderItems\": [
        {\"name\": \"Watercolor Workshop\", \"quantity\": 1, \"price\": 45.00},
        {\"name\": \"Art Supplies Kit\", \"quantity\": 2, \"price\": 25.00}
      ],
      \"subtotal\": 95.00,
      \"shipping\": 5.00,
      \"vat\": 20.00,
      \"total\": 120.00,
      \"shippingAddress\": {
        \"line1\": \"123 Test Street\",
        \"line2\": \"Apt 4B\",
        \"city\": \"London\",
        \"postcode\": \"SW1A 1AA\",
        \"country\": \"United Kingdom\"
      },
      \"paymentMethod\": \"Visa ending in 4242\",
      \"estimatedDelivery\": \"3-5 business days\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 2: Order Shipped
echo "2️⃣  Testing: Order Shipped"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"order-shipped\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"orderNumber\": \"TEST-004\",
      \"trackingNumber\": \"GB123456789\",
      \"carrier\": \"Royal Mail\",
      \"trackingUrl\": \"https://www.royalmail.com/track-your-item?trackNumber=GB123456789\",
      \"estimatedDelivery\": \"February 10, 2026\",
      \"shippedItems\": [
        {\"name\": \"Watercolor Paint Set\", \"quantity\": 1},
        {\"name\": \"Premium Brushes (Set of 5)\", \"quantity\": 1},
        {\"name\": \"Watercolor Paper Pad\", \"quantity\": 2}
      ]
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 3: Digital Download Ready
echo "3️⃣  Testing: Digital Download Ready"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"digital-download-ready\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"productName\": \"Watercolor Techniques eBook\",
      \"downloadLinks\": [
        {
          \"name\": \"Watercolor Techniques PDF\",
          \"url\": \"https://lolaasone.com/downloads/watercolor-ebook.pdf\",
          \"format\": \"PDF\",
          \"size\": \"15 MB\"
        },
        {
          \"name\": \"Bonus Video Tutorial\",
          \"url\": \"https://lolaasone.com/downloads/tutorial.mp4\",
          \"format\": \"MP4\",
          \"size\": \"250 MB\"
        }
      ],
      \"expiryDate\": \"March 6, 2026\",
      \"orderNumber\": \"TEST-003\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""
echo "✅ All order email tests complete!"
echo "📬 Check your inbox at: $TEST_EMAIL"

