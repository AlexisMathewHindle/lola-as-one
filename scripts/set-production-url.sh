#!/bin/bash

# Script to set the production APP_URL for Supabase Edge Functions
# This fixes the redirect issue where users are sent to localhost after Stripe checkout

set -e

echo "🌐 Set Production APP_URL for Supabase Edge Functions"
echo ""
echo "This will configure where users are redirected after Stripe checkout."
echo ""
echo "Current domains:"
echo "  - Netlify (current): https://lola-workshops.netlify.app"
echo "  - Custom domain (future): https://www.lotsoflovelyart.com"
echo ""

# Prompt for production URL
read -p "Enter your production URL (e.g., https://lola-workshops.netlify.app): " PRODUCTION_URL

# Validate URL format
if [[ ! $PRODUCTION_URL =~ ^https?:// ]]; then
  echo "❌ Invalid URL format. Must start with http:// or https://"
  exit 1
fi

# Remove trailing slash if present
PRODUCTION_URL=${PRODUCTION_URL%/}

echo ""
echo "Setting APP_URL to: $PRODUCTION_URL"
echo ""

# Set the secret
if supabase secrets set APP_URL="$PRODUCTION_URL" --project-ref hubbjhtjyubzczxengyo; then
  echo ""
  echo "✅ APP_URL secret set successfully!"
  echo ""

  # Ask if user wants to redeploy functions
  read -p "Do you want to redeploy the checkout functions now? (y/n) " -n 1 -r
  echo ""

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Redeploying checkout functions..."
    echo ""

    echo "1/2 Deploying create-checkout-session..."
    supabase functions deploy create-checkout-session --no-verify-jwt --project-ref hubbjhtjyubzczxengyo

    echo ""
    echo "2/2 Deploying create-subscription-checkout-session..."
    supabase functions deploy create-subscription-checkout-session --no-verify-jwt --project-ref hubbjhtjyubzczxengyo

    echo ""
    echo "✅ Functions redeployed!"
    echo ""
    echo "🎉 All done! Users will now be redirected to:"
    echo "   Success: $PRODUCTION_URL/order/success"
    echo "   Cancel:  $PRODUCTION_URL/checkout"
    echo ""
    echo "💡 To change the domain later, just run this script again!"
  else
    echo ""
    echo "⚠️  Remember to redeploy the functions for changes to take effect:"
    echo "   ./scripts/deploy-checkout-functions.sh"
  fi
else
  echo ""
  echo "❌ Failed to set APP_URL secret"
  exit 1
fi

