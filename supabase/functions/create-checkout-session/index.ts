import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_CHECKOUT_APP_URL = 'https://lola-as-one.netlify.app'
const LEGACY_CHECKOUT_HOSTS = new Set(['lola-workshops.netlify.app'])
const GBP_CURRENCY = 'gbp'
const MAX_STRIPE_METADATA_VALUE_LENGTH = 450
const MAX_ATTENDEE_ALLERGIES_LENGTH = 240
const SIBLING_DISCOUNT_CODE = 'SIBLING10'
const SIBLING_DISCOUNT_PERCENTAGE = 10
const SIBLING_DISCOUNT_SOURCE = 'automatic_sibling'
const ADULT_WORKSHOP_LAYOUT_KEY = 'adult_workshop'

type CouponRecord = {
  id: string
  code: string
  name?: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number | string
  is_active: boolean
  valid_from?: string | null
  valid_until?: string | null
  usage_limit?: number | null
  usage_count?: number | null
  per_customer_limit?: number | null
  applies_to?: string | null
  metadata?: Record<string, unknown> | null
}

type AppliedCoupon = {
  coupon: CouponRecord
  discountPence: number
  eligibleSubtotalPence: number
  source?: 'manual_coupon' | typeof SIBLING_DISCOUNT_SOURCE
}

function getCheckoutAppUrl(): string {
  const configuredUrl = Deno.env.get('CHECKOUT_APP_URL') || Deno.env.get('APP_URL')
  const trimmedUrl = configuredUrl?.trim().replace(/\/+$/, '')

  if (!trimmedUrl) {
    return DEFAULT_CHECKOUT_APP_URL
  }

  try {
    const url = new URL(trimmedUrl)

    if (LEGACY_CHECKOUT_HOSTS.has(url.hostname)) {
      return DEFAULT_CHECKOUT_APP_URL
    }

    return trimmedUrl
  } catch {
    console.warn('Invalid checkout app URL configured, falling back to default:', configuredUrl)
    return DEFAULT_CHECKOUT_APP_URL
  }
}

function sanitizeMetadataTitle(title: unknown, fallbackTitle?: unknown): string {
  const normalizedTitle = String(title || fallbackTitle || 'Item')
    .replace(/\s+/g, ' ')
    .replace(/^"+|"+$/g, '')
    .trim()

  return normalizedTitle.slice(0, 120) || 'Item'
}

function isAccepted(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

function splitMetadataValue(value: string): string[] {
  const chunks: string[] = []

  for (let index = 0; index < value.length; index += MAX_STRIPE_METADATA_VALUE_LENGTH) {
    chunks.push(value.slice(index, index + MAX_STRIPE_METADATA_VALUE_LENGTH))
  }

  return chunks.length > 0 ? chunks : ['']
}

function setMetadataValue(metadata: Record<string, string>, key: string, value: string) {
  const chunks = splitMetadataValue(value)

  if (chunks.length === 1) {
    metadata[key] = chunks[0]
    return
  }

  metadata[`${key}_chunk_count`] = String(chunks.length)
  chunks.forEach((chunk, index) => {
    metadata[`${key}_${index}`] = chunk
  })
}

function normalizeDateOnly(value: unknown): string {
  const date = String(value || '').trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return ''
  }

  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return ''
  }

  return date
}

function buildItemMetadata(item: any) {
  return {
    id: item.id || item.offering_id,
    offering_id: item.offering_id || item.id || null,
    event_id: item.event_id || null,
    title: sanitizeMetadataTitle(item.event_title, item.title),
    price: item.price,
    quantity: item.quantity,
    type: item.type,
    eventDate: item.eventDate || null,
    eventTime: item.eventTime || null,
  }
}

