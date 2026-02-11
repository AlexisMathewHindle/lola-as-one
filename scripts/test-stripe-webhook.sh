#!/bin/bash

# Stripe Webhook Testing Script
# This script helps you test the Stripe webhook locally

set -e

echo "🧪 Stripe Webhook Testing"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  brew install stripe/stripe-cli/stripe  # macOS"
    echo "  # Or visit: https://stripe.com/docs/stripe-cli"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI ready"
echo ""

# Check if user is logged in to Stripe
echo "🔐 Checking Stripe authentication..."
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged in to Stripe"
    echo ""
    echo "Please log in first:"
    echo "  stripe login"
    echo ""
    read -p "Press Enter after logging in..."
fi

echo "✅ Authenticated with Stripe"
echo ""

# Check if Supabase is running locally
echo "🔍 Checking if Supabase is running locally..."
if ! curl -s http://localhost:54321/functions/v1/stripe-webhook > /dev/null 2>&1; then
    echo "⚠️  Supabase doesn't appear to be running locally"
    echo ""
    read -p "Do you want to start Supabase now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting Supabase..."
        supabase start
    else
        echo ""
        echo "Please start Supabase first:"
        echo "  supabase start"
        echo ""
        exit 1
    fi
fi

echo "✅ Supabase is running"
echo ""

# Show menu
echo "Choose a testing option:"
echo ""
echo "1. Listen for webhook events (forward to local function)"
echo "2. Trigger a test checkout.session.completed event"
echo "3. Trigger a test checkout.session.expired event"
echo "4. View webhook logs"
echo "5. Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🎧 Listening for Stripe webhook events..."
        echo ""
        echo "This will forward all Stripe events to your local webhook function."
        echo "Keep this terminal open and test payments in another terminal or browser."
        echo ""
        echo "📝 Copy the webhook signing secret (whsec_...) and set it:"
        echo "   export STRIPE_WEBHOOK_SECRET=whsec_..."
        echo ""
        stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
        ;;
    2)
        echo ""
        echo "🚀 Triggering checkout.session.completed event..."
        echo ""
        stripe trigger checkout.session.completed
        echo ""
        echo "✅ Event triggered!"
        echo ""
        echo "Check the logs to see if it was processed:"
        echo "  supabase functions logs stripe-webhook"
        ;;
    3)
        echo ""
        echo "🚀 Triggering checkout.session.expired event..."
        echo ""
        stripe trigger checkout.session.expired
        echo ""
        echo "✅ Event triggered!"
        echo ""
        echo "Check the logs to see if it was processed:"
        echo "  supabase functions logs stripe-webhook"
        ;;
    4)
        echo ""
        echo "📋 Viewing webhook logs..."
        echo ""
        supabase functions logs stripe-webhook --follow
        ;;
    5)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

