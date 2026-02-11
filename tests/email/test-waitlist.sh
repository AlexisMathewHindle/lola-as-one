#!/bin/bash

# Test Waitlist Email Templates

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "⏳ Testing Waitlist Email Templates"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

# Test 1: Waitlist - Event Available
echo "1️⃣  Testing: Waitlist - Event Available"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"waitlist-event-available\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"eventName\": \"Advanced Watercolor Techniques\",
      \"eventDate\": \"Saturday, March 1, 2026\",
      \"eventTime\": \"2:00 PM - 5:00 PM\",
      \"location\": \"Lola Studio, 123 Creative Lane, London\",
      \"spacesAvailable\": 2,
      \"price\": 65.00,
      \"expiryTime\": \"February 7, 2026 at 10:00 AM\",
      \"bookingLink\": \"https://lolaasone.com/events/advanced-watercolor?waitlist=true\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 2: Waitlist - Product Available
echo "2️⃣  Testing: Waitlist - Product Available"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"waitlist-product-available\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"productName\": \"Limited Edition Watercolor Set\",
      \"productImage\": \"https://lolaasone.com/images/watercolor-set.jpg\",
      \"price\": 89.99,
      \"stockQuantity\": 5,
      \"expiryTime\": \"February 8, 2026 at 10:00 AM\",
      \"productLink\": \"https://lolaasone.com/products/limited-watercolor-set\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""
echo "✅ All waitlist tests complete!"
echo "📬 Check your inbox at: $TEST_EMAIL"

