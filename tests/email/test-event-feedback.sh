#!/bin/bash

# Test Event Feedback Request Email Template

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "💬 Testing Event Feedback Request Email"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

curl -i --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"event-feedback-request\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"eventName\": \"Watercolor Landscapes Workshop\",
      \"eventDate\": \"Tuesday, May 12, 2026\",
      \"bookingReference\": \"BOOK-12345\",
      \"feedbackLink\": \"https://www.lotsoflovelyart.com/feedback?booking=BOOK-12345\",
      \"photoShareLink\": \"https://www.lotsoflovelyart.com/share-photos?booking=BOOK-12345\"
    }
  }"

echo ""
echo ""
echo "✅ Test complete!"