function buildAttendeeMetadata(attendee: any) {
  return {
    ...attendee,
    firstName: String(attendee.firstName || '').trim(),
    lastName: String(attendee.lastName || '').trim(),
    email: String(attendee.email || '').trim(),
    phone: String(attendee.phone || '').trim(),
    dateOfBirth: normalizeDateOnly(attendee.dateOfBirth || attendee.date_of_birth || attendee.dob),
    allergies: String(attendee.allergies || '').trim().slice(0, MAX_ATTENDEE_ALLERGIES_LENGTH),
    notes: String(attendee.notes || '').trim(),
  }
}

function normalizeDiscountCode(code: unknown): string {
  return typeof code === 'string'
    ? code.trim().toUpperCase()
    : ''
}

function toPence(value: unknown): number {
  const numericValue = Number(value || 0)
  return Number.isFinite(numericValue) ? Math.round(numericValue * 100) : 0
}

function getItemLinePence(item: any): number {
  const quantity = Number(item.quantity || 0)
  return Math.max(0, toPence(item.price) * quantity)
}

function getEventLookupId(item: any): string {
  if (item.type !== 'event') {
    return ''
  }

  return String(item.event_id || item.id || '').trim()
}

function isItemEligibleForCoupon(item: any, appliesTo?: string | null): boolean {
  const target = appliesTo || 'all'
  const itemType = item.type || 'product_physical'

  if (target === 'all') return true
  if (target === 'events') return itemType === 'event'
  if (target === 'products') return itemType === 'product_physical' || itemType === 'product_digital'
  if (target === 'subscriptions') return itemType === 'subscription'

  return false
}

function calculateEligibleSubtotalPence(items: any[], appliesTo?: string | null): number {
  return items.reduce((sum, item) => {
    if (!isItemEligibleForCoupon(item, appliesTo)) {
      return sum
    }

    return sum + getItemLinePence(item)
  }, 0)
}

function getCategoryFromEventRecord(eventRecord: any) {
  const category = eventRecord?.category
  return Array.isArray(category) ? category[0] : category
}

async function fetchEventEligibilityById(supabase: any, items: any[]) {
  const eventIds = [...new Set(
    items
      .map(getEventLookupId)
      .filter(Boolean)
  )]

  if (eventIds.length === 0) {
    return new Map<string, any>()
  }

  const { data, error } = await supabase
    .from('offering_events')
    .select('id, category:event_categories(id, slug, name, layout_key)')
    .in('id', eventIds)

  if (error) {
    console.error('Error loading event category data for automatic discounts:', error)
    return new Map<string, any>()
  }

  return new Map((data || []).map((eventRecord: any) => [eventRecord.id, eventRecord]))
}

function isAdultWorkshopEvent(eventRecord: any): boolean {
  return getCategoryFromEventRecord(eventRecord)?.layout_key === ADULT_WORKSHOP_LAYOUT_KEY
}

function calculateSiblingEligibleSubtotalPence(items: any[], eventEligibilityById: Map<string, any>): number {
  return items.reduce((sum, item) => {
    if (item.type !== 'event') {
      return sum
    }

    if (Number(item.quantity || 0) < 2) {
      return sum
    }

    const eventId = getEventLookupId(item)
    const eventRecord = eventEligibilityById.get(eventId)

    if (!eventRecord || isAdultWorkshopEvent(eventRecord)) {
      return sum
    }

    return sum + getItemLinePence(item)
  }, 0)
}

async function loadSiblingDiscountCoupon(supabase: any): Promise<CouponRecord | null> {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, code, name, discount_type, discount_value, is_active, valid_from, valid_until, usage_limit, usage_count, per_customer_limit, applies_to, metadata')
    .eq('code', SIBLING_DISCOUNT_CODE)
    .maybeSingle()

  if (error) {
    console.error('Error loading sibling discount coupon record:', error)
  }

  if (coupon) {
    if (!coupon.is_active) {
      return null
    }

    const now = Date.now()
    if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
      return null
    }

    if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) {
      return null
    }

    return coupon
  }

  return {
    id: '',
    code: SIBLING_DISCOUNT_CODE,
    name: 'Sibling discount',
    discount_type: 'percentage',
    discount_value: SIBLING_DISCOUNT_PERCENTAGE,
    is_active: true,
    applies_to: 'events',
    metadata: {
      automatic_discount: true,
      rule: 'sibling_discount',
    },
  }
}

