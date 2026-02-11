#!/usr/bin/env node

/**
 * Direct Webhook Test Script
 * This script tests the webhook by checking what happens when events are received
 */

const https = require('https');
const http = require('http');

console.log('🧪 Stripe Webhook Direct Test\n');

// Test 1: Check if webhook endpoint is accessible
console.log('1. Testing webhook endpoint accessibility...');

const options = {
  hostname: 'localhost',
  port: 54321,
  path: '/functions/v1/stripe-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  console.log(`   Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 400) {
      console.log('   ✅ Webhook endpoint is accessible');
      console.log('   ℹ️  Got 400 (expected - missing signature)');
    } else {
      console.log(`   Response: ${data}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Diagnosis:\n');
    console.log('The issue with `stripe trigger checkout.session.completed` is that');
    console.log('it creates a test event WITHOUT the custom metadata your webhook needs.\n');
    console.log('Your webhook expects metadata like:');
    console.log('  - customer_email');
    console.log('  - customer_first_name');
    console.log('  - customer_last_name');
    console.log('  - items (JSON array)');
    console.log('  - subtotal, shipping_cost, vat, total');
    console.log('  - shipping address fields\n');
    console.log('Without this metadata, the webhook cannot create orders.\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Solutions:\n');
    console.log('Option 1: Test with your actual frontend');
    console.log('  1. Start your Vue app');
    console.log('  2. Add items to cart');
    console.log('  3. Go through checkout');
    console.log('  4. Use test card: 4242 4242 4242 4242');
    console.log('  5. Complete payment');
    console.log('  6. Check database for new order\n');
    
    console.log('Option 2: Check webhook logs for errors');
    console.log('  Run: docker logs supabase_edge_runtime_lola-as-one --tail 100\n');
    
    console.log('Option 3: Add debug logging to webhook');
    console.log('  Add console.log statements to see what metadata is received\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔍 To verify webhook is working:\n');
    console.log('1. Check Docker logs:');
    console.log('   docker logs supabase_edge_runtime_lola-as-one --tail 50 --follow\n');
    console.log('2. Trigger event:');
    console.log('   stripe trigger checkout.session.completed\n');
    console.log('3. Look for "Received Stripe event" in logs');
    console.log('4. Check for any error messages\n');
  });
});

req.on('error', (e) => {
  console.error(`   ❌ Error: ${e.message}`);
  console.log('\n   Make sure Supabase is running: supabase start');
});

req.write(JSON.stringify({}));
req.end();

