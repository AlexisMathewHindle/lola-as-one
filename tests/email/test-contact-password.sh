#!/bin/bash

# Test Contact Form and Password Reset Email Templates

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "🔐 Testing Contact Form and Password Reset Email Templates"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

# Test 1: Password Reset
echo "1️⃣  Testing: Password Reset"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"password-reset\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"resetLink\": \"https://lolaasone.com/reset-password?token=test123456\",
      \"expiryMinutes\": 60
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 2: Contact Form - Customer Confirmation
echo "2️⃣  Testing: Contact Form - Customer Confirmation"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"contact-form-customer\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"customerEmail\": \"test@example.com\",
      \"subject\": \"Question about workshop availability\",
      \"message\": \"Hi, I would like to know if you have any watercolor workshops available in March?\",
      \"referenceNumber\": \"CONTACT-12345\",
      \"submissionDate\": \"February 6, 2026 at 10:30 AM\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 3: Contact Form - Admin Notification
echo "3️⃣  Testing: Contact Form - Admin Notification"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"contact-form-admin\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"customerEmail\": \"test@example.com\",
      \"customerPhone\": \"+44 7700 900123\",
      \"subject\": \"Question about workshop availability\",
      \"message\": \"Hi, I would like to know if you have any watercolor workshops available in March?\",
      \"referenceNumber\": \"CONTACT-12345\",
      \"submissionDate\": \"February 6, 2026 at 10:30 AM\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""
echo "✅ All contact and password tests complete!"
echo "📬 Check your inbox at: $TEST_EMAIL"

