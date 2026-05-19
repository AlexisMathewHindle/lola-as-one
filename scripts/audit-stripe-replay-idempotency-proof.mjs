#!/usr/bin/env node

import { createHmac } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const evidencePath = resolve(root, 'docs/stripe-replay-idempotency-proof-evidence.md')
const confirmed = process.env.CONFIRM_STRIPE_REPLAY_PROOF_RUN === '1'
const allowLiveSession = process.env.ALLOW_LIVE_STRIPE_REPLAY_PROOF === '1'
const explicitSessionId = process.env.STRIPE_CHECKOUT_SESSION_ID || ''
const explicitReplayEventId = process.env.STRIPE_REPLAY_EVENT_ID || ''

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
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ||
  fileEnvs.functions.STRIPE_SECRET_KEY
const stripeWebhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ||
  fileEnvs.functions.STRIPE_WEBHOOK_SECRET

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing production Supabase URL or service role key')
}

if (!stripeSecretKey || !stripeWebhookSecret) {
  throw new Error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
}

if (!/^whsec_[A-Za-z0-9]+$/.test(stripeWebhookSecret)) {
  throw new Error([
    'STRIPE_WEBHOOK_SECRET format is invalid.',
    'Check for accidental trailing punctuation, quotes, spaces, or copied prose after the whsec_ value.',
    'The replay proof stopped before posting duplicate webhook events.'
  ].join('\n'))
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function escapeCell(value) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function formatTable(headers, rows) {
  if (!rows.length) return '_No rows._'

  const headerLine = `| ${headers.map(escapeCell).join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)

  return [headerLine, separator, ...body].join('\n')
}

function passed(label, detail) {
  return { label, status: 'passed', detail, failure: '' }
}

function failed(label, detail, failure) {
  return { label, status: 'failed', detail, failure }
}

function normalizeRows(rows, keys) {
  return [...rows]
    .map((row) => {
      const normalized = {}
      for (const key of keys) normalized[key] = row[key] ?? null
      return normalized
    })
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

function comparableBusinessState(snapshot) {
  return {
    orders: normalizeRows(snapshot.orders, [
      'id',
      'order_number',
      'stripe_checkout_session_id',
      'customer_email',
      'status',
      'total_gbp'
    ]),
    orderItems: normalizeRows(snapshot.orderItems, [
      'id',
      'order_id',
      'offering_id',
      'item_type',
      'title',
      'quantity',
      'total_price_gbp',
      'event_date',
      'event_start_time'
    ]),
    bookings: normalizeRows(snapshot.bookings, [
      'id',
      'order_id',
      'order_item_id',
      'offering_event_id',
      'number_of_attendees',
      'status'
    ]),
    attendees: normalizeRows(snapshot.attendees, [
      'id',
      'booking_id',
      'first_name',
      'last_name',
      'email'
    ]),
    capacity: normalizeRows(snapshot.capacityState, [
      'offering_event_id',
      'spaces_booked',
      'spaces_available',
      'current_bookings',
      'max_capacity'
    ]),
    emailLogs: normalizeRows(snapshot.emailLogs, [
      'id',
      'template',
      'recipient',
      'status',
      'sent_at'
    ])
  }
}

function businessStateEqual(a, b) {
  return JSON.stringify(comparableBusinessState(a)) === JSON.stringify(comparableBusinessState(b))
}

function countSummary(snapshot) {
  return {
    orders: snapshot.orders.length,
    orderItems: snapshot.orderItems.length,
    bookings: snapshot.bookings.length,
    attendees: snapshot.attendees.length,
    capacityRows: snapshot.capacityState.length,
    emailLogs: snapshot.emailLogs.length,
    stripeEvents: snapshot.stripeEvents.length
  }
}

function resultRows(results) {
  return results.map((result) => [
    result.status,
    result.label,
    result.detail,
    result.failure
  ])
}

async function checked(label, callback) {
  const { data, error } = await callback()
  if (error) throw new Error(`${label}: ${error.message}`)
  return data || []
}

async function resolveLatestSessionId() {
  if (explicitSessionId) return explicitSessionId

  if (existsSync(resolve(root, 'docs/stripe-payment-webhook-proof-evidence.md'))) {
    const evidence = readFileSync(resolve(root, 'docs/stripe-payment-webhook-proof-evidence.md'), 'utf8')
    const match = evidence.match(/cs_(?:test|live)_[A-Za-z0-9]+/)
    if (match) return match[0]
  }

  const rows = await checked('latest order lookup', () =>
    supabase
      .from('orders')
      .select('stripe_checkout_session_id')
      .like('stripe_checkout_session_id', 'cs_%')
      .order('created_at', { ascending: false })
      .limit(1)
  )

  return rows[0]?.stripe_checkout_session_id || ''
}

async function getSnapshot(sessionId) {
  const orders = await checked('orders lookup', () =>
    supabase
      .from('orders')
      .select('id,order_number,stripe_checkout_session_id,customer_email,status,total_gbp,created_at')
      .eq('stripe_checkout_session_id', sessionId)
      .order('created_at', { ascending: true })
  )

  const orderIds = orders.map((order) => order.id)
  const earliestOrderCreatedAt = orders[0]?.created_at || new Date(0).toISOString()

  const orderItems = orderIds.length
    ? await checked('order_items lookup', () =>
      supabase
        .from('order_items')
        .select('id,order_id,offering_id,item_type,title,quantity,total_price_gbp,event_date,event_start_time')
        .in('order_id', orderIds)
        .order('id', { ascending: true })
    )
    : []

  const bookings = orderIds.length
    ? await checked('bookings lookup', () =>
      supabase
        .from('bookings')
        .select('id,order_id,order_item_id,offering_event_id,number_of_attendees,status')
        .in('order_id', orderIds)
        .order('id', { ascending: true })
    )
    : []

  const bookingIds = bookings.map((booking) => booking.id)
  const attendees = bookingIds.length
    ? await checked('booking_attendees lookup', () =>
      supabase
        .from('booking_attendees')
        .select('id,booking_id,first_name,last_name,email')
        .in('booking_id', bookingIds)
        .order('id', { ascending: true })
    )
    : []

  const eventIds = [...new Set(bookings.map((booking) => booking.offering_event_id).filter(Boolean))]
  const capacities = eventIds.length
    ? await checked('event_capacity lookup', () =>
      supabase
        .from('event_capacity')
        .select('offering_event_id,total_capacity,spaces_booked,spaces_available')
        .in('offering_event_id', eventIds)
    )
    : []
  const events = eventIds.length
    ? await checked('offering_events lookup', () =>
      supabase
        .from('offering_events')
        .select('id,current_bookings,max_capacity')
        .in('id', eventIds)
    )
    : []

  const capacityState = eventIds.map((eventId) => {
    const capacity = capacities.find((row) => row.offering_event_id === eventId) || {}
    const event = events.find((row) => row.id === eventId) || {}
    return {
      offering_event_id: eventId,
      spaces_booked: Number(capacity.spaces_booked || 0),
      spaces_available: Number(capacity.spaces_available || 0),
      current_bookings: Number(event.current_bookings || 0),
      max_capacity: Number(event.max_capacity || 0)
    }
  })

  const recentEmails = await checked('email_logs lookup', () =>
    supabase
      .from('email_logs')
      .select('id,template,recipient,status,sent_at,metadata')
      .gte('sent_at', earliestOrderCreatedAt)
      .order('sent_at', { ascending: false })
      .limit(200)
  )
  const orderNumbers = new Set(orders.map((order) => order.order_number))
  const emailLogs = recentEmails.filter((email) => {
    const metadata = email.metadata || {}
    return metadata.stripeCheckoutSessionId === sessionId ||
      orderNumbers.has(metadata.orderNumber)
  })

  const stripeEvents = await checked('stripe_events lookup', () =>
    supabase
      .from('stripe_events')
      .select('id,type,processed_at')
      .eq('type', 'checkout.session.completed')
      .gte('processed_at', earliestOrderCreatedAt)
      .order('processed_at', { ascending: true })
      .limit(100)
  )

  return {
    sessionId,
    orders,
    orderItems,
    bookings,
    attendees,
    capacityState,
    emailLogs,
    stripeEvents
  }
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

async function postCompletedWebhook({ session, eventId }) {
  const checkoutSession = {
    ...session,
    id: session.id,
    object: 'checkout.session',
    mode: 'payment',
    status: 'complete',
    payment_status: 'paid',
    customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
    payment_intent: session.payment_intent || `pi_codex_replay_${Date.now()}`,
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
  let body = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }

  return {
    ok: response.ok,
    status: response.status,
    body
  }
}

async function verifyWebhookSecret() {
  const eventId = `evt_codex_replay_secret_probe_${Date.now()}`
  const payload = JSON.stringify({
    id: eventId,
    object: 'event',
    type: 'codex.replay_secret_probe',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'codex_replay_secret_probe'
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
      'The replay proof stopped before posting duplicate checkout.session.completed events.'
    ].join('\n'))
  }
}

function chooseReplayEventId(snapshot) {
  if (explicitReplayEventId) return explicitReplayEventId
  return snapshot.stripeEvents[0]?.id || ''
}

function writeEvidence({ sessionId, replayEventId, secondEventId, baseline, afterSameEvent, afterSecondEvent, responses, results }) {
  const failures = results.filter((result) => result.status === 'failed')
  const status = failures.length > 0 ? 'blocked' : 'green'
  const baselineCounts = countSummary(baseline)
  const afterSameCounts = countSummary(afterSameEvent)
  const afterSecondCounts = countSummary(afterSecondEvent)

  const markdown = `# Stripe Replay And Idempotency Proof Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Audit source: signed duplicate webhook posts against production Supabase Edge Function
Checkout Session: \`${sessionId}\`
Cached replay event ID: \`${replayEventId}\`
Second same-session event ID: \`${secondEventId}\`

## Run Summary

| Check | Result |
|-------|--------|
| Overall status | ${status} |
| Checks | ${results.length} |
| Checks passed | ${results.filter((result) => result.status === 'passed').length} |
| Failed checks | ${failures.length} |
| Same-event replay response | ${responses.sameEvent.status} ${JSON.stringify(responses.sameEvent.body)} |
| Second same-session response | ${responses.secondEvent.status} ${JSON.stringify(responses.secondEvent.body)} |

## Proof Checks

${formatTable(['Result', 'Check', 'Detail', 'Failure'], resultRows(results))}

## Row Counts

| Snapshot | Orders | Order items | Bookings | Attendees | Capacity rows | Email logs | Checkout session event logs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Before replay | ${baselineCounts.orders} | ${baselineCounts.orderItems} | ${baselineCounts.bookings} | ${baselineCounts.attendees} | ${baselineCounts.capacityRows} | ${baselineCounts.emailLogs} | ${baselineCounts.stripeEvents} |
| After same event ID replay | ${afterSameCounts.orders} | ${afterSameCounts.orderItems} | ${afterSameCounts.bookings} | ${afterSameCounts.attendees} | ${afterSameCounts.capacityRows} | ${afterSameCounts.emailLogs} | ${afterSameCounts.stripeEvents} |
| After second same-session event | ${afterSecondCounts.orders} | ${afterSecondCounts.orderItems} | ${afterSecondCounts.bookings} | ${afterSecondCounts.attendees} | ${afterSecondCounts.capacityRows} | ${afterSecondCounts.emailLogs} | ${afterSecondCounts.stripeEvents} |

## Capacity Snapshot

${formatTable(
    ['Offering event ID', 'Spaces booked', 'Spaces available', 'Current bookings', 'Max capacity'],
    afterSecondEvent.capacityState.map((row) => [
      row.offering_event_id,
      row.spaces_booked,
      row.spaces_available,
      row.current_bookings,
      row.max_capacity
    ])
  )}

## Notes

- This is sandbox/test-mode evidence when the Checkout Session starts with \`cs_test_\`.
- Same Stripe event ID replay must return success from the webhook cache and must not write business rows.
- A different Stripe event ID for the same Checkout Session may add one extra \`stripe_events\` audit row, but must not create another order, booking, attendee, capacity decrement, or email send.
- Duplicate customer/admin email sends are prevented in this proof because the same-session duplicate exits at the existing-order guard before email invocation.
- Live-mode replay proof must be repeated after live Stripe cutover with a \`cs_live_...\` session.
`

  writeFileSync(evidencePath, markdown)
  return { status, failures }
}

const sessionId = await resolveLatestSessionId()

if (!sessionId) {
  throw new Error('No checkout session ID found. Pass STRIPE_CHECKOUT_SESSION_ID=cs_...')
}

if (sessionId.startsWith('cs_live_') && !allowLiveSession) {
  throw new Error('Refusing to replay a live Stripe Checkout Session without ALLOW_LIVE_STRIPE_REPLAY_PROOF=1.')
}

if (!sessionId.startsWith('cs_test_') && !sessionId.startsWith('cs_live_') && !allowLiveSession) {
  throw new Error(`Checkout Session ${sessionId} is not recognizably test or live mode.`)
}

const baseline = await getSnapshot(sessionId)

if (baseline.orders.length !== 1) {
  throw new Error(`Expected exactly one baseline order for ${sessionId}; found ${baseline.orders.length}`)
}

const replayEventId = chooseReplayEventId(baseline)

if (!replayEventId) {
  throw new Error('No existing checkout.session.completed stripe_events row found. Pass STRIPE_REPLAY_EVENT_ID=evt_...')
}

console.log('Stripe replay idempotency proof target:')
console.log(`- Checkout Session: ${sessionId}`)
console.log(`- Order: ${baseline.orders[0].order_number}`)
console.log(`- Cached replay event ID: ${replayEventId}`)
console.log(`- Baseline orders: ${baseline.orders.length}`)
console.log(`- Baseline bookings: ${baseline.bookings.length}`)
console.log(`- Baseline attendees: ${baseline.attendees.length}`)
console.log(`- Baseline email logs: ${baseline.emailLogs.length}`)

if (!confirmed) {
  console.log('')
  console.log('Dry run only. This script will post two signed duplicate checkout.session.completed webhooks to the deployed Stripe webhook.')
  console.log('The first reuses an existing Stripe event ID and should hit the webhook cache.')
  console.log('The second uses a new event ID with the same Checkout Session ID and should hit the existing-order guard.')
  console.log('Run with CONFIRM_STRIPE_REPLAY_PROOF_RUN=1 to execute.')
  process.exit(0)
}

await verifyWebhookSecret()
const stripeSession = await retrieveStripeSession(sessionId)
const sameEventResponse = await postCompletedWebhook({
  session: stripeSession,
  eventId: replayEventId
})

await delay(1500)
const afterSameEvent = await getSnapshot(sessionId)

const secondEventId = `evt_codex_checkout_replay_same_session_${Date.now()}`
const secondEventResponse = await postCompletedWebhook({
  session: stripeSession,
  eventId: secondEventId
})

await delay(1500)
const afterSecondEvent = await getSnapshot(sessionId)

const baselineCounts = countSummary(baseline)
const afterSameCounts = countSummary(afterSameEvent)
const afterSecondCounts = countSummary(afterSecondEvent)

const results = [
  sameEventResponse.ok && sameEventResponse.body?.cached === true
    ? passed('Same event ID replay response', `${sameEventResponse.status}; cached=true`)
    : failed('Same event ID replay response', `${sameEventResponse.status}`, JSON.stringify(sameEventResponse.body)),
  businessStateEqual(baseline, afterSameEvent) &&
    afterSameCounts.stripeEvents === baselineCounts.stripeEvents
    ? passed('Same event ID creates no duplicate business rows', 'Orders, items, bookings, attendees, capacity, email logs, and event logs unchanged.')
    : failed('Same event ID creates no duplicate business rows', sessionId, 'Business state changed after cached replay.'),
  secondEventResponse.ok
    ? passed('Second same-session event response', `${secondEventResponse.status}`)
    : failed('Second same-session event response', `${secondEventResponse.status}`, JSON.stringify(secondEventResponse.body)),
  afterSecondCounts.orders === baselineCounts.orders
    ? passed('No duplicate orders', `${baselineCounts.orders} order row(s) before and after replay.`)
    : failed('No duplicate orders', sessionId, `Before ${baselineCounts.orders}, after ${afterSecondCounts.orders}`),
  afterSecondCounts.orderItems === baselineCounts.orderItems
    ? passed('No duplicate order item rows', `${baselineCounts.orderItems} order item row(s) before and after replay.`)
    : failed('No duplicate order item rows', sessionId, `Before ${baselineCounts.orderItems}, after ${afterSecondCounts.orderItems}`),
  afterSecondCounts.bookings === baselineCounts.bookings
    ? passed('No duplicate booking rows', `${baselineCounts.bookings} booking row(s) before and after replay.`)
    : failed('No duplicate booking rows', sessionId, `Before ${baselineCounts.bookings}, after ${afterSecondCounts.bookings}`),
  afterSecondCounts.attendees === baselineCounts.attendees
    ? passed('No duplicate attendee rows', `${baselineCounts.attendees} attendee row(s) before and after replay.`)
    : failed('No duplicate attendee rows', sessionId, `Before ${baselineCounts.attendees}, after ${afterSecondCounts.attendees}`),
  JSON.stringify(comparableBusinessState(baseline).capacity) ===
    JSON.stringify(comparableBusinessState(afterSecondEvent).capacity)
    ? passed('Capacity is not decremented twice', 'Capacity rows and offering_events.current_bookings are unchanged after duplicate delivery.')
    : failed('Capacity is not decremented twice', sessionId, 'Capacity state changed after duplicate delivery.'),
  afterSecondCounts.emailLogs === baselineCounts.emailLogs
    ? passed('Duplicate email sends prevented', `${baselineCounts.emailLogs} order-linked email log(s) before and after replay.`)
    : failed('Duplicate email sends prevented', sessionId, `Before ${baselineCounts.emailLogs}, after ${afterSecondCounts.emailLogs}`),
  afterSecondCounts.stripeEvents === baselineCounts.stripeEvents + 1 &&
    afterSecondEvent.stripeEvents.some((event) => event.id === secondEventId)
    ? passed('Second same-session event only writes audit event', `stripe_events increased by 1 for ${secondEventId}.`)
    : failed('Second same-session event only writes audit event', sessionId, `Before ${baselineCounts.stripeEvents}, after ${afterSecondCounts.stripeEvents}`)
]

const { failures } = writeEvidence({
  sessionId,
  replayEventId,
  secondEventId,
  baseline,
  afterSameEvent,
  afterSecondEvent,
  responses: {
    sameEvent: sameEventResponse,
    secondEvent: secondEventResponse
  },
  results
})

console.log(`Stripe replay idempotency proof audit complete: ${failures.length} failed`)

if (failures.length > 0) {
  console.log(formatTable(
    ['Check', 'Detail', 'Failure'],
    failures.map((result) => [result.label, result.detail, result.failure || 'Check failed'])
  ))
  process.exit(1)
}

console.log(`Stripe replay idempotency proof complete for ${sessionId}`)
