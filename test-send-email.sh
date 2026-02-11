#!/bin/bash

# Test script for send-email Edge Function
# This sends a test order confirmation email

echo "🧪 Testing send-email Edge Function..."
echo ""

# Test email address (change this to your email)
TEST_EMAIL="alexishindle@gmail.com"

echo "📧 Sending test order confirmation email to: $TEST_EMAIL"
echo ""

# Send test email (using service role key for local testing)
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU' \
  --header 'Content-Type: application/json' \
  --data '{
    "template": "order-confirmation",
    "to": "'$TEST_EMAIL'",
    "data": {
      "orderNumber": "TEST-001",
      "customerName": "Test User",
      "orderItems": [
        {
          "name": "Watercolor Workshop",
          "quantity": 1,
          "price": 45.00
        },
        {
          "name": "Art Supplies Kit",
          "quantity": 2,
          "price": 25.00
        }
      ],
      "subtotal": 95.00,
      "shipping": 5.00,
      "vat": 20.00,
      "total": 120.00,
      "paymentMethod": "Visa ending in 4242"
    }
  }'

echo ""
echo ""
echo "✅ Test complete! Check the terminal running the function for logs."
echo "📬 Check your email at: $TEST_EMAIL"

