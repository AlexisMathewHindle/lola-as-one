#!/bin/bash

# Test script to reproduce the checkout error
# This will help us see the exact error message

set -e

echo "🧪 Testing create-checkout-session function"
echo ""

# Your Supabase project details
PROJECT_REF="hubbjhtjyubzczxengyo"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/create-checkout-session"

echo "📍 Function URL: $FUNCTION_URL"
echo ""

# Test with minimal valid data
echo "🔍 Sending test request..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY:-your-anon-key}" \
  -d '{
    "items": [
      {
        "id": "test-id",
        "title": "Test Event",
        "type": "event",
        "price": 10.00,
        "quantity": 1,
        "event_id": "test-event-id"
      }
    ],
    "customer": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    }
  }')

# Extract HTTP status code
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 Response Status: $HTTP_STATUS"
echo ""
echo "📄 Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Function returned 200 OK"
else
  echo "❌ Function returned non-2xx status: $HTTP_STATUS"
  echo ""
  echo "This is the error your users are seeing!"
fi

