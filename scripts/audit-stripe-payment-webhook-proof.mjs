#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const evidencePath = resolve(root, 'docs/stripe-payment-webhook-proof-evidence.md')
const sessionArg = process.argv.find((arg) => arg.startsWith('--session-id='))
const checkoutSessionId = process.env.STRIPE_CHECKOUT_SESSION_ID ||
  (sessionArg ? sessionArg.slice('--session-id='.length) : '')

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

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing production Supabase URL or service role key')
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

function skipped(label, detail) {
  return { label, status: 'skipped', detail, failure: '' }
}

function sourceChecks() {
  const checkoutSource = readFileSync(resolve(root, 'supabase/functions/create-checkout-session/index.ts'), 'utf8')
  const webhookSource = readFileSync(resolve(root, 'supabase/functions/stripe-webhook/index.ts'), 'utf8')
  const sendEmailSource = readFileSync(resolve(root, 'supabase/functions/send-email/index.ts'), 'utf8')
  const orderSource = readFileSync(resolve(root, 'supabase/functions/get-order-by-session/index.ts'), 'utf8')
  const capacityTriggerSource = readFileSync(resolve(root, 'supabase/migrations/20260514_use_booking_trigger_for_capacity.sql'), 'utf8')

  const capacityIndex = checkoutSource.indexOf('Validate inventory and capacity')
  const stripeCreateIndex = checkoutSource.indexOf('stripe.checkout.sessions.create')
  const hasSignatureVerification = webhookSource.includes('constructEventAsync') ||
    webhookSource.includes('constructEvent(body, signature, webhookSecret)')
  const hasUnsafeSignatureFallback = webhookSource.includes('Skipping signature verification') ||
    webhookSource.includes('event = JSON.parse(body)')
  const secretPrefixLogging = checkoutSource.includes('keyPrefix') ||
    webhookSource.includes('keyPrefix') ||
    webhookSource.includes('Webhook secret prefix') ||
    webhookSource.includes('substring(0, 10)')

  return [
    hasSignatureVerification && webhookSource.includes('Invalid Stripe signature') && !hasUnsafeSignatureFallback
      ? passed('Webhook rejects invalid signatures', 'Stripe signatures are constructed and verification failures return 400.')
      : failed('Webhook rejects invalid signatures', 'Webhook must reject invalid signatures before event processing.', 'Unsafe signature fallback or missing rejection path found.'),
    webhookSource.includes("from('stripe_events')") &&
      webhookSource.includes('Event already processed') &&
      webhookSource.includes("eq('stripe_checkout_session_id', session.id)") &&
      webhookSource.includes('Order already exists for checkout session')
      ? passed('Webhook idempotency', 'Stripe event ID and checkout session ID duplicate guards are present.')
      : failed('Webhook idempotency', 'Webhook should guard duplicate Stripe deliveries.', 'Missing event/session idempotency guard.'),
    webhookSource.includes("session.mode === 'subscription'") &&
      webhookSource.includes('Subscription checkout.session.completed received - skipping order creation')
      ? passed('Subscription event isolation', 'Subscription checkout sessions do not create one-time event orders.')
      : failed('Subscription event isolation', 'Subscription checkout sessions should not create one-time event orders.', 'Subscription session guard missing.'),
    webhookSource.includes("from('orders')") &&
      webhookSource.includes("from('order_items')") &&
      webhookSource.includes("from('bookings')") &&
      webhookSource.includes("from('booking_attendees')")
      ? passed('Webhook persistence paths', 'Orders, order items, bookings, and attendee insert paths are present.')
      : failed('Webhook persistence paths', 'Webhook must create order, order item, booking, and attendee rows.', 'Missing persistence path.'),
    !webhookSource.includes("rpc('decrement_event_capacity'") &&
      webhookSource.includes('Capacity is updated once by the database booking trigger') &&
      capacityTriggerSource.includes('update_event_capacity_on_booking') &&
      capacityTriggerSource.includes('current_bookings = v_spaces_booked')
      ? passed('Booking-trigger capacity decrement', 'Webhook creates bookings; the database trigger updates capacity once and mirrors current_bookings.')
      : failed('Booking-trigger capacity decrement', 'Capacity should be updated once by the confirmed-booking trigger, not separately by the webhook.', 'Webhook RPC or trigger mirror check failed.'),
    webhookSource.includes("template: 'order-confirmation'") &&
      webhookSource.includes("'new-order-admin'") &&
      webhookSource.includes("'event-booking-admin'") &&
      webhookSource.includes("template: 'event-booking-confirmation'") &&
      webhookSource.includes('stripeCheckoutSessionId: session.id') &&
      webhookSource.includes('invokeSendEmail') &&
      webhookSource.includes('Authorization: `Bearer ${authToken}`') &&
      webhookSource.includes("Deno.env.get('FUNCTIONS_GATEWAY_JWT') || serviceRoleKey") &&
      webhookSource.includes('FUNCTIONS_BASE_URL') &&
      webhookSource.includes('logEmailFailure')
      ? passed('Webhook email side effects', 'Product receipt, event customer/admin email calls, gateway JWT invocation, fallback failure logging, and order-linked email metadata are present.')
      : failed('Webhook email side effects', 'Webhook should invoke product receipt and event customer/admin templates.', 'Missing expected email call.'),
    sendEmailSource.includes("status: 'failed'") &&
      sendEmailSource.includes('error_message') &&
      sendEmailSource.includes("from('email_logs')")
      ? passed('Email failure logging', 'send-email writes failed email attempts to email_logs.')
      : failed('Email failure logging', 'Email failures must be visible in email_logs for operational proof.', 'Failed email log insert path missing.'),
    checkoutSource.includes('getCheckoutAppUrl') &&
      checkoutSource.includes('success_url') &&
      checkoutSource.includes('/order/success?session_id={CHECKOUT_SESSION_ID}') &&
      checkoutSource.includes('cancel_url')
      ? passed('Checkout return URLs', 'Checkout session uses app success and cancel URLs.')
      : failed('Checkout return URLs', 'Checkout session should return customers to app order success and checkout routes.', 'Return URL configuration missing.'),
    checkoutSource.includes('line_item_count') &&
      checkoutSource.includes('line_item_') &&
      checkoutSource.includes('item_${index}_attendees') &&
      checkoutSource.includes('event_id')
      ? passed('Checkout event metadata', 'Line item and attendee metadata are available for webhook reconstruction.')
      : failed('Checkout event metadata', 'Checkout metadata must include event lines and attendees.', 'Metadata fields missing.'),
    capacityIndex !== -1 && stripeCreateIndex !== -1 && capacityIndex < stripeCreateIndex
      ? passed('Capacity before Stripe', 'Capacity validation occurs before stripe.checkout.sessions.create.')
      : failed('Capacity before Stripe', 'Capacity must be checked before Stripe session creation.', 'Capacity check order is invalid.'),
    orderSource.includes('stripe_checkout_session_id') &&
      orderSource.includes('booking_attendees') &&
      orderSource.includes('bookings:')
      ? passed('Order success recovery source', 'get-order-by-session returns order, booking, and attendee details.')
      : failed('Order success recovery source', 'Order success route needs recoverable booking details.', 'Order lookup source missing booking details.'),
    !secretPrefixLogging
      ? passed('No secret-prefix logging', 'Stripe/webhook secret prefixes are not logged.')
      : failed('No secret-prefix logging', 'Production functions should not log secret prefixes.', 'Secret-prefix logging found.')
  ]
}

