#!/bin/bash

# Set production Stripe and checkout URL secrets for the shared Supabase project.
# This script prompts locally so live keys do not need to be pasted into chat
# or committed to files.

set -euo pipefail

PROJECT_REF_DEFAULT="hubbjhtjyubzczxengyo"
PRODUCTION_URL_DEFAULT="https://lolacreativespace.com"

find_supabase_cli() {
  if command -v supabase >/dev/null 2>&1; then
    echo "supabase"
    return
  fi

  local local_cli="./app/node_modules/supabase/bin/supabase"
  if [ -x "$local_cli" ]; then
    echo "$local_cli"
    return
  fi

  echo ""
}

require_non_empty() {
  local name="$1"
  local value="$2"

  if [ -z "$value" ]; then
    echo "ERROR: $name is required."
    exit 1
  fi
}

set_secret() {
  local name="$1"
  local value="$2"

  echo "Setting $name..."
  "$SUPABASE_CMD" secrets set "$name=$value" --project-ref "$PROJECT_REF"
}

SUPABASE_CMD="$(find_supabase_cli)"
if [ -z "$SUPABASE_CMD" ]; then
  echo "ERROR: Supabase CLI was not found."
  echo "Install it, or run npm install in app/ so the local CLI is available."
  exit 1
fi

echo "Using Supabase CLI: $SUPABASE_CMD"
echo ""

read -r -p "Supabase project ref [$PROJECT_REF_DEFAULT]: " PROJECT_REF
PROJECT_REF="${PROJECT_REF:-$PROJECT_REF_DEFAULT}"

read -r -p "Production URL [$PRODUCTION_URL_DEFAULT]: " PRODUCTION_URL
PRODUCTION_URL="${PRODUCTION_URL:-$PRODUCTION_URL_DEFAULT}"
PRODUCTION_URL="${PRODUCTION_URL%/}"

if [[ ! "$PRODUCTION_URL" =~ ^https:// ]]; then
  echo "ERROR: Production URL must start with https://"
  exit 1
fi

echo ""
echo "Paste the live Stripe secret key. Input is hidden."
read -r -s -p "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
echo ""

echo "Paste the live Stripe webhook signing secret. Input is hidden."
read -r -s -p "STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET
echo ""
echo ""

require_non_empty "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
require_non_empty "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"

if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
  echo "ERROR: This is a Stripe test secret key. Production needs a live key."
  exit 1
fi

if [[ "$STRIPE_SECRET_KEY" != sk_live_* && "$STRIPE_SECRET_KEY" != rk_live_* ]]; then
  echo "WARNING: Stripe key does not start with sk_live_ or rk_live_."
  read -r -p "Continue anyway? (y/N): " CONTINUE_WITH_KEY
  if [[ ! "$CONTINUE_WITH_KEY" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

if [[ "$STRIPE_WEBHOOK_SECRET" != whsec_* ]]; then
  echo "ERROR: Stripe webhook signing secret should start with whsec_."
  exit 1
fi

echo "About to set production checkout secrets for:"
echo "  Project: $PROJECT_REF"
echo "  URL:     $PRODUCTION_URL"
echo ""
read -r -p "Proceed? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

set_secret "ENVIRONMENT" "production"
set_secret "APP_URL" "$PRODUCTION_URL"
set_secret "CHECKOUT_APP_URL" "$PRODUCTION_URL"
set_secret "SITE_URL" "$PRODUCTION_URL"
set_secret "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
set_secret "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"

echo ""
echo "Production Stripe secrets were set."
echo ""
read -r -p "Redeploy checkout/webhook/email functions now? (y/N): " DEPLOY_NOW

if [[ "$DEPLOY_NOW" =~ ^[Yy]$ ]]; then
  "$SUPABASE_CMD" functions deploy create-checkout-session --no-verify-jwt --project-ref "$PROJECT_REF"
  "$SUPABASE_CMD" functions deploy stripe-webhook --no-verify-jwt --project-ref "$PROJECT_REF"
  "$SUPABASE_CMD" functions deploy get-order-by-session --project-ref "$PROJECT_REF"
  "$SUPABASE_CMD" functions deploy send-email --project-ref "$PROJECT_REF"
  echo ""
  echo "Functions redeployed."
else
  echo ""
  echo "Remember to redeploy these functions after secret changes:"
  echo "  $SUPABASE_CMD functions deploy create-checkout-session --no-verify-jwt --project-ref $PROJECT_REF"
  echo "  $SUPABASE_CMD functions deploy stripe-webhook --no-verify-jwt --project-ref $PROJECT_REF"
  echo "  $SUPABASE_CMD functions deploy get-order-by-session --project-ref $PROJECT_REF"
  echo "  $SUPABASE_CMD functions deploy send-email --project-ref $PROJECT_REF"
fi

echo ""
echo "Next:"
echo "1. Set Netlify production VITE_APP_URL=$PRODUCTION_URL"
echo "2. Set Netlify production VITE_STRIPE_PUBLISHABLE_KEY to the live publishable key."
echo "3. Trigger a fresh Netlify production deploy."
echo "4. Run one low-risk live checkout proof."

