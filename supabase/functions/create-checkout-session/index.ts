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
    console.log('🛒 Create checkout session request received')

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || ''

    // Debug logging (remove after testing)
    console.log('Stripe key check:', {
      hasKey: !!stripeKey,
      keyPrefix: stripeKey.substring(0, 7),
      keyLength: stripeKey.length
    })

    if (!stripeKey || stripeKey === '12345678') {
      throw new Error('Stripe API key is not configured. Please set STRIPE_SECRET_KEY in Supabase secrets.')
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { items, customer, shipping } = await req.json()

    console.log('📦 Request data:', {
      itemCount: items?.length,
      customerEmail: customer?.email,
      hasShipping: !!shipping,
    })
    console.log('📦 Items:', JSON.stringify(items, null, 2))

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
        // Get the offering_event record
        // If event_id is provided, use it directly; otherwise look up by offering_id
        let offeringEvent
        let eventError

        if (item.event_id) {
          // Direct lookup by event_id (offering_events.id)
          const result = await supabase
            .from('offering_events')
            .select('id, max_capacity, current_bookings, offering_id')
            .eq('id', item.event_id)
            .single()
          offeringEvent = result.data
          eventError = result.error
        } else {
          // Fallback: lookup by offering_id (may return multiple, take first)
          const result = await supabase
            .from('offering_events')
            .select('id, max_capacity, current_bookings, offering_id')
            .eq('offering_id', item.id || item.offering_id)
            .limit(1)
            .single()
          offeringEvent = result.data
          eventError = result.error
        }

        if (eventError || !offeringEvent) {
          console.error('Error fetching offering_event:', eventError)
          throw new Error(`Event not found: ${item.title}`)
        }

        // Check if there's an event_capacity record
        const { data: capacity, error: capacityError } = await supabase
          .from('event_capacity')
          .select('spaces_available')
          .eq('offering_event_id', offeringEvent.id)
          .maybeSingle()

        // Use event_capacity if it exists, otherwise fall back to offering_events
        let availableSpaces
        if (capacity && !capacityError) {
          availableSpaces = capacity.spaces_available
        } else {
          // Fallback: calculate from offering_events
          availableSpaces = offeringEvent.max_capacity - offeringEvent.current_bookings
        }

        console.log(`Event capacity check for ${item.title}:`, {
          item_id: item.id,
          offering_id: item.offering_id || offeringEvent.offering_id,
          event_id: item.event_id,
          offering_event_id: offeringEvent.id,
          max_capacity: offeringEvent.max_capacity,
          current_bookings: offeringEvent.current_bookings,
          available_spaces: availableSpaces,
          requested_quantity: item.quantity
        })

        if (availableSpaces < item.quantity) {
          throw new Error(`Insufficient capacity for ${item.title}. Only ${availableSpaces} spaces available.`)
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

    // Prepare items for metadata (without attendees to avoid 500 char limit)
    console.log('📦 Original items:', JSON.stringify(items))
    const itemsForMetadata = items.map((item: any) => {
      const { attendees, ...itemWithoutAttendees } = item
      return itemWithoutAttendees
    })
    console.log('📦 Items without attendees:', JSON.stringify(itemsForMetadata))
    console.log('📦 Items metadata length:', JSON.stringify(itemsForMetadata).length)

    // Prepare attendees data separately (only for items that have attendees)
    const attendeesData: Record<string, any> = {}
    items.forEach((item: any, index: number) => {
      if (item.attendees && item.attendees.length > 0) {
        const attendeesJson = JSON.stringify(item.attendees)
        console.log(`👥 Item ${index} attendees (${attendeesJson.length} chars):`, attendeesJson)
        attendeesData[`item_${index}_attendees`] = attendeesJson
      }
    })
    console.log('📦 Attendees data keys:', Object.keys(attendeesData))

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
        items: JSON.stringify(itemsForMetadata),
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        vat: vat.toFixed(2),
        total: total.toFixed(2),
        ...attendeesData, // Spread attendees data as separate metadata fields
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
    console.error('❌ Error creating checkout session:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    // Log additional context for debugging
    if (error.type === 'StripeInvalidRequestError') {
      console.error('Stripe error details:', {
        type: error.type,
        code: error.code,
        param: error.param,
        statusCode: error.statusCode,
      })
    }

    return new Response(
      JSON.stringify({
        error: error.message,
        errorType: error.name || error.type || 'UnknownError',
        // Include more details in development
        ...(Deno.env.get('ENVIRONMENT') !== 'production' && {
          stack: error.stack,
          details: error.toString()
        })
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

