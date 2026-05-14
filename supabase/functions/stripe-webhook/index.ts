import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getNextCycleKey } from '../_shared/cycle-helpers.ts'

function isMissingColumnError(error: any, columns: string[]): boolean {
  const message = String(error?.message || error?.details || '')
  const referencesColumn = columns.some((column) => message.includes(column))

  return referencesColumn && (
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  )
}

function isMissingOrderCouponColumnError(error: any): boolean {
  return isMissingColumnError(error, ['coupon_id', 'coupon_code', 'discount_gbp'])
}

function isMissingOrderConsentColumnError(error: any): boolean {
  return isMissingColumnError(error, [
    'health_safety_accepted',
    'health_safety_accepted_at',
    'privacy_policy_accepted',
    'privacy_policy_accepted_at',
    'newsletter_opt_in',
    'newsletter_opt_in_at',
  ])
}

function isMissingAttendeeAllergiesColumnError(error: any): boolean {
  return isMissingColumnError(error, ['allergies'])
}

function metadataBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

function getMetadataValue(metadata: Record<string, string>, key: string): string {
  const chunkCount = Number.parseInt(metadata[`${key}_chunk_count`] || '0', 10)

  if (chunkCount > 0) {
    return Array.from({ length: chunkCount })
      .map((_, index) => metadata[`${key}_${index}`] || '')
      .join('')
  }

  return metadata[key] || ''
}

function buildAttendeeNotes(attendee: any, includeAllergies = false): string | null {
  const notes = String(attendee.notes || '').trim()
  const allergies = String(attendee.allergies || '').trim()
  const parts = [notes]

  if (includeAllergies && allergies) {
    parts.push(`Allergies: ${allergies}`)
  }

  const combined = parts.filter(Boolean).join('\n')
  return combined || null
}

function getAdminEmails(): string[] {
  const configuredEmails = Deno.env.get('ADMIN_EMAILS')
  const emails = configuredEmails
    ? configuredEmails.split(',').map((email) => email.trim()).filter(Boolean)
    : ['alexishindle@gmail.com', 'hello@lotsoflovelyart.com']

  return emails.length > 0 ? emails : ['hello@lotsoflovelyart.com']
}

function md5Hex(input: string): string {
  const bytes = Array.from(new TextEncoder().encode(input))
  const bitLength = bytes.length * 8
  const bitLengthLow = bitLength >>> 0
  const bitLengthHigh = Math.floor(bitLength / 0x100000000) >>> 0

  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)

  for (let i = 0; i < 4; i += 1) bytes.push((bitLengthLow >>> (8 * i)) & 0xff)
  for (let i = 0; i < 4; i += 1) bytes.push((bitLengthHigh >>> (8 * i)) & 0xff)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]
  const constants = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0
  )
  const leftRotate = (value: number, amount: number) =>
    ((value << amount) | (value >>> (32 - amount))) >>> 0

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) => {
      const base = offset + index * 4
      return (
        bytes[base] |
        (bytes[base + 1] << 8) |
        (bytes[base + 2] << 16) |
        (bytes[base + 3] << 24)
      ) >>> 0
    })

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let i = 0; i < 64; i += 1) {
      let f: number
      let g: number

      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }

      const next = d
      d = c
      c = b
      b = (b + leftRotate((a + f + constants[i] + words[g]) >>> 0, shifts[i])) >>> 0
      a = next
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  const wordToHex = (word: number) =>
    Array.from({ length: 4 }, (_, index) =>
      ((word >>> (8 * index)) & 0xff).toString(16).padStart(2, '0')
    ).join('')

  return [a0, b0, c0, d0].map(wordToHex).join('')
}

function getFunctionsBaseUrl(supabaseUrl: string): string {
  return (Deno.env.get('FUNCTIONS_BASE_URL') || supabaseUrl).replace(/\/$/, '')
}

async function logEmailFailure(supabase: any, body: Record<string, any>, error: any) {
  try {
    await supabase.from('email_logs').insert({
      template: body.template || 'unknown',
      recipient: body.to || 'unknown',
      status: 'failed',
      error_message: error?.message || String(error),
      metadata: body.metadata || null,
      sent_at: new Date().toISOString(),
    })
  } catch (logError) {
    console.error('Failed to log webhook email failure:', logError)
  }
}

