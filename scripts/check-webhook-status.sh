#!/bin/bash

echo "🔍 Checking Webhook Status"
echo ""

echo "1️⃣ Checking if webhook function is deployed..."
./app/node_modules/supabase/bin/supabase functions list 2>&1 | grep stripe-webhook
echo ""

echo "2️⃣ Checking webhook secret is set..."
./app/node_modules/supabase/bin/supabase secrets list 2>&1 | grep STRIPE_WEBHOOK_SECRET
echo ""

echo "3️⃣ Testing webhook endpoint accessibility..."
echo "Testing: https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  "https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status: $HTTP_STATUS"
echo "Response: $BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "400" ]; then
    echo "✅ Webhook endpoint is accessible"
else
    echo "❌ Webhook endpoint returned unexpected status: $HTTP_STATUS"
fi

echo ""
echo "4️⃣ Next steps to debug:"
echo ""
echo "A. Check Stripe Dashboard webhook logs:"
echo "   https://dashboard.stripe.com/test/webhooks"
echo "   - Click on your webhook endpoint"
echo "   - Check if there are any delivery attempts"
echo "   - Look for errors"
echo ""
echo "B. Check Supabase Edge Function logs:"
echo "   https://supabase.com/dashboard/project/hubbjhtjyubzczxengyo/functions/stripe-webhook/logs"
echo ""
echo "C. Test sending a webhook from Stripe Dashboard:"
echo "   - Go to your webhook endpoint in Stripe"
echo "   - Click 'Send test webhook'"
echo "   - Select 'checkout.session.completed'"
echo "   - Check the response"

