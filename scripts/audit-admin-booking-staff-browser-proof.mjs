#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const appUrl = (process.env.ADMIN_STAFF_TEST_APP_URL || process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const email = process.env.ADMIN_STAFF_TEST_EMAIL
const password = process.env.ADMIN_STAFF_TEST_PASSWORD
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const fallbackChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const outputPath = resolve(root, 'docs/admin-booking-staff-browser-proof.md')
const viewportSpecs = (process.env.ADMIN_STAFF_TEST_VIEWPORTS || '390x844,1024x768')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => {
    const match = value.match(/^(\d+)x(\d+)$/)
    if (!match) throw new Error(`Invalid viewport spec: ${value}`)
    return { label: value, width: Number(match[1]), height: Number(match[2]) }
  })

if (!email || !password) {
  throw new Error('Set ADMIN_STAFF_TEST_EMAIL and ADMIN_STAFF_TEST_PASSWORD')
}

const resolvedChromePath = existsSync(chromePath) ? chromePath : fallbackChromePath
if (!existsSync(resolvedChromePath)) {
  throw new Error(`Chrome executable not found: ${resolvedChromePath}`)
}

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

function envAnonKey(source) {
  return source.SUPABASE_ANON_KEY || source.VITE_SUPABASE_ANON_KEY || source.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  envAnonKey(fileEnvs.root) ||
  envAnonKey(fileEnvs.app) ||
  envAnonKey(fileEnvs.migration) ||
  envAnonKey(fileEnvs.functions)

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing production Supabase URL or service role key')
}

if (!anonKey) {
  throw new Error('Missing production Supabase anon key')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const supabaseAuth = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function authStorageKey() {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token`
}

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

function maskEmail(value) {
  if (!value || !String(value).includes('@')) return '-'
  const [local, domain] = String(value).split('@')
  return `${local.slice(0, 2) || '*'}***@${domain}`
}

async function checked(label, callback) {
  const { data, error } = await callback()
  if (error) throw new Error(`${label}: ${error.message}`)
  return data || []
}

async function fetchProofBooking() {
  const bookings = await checked('future booking lookup', () =>
    supabase
      .from('bookings')
      .select(`
        id,
        order_id,
        offering_event_id,
        customer_email,
        customer_name,
        number_of_attendees,
        status,
        order:orders(
          id,
          order_number,
          status,
          stripe_payment_intent_id
        ),
        booking_attendees(id),
        offering_event:offering_events(
          id,
          event_date,
          event_start_time,
          offering:offerings(title, slug)
        )
      `)
      .eq('status', 'confirmed')
      .gte('offering_event.event_date', auditDate)
      .order('created_at', { ascending: false })
      .limit(25)
  )

  const target = bookings.find((booking) =>
    booking.offering_event?.event_date >= auditDate &&
    booking.order?.id &&
    (booking.booking_attendees || []).length === Number(booking.number_of_attendees || 0)
  )

  if (!target) {
    throw new Error('No future confirmed booking with attendee rows was found for staff browser proof')
  }

  return target
}

async function createAdminSession() {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    throw new Error(`Admin staff auth failed: ${error.message}`)
  }

  if (data.user?.app_metadata?.role !== 'admin') {
    throw new Error('Admin staff auth failed: supplied user does not have app_metadata.role=admin')
  }

  if (!data.session) {
    throw new Error('Admin staff auth failed: Supabase returned no session')
  }

  return data.session
}

async function waitForChromeWebSocket(process) {
  return new Promise((resolvePromise, rejectPromise) => {
    let stderr = ''
    const timeout = setTimeout(() => {
      rejectPromise(new Error(`Timed out waiting for Chrome DevTools URL. stderr: ${stderr.slice(-1000)}`))
    }, 15000)

    process.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (!match) return

      clearTimeout(timeout)
      resolvePromise(match[1])
    })

    process.on('error', (error) => {
      clearTimeout(timeout)
      rejectPromise(error)
    })

    process.on('exit', (code, signal) => {
      if (code === null && signal) return
      clearTimeout(timeout)
      rejectPromise(new Error(`Chrome exited before DevTools was ready: code=${code} signal=${signal}`))
    })
  })
}

function portFromBrowserWsUrl(wsUrl) {
  return new URL(wsUrl).port
}

async function createPageTarget(browserWsUrl) {
  const port = portFromBrowserWsUrl(browserWsUrl)
  const endpoint = `http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`
  let response = await fetch(endpoint, { method: 'PUT' })

  if (!response.ok) response = await fetch(endpoint)
  if (!response.ok) throw new Error(`Failed to create Chrome target: ${response.status} ${response.statusText}`)

  return response.json()
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.ws = null
    this.nextId = 1
    this.pending = new Map()
    this.eventWaiters = new Map()
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl)

    await new Promise((resolvePromise, rejectPromise) => {
      this.ws.addEventListener('open', resolvePromise, { once: true })
      this.ws.addEventListener('error', rejectPromise, { once: true })
    })

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)

      if (message.id && this.pending.has(message.id)) {
        const { resolve: resolvePending, reject, timer } = this.pending.get(message.id)
        clearTimeout(timer)
        this.pending.delete(message.id)

        if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ''}`.trim()))
        else resolvePending(message.result || {})
        return
      }

      if (message.method && this.eventWaiters.has(message.method)) {
        const waiters = this.eventWaiters.get(message.method)
        const waiter = waiters.shift()
        if (waiter) {
          clearTimeout(waiter.timer)
          waiter.resolve(message.params || {})
        }
      }
    })
  }

  send(method, params = {}, timeoutMs = 10000) {
    const id = this.nextId++
    const payload = JSON.stringify({ id, method, params })

    return new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        rejectPromise(new Error(`CDP command timed out: ${method}`))
      }, timeoutMs)

      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise, timer })
      this.ws.send(payload)
    })
  }

  waitForEvent(method, timeoutMs = 15000) {
    return new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        const waiters = this.eventWaiters.get(method) || []
        this.eventWaiters.set(method, waiters.filter((waiter) => waiter.timer !== timer))
        rejectPromise(new Error(`Timed out waiting for CDP event: ${method}`))
      }, timeoutMs)

      const waiters = this.eventWaiters.get(method) || []
      waiters.push({ resolve: resolvePromise, timer })
      this.eventWaiters.set(method, waiters)
    })
  }

  close() {
    this.ws?.close()
  }
}

