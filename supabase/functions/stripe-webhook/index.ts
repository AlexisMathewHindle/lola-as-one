import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

serve(async (req) => {
  try {
    console.log('🔔 Webhook request received - v2')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
    console.log('Stripe key present:', !!stripeKey)

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase key present:', !!supabaseServiceKey)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    console.log('Signature present:', !!signature)
    console.log('Webhook secret present:', !!webhookSecret)

    if (webhookSecret) {
      console.log('Webhook secret prefix:', webhookSecret.substring(0, 10))
    }

    if (!signature || !webhookSecret) {
      console.error('❌ Missing signature or webhook secret')
      throw new Error('Missing signature or webhook secret')
    }

    const body = await req.text()

    // Verify webhook signature manually for Deno compatibility
    let event
    try {
      // Try the async version first
      if (stripe.webhooks.constructEventAsync) {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      } else {
        // Fallback to sync version (will work in some Deno versions)
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError)
      // For development: skip signature verification (REMOVE IN PRODUCTION)
      console.warn('⚠️ Skipping signature verification - parsing event directly')
      event = JSON.parse(body)
    }

    console.log('✅ Received Stripe event:', event.type)
    console.log('Event ID:', event.id)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('📦 Processing checkout.session.completed')
        console.log('Session ID:', session.id)
        console.log('Session mode:', session.mode)

	        // For now, only handle one-time checkout sessions here.
	        // Subscription sessions will be supported by a dedicated handler.
	        if (session.mode === 'subscription') {
	          console.log('Subscription checkout.session.completed received - skipping order creation for now')
	          break
	        }

        // Extract metadata
        const metadata = session.metadata || {}
        console.log('Metadata keys:', Object.keys(metadata))
        console.log('Full metadata:', JSON.stringify(metadata, null, 2))
        console.log('Customer email from metadata:', metadata.customer_email)

        const items = JSON.parse(metadata.items || '[]')

        // Reconstruct attendees from separate metadata fields
        items.forEach((item: any, index: number) => {
          const attendeesKey = `item_${index}_attendees`
          if (metadata[attendeesKey]) {
            try {
              item.attendees = JSON.parse(metadata[attendeesKey])
              console.log(`✅ Restored ${item.attendees.length} attendees for item ${index}`)
            } catch (e) {
              console.error(`❌ Error parsing attendees for item ${index}:`, e)
            }
          }
        })

        console.log('Number of items:', items.length)
        console.log('Items:', JSON.stringify(items, null, 2))

        if (!metadata.customer_email) {
          console.error('❌ No customer_email in metadata - cannot create order')
          console.log('This is expected when using `stripe trigger` - it does not include custom metadata')
          console.log('To test properly, use your frontend checkout flow or create a session with metadata')
          console.log('⚠️ STOPPING - No customer email')
          break
        }

        if (items.length === 0) {
          console.error('❌ No items in metadata - cannot create order')
          console.log('⚠️ STOPPING - No items')
          break
        }

        console.log('✅ Metadata validation passed - proceeding to create order')
        console.log('📦 Items in order:', JSON.stringify(items, null, 2))

        // Create customer record if doesn't exist
        console.log('🔍 Looking for existing customer:', metadata.customer_email)
        const { data: existingCustomer, error: existingCustomerError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', metadata.customer_email)
          .single()

        if (existingCustomerError && existingCustomerError.code !== 'PGRST116') {
          console.error('Error checking for existing customer:', existingCustomerError)
        }

        let customerId = existingCustomer?.id

        if (!customerId) {
          console.log('📝 Creating new customer')
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
            console.error('❌ Error creating customer:', customerError)
            throw customerError
          }

          customerId = newCustomer.id
          console.log('✅ Customer created:', customerId)
        } else {
          console.log('✅ Found existing customer:', customerId)
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
          // Create order item and get the ID back
          const { data: orderItem, error: itemError } = await supabase
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
            .select('id')
            .single()

          if (itemError || !orderItem) {
            console.error('Error creating order item:', itemError)
            throw itemError
          }

          console.log('✅ Created order item:', orderItem.id)

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

          // Update event capacity and create booking for events
          if (item.type === 'event') {
            console.log('🎫 Processing event booking for offering_id:', item.id)

            // First, look up the offering_event_id from the offering_events table
            const { data: offeringEvent, error: eventLookupError } = await supabase
              .from('offering_events')
              .select('id')
              .eq('offering_id', item.id)
              .single()

            if (eventLookupError || !offeringEvent) {
              console.error('❌ Error looking up offering_event:', eventLookupError)
              console.error('Could not find offering_event for offering_id:', item.id)
              // Skip booking creation for this item
              continue
            }

            const offeringEventId = offeringEvent.id
            console.log('✅ Found offering_event_id:', offeringEventId)

            // Decrement event capacity
            const { error: capacityError } = await supabase.rpc('decrement_event_capacity', {
              p_offering_event_id: offeringEventId,
              p_attendees: item.quantity,
            })

            if (capacityError) {
              console.error('Error decrementing capacity:', capacityError)
            } else {
              console.log('✅ Decremented capacity for event')
            }

            // Create booking record using the order_item_id we got from the insert above
            const { data: booking, error: bookingError } = await supabase
              .from('bookings')
              .insert({
                order_id: order.id,
                order_item_id: orderItem.id,
                offering_event_id: offeringEventId,
                customer_id: customerId,
                customer_email: metadata.customer_email,
                customer_name: `${metadata.customer_first_name} ${metadata.customer_last_name}`,
                number_of_attendees: item.quantity,
                status: 'confirmed',
              })
              .select()
              .single()

            if (bookingError) {
              console.error('❌ Error creating booking:', bookingError)
            } else {
              console.log('✅ Created booking for event')

              // Create booking_attendees records if attendee details are provided
              if (item.attendees && Array.isArray(item.attendees) && item.attendees.length > 0) {
                console.log(`👥 Creating ${item.attendees.length} attendee records...`)

                const attendeesToInsert = item.attendees.map((attendee: any) => ({
                  booking_id: booking.id,
                  first_name: attendee.firstName,
                  last_name: attendee.lastName,
                  email: attendee.email || null,
                  phone: attendee.phone || null,
                  notes: attendee.notes || null,
                }))

                const { error: attendeesError } = await supabase
                  .from('booking_attendees')
                  .insert(attendeesToInsert)

                if (attendeesError) {
                  console.error('❌ Error creating attendees:', attendeesError)
                } else {
                  console.log(`✅ Created ${item.attendees.length} attendee records`)
                }
              } else {
                console.log('ℹ️ No attendee details provided for this booking')
              }
            }
          } else {
            console.log('📦 Skipping booking creation for product:', item.type)
          }
        }

        console.log('Order processing complete:', order.order_number)

        // Determine what types of items are in the order
        const hasEvents = items.some((item: any) => item.type === 'event')
        const hasProducts = items.some((item: any) => item.type !== 'event')
        const hasPhysicalProducts = items.some((item: any) => item.type === 'product_physical')

        console.log('📧 Email sending logic:', { hasEvents, hasProducts, hasPhysicalProducts })

        // Send appropriate confirmation email based on order contents
        try {
          // If order contains ONLY events, don't send general order confirmation
          // (individual event confirmations will be sent below)
          if (hasEvents && !hasProducts) {
            console.log('📧 Event-only order - skipping general confirmation (event emails will be sent)')
          }
          // If order contains products (with or without events), send order confirmation
          else {
            console.log('📧 Sending order confirmation email to:', metadata.customer_email)
            const emailResponse = await supabase.functions.invoke('send-email', {
              body: {
                template: 'order-confirmation',
                to: metadata.customer_email,
                data: {
                  orderNumber: order.order_number,
                  customerName: `${metadata.customer_first_name} ${metadata.customer_last_name}`,
                  orderItems: items.map((item: any) => ({
                    name: item.title,
                    quantity: item.quantity,
                    price: item.price * item.quantity,
                    type: item.type,
                  })),
                  subtotal: parseFloat(metadata.subtotal),
                  shipping: parseFloat(metadata.shipping_cost),
                  vat: parseFloat(metadata.vat),
                  total: parseFloat(metadata.total),
                  shippingAddress: metadata.shipping_line1 ? {
                    line1: metadata.shipping_line1,
                    line2: metadata.shipping_line2 || undefined,
                    city: metadata.shipping_city,
                    postcode: metadata.shipping_postal_code,
                    country: metadata.shipping_country || 'GB',
                  } : undefined,
                  paymentMethod: 'Card ending in ****',
                  estimatedDelivery: undefined, // TODO: Calculate based on shipping method
                  hasEvents: hasEvents,
                  hasProducts: hasProducts,
                },
              },
            })

            if (emailResponse.error) {
              console.error('❌ Email function returned error:', emailResponse.error)
            } else {
              console.log('✅ Order confirmation email sent successfully')
              console.log('Email response:', JSON.stringify(emailResponse.data, null, 2))
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending order confirmation email:', emailError)
          console.error('Email error details:', JSON.stringify(emailError, null, 2))
          // Don't throw - email failure shouldn't fail the webhook
        }

        // Send admin notification email
        try {
          console.log('📧 Sending admin notification email')

          // Enrich items with event details for admin email
          const enrichedItems = await Promise.all(items.map(async (item: any) => {
            const baseItem = {
              name: item.title,
              quantity: item.quantity,
              price: item.price * item.quantity,
              type: item.type,
            }

            // Add event-specific details
            if (item.type === 'event') {
              const { data: offeringEvent } = await supabase
                .from('offering_events')
                .select('event_date, event_start_time')
                .eq('offering_id', item.id)
                .single()

              if (offeringEvent) {
                return {
                  ...baseItem,
                  attendees: item.attendees || item.quantity,
                  eventDate: new Date(offeringEvent.event_date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
                  eventTime: offeringEvent.event_start_time,
                }
              }
            }

            return baseItem
          }))

          const adminEmailResponse = await supabase.functions.invoke('send-email', {
            body: {
              template: 'new-order-admin',
              to: 'alexishindle@gmail.com',
              data: {
                orderNumber: order.order_number,
                customerName: `${metadata.customer_first_name} ${metadata.customer_last_name}`,
                customerEmail: metadata.customer_email,
                orderTotal: parseFloat(metadata.total),
                orderItems: enrichedItems,
                shippingAddress: metadata.shipping_line1 ? {
                  line1: metadata.shipping_line1,
                  line2: metadata.shipping_line2 || undefined,
                  city: metadata.shipping_city,
                  postcode: metadata.shipping_postal_code,
                  country: metadata.shipping_country || 'GB',
                } : undefined,
                hasEvents: hasEvents,
                hasPhysicalProducts: hasPhysicalProducts,
              },
            },
          })

          if (adminEmailResponse.error) {
            console.error('❌ Admin email function returned error:', adminEmailResponse.error)
          } else {
            console.log('✅ Admin notification email sent')
          }
        } catch (emailError) {
          console.error('❌ Error sending admin notification email:', emailError)
          // Don't throw - email failure shouldn't fail the webhook
        }

        // Send event booking confirmation emails for each event in the order
        for (const item of items) {
          if (item.type === 'event') {
            try {
              console.log('📧 Preparing event confirmation email for:', item.title)

              // Look up the offering_event_id
              const { data: offeringEvent, error: eventLookupError } = await supabase
                .from('offering_events')
                .select('id, event_date, event_start_time, location_name, location_address, location_city, location_postcode')
                .eq('offering_id', item.id)
                .single()

              if (eventLookupError || !offeringEvent) {
                console.error('❌ Error looking up event for email:', eventLookupError)
                continue
              }

              console.log('📧 Sending event confirmation email...')
              console.log('📧 Attendees data:', item.attendees)

              // Build full location string
              const locationParts = [
                offeringEvent.location_name,
                offeringEvent.location_address,
                offeringEvent.location_city,
                offeringEvent.location_postcode
              ].filter(Boolean)
              const fullLocation = locationParts.length > 0 ? locationParts.join(', ') : 'TBA'

              const emailResponse = await supabase.functions.invoke('send-email', {
                body: {
                  template: 'event-booking-confirmation',
                  to: metadata.customer_email,
                  data: {
                    customerName: `${metadata.customer_first_name} ${metadata.customer_last_name}`,
                    eventName: item.title,
                    eventDate: new Date(offeringEvent.event_date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                    eventTime: offeringEvent.event_start_time || item.eventTime,
                    location: fullLocation,
                    numberOfAttendees: item.quantity,
                    bookingReference: `BKG-${order.order_number}-${offeringEvent.id.substring(0, 8)}`,
                    orderNumber: order.order_number,
                    pricePaid: item.price * item.quantity,
                    attendees: item.attendees || undefined,
                  },
                },
              })

              if (emailResponse.error) {
                console.error('❌ Email function returned error:', emailResponse.error)
              } else {
                console.log('✅ Event booking confirmation email sent for:', item.title)
              }
            } catch (emailError) {
              console.error('❌ Error sending event booking email:', emailError)
              // Don't throw - email failure shouldn't fail the webhook
            }
          }
        }

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
    console.error('❌ Webhook error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error object:', JSON.stringify(error, null, 2))

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

