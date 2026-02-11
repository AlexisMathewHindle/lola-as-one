#!/bin/bash

# Master test script for all email templates
# This script sends test emails for all available templates

# Configuration
TEST_EMAIL="alexishindle@gmail.com"
API_URL="http://127.0.0.1:54321/functions/v1/send-email"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Email Template Testing Suite"
echo "================================"
echo ""
echo "📧 Test emails will be sent to: $TEST_EMAIL"
echo ""

# Function to send email and check response
send_test_email() {
    local template=$1
    local data=$2

    echo -e "${BLUE}Testing: $template${NC}"

    response=$(curl -s --location --request POST "$API_URL" \
        --header "Authorization: Bearer $AUTH_TOKEN" \
        --header "Content-Type: application/json" \
        --data "{
            \"template\": \"$template\",
            \"to\": \"$TEST_EMAIL\",
            \"data\": $data
        }")

    if echo "$response" | grep -q '"success":true'; then
        email_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Success${NC} - Email ID: $email_id"
    else
        echo -e "${RED}✗ Failed${NC}"
        echo "Response: $response"
    fi
    echo ""

    # Add delay to avoid rate limiting (Resend allows 2 requests/second)
    sleep 0.6
}

# Test 1: Order Confirmation
echo "1️⃣  Order Confirmation"
send_test_email "order-confirmation" '{
    "orderNumber": "TEST-001",
    "customerName": "Test User",
    "orderItems": [
        {"name": "Watercolor Workshop", "quantity": 1, "price": 45.00},
        {"name": "Art Supplies Kit", "quantity": 2, "price": 25.00}
    ],
    "subtotal": 95.00,
    "shipping": 5.00,
    "vat": 20.00,
    "total": 120.00,
    "shippingAddress": {
        "line1": "123 Test Street",
        "line2": "Apt 4B",
        "city": "London",
        "postcode": "SW1A 1AA",
        "country": "United Kingdom"
    },
    "paymentMethod": "Visa ending in 4242",
    "estimatedDelivery": "3-5 business days"
}'

# Test 2: Event Booking Confirmation
echo "2️⃣  Event Booking Confirmation"
send_test_email "event-booking-confirmation" '{
    "customerName": "Test User",
    "eventName": "Watercolor Landscapes Workshop",
    "eventDate": "Saturday, March 15, 2026",
    "eventTime": "10:00 AM - 1:00 PM",
    "location": "Lola Studio, 123 Creative Lane, London",
    "numberOfAttendees": 2,
    "bookingReference": "BOOK-12345",
    "orderNumber": "TEST-002",
    "pricePaid": 90.00,
    "whatToBring": "Please bring an apron and enthusiasm! All art supplies will be provided.",
    "parkingInfo": "Free parking available on Creative Lane. Nearest tube: Angel Station (5 min walk)",
    "cancellationPolicy": "Free cancellation up to 48 hours before the event. Cancellations within 48 hours are non-refundable."
}'

# Test 3: Subscription Activated
echo "3️⃣  Subscription Activated"
send_test_email "subscription-activated" '{
    "customerName": "Test User",
    "subscriptionName": "Monthly Craft Box",
    "billingInterval": "month",
    "pricePerCycle": 29.99,
    "nextBillingDate": "March 15, 2026",
    "firstBoxShippingDate": "February 20, 2026"
}'

# Test 4: Subscription Renewal Success
echo "4️⃣  Subscription Renewal Success"
send_test_email "subscription-renewal-success" '{
    "customerName": "Test User",
    "subscriptionName": "Monthly Craft Box",
    "amountCharged": 29.99,
    "billingDate": "February 15, 2026",
    "nextBillingDate": "March 15, 2026",
    "invoiceNumber": "INV-2026-001",
    "paymentMethod": "Visa ending in 4242"
}'

# Test 5: Subscription Payment Failed
echo "5️⃣  Subscription Payment Failed"
send_test_email "subscription-payment-failed" '{
    "customerName": "Test User",
    "subscriptionName": "Monthly Craft Box",
    "failedAmount": 29.99,
    "failureReason": "Insufficient funds",
    "retryDate": "February 18, 2026",
    "updatePaymentLink": "https://lolaasone.com/account/payment"
}'

# Test 6: Password Reset
echo "6️⃣  Password Reset"
send_test_email "password-reset" '{
    "resetLink": "https://lolaasone.com/reset-password?token=test123456",
    "expiryMinutes": 60
}'

