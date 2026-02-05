import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { offeringSlug, offeringId, customer } = await req.json()

    // Basic validation
    if (!customer || !customer.email) {
      throw new Error('Customer email is required')
    }

    if (!offeringSlug && !offeringId) {
      throw new Error('offeringSlug or offeringId is required')
    }

    // Load the subscription offering
    let offeringQuery = supabase
      .from('offerings')
      .select('id, slug, title, type, status, metadata')
      .eq('status', 'published')

    if (offeringId) {
      offeringQuery = offeringQuery.eq('id', offeringId)
    } else {
      offeringQuery = offeringQuery.eq('slug', offeringSlug)
    }

    const { data: offering, error: offeringError } = await offeringQuery.single()

    if (offeringError || !offering) {
      console.error('Error loading subscription offering:', offeringError || 'Not found')
      throw new Error('Subscription offering not found')
    }

    if (offering.type !== 'subscription') {
      throw new Error('Offering is not a subscription')
    }

    const offeringMetadata = (offering.metadata || {}) as {
      billing_interval?: string
      stripe_product_id?: string | null
      stripe_price_id?: string | null
    }

    const stripePriceId = offeringMetadata.stripe_price_id
    const billingInterval = offeringMetadata.billing_interval || 'month'

    if (!stripePriceId) {
      throw new Error('Stripe price ID is not configured for this subscription')
    }

    // Create or retrieve Stripe customer
    let stripeCustomer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('email', customer.email)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id)
    } else {
      stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.firstName && customer.lastName
          ? `${customer.firstName} ${customer.lastName}`
          : undefined,
        phone: customer.phone || undefined,
      })
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173'

    // Create Stripe Checkout Session in subscription mode
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/boxes/${offering.slug}`,
      metadata: {
        offering_id: offering.id,
        offering_slug: offering.slug,
        offering_title: offering.title,
        customer_email: customer.email,
        customer_first_name: customer.firstName || '',
        customer_last_name: customer.lastName || '',
        customer_phone: customer.phone || '',
        billing_interval: billingInterval,
        stripe_price_id: stripePriceId,
      },
    })

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating subscription checkout session:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

