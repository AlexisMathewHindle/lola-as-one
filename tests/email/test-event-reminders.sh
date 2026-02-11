#!/bin/bash

# Test Event Reminder Email Templates

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "⏰ Testing Event Reminder Email Templates"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

# Test 1: Event Reminder - 7 Days
echo "1️⃣  Testing: Event Reminder - 7 Days"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"event-reminder-7-days\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"eventName\": \"Watercolor Landscapes Workshop\",
      \"eventDate\": \"Saturday, February 13, 2026\",
      \"eventTime\": \"10:00 AM - 1:00 PM\",
      \"location\": \"Lola Studio, 123 Creative Lane, London\",
      \"numberOfAttendees\": 2,
      \"whatToBring\": \"Please bring an apron. All art supplies will be provided.\",
      \"parkingInfo\": \"Free parking on Creative Lane. Nearest tube: Angel Station\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""

# Test 2: Event Reminder - 24 Hours
echo "2️⃣  Testing: Event Reminder - 24 Hours"
curl -s --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"event-reminder-24-hours\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"eventName\": \"Watercolor Landscapes Workshop\",
      \"eventDate\": \"Saturday, February 7, 2026\",
      \"eventTime\": \"10:00 AM - 1:00 PM\",
      \"location\": \"Lola Studio, 123 Creative Lane, London\",
      \"weatherInfo\": \"Sunny with a high of 15°C. Perfect weather for creativity!\"
    }
  }" | grep -q '"success":true' && echo "✅ Success" || echo "❌ Failed"

echo ""
echo "✅ All event reminder tests complete!"
echo "📬 Check your inbox at: $TEST_EMAIL"

