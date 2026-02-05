import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

serve(async (req) => {
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

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    if (!signature || !webhookSecret) {
      throw new Error('Missing signature or webhook secret')
    }

    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Received Stripe event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

	        // For now, only handle one-time checkout sessions here.
	        // Subscription sessions will be supported by a dedicated handler.
	        if (session.mode === 'subscription') {
	          console.log('Subscription checkout.session.completed received - skipping order creation for now')
	          break
	        }

        // Extract metadata
        const metadata = session.metadata || {}
        const items = JSON.parse(metadata.items || '[]')

        // Create customer record if doesn't exist
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', metadata.customer_email)
          .single()

        let customerId = existingCustomer?.id

        if (!customerId) {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              email: metadata.customer_email,
              first_name: metadata.customer_first_name,
              last_name: metadata.customer_last_name,
              phone: metadata.customer_phone || null,
              stripe_customer_id: session.customer as string,
            })
            .select('id')
            .single()

          if (customerError) {
            console.error('Error creating customer:', customerError)
            throw customerError
          }

          customerId = newCustomer.id
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            customer_email: metadata.customer_email,
            order_type: 'one_time',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            subtotal_gbp: parseFloat(metadata.subtotal),
            shipping_gbp: parseFloat(metadata.shipping_cost),
            tax_gbp: parseFloat(metadata.vat),
            total_gbp: parseFloat(metadata.total),
            shipping_name: metadata.shipping_name || null,
            shipping_address_line1: metadata.shipping_line1 || null,
            shipping_address_line2: metadata.shipping_line2 || null,
            shipping_city: metadata.shipping_city || null,
            shipping_postcode: metadata.shipping_postal_code || null,
            shipping_country: metadata.shipping_country || 'GB',
            status: 'paid',
          })
          .select('id, order_number')
          .single()

        if (orderError) {
          console.error('Error creating order:', orderError)
          throw orderError
        }

        console.log('Created order:', order.order_number)

        // Create order items and update inventory/capacity
        for (const item of items) {
          // Create order item
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              offering_id: item.id,
              item_type: item.type,
              title: item.title,
              quantity: item.quantity,
              unit_price_gbp: item.price,
              total_price_gbp: item.price * item.quantity,
              event_date: item.eventDate || null,
              event_start_time: item.eventTime || null,
            })

          if (itemError) {
            console.error('Error creating order item:', itemError)
            throw itemError
          }

          // Update inventory for physical products
          if (item.type === 'product_physical') {
            const { error: inventoryError } = await supabase.rpc('decrement_inventory', {
              p_offering_id: item.id,
              p_quantity: item.quantity,
            })

            if (inventoryError) {
              console.error('Error decrementing inventory:', inventoryError)
            }
          }

          // Update event capacity for workshops
          if (item.type === 'event') {
            const { error: capacityError } = await supabase.rpc('decrement_event_capacity', {
              p_offering_event_id: item.id,
              p_attendees: item.quantity,
            })

            if (capacityError) {
              console.error('Error decrementing capacity:', capacityError)
            }

            // Create booking record
            const { error: bookingError } = await supabase
              .from('bookings')
              .insert({
                order_id: order.id,
                offering_event_id: item.id,
                customer_id: customerId,
                customer_email: metadata.customer_email,
                customer_name: `${metadata.customer_first_name} ${metadata.customer_last_name}`,
                number_of_attendees: item.quantity,
                status: 'confirmed',
              })

            if (bookingError) {
              console.error('Error creating booking:', bookingError)
            }
          }
        }

        console.log('Order processing complete:', order.order_number)
        break
      }

      case 'checkout.session.expired': {
        // Handle expired sessions (optional - release inventory holds)
        console.log('Checkout session expired:', event.data.object.id)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

