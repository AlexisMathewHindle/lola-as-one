#!/bin/bash

# Test Event Booking Confirmation Email

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "🎨 Testing Event Booking Confirmation Email"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

curl -i --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"event-booking-confirmation\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"eventName\": \"Watercolor Landscapes Workshop\",
      \"eventDate\": \"Saturday, March 15, 2026\",
      \"eventTime\": \"10:00 AM - 1:00 PM\",
      \"location\": \"Lola Studio, 123 Creative Lane, London\",
      \"numberOfAttendees\": 2,
      \"bookingReference\": \"BOOK-12345\",
      \"orderNumber\": \"TEST-002\",
      \"pricePaid\": 90.00,
      \"whatToBring\": \"Please bring an apron and enthusiasm! All art supplies will be provided.\",
      \"parkingInfo\": \"Free parking available on Creative Lane. Nearest tube: Angel Station (5 min walk)\",
      \"cancellationPolicy\": \"Free cancellation up to 48 hours before the event. Cancellations within 48 hours are non-refundable.\"
    }
  }"

echo ""
echo ""
echo "✅ Test complete!"

