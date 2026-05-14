#!/usr/bin/env node

import { createHmac } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const attendeeCount = Number(process.env.STRIPE_PROOF_ATTENDEES || 1)
const proofEmail = process.env.STRIPE_PROOF_EMAIL ||
  `stripe-proof+${auditDate.replace(/-/g, '')}-${Date.now()}@example.com`
const proofEventSlug = process.env.STRIPE_PROOF_EVENT_SLUG || ''
const allowLiveSession = process.env.ALLOW_LIVE_STRIPE_PAYMENT_PROOF === '1'
const confirmed = process.env.CONFIRM_STRIPE_PROOF_RUN === '1'

function readEnvFile(path) {
  if (!existsSync(path)) return {}

  const env = {}
  const text = readFileSync(path, 'utf8')

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const index = line.indexOf('=')
    if (index === -1) continue

    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function envUrl(source) {
  return source.SUPABASE_URL || source.VITE_SUPABASE_URL || source.NEXT_PUBLIC_SUPABASE_URL
}

function isLocalSupabaseUrl(value) {
  if (!value) return false
  try {
    const url = new URL(value)
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

const fileEnvs = {
  root: readEnvFile(resolve(root, '.env.local')),
  app: readEnvFile(resolve(root, 'app/.env.local')),
  functions: readEnvFile(resolve(root, 'supabase/functions/.env')),
  migration: readEnvFile(resolve(root, 'scripts/migration/.env'))
}

const urlCandidates = [
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  envUrl(fileEnvs.root),
  envUrl(fileEnvs.app),
  envUrl(fileEnvs.migration),
  envUrl(fileEnvs.functions)
].filter(Boolean)

const supabaseUrl = urlCandidates.find((value) => !isLocalSupabaseUrl(value)) || urlCandidates[0]
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.root.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.migration.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.functions.SUPABASE_SERVICE_ROLE_KEY
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  fileEnvs.app.VITE_SUPABASE_ANON_KEY ||
  serviceRoleKey
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ||
  fileEnvs.functions.STRIPE_SECRET_KEY
const stripeWebhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ||
  fileEnvs.functions.STRIPE_WEBHOOK_SECRET

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('Missing production Supabase URL, service role key, or anon key')
}

if (!stripeSecretKey || !stripeWebhookSecret) {
  throw new Error('Missing local STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET for the signed proof run')
}

if (!/^whsec_[A-Za-z0-9]+$/.test(stripeWebhookSecret)) {
  throw new Error([
    'STRIPE_WEBHOOK_SECRET format is invalid.',
    'Check for accidental trailing punctuation, quotes, spaces, or copied prose after the whsec_ value.',
    'The proof stopped before creating a Stripe Checkout Session or writing order/capacity data.'
  ].join('\n'))
}

if (!Number.isInteger(attendeeCount) || attendeeCount < 1 || attendeeCount > 4) {
  throw new Error('STRIPE_PROOF_ATTENDEES must be an integer between 1 and 4')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function getCapacity(event) {
  if (Array.isArray(event.capacity)) return event.capacity[0] || null
  return event.capacity || null
}

function spacesAvailable(event) {
  const capacity = getCapacity(event)
  const capacityValue = Number(capacity?.spaces_available)
  if (Number.isFinite(capacityValue)) return capacityValue

  const maxCapacity = Number(event.max_capacity)
  const currentBookings = Number(event.current_bookings)
  if (Number.isFinite(maxCapacity) && Number.isFinite(currentBookings)) {
    return Math.max(maxCapacity - currentBookings, 0)
  }

  return null
}

function capacityConsistent(event) {
  const capacity = getCapacity(event)
  return Boolean(capacity) &&
    Number(capacity.spaces_booked || 0) === Number(event.current_bookings || 0)
}

function buildAttendees(count) {
  return Array.from({ length: count }, (_, index) => ({
    firstName: index === 0 ? 'Stripe' : `Stripe ${index + 1}`,
    lastName: 'Proof',
    email: '',
    phone: '',
    notes: 'Automated Stripe webhook proof run'
  }))
}

function buildCartItem(event) {
  return {
    id: event.id,
    productId: event.id,
    variantId: null,
    title: event.offering.title,
    name: event.offering.title,
    price: Number(event.price_gbp),
    quantity: attendeeCount,
    image: event.offering.featured_image_url || event.category?.featured_image_url || null,
    type: 'event',
    slug: event.offering.slug,
    offering_id: event.offering.id,
    event_id: event.id,
    eventDate: event.event_date,
    eventTime: event.event_start_time,
    subscriptionConfig: null,
    attendees: buildAttendees(attendeeCount)
  }
}

async function fetchLaunchEvents() {
  const { data, error } = await supabase
    .from('offering_events')
    .select(`
      id,
      offering_id,
      event_date,
      event_start_time,
      price_gbp,
      max_capacity,
      current_bookings,
      offering:offerings!inner(
        id,
        title,
        slug,
        status,
        type,
        featured_image_url
      ),
      category:event_categories(
        id,
        name,
        slug,
        layout_key,
        featured_image_url
      ),
      capacity:event_capacity(
        total_capacity,
        spaces_booked,
        spaces_reserved,
        spaces_available
      )
    `)
    .eq('offering.status', 'published')
    .eq('offering.type', 'event')
    .gte('event_date', auditDate)
    .order('event_date', { ascending: true })
    .order('event_start_time', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch launch events: ${error.message}`)
  }

  return data || []
}

function chooseEvent(events) {
  const candidates = events.filter((event) => {
    if (proofEventSlug && event.offering?.slug !== proofEventSlug) return false
    if (!proofEventSlug && event.event_date <= auditDate) return false
    if (event.category?.layout_key === 'enquiry_only') return false
    if (!Number.isFinite(Number(event.price_gbp)) || Number(event.price_gbp) <= 0) return false
    if (!capacityConsistent(event)) return false
    return spacesAvailable(event) >= attendeeCount
  })

  if (!candidates.length) {
    const slugMessage = proofEventSlug ? ` for slug ${proofEventSlug}` : ''
    throw new Error(`No suitable paid launch event with ${attendeeCount} available space(s)${slugMessage}`)
  }

  return candidates[0]
}

async function createCheckoutSession(event) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    },
    body: JSON.stringify({
      items: [buildCartItem(event)],
      discountCode: null,
      customer: {
        email: proofEmail,
        firstName: 'Stripe',
        lastName: 'Proof',
        phone: '07123456789'
      },
      shipping: null
    })
  })

  const text = await response.text()
  let body = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }

  if (!response.ok) {
    throw new Error(`create-checkout-session failed: ${response.status} ${JSON.stringify(body)}`)
  }

  if (!body.sessionId || !body.url) {
    throw new Error(`create-checkout-session response missing sessionId or url: ${JSON.stringify(body)}`)
  }

  if (String(body.sessionId).startsWith('cs_live_') && !allowLiveSession) {
    throw new Error('Created a live Stripe Checkout Session. Refusing to continue without ALLOW_LIVE_STRIPE_PAYMENT_PROOF=1.')
  }

  if (!String(body.sessionId).startsWith('cs_test_') && !allowLiveSession) {
    throw new Error(`Checkout Session ${body.sessionId} is not test-mode. Refusing to continue without ALLOW_LIVE_STRIPE_PAYMENT_PROOF=1.`)
  }

  return body
}

async function retrieveStripeSession(sessionId) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`
      }
    }
  )

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`Unable to retrieve Stripe Checkout Session ${sessionId}: ${response.status} ${JSON.stringify(body)}`)
  }

  return body
}