async function invokeSendEmail(supabaseUrl: string, serviceRoleKey: string, body: Record<string, any>) {
  const functionsBaseUrl = getFunctionsBaseUrl(supabaseUrl)
  const authToken = (Deno.env.get('SUPABASE_ANON_KEY') || serviceRoleKey).trim()
  const response = await fetch(`${functionsBaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: authToken,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  })

  const text = await response.text().catch(() => '')
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  if (!response.ok) {
    return {
      data,
      error: {
        message: data?.error || text || `send-email returned ${response.status}`,
        status: response.status,
      },
    }
  }

  return { data, error: null }
}

async function markCustomerMarketingOptIn(supabase: any, customerId: string, acceptedAt: string | null) {
  try {
    const { error } = await supabase
      .from('customers')
      .update({
        marketing_opt_in: true,
        marketing_opt_in_at: acceptedAt || new Date().toISOString(),
      })
      .eq('id', customerId)

    if (error && isMissingColumnError(error, ['marketing_opt_in_at'])) {
      const fallback = await supabase
        .from('customers')
        .update({ marketing_opt_in: true })
        .eq('id', customerId)

      if (fallback.error) {
        console.error('❌ Error updating customer marketing opt-in:', fallback.error)
      }
      return
    }

    if (error) {
      console.error('❌ Error updating customer marketing opt-in:', error)
    }
  } catch (error) {
    console.error('❌ Error updating customer marketing opt-in:', error)
  }
}

async function subscribeToMailchimp(customer: {
  email: string
  firstName?: string
  lastName?: string
}) {
  const apiKey = Deno.env.get('MAILCHIMP_API_KEY')?.trim()
  const audienceId = (Deno.env.get('MAILCHIMP_AUDIENCE_ID') || Deno.env.get('MAILCHIMP_LIST_ID'))?.trim()
  const configuredServerPrefix = Deno.env.get('MAILCHIMP_SERVER_PREFIX')?.trim()
  const serverPrefix = configuredServerPrefix || apiKey?.split('-').pop()

  if (!apiKey || !audienceId || !serverPrefix) {
    console.warn('⚠️ Mailchimp opt-in requested but MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID are not fully configured')
    return
  }

  const email = customer.email.trim().toLowerCase()
  const subscriberHash = md5Hex(email)
  const doubleOptIn = metadataBoolean(Deno.env.get('MAILCHIMP_DOUBLE_OPT_IN'))
  const status = doubleOptIn ? 'pending' : 'subscribed'
  const response = await fetch(
    `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${btoa(`anystring:${apiKey}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: status,
        status,
        merge_fields: {
          FNAME: customer.firstName || '',
          LNAME: customer.lastName || '',
        },
        tags: ['Checkout opt-in'],
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Mailchimp subscribe failed (${response.status}): ${body}`)
  }

  console.log('✅ Mailchimp subscriber updated:', email)
}

serve(async (req) => {
  try {
    console.log('🔔 Webhook request received - v2')
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)

    // Initialize Stripe
    const stripeKey = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim()
    console.log('Stripe key configured:', !!stripeKey)

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase client
    const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').trim()
    const supabaseServiceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim()
    console.log('Supabase service key configured:', !!supabaseServiceKey)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = (Deno.env.get('STRIPE_WEBHOOK_SECRET') || '').trim()

    console.log('Signature present:', !!signature)
    console.log('Webhook secret present:', !!webhookSecret)

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
      return new Response(
        JSON.stringify({ error: 'Invalid Stripe signature' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('✅ Received Stripe event:', event.type)
    console.log('Event ID:', event.id)

    // Check if event already processed (idempotency)
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single()

    if (existingEvent) {
      console.log('⚠️ Event already processed:', event.id)
      return new Response(
        JSON.stringify({ received: true, cached: true }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

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
        console.log('Customer email present in metadata:', !!metadata.customer_email)

        let items: any[] = []
        const lineItemCount = parseInt(metadata.line_item_count || '0', 10)

        if (lineItemCount > 0) {
          items = Array.from({ length: lineItemCount })
            .map((_, index) => metadata[`line_item_${index}`])
            .filter(Boolean)
            .map((serializedItem) => JSON.parse(serializedItem))
        } else {
          items = JSON.parse(metadata.items || '[]')
        }

        // Reconstruct attendees from separate metadata fields
        items.forEach((item: any, index: number) => {
          const attendeesKey = `item_${index}_attendees`
          const attendeesJson = getMetadataValue(metadata, attendeesKey)
          if (attendeesJson) {
            try {
              item.attendees = JSON.parse(attendeesJson)
              console.log(`✅ Restored ${item.attendees.length} attendees for item ${index}`)
            } catch (e) {
              console.error(`❌ Error parsing attendees for item ${index}:`, e)
            }
          }
        })

        console.log('Number of items:', items.length)
        console.log('Item count:', items.length)

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

        const subtotalAmount = parseFloat(metadata.subtotal || '0')
        const shippingAmount = parseFloat(metadata.shipping_cost || '0')
        const stripeDiscountAmount = (session.total_details?.amount_discount || 0) / 100
        const discountAmount = stripeDiscountAmount > 0
          ? stripeDiscountAmount
          : parseFloat(metadata.discount_amount || '0')
        const totalAmount = typeof session.amount_total === 'number'
          ? session.amount_total / 100
          : parseFloat(metadata.total || '0')
        const vatAmount = totalAmount * 0.20 / 1.20
        const couponId = metadata.coupon_id || null
        const couponCode = metadata.discount_code || ''
        const discountLabel = couponCode
          ? `Discount (${couponCode})`
          : 'Discount'
        const healthSafetyAccepted = metadataBoolean(metadata.health_safety_accepted)
        const privacyPolicyAccepted = metadataBoolean(metadata.privacy_policy_accepted)
        const newsletterOptIn = metadataBoolean(metadata.newsletter_opt_in)
        const healthSafetyAcceptedAt = metadata.health_safety_accepted_at || null
        const privacyPolicyAcceptedAt = metadata.privacy_policy_accepted_at || null
        const newsletterOptInAt = metadata.newsletter_opt_in_at || null
        const emailOrderItems = items.map((item: any) => ({
          name: item.title,
          quantity: item.quantity,
          price: item.price * item.quantity,
          type: item.type,
        }))

        if (discountAmount > 0) {
          emailOrderItems.push({
            name: discountLabel,
            quantity: 1,
            price: -discountAmount,
            type: 'discount',
          })
        }

        console.log('✅ Metadata validation passed - proceeding to create order')
        console.log('📦 Items in order:', items.length)

        const { data: existingOrder, error: existingOrderError } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('stripe_checkout_session_id', session.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (existingOrderError) {
          console.error('Error checking for existing order:', existingOrderError)
          throw existingOrderError
        }

        if (existingOrder) {
          console.log('⚠️ Order already exists for checkout session, skipping duplicate processing:', {
            sessionId: session.id,
            orderNumber: existingOrder.order_number,
          })
          break
        }

        // Create customer record if doesn't exist
        console.log('🔍 Looking for existing customer by metadata email')
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

        if (newsletterOptIn && customerId) {
          await markCustomerMarketingOptIn(supabase, customerId, newsletterOptInAt)
        }

        const orderPayload = {
          customer_id: customerId,
          customer_email: metadata.customer_email,
          order_type: 'one_time',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          subtotal_gbp: subtotalAmount,
          shipping_gbp: shippingAmount,
          tax_gbp: vatAmount,
          total_gbp: totalAmount,
          shipping_name: metadata.shipping_name || null,
          shipping_address_line1: metadata.shipping_line1 || null,
          shipping_address_line2: metadata.shipping_line2 || null,
          shipping_city: metadata.shipping_city || null,
          shipping_postcode: metadata.shipping_postal_code || null,
          shipping_country: metadata.shipping_country || 'GB',
          status: 'paid',
        }

        const orderCouponPayload = {
          coupon_id: couponId,
          coupon_code: couponCode || null,
          discount_gbp: discountAmount,
        }

        const orderConsentPayload = {
          health_safety_accepted: healthSafetyAccepted,
          health_safety_accepted_at: healthSafetyAcceptedAt,
          privacy_policy_accepted: privacyPolicyAccepted,
          privacy_policy_accepted_at: privacyPolicyAcceptedAt,
          newsletter_opt_in: newsletterOptIn,
          newsletter_opt_in_at: newsletterOptInAt,
        }

        let { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            ...orderPayload,
            ...orderCouponPayload,
            ...orderConsentPayload,
          })
          .select('id, order_number')
          .single()

        if (orderError && isMissingOrderConsentColumnError(orderError)) {
          console.warn('⚠️ Orders consent columns are not available; retrying order insert without consent summary fields')
          const retryResult = await supabase
            .from('orders')
            .insert({
              ...orderPayload,
              ...orderCouponPayload,
            })
            .select('id, order_number')
            .single()

          order = retryResult.data
          orderError = retryResult.error
        }

        if (orderError && isMissingOrderCouponColumnError(orderError)) {
          console.warn('⚠️ Orders coupon columns are not available; retrying order insert without coupon summary fields')
          const retryResult = await supabase
            .from('orders')
            .insert({
              ...orderPayload,
              ...orderConsentPayload,
            })
            .select('id, order_number')
            .single()

          order = retryResult.data
          orderError = retryResult.error
        }

        if (orderError && (
          isMissingOrderCouponColumnError(orderError) ||
          isMissingOrderConsentColumnError(orderError)
        )) {
          console.warn('⚠️ Orders optional columns are not available; retrying order insert with base fields only')
          const retryResult = await supabase
            .from('orders')
            .insert(orderPayload)
            .select('id, order_number')
            .single()

          order = retryResult.data
          orderError = retryResult.error
        }

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
              offering_id: item.offering_id || item.id,
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
            console.log('🎫 Processing event booking:', {
              offering_id: item.id,
              event_id: item.event_id,
            })

            let offeringEvent
            let eventLookupError

            if (item.event_id) {
              const result = await supabase
                .from('offering_events')
                .select('id')
                .eq('id', item.event_id)
                .single()

              offeringEvent = result.data
              eventLookupError = result.error
            } else {
              const result = await supabase
                .from('offering_events')
                .select('id')
                .eq('offering_id', item.offering_id || item.id)
                .single()

              offeringEvent = result.data
              eventLookupError = result.error
            }

            if (eventLookupError || !offeringEvent) {
              console.error('❌ Error looking up offering_event:', eventLookupError)
              console.error('Could not find offering_event for item:', {
                offering_id: item.id,
                event_id: item.event_id,
              })
              // Skip booking creation for this item
              continue
            }

            const offeringEventId = offeringEvent.id
            console.log('✅ Found offering_event_id:', offeringEventId)

            // Create booking record using the order_item_id we got from the insert above.
            // Capacity is updated once by the database booking trigger.
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
                  allergies: attendee.allergies || null,
                  notes: buildAttendeeNotes(attendee),
                }))

                let { error: attendeesError } = await supabase
                  .from('booking_attendees')
                  .insert(attendeesToInsert)

                if (attendeesError && isMissingAttendeeAllergiesColumnError(attendeesError)) {
                  console.warn('⚠️ booking_attendees.allergies is not available; retrying attendee insert with allergies in notes')
                  const fallbackAttendeesToInsert = item.attendees.map((attendee: any) => ({
                    booking_id: booking.id,
                    first_name: attendee.firstName,
                    last_name: attendee.lastName,
                    email: attendee.email || null,
                    phone: attendee.phone || null,
                    notes: buildAttendeeNotes(attendee, true),
                  }))

                  const retryResult = await supabase
                    .from('booking_attendees')
                    .insert(fallbackAttendeesToInsert)

                  attendeesError = retryResult.error
                }

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

        if (discountAmount > 0) {
          const { error: discountItemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              offering_id: null,
              item_type: 'discount',
              title: discountLabel,
              quantity: 1,
              unit_price_gbp: -discountAmount,
              total_price_gbp: -discountAmount,
              event_date: null,
              event_start_time: null,
            })

          if (discountItemError) {
            console.error('❌ Error creating discount order item:', discountItemError)
          } else {
            console.log('✅ Created discount order item')
          }
        }

        if (couponId && discountAmount > 0) {
          const { error: redemptionError } = await supabase
            .from('coupon_redemptions')
            .insert({
              coupon_id: couponId,
              order_id: order.id,
              customer_id: customerId,
              customer_email: String(metadata.customer_email).toLowerCase(),
              coupon_code: couponCode,
              discount_amount: discountAmount,
              currency: 'gbp',
              stripe_checkout_session_id: session.id,
              stripe_coupon_id: metadata.stripe_coupon_id || null,
            })

          if (redemptionError) {
            console.error('❌ Error recording coupon redemption:', redemptionError)
          } else {
            const { error: usageError } = await supabase.rpc('increment_coupon_usage', {
              p_coupon_id: couponId,
            })

            if (usageError) {
              console.error('❌ Error incrementing coupon usage:', usageError)
            } else {
              console.log('✅ Recorded coupon redemption')
            }
          }
        }

        if (newsletterOptIn) {
          try {
            await subscribeToMailchimp({
              email: metadata.customer_email,
              firstName: metadata.customer_first_name,
              lastName: metadata.customer_last_name,
            })
          } catch (mailchimpError) {
            console.error('❌ Error subscribing customer to Mailchimp:', mailchimpError)
          }
        }

        console.log('Order processing complete:', order.order_number)

        // Determine what types of items are in the order
        const hasEvents = items.some((item: any) => item.type === 'event')
        const hasProducts = items.some((item: any) => item.type !== 'event')
        const hasPhysicalProducts = items.some((item: any) => item.type === 'product_physical')

        console.log('📧 Email sending logic:', { hasEvents, hasProducts, hasPhysicalProducts })

        // Send order confirmation email (serves as receipt) for ALL orders
        try {
          console.log('📧 Sending order confirmation/receipt email')
          const emailResponse = await invokeSendEmail(
            supabaseUrl,
            supabaseServiceKey,
            {
              template: 'order-confirmation',
              to: metadata.customer_email,
              data: {
                orderNumber: order.order_number,
                customerName: `${metadata.customer_first_name} ${metadata.customer_last_name}`,
                orderItems: emailOrderItems,
                subtotal: subtotalAmount,
                shipping: shippingAmount,
                vat: vatAmount,
                total: totalAmount,
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
              metadata: {
                orderNumber: order.order_number,
                stripeCheckoutSessionId: session.id,
              },
            },
          )

          if (emailResponse.error) {
            console.error('❌ Email function returned error:', emailResponse.error)
            await logEmailFailure(supabase, {
              template: 'order-confirmation',
              to: metadata.customer_email,
              metadata: {
                orderNumber: order.order_number,
                stripeCheckoutSessionId: session.id,
              },
            }, emailResponse.error)
          } else {
            console.log('✅ Order confirmation/receipt email sent successfully')
            console.log('Email response:', JSON.stringify(emailResponse.data, null, 2))
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
              let offeringEvent

              if (item.event_id) {
                const result = await supabase
                  .from('offering_events')
                  .select('event_date, event_start_time')
                  .eq('id', item.event_id)
                  .single()
                offeringEvent = result.data
              } else {
                const result = await supabase
                  .from('offering_events')
                  .select('event_date, event_start_time')
                  .eq('offering_id', item.offering_id || item.id)
                  .limit(1)
                  .single()
                offeringEvent = result.data
              }

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

          if (discountAmount > 0) {
            enrichedItems.push({
              name: discountLabel,
              quantity: 1,
              price: -discountAmount,
              type: 'discount',
            })
          }

          const adminEmails = getAdminEmails()

          for (const adminEmail of adminEmails) {
            const adminEmailResponse = await invokeSendEmail(
              supabaseUrl,
              supabaseServiceKey,
              {
                template: 'new-order-admin',
                to: adminEmail,
                data: {
                orderNumber: order.order_number,
                customerName: `${metadata.customer_first_name} ${metadata.customer_last_name}`,
                customerEmail: metadata.customer_email,
                orderTotal: totalAmount,
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
              metadata: {
                orderNumber: order.order_number,
                stripeCheckoutSessionId: session.id,
              },
            },
            )

            if (adminEmailResponse.error) {
              console.error(`❌ Admin email function returned error for ${adminEmail}:`, adminEmailResponse.error)
              await logEmailFailure(supabase, {
                template: 'new-order-admin',
                to: adminEmail,
                metadata: {
                  orderNumber: order.order_number,
                  stripeCheckoutSessionId: session.id,
                },
              }, adminEmailResponse.error)
            } else {
              console.log(`✅ Admin notification email sent to ${adminEmail}`)
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending admin notification emails:', emailError)
          // Don't throw - email failure shouldn't fail the webhook
        }

        // Send event booking confirmation emails for each event in the order
        for (const item of items) {
          if (item.type === 'event') {
            try {
              console.log('📧 Preparing event confirmation email for:', item.title)

              // Look up the offering_event using event_id if available, otherwise offering_id
              let offeringEvent
              let eventLookupError

              if (item.event_id) {
                // Direct lookup by event_id (offering_events.id)
                const result = await supabase
                  .from('offering_events')
                  .select('id, event_date, event_start_time, location_name, location_address, location_city, location_postcode')
                  .eq('id', item.event_id)
                  .single()
                offeringEvent = result.data
                eventLookupError = result.error
              } else {
                // Fallback: lookup by offering_id
                const result = await supabase
                  .from('offering_events')
                  .select('id, event_date, event_start_time, location_name, location_address, location_city, location_postcode')
                  .eq('offering_id', item.id || item.offering_id)
                  .limit(1)
                  .single()
                offeringEvent = result.data
                eventLookupError = result.error
              }

              if (eventLookupError || !offeringEvent) {
                console.error('❌ Error looking up event for email:', eventLookupError)
                continue
              }

              console.log('📧 Sending event confirmation email...')
              console.log('📧 Attendee details present:', Array.isArray(item.attendees) && item.attendees.length > 0)

              // Build full location string
              const locationParts = [
                offeringEvent.location_name,
                offeringEvent.location_address,
                offeringEvent.location_city,
                offeringEvent.location_postcode
              ].filter(Boolean)
              const fullLocation = locationParts.length > 0 ? locationParts.join(', ') : 'TBA'

              const emailResponse = await invokeSendEmail(
                supabaseUrl,
                supabaseServiceKey,
                {
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
                  metadata: {
                    orderNumber: order.order_number,
                    stripeCheckoutSessionId: session.id,
                    offeringEventId: offeringEvent.id,
                  },
                },
              )

              if (emailResponse.error) {
                console.error('❌ Email function returned error:', emailResponse.error)
                await logEmailFailure(supabase, {
                  template: 'event-booking-confirmation',
                  to: metadata.customer_email,
                  metadata: {
                    orderNumber: order.order_number,
                    stripeCheckoutSessionId: session.id,
                    offeringEventId: offeringEvent.id,
                  },
                }, emailResponse.error)
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

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔔 Processing customer.subscription.created')
        console.log('Subscription ID:', subscription.id)

        // Get customer from Stripe
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        const customerEmail = (customer as Stripe.Customer).email

        if (!customerEmail) {
          console.error('❌ No customer email found')
          break
        }

        // Find or create customer in database
        let { data: dbCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single()

        if (!dbCustomer) {
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              email: customerEmail,
              stripe_customer_id: subscription.customer as string,
            })
            .select('id')
            .single()
          dbCustomer = newCustomer
        }

        if (!dbCustomer) {
          console.error('❌ Could not find or create customer')
          break
        }

        // Get plan from database using Stripe price ID
        const priceId = subscription.items.data[0]?.price.id
        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single()

        if (!plan) {
          console.error('❌ No plan found for price ID:', priceId)
          break
        }

        // Create subscription record
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            customer_id: dbCustomer.id,
            plan_id: plan.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })

        if (subError) {
          console.error('❌ Error creating subscription:', subError)
        } else {
          console.log('✅ Subscription created in database')
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔔 Processing customer.subscription.updated')
        console.log('Subscription ID:', subscription.id)

        // Update subscription record
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError)
        } else {
          console.log('✅ Subscription updated in database')
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔔 Processing customer.subscription.deleted')
        console.log('Subscription ID:', subscription.id)

        // Mark subscription as canceled
        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (deleteError) {
          console.error('❌ Error canceling subscription:', deleteError)
        } else {
          console.log('✅ Subscription canceled in database')
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('💰 Processing invoice.payment_succeeded')
        console.log('Invoice ID:', invoice.id)
        console.log('Subscription ID:', invoice.subscription)

        // Skip if not a subscription invoice
        if (!invoice.subscription) {
          console.log('ℹ️ Not a subscription invoice - skipping')
          break
        }

        // Get subscription from database with plan
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            *,
            plan:plans(*),
            customer:customers(*)
          `)
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (subError || !subscription) {
          console.error('❌ Subscription not found:', subError)
          break
        }

        console.log('✅ Found subscription:', subscription.id)
        console.log('Plan cutoff day:', subscription.plan.cutoff_day)

        // Get customer's default address
        const { data: address } = await supabase
          .from('addresses')
          .select('*')
          .eq('customer_id', subscription.customer_id)
          .eq('is_default', true)
          .single()

        if (!address) {
          console.error('❌ No default address found for customer')
          // TODO: Send email to customer to add address
          break
        }

        // Calculate cycle key using helper function
        const billingDate = new Date(invoice.created * 1000)
        const cycleKey = getNextCycleKey(billingDate, subscription.plan.cutoff_day)

        console.log('📅 Billing date:', billingDate.toISOString())
        console.log('📅 Cycle key:', cycleKey)

        // Create order with cycle_key
        const orderNumber = `SUB-${Date.now()}-${subscription.id.slice(0, 8)}`
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_id: subscription.customer_id,
            customer_email: subscription.customer.email,
            order_type: 'subscription_renewal',
            stripe_subscription_id: invoice.subscription as string,
            stripe_payment_intent_id: invoice.payment_intent as string,

            // Cycle key - determines which month to ship
            cycle_key: cycleKey,

            // Pricing (convert from pence to pounds)
            subtotal_gbp: (invoice.subtotal || 0) / 100,
            shipping_gbp: 0,
            tax_gbp: (invoice.tax || 0) / 100,
            total_gbp: (invoice.amount_paid || 0) / 100,

            // Address snapshot
            shipping_name: address.name,
            shipping_address_line1: address.address_line1,
            shipping_address_line2: address.address_line2,
            shipping_city: address.city,
            shipping_postcode: address.postcode,
            shipping_country: address.country,

            // Fulfillment status
            status: 'queued',
          })
          .select('id, order_number')
          .single()

        if (orderError) {
          console.error('❌ Error creating order:', orderError)
          break
        }

        console.log('✅ Created subscription order:', order.order_number)
        console.log('📦 Order will ship in cycle:', cycleKey)

        // TODO: Send subscription renewal confirmation email

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('❌ Processing invoice.payment_failed')
        console.log('Invoice ID:', invoice.id)

        // Skip if not a subscription invoice
        if (!invoice.subscription) {
          console.log('ℹ️ Not a subscription invoice - skipping')
          break
        }

        // Update subscription status
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_subscription_id', invoice.subscription)

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError)
        } else {
          console.log('✅ Subscription marked as past_due')
        }

        // TODO: Send payment failed email to customer

        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    // Log event as processed (idempotency)
    const { error: logError } = await supabase
      .from('stripe_events')
      .insert({
        id: event.id,
        type: event.type,
      })

    if (logError) {
      console.error('⚠️ Error logging event (non-fatal):', logError)
    } else {
      console.log('✅ Event logged as processed')
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
