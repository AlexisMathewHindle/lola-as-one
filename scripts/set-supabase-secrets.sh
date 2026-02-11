#!/bin/bash

# Set Supabase Edge Function Secrets
# This script sets the required environment variables for Edge Functions

echo "🔐 Setting Supabase Edge Function Secrets"
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo ""
    echo "Trying to use local installation..."
    SUPABASE_CMD="./app/node_modules/supabase/bin/supabase"
    
    if [ ! -f "$SUPABASE_CMD" ]; then
        echo "❌ Local Supabase CLI not found either"
        echo ""
        echo "Please install Supabase CLI:"
        echo "  npm install -g supabase"
        exit 1
    fi
else
    SUPABASE_CMD="supabase"
fi

echo "Using Supabase CLI: $SUPABASE_CMD"
echo ""

# Read secrets from supabase/functions/.env
if [ ! -f "supabase/functions/.env" ]; then
    echo "❌ supabase/functions/.env file not found"
    exit 1
fi

echo "📖 Reading secrets from supabase/functions/.env"
echo ""

# Source the .env file
source supabase/functions/.env

# Set secrets
echo "Setting STRIPE_SECRET_KEY..."
$SUPABASE_CMD secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"

echo ""
echo "Setting STRIPE_WEBHOOK_SECRET..."
$SUPABASE_CMD secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"

echo ""
echo "Setting SUPABASE_URL..."
# Use remote URL for production
$SUPABASE_CMD secrets set SUPABASE_URL="https://hubbjhtjyubzczxengyo.supabase.co"

echo ""
echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
# Use remote service role key
$SUPABASE_CMD secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YmJqaHRqeXViemN6eGVuZ3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk1Mzc3MywiZXhwIjoyMDg1NTI5NzczfQ._4G1ktW-qtkazC-_yOQAPALUlDIyyQU8nudX8MzDz00"

echo ""
echo "Setting APP_URL..."
$SUPABASE_CMD secrets set APP_URL="http://localhost:5173"

echo ""
echo "Setting RESEND_API_KEY..."
$SUPABASE_CMD secrets set RESEND_API_KEY="$RESEND_API_KEY"

echo ""
echo "✅ All secrets set!"
echo ""
echo "Next steps:"
echo "1. Redeploy the Edge Function:"
echo "   $SUPABASE_CMD functions deploy create-checkout-session --no-verify-jwt"
echo ""
echo "2. Test the checkout flow"