async function tableChecks() {
  const tables = [
    ['customers', 'id,email,stripe_customer_id'],
    ['orders', 'id,order_number,stripe_checkout_session_id,customer_email,status,total_gbp,created_at'],
    ['order_items', 'id,order_id,offering_id,item_type,quantity,total_price_gbp,event_date,event_start_time'],
    ['bookings', 'id,order_id,order_item_id,offering_event_id,number_of_attendees,status'],
    ['booking_attendees', 'id,booking_id,first_name,last_name'],
    ['event_capacity', 'id,offering_event_id,total_capacity,spaces_booked,spaces_available'],
    ['offering_events', 'id,current_bookings,max_capacity'],
    ['stripe_events', 'id,type,processed_at'],
    ['email_logs', 'id,template,recipient,status,sent_at,metadata']
  ]

  const results = []

  for (const [table, columns] of tables) {
    const { error } = await supabase
      .from(table)
      .select(columns)
      .limit(1)

    results.push(error
      ? failed(`Production table: ${table}`, columns, error.message)
      : passed(`Production table: ${table}`, columns))
  }

  return results
}

async function endpointChecks() {
  const baseUrl = supabaseUrl.replace(/\/$/, '')
  const webhookResponse = await fetch(`${baseUrl}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })

  const webhookText = await webhookResponse.text().catch(() => '')
  const probeEventId = `evt_codex_signature_probe_${Date.now()}`
  const invalidSignatureResponse = await fetch(`${baseUrl}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=invalid_signature`
    },
    body: JSON.stringify({
      id: probeEventId,
      type: 'codex.signature_probe',
      data: {
        object: {}
      }
    })
  })
  const invalidSignatureText = await invalidSignatureResponse.text().catch(() => '')
  const { data: probeRow, error: probeCheckError } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', probeEventId)
    .maybeSingle()

  if (probeRow) {
    await supabase
      .from('stripe_events')
      .delete()
      .eq('id', probeEventId)
  }

  const checkoutResponse = await fetch(`${baseUrl}/functions/v1/create-checkout-session`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Access-Control-Request-Method': 'POST'
    }
  })

  return [
    webhookResponse.status === 400
      ? passed('Webhook rejects unsigned requests', `Status ${webhookResponse.status}`)
      : failed('Webhook rejects unsigned requests', 'Unsigned webhook request should return 400.', `Status ${webhookResponse.status}: ${webhookText.slice(0, 160)}`),
    invalidSignatureResponse.status === 400 && !probeRow && !probeCheckError
      ? passed('Webhook rejects invalid signatures', `Status ${invalidSignatureResponse.status}; no probe row written`)
      : failed(
          'Webhook rejects invalid signatures',
          'Invalid signed webhook request should return 400 without writing stripe_events.',
          probeCheckError?.message || `Status ${invalidSignatureResponse.status}; probeRow=${Boolean(probeRow)}; body=${invalidSignatureText.slice(0, 160)}`
        ),
    checkoutResponse.ok
      ? passed('Checkout function preflight', `Status ${checkoutResponse.status}`)
      : failed('Checkout function preflight', 'Checkout function should respond to OPTIONS without creating a session.', `Status ${checkoutResponse.status}`)
  ]
}

async function liveSessionChecks(sessionId) {
  if (!sessionId) {
    return [
      skipped('Completed payment proof', 'Set STRIPE_CHECKOUT_SESSION_ID=cs_... after completing a deliberate Stripe checkout.')
    ]
  }

  const results = []
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,order_number,stripe_checkout_session_id,customer_email,status,total_gbp,created_at')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle()

  if (orderError) {
    return [failed('Payment session order lookup', sessionId, orderError.message)]
  }

  if (!order) {
    return [failed('Payment session order lookup', sessionId, 'No order found for checkout session.')]
  }

  results.push(order.status === 'paid'
    ? passed('Payment session order lookup', `${order.order_number}; ${order.status}; GBP ${order.total_gbp}`)
    : failed('Payment session order lookup', order.order_number, `Expected paid, found ${order.status}`))

  const { data: orderItems, error: itemError } = await supabase
    .from('order_items')
    .select('id,order_id,offering_id,item_type,title,quantity,total_price_gbp,event_date,event_start_time')
    .eq('order_id', order.id)

  if (itemError) {
    results.push(failed('Payment session order items', order.order_number, itemError.message))
  }

  const eventItems = (orderItems || []).filter((item) => item.item_type === 'event')
  results.push(eventItems.length > 0
    ? passed('Payment session event order items', `${eventItems.length} event item(s)`)
    : failed('Payment session event order items', order.order_number, 'No event order items found.'))

  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      order_id,
      order_item_id,
      offering_event_id,
      number_of_attendees,
      status,
      booking_attendees (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq('order_id', order.id)

  if (bookingError) {
    results.push(failed('Payment session bookings', order.order_number, bookingError.message))
  }

  const attendeeCount = (bookings || []).reduce((sum, booking) => {
    return sum + (booking.booking_attendees || []).length
  }, 0)
  const bookedQuantity = eventItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)

  results.push((bookings || []).length === eventItems.length && eventItems.length > 0
    ? passed('Payment session booking rows', `${(bookings || []).length} booking row(s)`)
    : failed('Payment session booking rows', order.order_number, `Expected ${eventItems.length}, found ${(bookings || []).length}`))
  results.push(attendeeCount === bookedQuantity && bookedQuantity > 0
    ? passed('Payment session attendee rows', `${attendeeCount} attendee row(s) for ${bookedQuantity} booked place(s)`)
    : failed('Payment session attendee rows', order.order_number, `Expected ${bookedQuantity}, found ${attendeeCount}`))

  const baseUrl = supabaseUrl.replace(/\/$/, '')
  const successResponse = await fetch(`${baseUrl}/functions/v1/get-order-by-session?session_id=${encodeURIComponent(sessionId)}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  })
  const successBody = await successResponse.json().catch(() => ({}))
  const successAttendeeCount = (successBody.bookings || []).reduce((sum, booking) => {
    return sum + (booking.attendees || []).length
  }, 0)

  results.push(successResponse.ok &&
    successBody.orderNumber === order.order_number &&
    (successBody.bookings || []).length === (bookings || []).length &&
    successAttendeeCount === attendeeCount
    ? passed('Payment session success-page recovery', `${successBody.orderNumber}; ${(successBody.bookings || []).length} booking row(s)`)
    : failed('Payment session success-page recovery', order.order_number, successBody.error || `Status ${successResponse.status}`))

  const eventIds = [...new Set((bookings || []).map((booking) => booking.offering_event_id).filter(Boolean))]

  if (eventIds.length > 0) {
    const { data: capacities, error: capacityError } = await supabase
      .from('event_capacity')
      .select('offering_event_id,total_capacity,spaces_booked,spaces_available')
      .in('offering_event_id', eventIds)
    const { data: events, error: eventError } = await supabase
      .from('offering_events')
      .select('id,current_bookings,max_capacity')
      .in('id', eventIds)

    if (capacityError || eventError) {
      results.push(failed('Payment session capacity consistency', eventIds.join(', '), capacityError?.message || eventError?.message))
    } else {
      const drift = eventIds.filter((eventId) => {
        const capacity = capacities.find((row) => row.offering_event_id === eventId)
        const event = events.find((row) => row.id === eventId)
        return !capacity || !event || Number(capacity.spaces_booked || 0) !== Number(event.current_bookings || 0)
      })

      results.push(drift.length === 0
        ? passed('Payment session capacity consistency', `${eventIds.length} event capacity row(s) consistent`)
        : failed('Payment session capacity consistency', eventIds.join(', '), `Drift found for ${drift.join(', ')}`))
    }
  } else {
    results.push(failed('Payment session capacity consistency', order.order_number, 'No booking event IDs found.'))
  }

  const { data: emails, error: emailError } = await supabase
    .from('email_logs')
    .select('template,status,sent_at,metadata')
    .gte('sent_at', order.created_at)
    .order('sent_at', { ascending: false })
    .limit(50)

  if (emailError) {
    results.push(failed('Payment session email logs', order.order_number, emailError.message))
  } else {
    const expectedTemplates = ['event-booking-confirmation', 'event-booking-admin']
    const orderLinkedEmails = (emails || []).filter((email) => {
      const metadata = email.metadata || {}
      return metadata.orderNumber === order.order_number ||
        metadata.stripeCheckoutSessionId === checkoutSessionId
    })

    const templates = new Set(orderLinkedEmails.map((email) => email.template))
    const missing = expectedTemplates.filter((template) => !templates.has(template))
    const notSent = expectedTemplates.filter((template) =>
      orderLinkedEmails.some((email) => email.template === template) &&
      !orderLinkedEmails.some((email) => email.template === template && email.status === 'sent')
    )

    if (orderLinkedEmails.length === 0) {
      results.push(failed('Payment session email logs', order.order_number, 'No order-linked email_logs rows found.'))
    } else {
      results.push(missing.length === 0 && notSent.length === 0
        ? passed('Payment session email logs', `${expectedTemplates.join(', ')} sent`)
        : failed('Payment session email logs', order.order_number, [
          missing.length ? `Missing order-linked template logs: ${missing.join(', ')}` : '',
          notSent.length ? `Templates without sent status: ${notSent.join(', ')}` : ''
        ].filter(Boolean).join('; ')))
    }
  }

  const { data: stripeEvents, error: stripeEventError } = await supabase
    .from('stripe_events')
    .select('id,type,processed_at')
    .eq('type', 'checkout.session.completed')
    .gte('processed_at', order.created_at)
    .limit(10)

  if (stripeEventError) {
    results.push(failed('Payment session stripe event log', order.order_number, stripeEventError.message))
  } else {
    results.push((stripeEvents || []).length > 0
      ? passed('Payment session stripe event log', `${stripeEvents.length} checkout.session.completed event(s) after order creation`)
      : failed('Payment session stripe event log', order.order_number, 'No checkout.session.completed stripe_events rows after order creation.'))
  }

  return results
}

