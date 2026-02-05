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
    const { items, customer, shipping } = await req.json()

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items are required')
    }
    if (!customer || !customer.email) {
      throw new Error('Customer email is required')
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const hasPhysicalItems = items.some(item => item.type === 'product_physical')
    const shippingCost = hasPhysicalItems ? 5.00 : 0.00
    const total = subtotal + shippingCost
    const vat = total * 0.20 / 1.20 // VAT is included in prices

    // Validate inventory and capacity
    for (const item of items) {
      if (item.type === 'product_physical') {
        // Check inventory
        const { data: inventory, error } = await supabase
          .from('inventory_items')
          .select('quantity_available')
          .eq('offering_id', item.id)
          .single()

        if (error || !inventory || inventory.quantity_available < item.quantity) {
          throw new Error(`Insufficient stock for ${item.title}`)
        }
      } else if (item.type === 'event') {
        // Check event capacity
        const { data: capacity, error } = await supabase
          .from('event_capacity')
          .select('spaces_available')
          .eq('offering_event_id', item.id)
          .single()

        if (error || !capacity || capacity.spaces_available < item.quantity) {
          throw new Error(`Insufficient capacity for ${item.title}`)
        }
      }
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
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone || undefined,
      })
    }

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.title,
          description: item.type === 'event' 
            ? `Event on ${item.eventDate} at ${item.eventTime}`
            : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to pence
      },
      quantity: item.quantity,
    }))

    // Add shipping as a line item if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/checkout`,
      metadata: {
        customer_email: customer.email,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_phone: customer.phone || '',
        shipping_name: shipping?.name || '',
        shipping_line1: shipping?.address?.line1 || '',
        shipping_line2: shipping?.address?.line2 || '',
        shipping_city: shipping?.address?.city || '',
        shipping_postal_code: shipping?.address?.postal_code || '',
        shipping_country: shipping?.address?.country || 'GB',
        items: JSON.stringify(items),
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        vat: vat.toFixed(2),
        total: total.toFixed(2),
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
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

