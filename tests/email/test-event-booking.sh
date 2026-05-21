#!/bin/bash

# Test Event Booking Confirmation Email

TEST_EMAIL="${1:-alexishindle@gmail.com}"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo "🎨 Testing Event Booking Emails"
echo "📧 Sending to: $TEST_EMAIL"
echo ""

echo "1. Customer event booking confirmation"
curl -i --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"event-booking-confirmation\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"customerName\": \"Test User\",
      \"eventName\": \"Watercolor Landscapes Workshop\",
      \"eventDate\": \"Saturday, June 20, 2026\",
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
echo "2. Admin order notification for event booking"
curl -i --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"new-order-admin\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"orderNumber\": \"TEST-ADMIN-001\",
      \"customerName\": \"Test User\",
      \"customerEmail\": \"test@example.com\",
      \"orderTotal\": 90.00,
      \"orderItems\": [
        {
          \"name\": \"Watercolor Landscapes Workshop\",
          \"quantity\": 2,
          \"price\": 90.00,
          \"type\": \"event\",
          \"attendees\": 2,
          \"eventDate\": \"Saturday, June 20, 2026\",
          \"eventTime\": \"10:00 AM - 1:00 PM\"
        }
      ],
      \"hasEvents\": true,
      \"hasPhysicalProducts\": false
    }
  }"

echo ""
echo ""
echo "3. Admin order notification with attendee object details"
curl -i --location --request POST "$API_URL" \
  --header "Authorization: Bearer $AUTH_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"template\": \"new-order-admin\",
    \"to\": \"$TEST_EMAIL\",
    \"data\": {
      \"orderNumber\": \"TEST-ADMIN-002\",
      \"customerName\": \"Test User\",
      \"customerEmail\": \"test@example.com\",
      \"orderTotal\": 90.00,
      \"orderItems\": [
        {
          \"name\": \"Watercolor Landscapes Workshop\",
          \"quantity\": 2,
          \"price\": 90.00,
          \"type\": \"event\",
          \"attendees\": [
            {
              \"firstName\": \"Ada\",
              \"lastName\": \"Lovelace\",
              \"email\": \"ada@example.com\",
              \"phone\": \"07123456789\",
              \"allergies\": \"None\",
              \"notes\": \"No notes\"
            },
            {
              \"firstName\": \"Grace\",
              \"lastName\": \"Hopper\",
              \"email\": \"grace@example.com\",
              \"phone\": \"07987654321\",
              \"allergies\": \"Nuts\",
              \"notes\": \"Prefers front row\"
            }
          ],
          \"eventDate\": \"Saturday, June 20, 2026\",
          \"eventTime\": \"10:00 AM - 1:00 PM\"
        }
      ],
      \"hasEvents\": true,
      \"hasPhysicalProducts\": false
    }
  }"

echo ""
echo ""
echo "✅ Test complete!"
