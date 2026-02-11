#!/bin/bash

# Webhook Diagnostic Script
# This script checks if your webhook setup is correct

set -e

echo "🔍 Stripe Webhook Diagnostic"
echo ""

# Check if .env file exists
echo "1. Checking .env file..."
if [ -f "supabase/functions/.env" ]; then
    echo "   ✅ .env file exists"
    
    # Check for required variables
    echo ""
    echo "2. Checking environment variables..."
    
    if grep -q "STRIPE_SECRET_KEY=sk_" supabase/functions/.env; then
        echo "   ✅ STRIPE_SECRET_KEY is set"
    else
        echo "   ❌ STRIPE_SECRET_KEY is missing or invalid"
    fi
    
    if grep -q "STRIPE_WEBHOOK_SECRET=whsec_" supabase/functions/.env; then
        echo "   ✅ STRIPE_WEBHOOK_SECRET is set"
    elif grep -q "STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret" supabase/functions/.env; then
        echo "   ❌ STRIPE_WEBHOOK_SECRET is still the placeholder value!"
        echo "      You need to set the real webhook secret from 'stripe listen'"
    else
        echo "   ❌ STRIPE_WEBHOOK_SECRET is missing"
    fi
    
    if grep -q "SUPABASE_URL=https://" supabase/functions/.env; then
        echo "   ✅ SUPABASE_URL is set"
    else
        echo "   ❌ SUPABASE_URL is missing or invalid"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY=eyJ" supabase/functions/.env; then
        echo "   ✅ SUPABASE_SERVICE_ROLE_KEY is set"
    else
        echo "   ❌ SUPABASE_SERVICE_ROLE_KEY is missing or invalid"
    fi
else
    echo "   ❌ .env file not found at supabase/functions/.env"
    echo "      Copy .env.example to .env and fill in the values"
fi

echo ""
echo "3. Checking Supabase status..."
if supabase status > /dev/null 2>&1; then
    echo "   ✅ Supabase is running"
    
    # Get the API URL
    API_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    echo "   API URL: $API_URL"
else
    echo "   ❌ Supabase is not running"
    echo "      Run: supabase start"
fi

echo ""
echo "4. Checking webhook function..."
if [ -f "supabase/functions/stripe-webhook/index.ts" ]; then
    echo "   ✅ Webhook function exists"
else
    echo "   ❌ Webhook function not found"
fi

echo ""
echo "5. Checking Stripe CLI..."
if command -v stripe &> /dev/null; then
    echo "   ✅ Stripe CLI is installed"
    
    # Check if authenticated
    if stripe config --list > /dev/null 2>&1; then
        echo "   ✅ Stripe CLI is authenticated"
    else
        echo "   ❌ Stripe CLI is not authenticated"
        echo "      Run: stripe login"
    fi
else
    echo "   ❌ Stripe CLI is not installed"
    echo "      Install: brew install stripe/stripe-cli/stripe"
fi

echo ""
echo "6. Testing webhook endpoint..."
if curl -s -X POST http://localhost:54321/functions/v1/stripe-webhook > /dev/null 2>&1; then
    echo "   ✅ Webhook endpoint is accessible"
else
    echo "   ❌ Webhook endpoint is not accessible"
    echo "      Make sure Supabase is running: supabase start"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if webhook secret needs to be updated
if grep -q "STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret" supabase/functions/.env; then
    echo "⚠️  ACTION REQUIRED:"
    echo ""
    echo "Your STRIPE_WEBHOOK_SECRET is not set correctly."
    echo ""
    echo "To fix this:"
    echo "1. Run: stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook"
    echo "2. Copy the webhook signing secret (whsec_...)"
    echo "3. Update supabase/functions/.env:"
    echo "   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here"
    echo "4. Restart Supabase: supabase stop && supabase start"
    echo ""
elif grep -q "STRIPE_WEBHOOK_SECRET=whsec_" supabase/functions/.env; then
    echo "✅ All checks passed!"
    echo ""
    echo "Your webhook should be working. To test:"
    echo ""
    echo "Terminal 1: supabase functions logs stripe-webhook --follow"
    echo "Terminal 2: stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook"
    echo "Terminal 3: stripe trigger checkout.session.completed"
    echo ""
fi

