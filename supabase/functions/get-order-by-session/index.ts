import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get session_id from query params
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')

    if (!sessionId) {
      throw new Error('session_id parameter is required')
    }

    // Fetch order by Stripe session ID
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
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    if (itemsError) {
      throw new Error('Failed to fetch order items')
    }

    // Format response
    const response = {
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      orderItems: orderItems.map(item => ({
        id: item.id,
        title: item.title,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price_gbp: parseFloat(item.unit_price_gbp),
        total_price_gbp: parseFloat(item.total_price_gbp),
        event_date: item.event_date,
        event_start_time: item.event_start_time,
      })),
      subtotal: parseFloat(order.subtotal_gbp),
      shipping: parseFloat(order.shipping_gbp),
      vat: parseFloat(order.tax_gbp),
      total: parseFloat(order.total_gbp),
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

