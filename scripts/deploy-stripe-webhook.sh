#!/bin/bash

# Stripe Webhook Deployment Script
# This script deploys the Stripe webhook Edge Function to Supabase

set -e

echo "🚀 Stripe Webhook Deployment"
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

echo "✅ Authenticated with Supabase"
echo ""

# Check if required secrets are set
echo "🔑 Checking for required secrets..."
echo ""
echo "Required secrets:"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - APP_URL"
echo ""

read -p "Have you set all required secrets? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set the required secrets first:"
    echo ""
    echo "  supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here"
    echo "  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here"
    echo "  supabase secrets set SUPABASE_URL=https://your-project.supabase.co"
    echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "  supabase secrets set APP_URL=https://your-app-domain.com"
    echo ""
    echo "Or in Supabase Dashboard:"
    echo "  Project Settings > Edge Functions > Secrets"
    echo ""
    exit 1
fi

echo "✅ Secrets configured"
echo ""

# Deploy the stripe-webhook function
echo "📦 Deploying stripe-webhook Edge Function..."
supabase functions deploy stripe-webhook

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ stripe-webhook function deployed successfully"
    echo ""
    
    # Get the function URL
    echo "📍 Function URL:"
    echo "   https://[your-project-ref].supabase.co/functions/v1/stripe-webhook"
    echo ""
    
    echo "🎯 Next Steps:"
    echo ""
    echo "1. Configure Stripe Webhook Endpoint:"
    echo "   - Go to https://dashboard.stripe.com/webhooks"
    echo "   - Click 'Add endpoint'"
    echo "   - Enter URL: https://[your-project-ref].supabase.co/functions/v1/stripe-webhook"
    echo "   - Select events:"
    echo "     • checkout.session.completed"
    echo "     • checkout.session.expired"
    echo "     • customer.subscription.created (if using subscriptions)"
    echo "     • customer.subscription.updated (if using subscriptions)"
    echo "     • customer.subscription.deleted (if using subscriptions)"
    echo "   - Copy the webhook signing secret (whsec_...)"
    echo ""
    echo "2. Update STRIPE_WEBHOOK_SECRET if needed:"
    echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_new_secret"
    echo ""
    echo "3. Test the webhook:"
    echo "   - Create a test checkout session"
    echo "   - Complete payment with test card: 4242 4242 4242 4242"
    echo "   - Check logs: supabase functions logs stripe-webhook"
    echo ""
    echo "4. Monitor webhook deliveries in Stripe Dashboard:"
    echo "   https://dashboard.stripe.com/webhooks"
    echo ""
    echo "✨ Deployment complete!"
else
    echo ""
    echo "❌ Failed to deploy stripe-webhook function"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check that you're in the project root directory"
    echo "  - Verify supabase/functions/stripe-webhook/index.ts exists"
    echo "  - Check Supabase CLI version: supabase --version"
    echo "  - Try: supabase link (if not linked to a project)"
    echo ""
    exit 1
fi

