#!/bin/bash

# Deploy Checkout Edge Functions to Supabase
# This script deploys all checkout-related Edge Functions

set -e

echo "🚀 Deploying Checkout Edge Functions to Supabase"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI ready"
echo ""

# Check if user is logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Please log in first:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Check if linked to a project
echo "🔗 Checking project link..."
if ! supabase status &> /dev/null 2>&1; then
    echo "⚠️  Not linked to a Supabase project"
    echo ""
    echo "Please link to your project first:"
    echo "  supabase link --project-ref hubbjhtjyubzczxengyo"
    echo ""
    read -p "Do you want to link now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase link --project-ref hubbjhtjyubzczxengyo
    else
        exit 1
    fi
fi

echo "✅ Project linked"
echo ""

# Check required secrets
echo "🔑 Checking required secrets..."
echo ""
echo "The following secrets must be set in your Supabase project:"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - APP_URL"
echo "  - RESEND_API_KEY (for email notifications)"
echo ""

read -p "Have you set all required secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set the required secrets first:"
    echo ""
    echo "  supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here"
    echo "  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here"
    echo "  supabase secrets set SUPABASE_URL=https://hubbjhtjyubzczxengyo.supabase.co"
    echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "  supabase secrets set APP_URL=http://localhost:5173"
    echo "  supabase secrets set RESEND_API_KEY=re_your_key_here"
    echo ""
    echo "Or in Supabase Dashboard:"
    echo "  Project Settings > Edge Functions > Secrets"
    echo ""
    exit 1
fi

echo "✅ Secrets configured"
echo ""

# Deploy functions
echo "📦 Deploying Edge Functions (with JWT verification disabled for guest checkout)..."
echo ""

echo "1/4 Deploying create-checkout-session (no JWT required - allows guest checkout)..."
if supabase functions deploy create-checkout-session --no-verify-jwt; then
    echo "✅ create-checkout-session deployed"
else
    echo "❌ Failed to deploy create-checkout-session"
    exit 1
fi

echo ""
echo "2/4 Deploying create-subscription-checkout-session (no JWT required)..."
if supabase functions deploy create-subscription-checkout-session --no-verify-jwt; then
    echo "✅ create-subscription-checkout-session deployed"
else
    echo "❌ Failed to deploy create-subscription-checkout-session"
    exit 1
fi

echo ""
echo "3/4 Deploying stripe-webhook (no JWT required - called by Stripe)..."
if supabase functions deploy stripe-webhook --no-verify-jwt; then
    echo "✅ stripe-webhook deployed"
else
    echo "❌ Failed to deploy stripe-webhook"
    exit 1
fi

echo ""
echo "4/4 Deploying validate-subscription-boxes (no JWT required)..."
if supabase functions deploy validate-subscription-boxes --no-verify-jwt; then
    echo "✅ validate-subscription-boxes deployed"
else
    echo "❌ Failed to deploy validate-subscription-boxes"
    exit 1
fi

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "📍 Function URLs:"
echo "   https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/create-checkout-session"
echo "   https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/create-subscription-checkout-session"
echo "   https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook"
echo "   https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/validate-subscription-boxes"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Configure Stripe Webhook Endpoint:"
echo "   - Go to https://dashboard.stripe.com/webhooks"
echo "   - Click 'Add endpoint'"
echo "   - Enter URL: https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook"
echo "   - Select events: checkout.session.completed, checkout.session.expired"
echo "   - Copy the webhook signing secret and update STRIPE_WEBHOOK_SECRET"
echo ""
echo "2. Test the checkout flow in your app"
echo ""
echo "✨ Deployment complete!"

