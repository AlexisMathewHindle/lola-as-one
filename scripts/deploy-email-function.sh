#!/bin/bash

# Deploy Email Function to Supabase
# This script deploys the send-email Edge Function and runs the email_logs migration

set -e

echo "🚀 Deploying Email Notification System..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
echo "📋 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase."
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"
echo ""

# Check if RESEND_API_KEY is set
echo "🔑 Checking for RESEND_API_KEY..."
read -p "Have you set the RESEND_API_KEY secret in Supabase? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set the RESEND_API_KEY secret first:"
    echo "  supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx"
    echo ""
    echo "Or in Supabase Dashboard:"
    echo "  Project Settings > Edge Functions > Secrets"
    exit 1
fi

echo "✅ RESEND_API_KEY configured"
echo ""

# Deploy the send-email function
echo "📦 Deploying send-email Edge Function..."
supabase functions deploy send-email

if [ $? -eq 0 ]; then
    echo "✅ send-email function deployed successfully"
else
    echo "❌ Failed to deploy send-email function"
    exit 1
fi

echo ""

# Run database migration
echo "🗄️  Running email_logs migration..."
read -p "Do you want to run the email_logs migration? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration applied successfully"
    else
        echo "❌ Failed to apply migration"
        echo "You can apply it manually in Supabase Dashboard > SQL Editor"
        echo "File: supabase/migrations/20260206_email_logs.sql"
    fi
else
    echo "⏭️  Skipping migration"
    echo "Remember to apply it manually later!"
fi

echo ""
echo "🎉 Email notification system deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Test the email function with a test order"
echo "  2. Set up custom domain in Resend (optional)"
echo "  3. Monitor email logs in the database"
echo "  4. Check Resend dashboard for delivery stats"
echo ""
echo "📚 Documentation:"
echo "  - Setup Guide: docs/RESEND-SETUP-GUIDE.md"
echo "  - Implementation Status: docs/EMAIL-IMPLEMENTATION-STATUS.md"
echo "  - Function README: supabase/functions/send-email/README.md"
echo ""

