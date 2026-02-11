#!/bin/bash

# Test Subscription Email Templates

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "📦 Testing Subscription Email Templates"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

# Test 1: Subscription Activated
echo "1️⃣  Testing: Subscription Activated"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"subscription-activated\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"subscriptionName\": \"Monthly Craft Box\",
      \"billingInterval\": \"month\",
      \"pricePerCycle\": 29.99,
      \"nextBillingDate\": \"March 15, 2026\",
      \"firstBoxShippingDate\": \"February 20, 2026\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 2: Subscription Renewal Success
echo "2️⃣  Testing: Subscription Renewal Success"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"subscription-renewal-success\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"subscriptionName\": \"Monthly Craft Box\",
      \"amountCharged\": 29.99,
      \"billingDate\": \"February 15, 2026\",
      \"nextBillingDate\": \"March 15, 2026\",
      \"invoiceNumber\": \"INV-2026-001\",
      \"paymentMethod\": \"Visa ending in 4242\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 3: Subscription Payment Failed
echo "3️⃣  Testing: Subscription Payment Failed"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"subscription-payment-failed\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"subscriptionName\": \"Monthly Craft Box\",
      \"failedAmount\": 29.99,
      \"failureReason\": \"Insufficient funds\",
      \"retryDate\": \"February 18, 2026\",
      \"updatePaymentLink\": \"https://lolaasone.com/account/payment\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""
echo "✅ All subscription tests complete!"
echo "📬 Check your inbox at: $TEST_EMAIL"

