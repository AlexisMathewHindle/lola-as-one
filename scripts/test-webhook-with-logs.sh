#!/bin/bash

# Test webhook and show detailed logs

echo "🧪 Testing Stripe Webhook with Detailed Logging"
echo ""

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running"
    echo "Starting Supabase..."
    supabase start
fi

echo "✅ Supabase is running"
echo ""

# Clear previous logs
echo "📋 Watching function logs..."
echo "   (This will show what happens when the webhook receives events)"
echo ""

# Start watching logs in background
supabase functions logs stripe-webhook --follow &
LOGS_PID=$!

# Give logs time to start
sleep 2

echo ""
echo "🚀 Triggering test checkout.session.completed event..."
echo ""

# Trigger the event
stripe trigger checkout.session.completed

# Wait for processing
sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Checking database for new orders..."
echo ""

# Check if any orders were created
supabase db execute "SELECT order_number, customer_email, total_gbp, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5;" 2>/dev/null || echo "No orders found or error querying database"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill the logs process
kill $LOGS_PID 2>/dev/null

echo ""
echo "💡 If no orders were created, check the logs above for errors"

