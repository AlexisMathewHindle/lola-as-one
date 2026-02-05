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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { subscription_offering_id, selected_box_product_ids } = await req.json()

    if (!subscription_offering_id || !Array.isArray(selected_box_product_ids)) {
      return new Response(
        JSON.stringify({
          error: 'subscription_offering_id and selected_box_product_ids are required',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    if (selected_box_product_ids.length === 0) {
      return new Response(
        JSON.stringify({ allAvailable: true, unavailable: [], suggestions: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Load all curated boxes for this subscription offering
    const { data: planBoxes, error: planError } = await supabase
      .from('subscription_plan_boxes')
      .select(
        `
        offering_product_id,
        offering_product:offering_products(
          id,
          price_gbp,
          track_inventory,
          stock_quantity,
          available_for_subscription,
          offering:offerings(
            id,
            slug,
            title,
            status
          )
        )
      `,
      )
      .eq('subscription_offering_id', subscription_offering_id)

    if (planError) {
      console.error('Error loading subscription plan boxes:', planError)
      throw new Error('Failed to load subscription plan boxes')
    }

    const byProductId = new Map<string, any>()
    for (const row of planBoxes || []) {
      const product = row.offering_product
      if (product?.id) {
        byProductId.set(product.id, product)
      }
    }

    const unavailable: any[] = []
    const selectedSet = new Set<string>(selected_box_product_ids)

    for (const id of selected_box_product_ids as string[]) {
      const product = byProductId.get(id)

      if (!product) {
        unavailable.push({
          offering_product_id: id,
          reason: 'not_in_plan',
          title: null,
          slug: null,
        })
        continue
      }

      const offering = product.offering
      const status = offering?.status ?? null
      const trackInventory = !!product.track_inventory
      const stockQty =
        typeof product.stock_quantity === 'number' ? product.stock_quantity : null

      if (status !== 'published') {
        unavailable.push({
          offering_product_id: id,
          reason: 'unpublished',
          title: offering?.title ?? null,
          slug: offering?.slug ?? null,
        })
        continue
      }

      if (product.available_for_subscription === false) {
        unavailable.push({
          offering_product_id: id,
          reason: 'not_available_for_subscription',
          title: offering?.title ?? null,
          slug: offering?.slug ?? null,
        })
        continue
      }

      if (trackInventory && (stockQty === null || stockQty <= 0)) {
        unavailable.push({
          offering_product_id: id,
          reason: 'out_of_stock',
          title: offering?.title ?? null,
          slug: offering?.slug ?? null,
        })
        continue
      }
    }

    // Build suggestions: curated boxes that are available and not currently selected
    const suggestions: any[] = []

    for (const row of planBoxes || []) {
      const product = row.offering_product
      if (!product?.id) continue
      if (selectedSet.has(product.id)) continue

      const offering = product.offering
      const status = offering?.status ?? null
      const trackInventory = !!product.track_inventory
      const stockQty =
        typeof product.stock_quantity === 'number' ? product.stock_quantity : null

      const isAvailable =
        status === 'published' &&
        product.available_for_subscription !== false &&
        (!trackInventory || (stockQty !== null && stockQty > 0))

      if (!isAvailable) continue

      suggestions.push({
        offering_product_id: product.id,
        title: offering?.title ?? null,
        slug: offering?.slug ?? null,
        price_gbp: product.price_gbp ?? null,
      })
    }

    const allAvailable = unavailable.length === 0

    return new Response(
      JSON.stringify({ allAvailable, unavailable, suggestions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error validating subscription boxes:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