function signStripePayload(payload) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const signature = createHmac('sha256', stripeWebhookSecret)
    .update(signedPayload)
    .digest('hex')

  return `t=${timestamp},v1=${signature}`
}

async function verifyWebhookSecret() {
  const eventId = `evt_codex_webhook_secret_probe_${Date.now()}`
  const payload = JSON.stringify({
    id: eventId,
    object: 'event',
    type: 'codex.webhook_secret_probe',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'codex_webhook_secret_probe'
      }
    }
  })

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signStripePayload(payload)
    },
    body: payload
  })

  const text = await response.text().catch(() => '')

  await supabase
    .from('stripe_events')
    .delete()
    .eq('id', eventId)

  if (!response.ok) {
    throw new Error([
      `Webhook secret probe failed: ${response.status} ${text.slice(0, 240)}`,
      'The local STRIPE_WEBHOOK_SECRET does not match the deployed Supabase Edge Function secret.',
      'Pass the deployed Stripe endpoint signing secret with STRIPE_WEBHOOK_SECRET=whsec_... and rerun.',
      'The proof stopped before creating a Stripe Checkout Session or writing order/capacity data.'
    ].join('\n'))
  }
}

async function sendCompletedWebhook(session, fallbackEvent) {
  const eventId = `evt_codex_checkout_completed_${Date.now()}`
  const checkoutSession = {
    ...session,
    id: session.id,
    object: 'checkout.session',
    mode: 'payment',
    status: 'complete',
    payment_status: 'paid',
    amount_total: session.amount_total || Math.round(Number(fallbackEvent.price_gbp) * attendeeCount * 100),
    total_details: session.total_details || {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 0
    },
    customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
    payment_intent: session.payment_intent || `pi_codex_proof_${Date.now()}`,
    metadata: session.metadata || {}
  }

  const payload = JSON.stringify({
    id: eventId,
    object: 'event',
    api_version: '2024-11-20.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: checkoutSession
    }
  })

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signStripePayload(payload)
    },
    body: payload
  })

  const text = await response.text().catch(() => '')

  if (!response.ok) {
    throw new Error(`Signed checkout.session.completed webhook failed: ${response.status} ${text.slice(0, 500)}`)
  }

  return eventId
}

