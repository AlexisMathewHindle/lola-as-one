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

require_env() {
    local name="$1"
    if [ -z "${!name}" ]; then
        echo "❌ $name is not set"
        exit 1
    fi
}

set_secret() {
    local name="$1"
    local value="$2"

    if [ -z "$value" ]; then
        return
    fi

    echo ""
    echo "Setting $name..."
    $SUPABASE_CMD secrets set "$name=$value" --project-ref "$PROJECT_REF"
}

# Read secrets from supabase/functions/.env
if [ ! -f "supabase/functions/.env" ]; then
    echo "❌ supabase/functions/.env file not found"
    exit 1
fi

echo "📖 Reading secrets from supabase/functions/.env"
echo ""

# Source the .env file
source supabase/functions/.env

PROJECT_REF="${PROJECT_REF:-hubbjhtjyubzczxengyo}"
CHECKOUT_APP_URL="${CHECKOUT_APP_URL:-$APP_URL}"

require_env PROJECT_REF
require_env SUPABASE_URL
require_env SUPABASE_SERVICE_ROLE_KEY
require_env STRIPE_SECRET_KEY
require_env STRIPE_WEBHOOK_SECRET
require_env RESEND_API_KEY
require_env APP_URL
require_env EMAIL_FROM

# Set required secrets.
set_secret "SUPABASE_URL" "$SUPABASE_URL"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
set_secret "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
set_secret "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
set_secret "APP_URL" "$APP_URL"
set_secret "CHECKOUT_APP_URL" "$CHECKOUT_APP_URL"
set_secret "RESEND_API_KEY" "$RESEND_API_KEY"
set_secret "EMAIL_FROM" "$EMAIL_FROM"

# Set optional operational secrets when present.
set_secret "EMAIL_REPLY_TO" "$EMAIL_REPLY_TO"
set_secret "SUPPORT_EMAIL" "$SUPPORT_EMAIL"
set_secret "ADMIN_EMAILS" "$ADMIN_EMAILS"
set_secret "FUNCTIONS_GATEWAY_JWT" "$FUNCTIONS_GATEWAY_JWT"
set_secret "SITE_URL" "$SITE_URL"
set_secret "EVENT_FEEDBACK_URL" "$EVENT_FEEDBACK_URL"
set_secret "EVENT_EMAIL_TIME_ZONE" "$EVENT_EMAIL_TIME_ZONE"
set_secret "EVENT_EMAIL_CRON_SECRET" "$EVENT_EMAIL_CRON_SECRET"
set_secret "MAILCHIMP_API_KEY" "$MAILCHIMP_API_KEY"
set_secret "MAILCHIMP_AUDIENCE_ID" "$MAILCHIMP_AUDIENCE_ID"
set_secret "MAILCHIMP_SERVER_PREFIX" "$MAILCHIMP_SERVER_PREFIX"
set_secret "MAILCHIMP_DOUBLE_OPT_IN" "$MAILCHIMP_DOUBLE_OPT_IN"

echo ""
echo "✅ All secrets set!"
echo ""
echo "Next steps:"
echo "1. Redeploy the Edge Functions:"
echo "   $SUPABASE_CMD functions deploy create-checkout-session --no-verify-jwt"
echo "   $SUPABASE_CMD functions deploy stripe-webhook --no-verify-jwt"
echo "   $SUPABASE_CMD functions deploy send-email"
echo ""
echo "2. Test the checkout flow"
