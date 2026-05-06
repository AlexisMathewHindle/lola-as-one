import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseCurrency(value: unknown): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value || 0))
  return Number.isFinite(parsed) ? parsed : 0
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 get-order-by-session called')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get session_id from query params
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')

    console.log('Looking for session_id:', sessionId)

    if (!sessionId) {
      throw new Error('session_id parameter is required')
    }

    // Fetch order by Stripe session ID
    console.log('Querying orders table for stripe_checkout_session_id:', sessionId)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_email,
        subtotal_gbp,
        shipping_gbp,
        tax_gbp,
        total_gbp,
        shipping_name,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_postcode,
        shipping_country,
        created_at
      `)
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle()

    console.log('Order query result:', { order, orderError })

    if (orderError) {
      console.error('❌ Failed to query order for session:', sessionId)
      console.error('Error details:', orderError)
      throw new Error('Failed to fetch order')
    }

    if (!order) {
      console.error('❌ Order not found for session:', sessionId)
      throw new Error('Order not found')
    }

    console.log('✅ Found order:', order.order_number)

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    if (itemsError) {
      throw new Error('Failed to fetch order items')
    }

    // Fetch event bookings and attendees created by the Stripe webhook.
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        order_item_id,
        offering_event_id,
        customer_name,
        customer_email,
        number_of_attendees,
        status,
        created_at,
        booking_attendees (
          id,
          first_name,
          last_name,
          email,
          phone,
          notes
        )
      `)
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })

    if (bookingsError) {
      console.error('Failed to fetch bookings for order:', bookingsError)
      throw new Error('Failed to fetch booking details')
    }

    const bookingsByOrderItemId = new Map(
      (bookings || []).map((booking) => [booking.order_item_id, booking])
    )

    const formatAttendee = (attendee: any) => ({
      id: attendee.id,
      firstName: attendee.first_name || '',
      lastName: attendee.last_name || '',
      email: attendee.email || '',
      phone: attendee.phone || '',
      notes: attendee.notes || '',
    })

    // Format response
    const response = {
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      createdAt: order.created_at,
      orderItems: (orderItems || []).map(item => {
        const booking = bookingsByOrderItemId.get(item.id)
        const attendees = (booking?.booking_attendees || []).map(formatAttendee)

        return {
          id: item.id,
          title: item.title,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price_gbp: parseCurrency(item.unit_price_gbp),
          total_price_gbp: parseCurrency(item.total_price_gbp),
          event_date: item.event_date,
          event_start_time: item.event_start_time,
          booking: booking ? {
            id: booking.id,
            status: booking.status,
            numberOfAttendees: booking.number_of_attendees,
          } : null,
          attendees,
        }
      }),
      bookings: (bookings || []).map((booking) => {
        const orderItem = (orderItems || []).find((item) => item.id === booking.order_item_id)

        return {
          id: booking.id,
          orderItemId: booking.order_item_id,
          title: orderItem?.title || 'Workshop booking',
          eventDate: orderItem?.event_date || null,
          eventStartTime: orderItem?.event_start_time || null,
          status: booking.status,
          numberOfAttendees: booking.number_of_attendees,
          attendees: (booking.booking_attendees || []).map(formatAttendee),
        }
      }),
      subtotal: parseCurrency(order.subtotal_gbp),
      shipping: parseCurrency(order.shipping_gbp),
      vat: parseCurrency(order.tax_gbp),
      total: parseCurrency(order.total_gbp),
      shippingName: order.shipping_name,
      shippingAddressLine1: order.shipping_address_line1,
      shippingAddressLine2: order.shipping_address_line2,
      shippingCity: order.shipping_city,
      shippingPostcode: order.shipping_postcode,
      shippingCountry: order.shipping_country,
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