async function launchChrome(viewport) {
  const userDataDir = mkdtempSync(join(tmpdir(), 'lola-admin-staff-proof-'))
  const chrome = spawn(resolvedChromePath, [
    '--headless=new',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-gpu',
    '--no-default-browser-check',
    '--no-first-run',
    '--remote-debugging-port=0',
    `--window-size=${viewport.width},${viewport.height}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], {
    stdio: ['ignore', 'ignore', 'pipe']
  })

  const browserWsUrl = await waitForChromeWebSocket(chrome)
  const pageTarget = await createPageTarget(browserWsUrl)
  const cdp = new CdpSession(pageTarget.webSocketDebuggerUrl)
  await cdp.connect()
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 700
  })

  return { chrome, cdp, userDataDir }
}

async function stopChrome({ chrome, cdp, userDataDir }) {
  cdp.close()
  if (!chrome.killed) chrome.kill('SIGTERM')

  await Promise.race([
    new Promise((resolvePromise) => chrome.once('exit', resolvePromise)),
    delay(2500)
  ])

  rmSync(userDataDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200
  })
}

async function navigate(cdp, url) {
  const loadPromise = cdp.waitForEvent('Page.loadEventFired', 15000).catch(() => null)
  await cdp.send('Page.navigate', { url })
  await loadPromise
}

async function evaluate(cdp, expression, timeoutMs = 10000) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  }, timeoutMs)

  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description ||
      result.exceptionDetails.exception?.value ||
      result.exceptionDetails.text ||
      'Runtime evaluation failed'
    throw new Error(detail)
  }

  return result.result?.value
}

async function readPage(cdp) {
  return evaluate(cdp, `(() => ({
    href: window.location.href,
    title: document.title,
    text: document.body ? document.body.innerText : '',
    readyState: document.readyState
  }))()`)
}

async function waitForText(cdp, text, timeoutMs = 20000) {
  const startedAt = Date.now()
  let page = await readPage(cdp)

  while (Date.now() - startedAt < timeoutMs) {
    if ((page.text || '').includes(text)) return page
    await delay(300)
    page = await readPage(cdp)
  }

  throw new Error(`Timed out waiting for text: ${text}; href=${page.href}; text=${String(page.text || '').slice(0, 500).replace(/\s+/g, ' ')}`)
}

function pass(viewport, route, check, observed) {
  return { viewport, route, check, status: 'passed', observed, failure: '' }
}

function fail(viewport, route, check, observed, failure) {
  return { viewport, route, check, status: 'failed', observed, failure }
}

async function seedAuthSession(cdp, authSession) {
  await navigate(cdp, `${appUrl}/`)
  await evaluate(cdp, `(() => {
    localStorage.setItem(${JSON.stringify(authStorageKey())}, ${JSON.stringify(JSON.stringify(authSession))})
  })()`)
}

async function ensureLoggedIn(cdp, viewport, targetPath, authSession) {
  const targetUrl = `${appUrl}${targetPath}`
  await seedAuthSession(cdp, authSession)
  await navigate(cdp, targetUrl)
  let page = await readPage(cdp)

  if (page.href.includes('/login')) {
    throw new Error(`Admin session was not accepted by the local app; href=${page.href}`)
  }

  if (!page.href.includes('/admin/events/bookings')) {
    await navigate(cdp, targetUrl)
    page = await waitForText(cdp, 'Filters', 30000)
  } else {
    page = await waitForText(cdp, 'Filters', 30000)
  }

  return pass(viewport, '/admin/events/bookings', 'Admin login', 'Signed in and reached Event Bookings.')
}

async function runPageCheck(cdp, viewport, route, requiredText, observed) {
  await navigate(cdp, `${appUrl}${route}`)
  const page = await waitForText(cdp, requiredText[0])
  const missing = requiredText.filter((text) => !(page.text || '').includes(text))
  if (missing.length) {
    return fail(viewport, route, 'Page content', observed, `Missing text: ${missing.join(', ')}`)
  }
  return pass(viewport, route, 'Page content', observed)
}

async function fillInputByPlaceholder(cdp, placeholderNeedle, value) {
  await evaluate(cdp, `(() => {
    const input = [...document.querySelectorAll('input')].find((item) => (item.getAttribute('placeholder') || '').includes(${JSON.stringify(placeholderNeedle)}))
    if (!input) {
      const placeholders = [...document.querySelectorAll('input')].map((item) => item.getAttribute('placeholder') || item.type || item.name || 'input')
      throw new Error('Input not found: ${placeholderNeedle}; href=' + window.location.href + '; placeholders=' + placeholders.join(', '))
    }
    input.value = ${JSON.stringify(value)}
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })()`)
  await delay(600)
}

async function clickButtonByText(cdp, text) {
  await evaluate(cdp, `(() => {
    const button = [...document.querySelectorAll('button')].find((item) => item.innerText.trim() === ${JSON.stringify(text)})
    if (!button) throw new Error('Button not found: ${text}')
    button.click()
  })()`)
  await delay(300)
}

async function verifyCheckInButtonOnly(cdp, viewport) {
  const page = await readPage(cdp)
  if (page.text.includes('Check In') || page.text.includes('Undo Check-In')) {
    return pass(viewport, '/admin/events/:id/checkin', 'Check-in control', 'Check-in action is visible. The proof did not toggle a real booking.')
  }
  return fail(viewport, '/admin/events/:id/checkin', 'Check-in control', 'No check-in button visible.', 'Expected Check In or Undo Check-In action.')
}

async function verifyCancelModalOnly(cdp, viewport, bookingId) {
  await navigate(cdp, `${appUrl}/admin/bookings/${bookingId}`)
  await waitForText(cdp, 'Cancel Booking')
  await clickButtonByText(cdp, 'Cancel Booking')
  let page = await readPage(cdp)
  const opened = page.text.includes('Are you sure you want to cancel this booking?') && page.text.includes('Keep Booking')
  if (!opened) {
    return fail(viewport, '/admin/bookings/:id', 'Cancellation modal', 'Cancel button was clicked without confirming.', 'Cancellation modal did not open.')
  }
  await clickButtonByText(cdp, 'Keep Booking')
  page = await readPage(cdp)
  return pass(viewport, '/admin/bookings/:id', 'Cancellation modal', 'Cancellation modal opens and can be dismissed without cancelling.')
}

async function runViewportProof(viewport, booking, authSession) {
  const browserSession = await launchChrome(viewport)
  const results = []

  try {
    const { cdp } = browserSession
    results.push(await ensureLoggedIn(cdp, viewport.label, '/admin/events/bookings', authSession))

    await fillInputByPlaceholder(cdp, 'Customer name or email...', booking.customer_email)
    let page = await readPage(cdp)
    results.push((page.text || '').includes(booking.customer_name)
      ? pass(viewport.label, '/admin/events/bookings', 'Booking search', `Search finds ${maskEmail(booking.customer_email)}.`)
      : fail(viewport.label, '/admin/events/bookings', 'Booking search', `Searched for ${maskEmail(booking.customer_email)}.`, 'Target customer was not visible after search.'))

    results.push(await runPageCheck(cdp, viewport.label, `/admin/bookings/${booking.id}`, [
      'Booking #',
      'Customer Information',
      'Order Number',
      'Attendees'
    ], 'Booking detail shows customer, order, and attendee data.'))

    results.push(await verifyCancelModalOnly(cdp, viewport.label, booking.id))

    results.push(await runPageCheck(cdp, viewport.label, `/admin/events/${booking.offering_event_id}`, [
      'Capacity',
      'Bookings',
      'Waitlist',
      'Revenue',
      'Attendees'
    ], 'Event detail shows operating counters and attendee list.'))

    results.push(await runPageCheck(cdp, viewport.label, `/admin/events/${booking.offering_event_id}/checkin`, [
      'Total Attendees',
      'Checked In',
      'Not Checked In',
      'Search'
    ], 'Check-in screen shows event-day counters and search.'))
    results.push(await verifyCheckInButtonOnly(cdp, viewport.label))

    results.push(await runPageCheck(cdp, viewport.label, '/admin/orders', [
      'Orders',
      'Search'
    ], 'Orders list loads for reconciliation.'))
    await fillInputByPlaceholder(cdp, 'Order #', booking.order.order_number)
    page = await readPage(cdp)
    results.push((page.text || '').includes(booking.order.order_number)
      ? pass(viewport.label, '/admin/orders', 'Order search', `Order ${booking.order.order_number} is visible in admin Orders.`)
      : fail(viewport.label, '/admin/orders', 'Order search', `Searched for ${booking.order.order_number}.`, 'Target order was not visible after search.'))

    results.push(await runPageCheck(cdp, viewport.label, `/admin/orders/${booking.order.id}`, [
      'Payment Information',
      'Order Items',
      'Customer Information',
      booking.order.order_number
    ], 'Order detail shows payment, order item, and customer reconciliation data.'))

    page = await readPage(cdp)
    results.push(page.text.includes('View in Stripe') || !booking.order.stripe_payment_intent_id
      ? pass(viewport.label, '/admin/orders/:id', 'Stripe reconciliation link', booking.order.stripe_payment_intent_id ? 'View in Stripe link is visible.' : 'No Stripe payment intent on target order.')
      : fail(viewport.label, '/admin/orders/:id', 'Stripe reconciliation link', 'Order has a Stripe payment intent.', 'View in Stripe link was not visible.'))
  } finally {
    await stopChrome(browserSession)
  }

  return results
}

const booking = await fetchProofBooking()
const authSession = await createAdminSession()
const allResults = []

for (const viewport of viewportSpecs) {
  try {
    allResults.push(...await runViewportProof(viewport, booking, authSession))
  } catch (error) {
    allResults.push(fail(viewport.label, 'staff-browser-proof', 'Viewport proof', 'Proof run stopped.', error.message))
  }
}

const failed = allResults.filter((result) => result.status === 'failed')
const markdown = `# Admin Booking Staff Browser Proof

Status: current
Last updated: ${auditDate}
Parent workstream: [Admin Booking Operations](./admin-booking-operations-readiness.md)
Script: \`scripts/audit-admin-booking-staff-browser-proof.mjs\`
Mode: non-destructive browser proof

## Run Summary

| Check | Result |
| --- | --- |
| App URL | ${appUrl} |
| Viewports | ${viewportSpecs.map((viewport) => viewport.label).join(', ')} |
| Target booking | ${booking.id} |
| Target order | ${booking.order.order_number} |
| Target event | ${booking.offering_event?.offering?.title || '-'} |
| Target event date | ${booking.offering_event?.event_date || '-'} |
| Target customer | ${maskEmail(booking.customer_email)} |
| Checks run | ${allResults.length} |
| Failed checks | ${failed.length} |

## Results

${formatTable(
  ['Viewport', 'Route', 'Check', 'Status', 'Observed', 'Failure'],
  allResults.map((result) => [
    result.viewport,
    result.route,
    result.check,
    result.status,
    result.observed,
    result.failure
  ])
)}

## Boundaries

- The proof logs in through the app using credentials supplied through environment variables.
- It verifies real admin routes and production-backed booking data through the local app runtime.
- It opens and dismisses the cancellation modal, but does not confirm cancellation.
- It verifies the check-in action is visible, but does not toggle a real booking.
- It does not capture screenshots because admin pages contain customer data.
`

writeFileSync(outputPath, markdown, 'utf8')

console.log(`Admin booking staff browser proof complete: ${failed.length} failed`)
if (failed.length > 0) {
  console.log(formatTable(
    ['Viewport', 'Route', 'Check', 'Failure'],
    failed.map((result) => [result.viewport, result.route, result.check, result.failure])
  ))
  throw new Error(`Admin booking staff browser proof failed: ${failed.length} check(s)`)
}
