#!/bin/bash

# Test script to verify email sending is working
# This will help diagnose why emails aren't being sent after checkout

set -e

echo "📧 Testing Email Sending Function"
echo ""

PROJECT_REF="hubbjhtjyubzczxengyo"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/send-email"

# Get Supabase anon key
read -p "Enter your SUPABASE_ANON_KEY: " ANON_KEY

echo ""
echo "Testing order confirmation email..."
echo ""

# Test order confirmation email
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "template": "order-confirmation",
    "to": "test@example.com",
    "data": {
      "orderNumber": "TEST-12345",
      "customerName": "Test User",
      "orderItems": [
        {
          "name": "Test Workshop",
          "quantity": 1,
          "price": 25.00,
          "type": "event"
        }
      ],
      "subtotal": 25.00,
      "shipping": 0.00,
      "vat": 5.00,
      "total": 25.00,
      "hasEvents": true,
      "hasProducts": false
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
  echo "✅ Email function is working!"
  echo ""
  echo "If you didn't receive the email, check:"
  echo "  1. Resend dashboard for delivery status"
  echo "  2. Your spam folder"
  echo "  3. The 'from' email address in send-email/index.ts"
else
  echo "❌ Email function returned error: $HTTP_STATUS"
  echo ""
  echo "Common issues:"
  echo "  1. RESEND_API_KEY not set or invalid"
  echo "  2. Resend domain not verified"
  echo "  3. Template error"
  echo ""
  echo "Check Supabase function logs:"
  echo "  https://supabase.com/dashboard/project/$PROJECT_REF/functions/send-email/logs"
fi

echo ""
echo "Testing admin notification email..."
echo ""

# Test admin email
RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "template": "new-order-admin",
    "to": "admin@example.com",
    "data": {
      "orderNumber": "TEST-12345",
      "customerName": "Test User",
      "customerEmail": "test@example.com",
      "orderTotal": 25.00,
      "orderItems": [
        {
          "name": "Test Workshop",
          "quantity": 1,
          "price": 25.00,
          "type": "event"
        }
      ],
      "hasEvents": true,
      "hasPhysicalProducts": false
    }
  }')

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS:/d')

echo "📊 Response Status: $HTTP_STATUS2"
echo ""
echo "📄 Response Body:"
echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
echo ""

if [ "$HTTP_STATUS2" = "200" ]; then
  echo "✅ Admin email function is working!"
else
  echo "❌ Admin email function returned error: $HTTP_STATUS2"
fi

echo ""
echo "🔍 Next Steps:"
echo "  1. Check Supabase logs: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "  2. Check Resend dashboard: https://resend.com/emails"
echo "  3. Verify webhook is calling send-email correctly"

