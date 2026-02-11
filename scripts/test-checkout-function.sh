#!/bin/bash

# Test if create-checkout-session function is accessible without JWT

echo "🧪 Testing create-checkout-session function..."
echo ""

# Test data
TEST_DATA='{
  "items": [
    {
      "id": "test-item",
      "title": "Test Product",
      "price": 10.00,
      "quantity": 1,
      "type": "product_physical"
    }
  ],
  "customer": {
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phone": "1234567890"
  },
  "shipping": {
    "name": "Test User",
    "address": {
      "line1": "123 Test St",
      "line2": "",
      "city": "London",
      "postal_code": "SW1A 1AA",
      "country": "GB"
    }
  }
}'

echo "Testing WITHOUT JWT (guest checkout)..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  "https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YmJqaHRqeXViemN6eGVuZ3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTM3NzMsImV4cCI6MjA4NTUyOTc3M30.Kq7nXGk7rWK265-joM5nE-pUuRuIG0eCfzUtlaL2CrU" \
  -d "$TEST_DATA")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "401" ]; then
    echo "❌ FAILED: Got 401 Unauthorized"
    echo ""
    echo "This means JWT verification is still enabled."
    echo ""
    echo "To fix this, you need to:"
    echo "1. Go to Supabase Dashboard"
    echo "2. Navigate to: Edge Functions > create-checkout-session > Settings"
    echo "3. Look for 'Verify JWT' option and DISABLE it"
    echo ""
    echo "OR redeploy with:"
    echo "  supabase functions deploy create-checkout-session --no-verify-jwt"
    echo ""
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ SUCCESS: Function is accessible without JWT!"
    echo ""
    echo "Guest checkout should work now."
elif [ "$HTTP_STATUS" = "400" ]; then
    echo "⚠️  Got 400 Bad Request"
    echo ""
    echo "This is expected if the test data doesn't match your schema."
    echo "But the important thing is: JWT verification is DISABLED ✅"
    echo ""
    echo "The function is accessible, just needs valid data."
else
    echo "⚠️  Got unexpected status: $HTTP_STATUS"
    echo ""
    echo "Check the response above for details."
fi