async function calculateSiblingDiscountForCheckout(
  supabase: any,
  items: any[],
  eventEligibilityById: Map<string, any>,
): Promise<AppliedCoupon | null> {
  const eligibleSubtotalPence = calculateSiblingEligibleSubtotalPence(items, eventEligibilityById)

  if (eligibleSubtotalPence <= 0) {
    return null
  }

  const coupon = await loadSiblingDiscountCoupon(supabase)

  if (!coupon) {
    return null
  }

  const configuredPercentage = coupon.discount_type === 'percentage'
    ? Math.min(Number(coupon.discount_value || SIBLING_DISCOUNT_PERCENTAGE), 100)
    : SIBLING_DISCOUNT_PERCENTAGE

  const discountPence = Math.round(eligibleSubtotalPence * configuredPercentage / 100)

  if (discountPence <= 0) {
    return null
  }

  return {
    coupon,
    discountPence,
    eligibleSubtotalPence,
    source: SIBLING_DISCOUNT_SOURCE,
  }
}

function chooseBestDiscount(manualCoupon: AppliedCoupon | null, siblingDiscount: AppliedCoupon | null): AppliedCoupon | null {
  if (manualCoupon && siblingDiscount) {
    return siblingDiscount.discountPence > manualCoupon.discountPence
      ? siblingDiscount
      : manualCoupon
  }

  return manualCoupon || siblingDiscount
}

function getDiscountLabel(appliedCoupon: AppliedCoupon | null): string {
  if (!appliedCoupon) {
    return ''
  }

  if (appliedCoupon.source === SIBLING_DISCOUNT_SOURCE || appliedCoupon.coupon.code === SIBLING_DISCOUNT_CODE) {
    return 'Sibling discount'
  }

  return `Discount ${appliedCoupon.coupon.code}`
}