async function waitForOrder(sessionId) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < 30000) {
    const { data, error } = await supabase
      .from('orders')
      .select('id,order_number,status')
      .eq('stripe_checkout_session_id', sessionId)
      .maybeSingle()

    if (error) {
      throw new Error(`Order lookup failed: ${error.message}`)
    }

    if (data) return data
    await delay(1000)
  }

  throw new Error(`Timed out waiting for order for checkout session ${sessionId}`)
}

function runEvidenceAudit(sessionId) {
  const result = spawnSync(process.execPath, ['scripts/audit-stripe-payment-webhook-proof.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      STRIPE_CHECKOUT_SESSION_ID: sessionId
    },
    encoding: 'utf8'
  })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status !== 0) {
    throw new Error(`Evidence audit failed for ${sessionId}`)
  }
}

const events = await fetchLaunchEvents()
const event = chooseEvent(events)

console.log('Stripe checkout webhook proof target:')
console.log(`- Event: ${event.offering.title}`)
console.log(`- Slug: ${event.offering.slug}`)
console.log(`- Date: ${event.event_date}`)
console.log(`- Attendees: ${attendeeCount}`)
console.log(`- Spaces available before proof: ${spacesAvailable(event)}`)
console.log(`- Proof email: ${proofEmail}`)

if (!confirmed) {
  console.log('')
  console.log('Dry run only. This script will create a Stripe Checkout Session, send a signed checkout.session.completed webhook, create Supabase order/booking/attendee rows, update capacity through booking triggers, and trigger email side effects.')
  console.log('Run with CONFIRM_STRIPE_PROOF_RUN=1 to execute.')
  process.exit(0)
}

await verifyWebhookSecret()
const session = await createCheckoutSession(event)
console.log(`Created Stripe Checkout Session: ${session.sessionId}`)

const stripeSession = await retrieveStripeSession(session.sessionId)
console.log(`Retrieved Stripe Checkout Session from Stripe API: ${stripeSession.id}`)

const eventId = await sendCompletedWebhook(stripeSession, event)
console.log(`Posted signed checkout.session.completed webhook: ${eventId}`)

const order = await waitForOrder(session.sessionId)
console.log(`Created order: ${order.order_number}`)

runEvidenceAudit(session.sessionId)
console.log(`Stripe proof automation complete for ${session.sessionId}`)