function resultRows(results) {
  return results.map((result) => [
    result.status,
    result.label,
    result.detail,
    result.failure
  ])
}

function writeEvidence({ sourceResults, tableResults, endpointResults, liveResults }) {
  const allResults = [...sourceResults, ...tableResults, ...endpointResults, ...liveResults]
  const failures = allResults.filter((result) => result.status === 'failed')
  const skippedResults = allResults.filter((result) => result.status === 'skipped')
  const status = failures.length > 0
    ? 'blocked'
    : skippedResults.length > 0
      ? 'preflight green; live payment proof pending'
      : 'green'

  const markdown = `# Stripe Payment And Webhook Proof Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Stripe Payment And Webhook Proof](./stripe-payment-webhook-proof.md)
Audit source: source code, production Supabase table reachability, production Edge Function preflight${checkoutSessionId ? `, and checkout session ${checkoutSessionId}` : ''}

## Run Summary

| Check | Result |
|-------|--------|
| Overall status | ${status} |
| Source checks | ${sourceResults.length} |
| Source checks passed | ${sourceResults.filter((result) => result.status === 'passed').length} |
| Production table checks | ${tableResults.length} |
| Production table checks passed | ${tableResults.filter((result) => result.status === 'passed').length} |
| Endpoint checks | ${endpointResults.length} |
| Endpoint checks passed | ${endpointResults.filter((result) => result.status === 'passed').length} |
| Completed payment session checks | ${liveResults.length} |
| Completed payment session checks passed | ${liveResults.filter((result) => result.status === 'passed').length} |
| Failed checks | ${failures.length} |
| Skipped checks | ${skippedResults.length} |

## Source Hardening Checks

${formatTable(['Result', 'Check', 'Detail', 'Failure'], resultRows(sourceResults))}

## Production Table Checks

${formatTable(['Result', 'Check', 'Detail', 'Failure'], resultRows(tableResults))}

## Endpoint Preflight Checks

${formatTable(['Result', 'Check', 'Detail', 'Failure'], resultRows(endpointResults))}

## Completed Payment Session Checks

${formatTable(['Result', 'Check', 'Detail', 'Failure'], resultRows(liveResults))}

## Notes

- The safe preflight does not create a Stripe Checkout session and does not process a payment.
- A \`cs_test_...\` session is sandbox evidence only; it does not satisfy live Stripe launch proof.
- Email proof requires order-linked \`email_logs\` rows for the receipt, event booking confirmation, and admin notification with \`status = 'sent'\`.
- Live proof requires a deliberate completed live-mode Stripe checkout and rerun with \`STRIPE_CHECKOUT_SESSION_ID=cs_live_...\`.
- Sandbox replay/idempotency proof passed on 2026-05-19; live-mode replay/idempotency proof must be repeated after live Stripe cutover with a \`cs_live_...\` session.
`

  writeFileSync(evidencePath, markdown)
  return { status, failures, skippedResults }
}

const sourceResults = sourceChecks()
const tableResults = await tableChecks()
const endpointResults = await endpointChecks()
const liveResults = await liveSessionChecks(checkoutSessionId)
const { failures, skippedResults } = writeEvidence({ sourceResults, tableResults, endpointResults, liveResults })

console.log(`Stripe payment and webhook proof audit complete: ${failures.length} failed, ${skippedResults.length} skipped`)

if (failures.length > 0) {
  console.log(formatTable(
    ['Check', 'Detail', 'Failure'],
    failures.map((result) => [result.label, result.detail, result.failure || 'Check failed'])
  ))
  process.exit(1)
}

process.exit(0)