async function validateCouponForCheckout(
  supabase: any,
  items: any[],
  customerEmail: string,
  discountCode: string,
): Promise<AppliedCoupon | null> {
  if (!discountCode) {
    return null
  }

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .select('id, code, name, discount_type, discount_value, is_active, valid_from, valid_until, usage_limit, usage_count, per_customer_limit, applies_to, metadata')
    .eq('code', discountCode)
    .maybeSingle()

  if (couponError) {
    console.error('Error loading coupon:', couponError)
    throw new Error('Unable to validate discount code. Please try again.')
  }

  if (!coupon) {
    throw new Error(`Discount code "${discountCode}" is not valid.`)
  }

  if (coupon.metadata?.automatic_discount === true) {
    throw new Error(`Discount code "${discountCode}" is applied automatically when eligible.`)
  }

  if (!coupon.is_active) {
    throw new Error(`Discount code "${discountCode}" is not active.`)
  }

  const now = Date.now()
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    throw new Error(`Discount code "${discountCode}" is not active yet.`)
  }

  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) {
    throw new Error(`Discount code "${discountCode}" has expired.`)
  }

  if (
    typeof coupon.usage_limit === 'number' &&
    coupon.usage_limit > 0 &&
    Number(coupon.usage_count || 0) >= coupon.usage_limit
  ) {
    throw new Error(`Discount code "${discountCode}" has reached its usage limit.`)
  }

  if (typeof coupon.per_customer_limit === 'number' && coupon.per_customer_limit > 0) {
    const { count, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('customer_email', customerEmail.trim().toLowerCase())

    if (redemptionError) {
      console.error('Error checking coupon redemption history:', redemptionError)
      throw new Error('Unable to validate discount code. Please try again.')
    }

    if ((count || 0) >= coupon.per_customer_limit) {
      throw new Error(`Discount code "${discountCode}" has already been used for this customer.`)
    }
  }

  const eligibleSubtotalPence = calculateEligibleSubtotalPence(items, coupon.applies_to)

  if (eligibleSubtotalPence <= 0) {
    throw new Error(`Discount code "${discountCode}" does not apply to the items in your cart.`)
  }

  const discountValue = Number(coupon.discount_value || 0)
  let discountPence = 0

  if (coupon.discount_type === 'percentage') {
    discountPence = Math.round(eligibleSubtotalPence * Math.min(discountValue, 100) / 100)
  } else if (coupon.discount_type === 'fixed') {
    discountPence = Math.min(toPence(discountValue), eligibleSubtotalPence)
  }

  if (discountPence <= 0) {
    throw new Error(`Discount code "${discountCode}" does not apply a discount to this order.`)
  }

  return {
    coupon,
    discountPence,
    eligibleSubtotalPence,
    source: 'manual_coupon',
  }
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

    console.log('Stripe key configured:', !!stripeKey)

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
    const { items, customer, shipping, discountCode, consents = {} } = await req.json()
    const normalizedDiscountCode = normalizeDiscountCode(discountCode)
    const manualDiscountCode = normalizedDiscountCode === SIBLING_DISCOUNT_CODE
      ? ''
      : normalizedDiscountCode

    console.log('📦 Request data:', {
      itemCount: items?.length,
      hasCustomerEmail: !!customer?.email,
      hasShipping: !!shipping,
      discountCode: normalizedDiscountCode || null,
    })

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items are required')
    }
    if (!customer || !customer.email) {
      throw new Error('Customer email is required')
    }

    const hasEventItems = items.some(item => item.type === 'event')
    const healthSafetyAccepted = isAccepted(consents.healthSafetyAccepted)
    const privacyPolicyAccepted = isAccepted(consents.privacyPolicyAccepted)
    const newsletterOptIn = isAccepted(consents.newsletterOptIn)
    const consentAcceptedAt = new Date().toISOString()

    if (hasEventItems && !healthSafetyAccepted) {
      throw new Error('Please accept the health and safety agreement before continuing.')
    }

    if (!privacyPolicyAccepted) {
      throw new Error('Please agree to the Privacy Policy before continuing.')
    }

    if (hasEventItems) {
      const todayDate = new Date().toISOString().slice(0, 10)

      items.forEach((item: any) => {
        if (item.type !== 'event') {
          return
        }

        const quantity = Number(item.quantity || 0)
        const attendees = Array.isArray(item.attendees) ? item.attendees : []

        if (attendees.length < quantity) {
          throw new Error(`Please add attendee details for ${item.title || 'this workshop'}.`)
        }

        attendees.slice(0, quantity).forEach((attendee: any, index: number) => {
          const firstName = String(attendee.firstName || '').trim()
          const lastName = String(attendee.lastName || '').trim()
          const dateOfBirth = normalizeDateOnly(attendee.dateOfBirth || attendee.date_of_birth || attendee.dob)

          if (!firstName || !lastName) {
            throw new Error(`Please add attendee ${index + 1}'s name for ${item.title || 'this workshop'}.`)
          }

          if (!dateOfBirth) {
            throw new Error(`Please add a valid date of birth for attendee ${index + 1} on ${item.title || 'this workshop'}.`)
          }

          if (dateOfBirth > todayDate) {
            throw new Error(`Date of birth cannot be in the future for attendee ${index + 1} on ${item.title || 'this workshop'}.`)
          }
        })
      })
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const hasPhysicalItems = items.some(item => item.type === 'product_physical')
    const shippingCost = hasPhysicalItems ? 5.00 : 0.00
    const totalBeforeDiscount = subtotal + shippingCost
    const eventEligibilityById = await fetchEventEligibilityById(supabase, items)
    const manualCoupon = await validateCouponForCheckout(
      supabase,
      items,
      customer.email,
      manualDiscountCode,
    )
    const siblingDiscount = await calculateSiblingDiscountForCheckout(
      supabase,
      items,
      eventEligibilityById,
    )
    const appliedCoupon = chooseBestDiscount(manualCoupon, siblingDiscount)
    const discountLabel = getDiscountLabel(appliedCoupon)
    const discountAmount = appliedCoupon ? appliedCoupon.discountPence / 100 : 0
    const total = Math.max(0, totalBeforeDiscount - discountAmount)
    const vat = total * 0.20 / 1.20 // VAT is included in prices

    console.log('🏷️ Discount validation result:', appliedCoupon
      ? {
          code: appliedCoupon.coupon.code,
          couponId: appliedCoupon.coupon.id,
          appliesTo: appliedCoupon.coupon.applies_to || 'all',
          source: appliedCoupon.source || 'manual_coupon',
          discountPence: appliedCoupon.discountPence,
          eligibleSubtotalPence: appliedCoupon.eligibleSubtotalPence,
          manualDiscountPence: manualCoupon?.discountPence || 0,
          siblingDiscountPence: siblingDiscount?.discountPence || 0,
        }
      : null)

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
          console.log(`🔍 Looking up event by event_id: ${item.event_id}`)
          const result = await supabase
            .from('offering_events')
            .select('id, max_capacity, available_spaces, current_bookings, offering_id')
            .eq('id', item.event_id)
            .single()
          offeringEvent = result.data
          eventError = result.error
          console.log('Event lookup result:', { data: offeringEvent, error: eventError })
        } else {
          // Fallback: lookup by offering_id (may return multiple, take first)
          console.log(`🔍 Looking up event by offering_id: ${item.id || item.offering_id}`)
          const result = await supabase
            .from('offering_events')
            .select('id, max_capacity, available_spaces, current_bookings, offering_id')
            .eq('offering_id', item.id || item.offering_id)
            .limit(1)
            .single()
          offeringEvent = result.data
          eventError = result.error
          console.log('Event lookup result:', { data: offeringEvent, error: eventError })
        }

        if (eventError || !offeringEvent) {
          console.error('❌ Error fetching offering_event:', eventError)
          console.error('❌ Item details:', {
            event_id: item.event_id,
            offering_id: item.offering_id,
            id: item.id,
            title: item.title
          })
          throw new Error(`Event not found: ${item.title}. Event ID: ${item.event_id || 'not provided'}`)
        }

        // Check if there's an event_capacity record
        const { data: capacity, error: capacityError } = await supabase
          .from('event_capacity')
          .select('spaces_available')
          .eq('offering_event_id', offeringEvent.id)
          .maybeSingle()

        // Use event_capacity if it exists, otherwise fall back to offering_events
        let availableSpaces
        if (capacity && !capacityError && capacity.spaces_available !== null && capacity.spaces_available !== undefined) {
          availableSpaces = Number(capacity.spaces_available)
        } else {
          // Fallback: respect explicit inventory control before physical capacity.
          const sellableCapacity = offeringEvent.available_spaces ?? offeringEvent.max_capacity ?? 0
          const currentBookings = offeringEvent.current_bookings ?? 0
          availableSpaces = Math.max(Number(sellableCapacity) - Number(currentBookings), 0)
        }

        console.log(`Event capacity check for ${item.title}:`, {
          item_id: item.id,
          offering_id: item.offering_id || offeringEvent.offering_id,
          event_id: item.event_id,
          offering_event_id: offeringEvent.id,
          max_capacity: offeringEvent.max_capacity,
          sellable_capacity: offeringEvent.available_spaces,
          current_bookings: offeringEvent.current_bookings,
          available_spaces: availableSpaces,
          requested_quantity: item.quantity
        })

        if (availableSpaces <= 0) {
          throw new Error(`Sorry, "${item.title}" is now sold out. Please remove it from your cart and try again.`)
        }

        if (availableSpaces < item.quantity) {
          const plural = availableSpaces === 1 ? 'space' : 'spaces'
          throw new Error(`Sorry, "${item.title}" only has ${availableSpaces} ${plural} available. You're trying to book ${item.quantity}. Please reduce the quantity or remove it from your cart.`)
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
        currency: GBP_CURRENCY,
        product_data: {
          name: sanitizeMetadataTitle(item.event_title, item.title),
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
          currency: GBP_CURRENCY,
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      })
    }

    // Prepare items for metadata (without attendees to avoid 500 char limit)
    const itemsForMetadata = items.map((item: any) => buildItemMetadata(item))
    console.log('📦 Items metadata length:', JSON.stringify(itemsForMetadata).length)

    const itemMetadataFields: Record<string, string> = {
      line_item_count: String(itemsForMetadata.length),
    }

    itemsForMetadata.forEach((item: any, index: number) => {
      const serializedItem = JSON.stringify(item)
      console.log(`📦 line_item_${index} length:`, serializedItem.length)
      itemMetadataFields[`line_item_${index}`] = serializedItem
    })

    // Prepare attendees data separately (only for items that have attendees)
    const attendeesData: Record<string, string> = {}
    items.forEach((item: any, index: number) => {
      if (item.attendees && item.attendees.length > 0) {
        const attendeesJson = JSON.stringify(item.attendees.map(buildAttendeeMetadata))
        console.log(`👥 Item ${index} attendee metadata length:`, attendeesJson.length)
        setMetadataValue(attendeesData, `item_${index}_attendees`, attendeesJson)
      }
    })
    console.log('📦 Attendee metadata keys:', Object.keys(attendeesData))

    const checkoutAppUrl = getCheckoutAppUrl()
    let stripeCouponId = ''

    if (appliedCoupon) {
      const stripeCoupon = await stripe.coupons.create({
        duration: 'once',
        amount_off: appliedCoupon.discountPence,
        currency: GBP_CURRENCY,
        name: discountLabel || `Discount ${appliedCoupon.coupon.code}`,
        metadata: {
          app_coupon_id: appliedCoupon.coupon.id,
          app_coupon_code: appliedCoupon.coupon.code,
          app_discount_source: appliedCoupon.source || 'manual_coupon',
        },
      })

      stripeCouponId = stripeCoupon.id
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${checkoutAppUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${checkoutAppUrl}/checkout`,
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      metadata: {
        customer_email: customer.email,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_phone: customer.phone || '',
        health_safety_accepted: String(hasEventItems && healthSafetyAccepted),
        health_safety_accepted_at: hasEventItems && healthSafetyAccepted ? consentAcceptedAt : '',
        privacy_policy_accepted: String(privacyPolicyAccepted),
        privacy_policy_accepted_at: privacyPolicyAccepted ? consentAcceptedAt : '',
        newsletter_opt_in: String(newsletterOptIn),
        newsletter_opt_in_at: newsletterOptIn ? consentAcceptedAt : '',
        discount_code: appliedCoupon?.coupon.code || manualDiscountCode,
        requested_discount_code: normalizedDiscountCode,
        coupon_id: appliedCoupon?.coupon.id || '',
        coupon_applies_to: appliedCoupon?.coupon.applies_to || '',
        discount_type: appliedCoupon?.coupon.discount_type || '',
        discount_value: appliedCoupon ? String(appliedCoupon.coupon.discount_value) : '',
        discount_amount: discountAmount.toFixed(2),
        discount_label: discountLabel,
        discount_source: appliedCoupon?.source || '',
        automatic_sibling_discount_amount: siblingDiscount ? (siblingDiscount.discountPence / 100).toFixed(2) : '0.00',
        stripe_coupon_id: stripeCouponId,
        shipping_name: shipping?.name || '',
        shipping_line1: shipping?.address?.line1 || '',
        shipping_line2: shipping?.address?.line2 || '',
        shipping_city: shipping?.address?.city || '',
        shipping_postal_code: shipping?.address?.postal_code || '',
        shipping_country: shipping?.address?.country || 'GB',
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        vat: vat.toFixed(2),
        pre_discount_total: totalBeforeDiscount.toFixed(2),
        total: total.toFixed(2),
        ...itemMetadataFields,
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