# Test 7: Contact Form - Customer
echo "7️⃣  Contact Form - Customer Confirmation"
send_test_email "contact-form-customer" '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "subject": "Question about workshop availability",
    "message": "Hi, I would like to know if you have any watercolor workshops available in March?",
    "referenceNumber": "CONTACT-12345",
    "submissionDate": "February 6, 2026 at 10:30 AM"
}'

# Test 8: Contact Form - Admin
echo "8️⃣  Contact Form - Admin Notification"
send_test_email "contact-form-admin" '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+44 7700 900123",
    "subject": "Question about workshop availability",
    "message": "Hi, I would like to know if you have any watercolor workshops available in March?",
    "referenceNumber": "CONTACT-12345",
    "submissionDate": "February 6, 2026 at 10:30 AM"
}'

# Test 9: Digital Download Ready
echo "9️⃣  Digital Download Ready"
send_test_email "digital-download-ready" '{
    "customerName": "Test User",
    "productName": "Watercolor Techniques eBook",
    "downloadLinks": [
        {
            "name": "Watercolor Techniques PDF",
            "url": "https://lolaasone.com/downloads/watercolor-ebook.pdf",
            "format": "PDF",
            "size": "15 MB"
        },
        {
            "name": "Bonus Video Tutorial",
            "url": "https://lolaasone.com/downloads/tutorial.mp4",
            "format": "MP4",
            "size": "250 MB"
        }
    ],
    "expiryDate": "March 6, 2026",
    "orderNumber": "TEST-003"
}'

# Test 10: Order Shipped
echo "🔟 Order Shipped"
send_test_email "order-shipped" '{
    "customerName": "Test User",
    "orderNumber": "TEST-004",
    "trackingNumber": "GB123456789",
    "carrier": "Royal Mail",
    "trackingUrl": "https://www.royalmail.com/track-your-item?trackNumber=GB123456789",
    "estimatedDelivery": "February 10, 2026",
    "shippedItems": [
        {"name": "Watercolor Paint Set", "quantity": 1},
        {"name": "Premium Brushes (Set of 5)", "quantity": 1},
        {"name": "Watercolor Paper Pad", "quantity": 2}
    ]
}'

# Test 11: Event Reminder - 7 Days
echo "1️⃣1️⃣  Event Reminder - 7 Days"
send_test_email "event-reminder-7-days" '{
    "customerName": "Test User",
    "eventName": "Watercolor Landscapes Workshop",
    "eventDate": "Saturday, February 13, 2026",
    "eventTime": "10:00 AM - 1:00 PM",
    "location": "Lola Studio, 123 Creative Lane, London",
    "numberOfAttendees": 2,
    "whatToBring": "Please bring an apron. All art supplies will be provided.",
    "parkingInfo": "Free parking on Creative Lane. Nearest tube: Angel Station"
}'

# Test 12: Event Reminder - 24 Hours
echo "1️⃣2️⃣  Event Reminder - 24 Hours"
send_test_email "event-reminder-24-hours" '{
    "customerName": "Test User",
    "eventName": "Watercolor Landscapes Workshop",
    "eventDate": "Saturday, February 7, 2026",
    "eventTime": "10:00 AM - 1:00 PM",
    "location": "Lola Studio, 123 Creative Lane, London",
    "weatherInfo": "Sunny with a high of 15°C. Perfect weather for creativity!"
}'

# Test 13: Waitlist - Event Available
echo "1️⃣3️⃣  Waitlist - Event Available"
send_test_email "waitlist-event-available" '{
    "customerName": "Test User",
    "eventName": "Advanced Watercolor Techniques",
    "eventDate": "Saturday, March 1, 2026",
    "eventTime": "2:00 PM - 5:00 PM",
    "location": "Lola Studio, 123 Creative Lane, London",
    "spacesAvailable": 2,
    "price": 65.00,
    "expiryTime": "February 7, 2026 at 10:00 AM",
    "bookingLink": "https://lolaasone.com/events/advanced-watercolor?waitlist=true"
}'

# Test 14: Waitlist - Product Available
echo "1️⃣4️⃣  Waitlist - Product Available"
send_test_email "waitlist-product-available" '{
    "customerName": "Test User",
    "productName": "Limited Edition Watercolor Set",
    "productImage": "https://lolaasone.com/images/watercolor-set.jpg",
    "price": 89.99,
    "stockQuantity": 5,
    "expiryTime": "February 8, 2026 at 10:00 AM",
    "productLink": "https://lolaasone.com/products/limited-watercolor-set"
}'

echo ""
echo "================================"
echo -e "${GREEN}✅ All tests complete!${NC}"
echo ""
echo "📬 Check your inbox at: $TEST_EMAIL"
echo "🌐 View emails in Resend: https://resend.com/emails"
echo ""

