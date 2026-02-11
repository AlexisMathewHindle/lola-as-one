#!/bin/bash

# Start Stripe webhook listener for local development
# This forwards Stripe events to your deployed Edge Function

echo "🎧 Starting Stripe webhook listener..."
echo ""
echo "This will forward Stripe events to your Edge Function:"
echo "https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook"
echo ""

# Your Supabase anon key for authentication
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YmJqaHRqeXViemN6eGVuZ3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTM3NzMsImV4cCI6MjA4NTUyOTc3M30.Kq7nXGk7rWK265-joM5nE-pUuRuIG0eCfzUtlaL2CrU"

echo "Make sure you have Stripe CLI installed:"
echo "  brew install stripe/stripe-cli/stripe"
echo ""
echo "And that you're logged in:"
echo "  stripe login"
echo ""
echo "Starting listener..."
echo ""

stripe listen \
  --forward-to "https://hubbjhtjyubzczxengyo.supabase.co/functions/v1/stripe-webhook" \
  --api-key "$SUPABASE_ANON_KEY" \
  --events checkout.session.completed,payment_intent.succeeded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted

echo ""
echo "✅ Webhook listener started!"
echo ""
echo "Copy the webhook signing secret (whsec_...) and update it in Supabase secrets:"
echo "  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here"
echo ""
echo "Then redeploy the webhook function:"
echo "  supabase functions deploy stripe-webhook --no-verify-jwt"

