#!/bin/bash

# Set the Supabase Edge Function secrets required for production email sending.

set -euo pipefail

if ! command -v supabase > /dev/null 2>&1; then
  SUPABASE_CMD="./app/node_modules/supabase/bin/supabase"
  if [ ! -f "$SUPABASE_CMD" ]; then
    echo "Supabase CLI not found. Install it or run from the repo root with app dependencies installed."
    exit 1
  fi
else
  SUPABASE_CMD="supabase"
fi

if [ -f "supabase/functions/.env" ]; then
  set -a
  source supabase/functions/.env
  set +a
fi

PROJECT_REF="${PROJECT_REF:-hubbjhtjyubzczxengyo}"
APP_URL="${APP_URL:-https://lolacreativespace.com}"
CHECKOUT_APP_URL="${CHECKOUT_APP_URL:-$APP_URL}"
SITE_URL="${SITE_URL:-$APP_URL}"
EVENT_FEEDBACK_URL="${EVENT_FEEDBACK_URL:-$APP_URL/contact}"
EMAIL_FROM="${EMAIL_FROM:-Lola As One <hello@lolacreativespace.com>}"
EMAIL_REPLY_TO="${EMAIL_REPLY_TO:-hello@lolacreativespace.com}"
SUPPORT_EMAIL="${SUPPORT_EMAIL:-$EMAIL_REPLY_TO}"
ADMIN_EMAILS="${ADMIN_EMAILS:-$EMAIL_REPLY_TO}"
EVENT_EMAIL_TIME_ZONE="${EVENT_EMAIL_TIME_ZONE:-Europe/London}"

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "$name is not set"
    exit 1
  fi
}

set_secret() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    return
  fi
  echo "Setting $name"
  "$SUPABASE_CMD" secrets set "$name=$value" --project-ref "$PROJECT_REF"
}

require_env RESEND_API_KEY

set_secret RESEND_API_KEY "$RESEND_API_KEY"
set_secret EMAIL_FROM "$EMAIL_FROM"
set_secret EMAIL_REPLY_TO "$EMAIL_REPLY_TO"
set_secret SUPPORT_EMAIL "$SUPPORT_EMAIL"
set_secret ADMIN_EMAILS "$ADMIN_EMAILS"
set_secret APP_URL "$APP_URL"
set_secret CHECKOUT_APP_URL "$CHECKOUT_APP_URL"
set_secret SITE_URL "$SITE_URL"
set_secret EVENT_FEEDBACK_URL "$EVENT_FEEDBACK_URL"
set_secret EVENT_EMAIL_TIME_ZONE "$EVENT_EMAIL_TIME_ZONE"
set_secret EVENT_EMAIL_CRON_SECRET "${EVENT_EMAIL_CRON_SECRET:-}"

echo "Email go-live secrets have been submitted to Supabase."
