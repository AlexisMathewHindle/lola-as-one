#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const appUrl = (process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const renderTimeoutMs = Number(process.env.CHECKOUT_AUDIT_RENDER_TIMEOUT_MS || 18000)
const evidencePath = resolve(root, 'docs/event-cart-checkout-readiness-evidence.md')

if (!existsSync(chromePath)) {
  throw new Error(`Chrome executable not found: ${chromePath}`)
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

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function includesText(haystack, needle) {
  return normalizeText(haystack).includes(normalizeText(needle))
}

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
  if (!capacity) return false

  return Number(capacity.spaces_booked || 0) === Number(event.current_bookings || 0)
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
        spaces_available,
        waitlist_enabled,
        waitlist_count
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

function chooseTargets(events) {
  const uniqueBySlug = new Map()

  for (const event of events) {
    const slug = event.offering?.slug
    if (!slug || uniqueBySlug.has(slug)) continue
    uniqueBySlug.set(slug, event)
  }

  const uniqueEvents = [...uniqueBySlug.values()]

  const standard = uniqueEvents.find((event) =>
    event.category?.layout_key === 'standard' &&
    event.category?.slug !== 'half-term' &&
    spacesAvailable(event) >= 2 &&
    capacityConsistent(event)
  )

  const adult = uniqueEvents.find((event) =>
    event.category?.layout_key === 'adult_workshop' &&
    spacesAvailable(event) >= 1 &&
    capacityConsistent(event)
  )

  const halfTerm = uniqueEvents.find((event) =>
    event.category?.slug === 'half-term' &&
    spacesAvailable(event) >= 1 &&
    capacityConsistent(event)
  )

  if (!standard || !adult || !halfTerm) {
    throw new Error('Unable to find standard, adult, and half-term launch events with available capacity')
  }

  return { standard, adult, halfTerm }
}

function waitForChromeWebSocket(process) {
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

  if (!response.ok) {
    response = await fetch(endpoint)
  }

  if (!response.ok) {
    throw new Error(`Failed to create Chrome target: ${response.status} ${response.statusText}`)
  }

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

        if (message.error) {
          reject(new Error(`${message.error.message}: ${message.error.data || ''}`.trim()))
        } else {
          resolvePending(message.result || {})
        }
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

async function launchChrome() {
  const userDataDir = mkdtempSync(join(tmpdir(), 'lola-checkout-audit-'))
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-gpu',
    '--no-default-browser-check',
    '--no-first-run',
    '--remote-debugging-port=0',
    '--window-size=1440,1200',
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

  return { chrome, cdp, userDataDir }
}

async function stopChrome({ chrome, cdp, userDataDir }) {
  cdp.close()

  if (!chrome.killed) {
    chrome.kill('SIGTERM')
  }

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

async function readPage(cdp) {
  const result = await cdp.send('Runtime.evaluate', {
    expression: `(() => ({
      href: window.location.href,
      title: document.title,
      text: document.body ? document.body.innerText : '',
      readyState: document.readyState
    }))()`,
    returnByValue: true
  })

  return result.result?.value || { href: '', title: '', text: '', readyState: '' }
}

async function evaluate(cdp, expression, timeoutMs = 10000) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  }, timeoutMs)

  if (result.exceptionDetails) {
    const exception = result.exceptionDetails.exception?.description ||
      result.exceptionDetails.exception?.value ||
      result.exceptionDetails.text ||
      'Runtime evaluation failed'
    throw new Error(exception)
  }

  return result.result?.value
}

async function navigate(cdp, pathOrUrl, requiredText = []) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${appUrl}${pathOrUrl}`
  const loadPromise = cdp.waitForEvent('Page.loadEventFired', 15000).catch(() => null)
  await cdp.send('Page.navigate', { url })
  await loadPromise

  const markers = Array.isArray(requiredText) ? requiredText : [requiredText]
  const startedAt = Date.now()
  let page = await readPage(cdp)

  while (Date.now() - startedAt < renderTimeoutMs) {
    const hasMarkers = markers.every((marker) => !marker || includesText(page.text, marker))
    const stillLoading = includesText(page.text, 'loading')

    if (hasMarkers && !stillLoading) break
    await delay(350)
    page = await readPage(cdp)
  }

  return page
}

async function clearCart(cdp) {
  await evaluate(cdp, `(() => {
    try {
      localStorage.removeItem('cart')
      return true
    } catch {
      return false
    }
  })()`)
}

async function readCart(cdp) {
  return evaluate(cdp, `(() => {
    try {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : { items: [], sessionId: null }
    } catch (error) {
      return { items: [], sessionId: null, error: error.message }
    }
  })()`)
}

async function waitForCart(cdp, predicateExpression) {
  const startedAt = Date.now()
  let cart = await readCart(cdp)

  while (Date.now() - startedAt < renderTimeoutMs) {
    const passed = await evaluate(cdp, `((cart) => {
      ${predicateExpression}
    })(${JSON.stringify(cart)})`)

    if (passed) return cart

    await delay(300)
    cart = await readCart(cdp)
  }

  return cart
}

async function auditStandardDetailAdd(cdp, event) {
  await clearCart(cdp)
  await navigate(cdp, `/workshops/${encodeURIComponent(event.offering.slug)}`, [event.offering.title])

  const hasBookingForm = await evaluate(cdp, `(() => {
    return Boolean([...document.querySelectorAll('button[type="submit"]')]
      .find((candidate) => candidate.innerText.includes('Book Now')))
  })()`)

  if (hasBookingForm) {
    const formResult = await evaluate(cdp, `new Promise((resolve) => {
    const setValue = (element, value) => {
      if (!element) return false
      element.value = value
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }

    const select = document.querySelector('form select')
    setValue(select, '2')

    setTimeout(() => {
      const firstNames = [...document.querySelectorAll('input[placeholder="First name"]')]
      const lastNames = [...document.querySelectorAll('input[placeholder="Last name"]')]
      firstNames.forEach((input, index) => setValue(input, index === 0 ? 'Ada' : 'Grace'))
      lastNames.forEach((input, index) => setValue(input, index === 0 ? 'Lovelace' : 'Hopper'))
      setValue(document.querySelector('input[placeholder="your@email.com"]'), 'checkout-audit@example.com')
      setValue(document.querySelector('input[placeholder="07XXX XXXXXX"]'), '07123456789')

      const button = [...document.querySelectorAll('button[type="submit"]')]
        .find((candidate) => candidate.innerText.includes('Book Now'))
      button?.click()

      resolve({
        firstNameFields: firstNames.length,
        lastNameFields: lastNames.length,
        clicked: Boolean(button)
      })
    }, 200)
  })`, 12000)

    await navigate(cdp, '/cart', ['Shopping Cart'])
    const cart = await waitForCart(cdp, `return Array.isArray(cart.items) && cart.items.length === 1 && cart.items[0].quantity === 2`)
    const item = cart.items?.[0]

    return {
      key: 'standard-detail-add',
      label: 'Standard detail add-to-cart',
      passed: Boolean(
        formResult.clicked &&
        formResult.firstNameFields >= 2 &&
        item?.type === 'event' &&
        item?.event_id === event.id &&
        item?.offering_id === event.offering.id &&
        item?.quantity === 2 &&
        Array.isArray(item?.attendees) &&
        item.attendees.length === 2
      ),
      target: event.offering.slug,
      detail: item ? `${item.title} x ${item.quantity}; attendee form` : 'No cart item',
      failure: item ? '' : 'Cart item was not created'
    }
  }

  const clickResult = await clickFirstPlusButton(cdp)
  const cart = await waitForCart(cdp, `return Array.isArray(cart.items) && cart.items.length === 1 && cart.items[0].type === 'event'`)
  const item = cart.items?.[0]

  return {
    key: 'standard-detail-add',
    label: 'Standard detail add-to-cart',
    passed: Boolean(
      clickResult.clicked &&
      item?.type === 'event' &&
      item?.event_id === event.id &&
      item?.offering_id === event.offering.id &&
      item?.quantity === 1
    ),
    target: event.offering.slug,
    detail: item ? `${item.title} x ${item.quantity}; series plus control` : 'No cart item',
    failure: item ? '' : clickResult.clicked ? 'Cart item was not created' : 'No enabled plus button found'
  }
}

async function clickFirstPlusButton(cdp) {
  return evaluate(cdp, `(() => {
    const plusButtons = [...document.querySelectorAll('button:not(:disabled)')]
      .filter((button) => button.querySelector('svg[data-icon="plus"]') || button.innerHTML.includes('fa-plus'))

    const button = plusButtons[0]
    if (!button) {
      return { clicked: false, plusButtons: plusButtons.length }
    }

    button.click()
    return { clicked: true, plusButtons: plusButtons.length }
  })()`)
}

async function auditListingAdd(cdp, route, expectedTitle, expectedEvent, key, label) {
  await clearCart(cdp)
  await navigate(cdp, route, [expectedTitle])
  const clickResult = await clickFirstPlusButton(cdp)
  const cart = await waitForCart(cdp, `return Array.isArray(cart.items) && cart.items.length >= 1 && cart.items[0].type === 'event'`)
  const item = cart.items?.[0]

  return {
    key,
    label,
    passed: Boolean(
      clickResult.clicked &&
      item?.type === 'event' &&
      item?.quantity === 1 &&
      item?.event_id
    ),
    target: route,
    detail: item ? `${item.title} x ${item.quantity}` : 'No cart item',
    failure: clickResult.clicked ? '' : 'No enabled plus button found'
  }
}

function buildSeedCartItem(event, quantity = 2) {
  return {
    id: event.id,
    productId: event.id,
    variantId: null,
    title: event.offering.title,
    name: event.offering.title,
    price: Number(event.price_gbp),
    quantity,
    image: event.offering.featured_image_url || event.category?.featured_image_url || null,
    type: 'event',
    slug: event.offering.slug,
    offering_id: event.offering.id,
    event_id: event.id,
    eventDate: event.event_date,
    eventTime: event.event_start_time,
    subscriptionConfig: null,
    attendees: Array.from({ length: quantity }, (_, index) => ({
      firstName: index === 0 ? 'Ada' : 'Grace',
      lastName: index === 0 ? 'Lovelace' : 'Hopper',
      email: '',
      phone: '',
      notes: ''
    }))
  }
}

async function auditCheckoutPayload(cdp, event) {
  const seedCart = {
    items: [buildSeedCartItem(event, 2)],
    sessionId: null
  }

  await evaluate(cdp, `(() => {
    localStorage.setItem('cart', ${JSON.stringify(JSON.stringify(seedCart))})
    return true
  })()`)

  await navigate(cdp, '/checkout', ['Checkout', 'Workshop Attendees'])

  await evaluate(cdp, `(() => {
    const originalFetch = window.fetch.bind(window)
    window.__checkoutAudit = { requests: [] }
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url || ''
      if (url.includes('/functions/v1/create-checkout-session')) {
        let body = init?.body || null
        try {
          body = typeof body === 'string' ? JSON.parse(body) : body
        } catch {}

        window.__checkoutAudit.requests.push({
          url,
          method: init?.method || 'POST',
          body
        })

        return new Response(JSON.stringify({
          sessionId: 'cs_checkout_audit',
          url: window.location.origin + '/checkout#stripe-session-audit'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return originalFetch(input, init)
    }
    return true
  })()`)

  await evaluate(cdp, `new Promise((resolve) => {
    const setValue = (selector, value) => {
      const element = document.querySelector(selector)
      if (!element) return false
      element.value = value
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    }

    setValue('#firstName', 'Checkout')
    setValue('#lastName', 'Audit')
    setValue('#email', 'checkout-audit@example.com')
    setValue('#phone', '07123456789')

    const attendeeFirstNames = [...document.querySelectorAll('input[id^="attendee-"][id$="-firstName"]')]
    const attendeeLastNames = [...document.querySelectorAll('input[id^="attendee-"][id$="-lastName"]')]
    attendeeFirstNames.forEach((input, index) => {
      input.value = index === 0 ? 'Ada' : 'Grace'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    attendeeLastNames.forEach((input, index) => {
      input.value = index === 0 ? 'Lovelace' : 'Hopper'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    setTimeout(() => {
      const button = [...document.querySelectorAll('button[type="submit"]')]
        .find((candidate) => candidate.innerText.includes('Proceed to Payment'))
      button?.click()
      resolve({
        attendeeFirstNameFields: attendeeFirstNames.length,
        attendeeLastNameFields: attendeeLastNames.length,
        clicked: Boolean(button)
      })
    }, 200)
  })`, 12000)

  const startedAt = Date.now()
  let audit = await evaluate(cdp, `window.__checkoutAudit || { requests: [] }`)

  while (Date.now() - startedAt < renderTimeoutMs) {
    if (audit.requests?.length > 0) break
    await delay(300)
    audit = await evaluate(cdp, `window.__checkoutAudit || { requests: [] }`)
  }

  const request = audit.requests?.[0]
  const body = request?.body || {}
  const payloadItem = body.items?.[0]

  return {
    key: 'checkout-payload',
    label: 'Checkout session payload',
    passed: Boolean(
      request &&
      body.customer?.email === 'checkout-audit@example.com' &&
      Array.isArray(body.items) &&
      body.items.length === 1 &&
      payloadItem?.type === 'event' &&
      payloadItem?.event_id === event.id &&
      payloadItem?.offering_id === event.offering.id &&
      payloadItem?.quantity === 2 &&
      Array.isArray(payloadItem?.attendees) &&
      payloadItem.attendees.length === 2 &&
      body.shipping === null
    ),
    target: '/checkout',
    detail: request ? `${payloadItem?.title || 'Unknown'} x ${payloadItem?.quantity || 0}; attendees=${payloadItem?.attendees?.length || 0}` : 'No checkout request captured',
    failure: request ? '' : 'Checkout function request was not captured'
  }
}

async function auditOrderSuccessRoute(cdp) {
  const page = await navigate(cdp, '/order/success?session_id=cs_checkout_audit_missing', [])
  const acceptedMarkers = ['Order Not Found', 'Finalising Your Order', 'Your booking is confirmed']
  const marker = acceptedMarkers.find((candidate) => includesText(page.text, candidate))

  return {
    key: 'order-success-route',
    label: 'Order success route',
    passed: Boolean(marker),
    target: '/order/success?session_id=cs_checkout_audit_missing',
    detail: marker || 'No accepted marker',
    failure: marker ? '' : 'Order success route did not render an accepted state'
  }
}

async function runBrowserAudits(targets) {
  const chromeSession = await launchChrome()

  try {
    const results = []
    results.push(await auditStandardDetailAdd(chromeSession.cdp, targets.standard))
    results.push(await auditListingAdd(
      chromeSession.cdp,
      '/adult-workshops',
      'Adult Art Workshops',
      targets.adult,
      'adult-listing-add',
      'Adult listing add-to-cart'
    ))
    results.push(await auditListingAdd(
      chromeSession.cdp,
      '/half-term',
      'Half Term',
      targets.halfTerm,
      'half-term-add',
      'Half-term add-to-cart'
    ))
    results.push(await auditCheckoutPayload(chromeSession.cdp, targets.standard))
    results.push(await auditOrderSuccessRoute(chromeSession.cdp))

    return results
  } finally {
    await stopChrome(chromeSession)
  }
}

function staticChecks() {
  const checkoutSource = readFileSync(resolve(root, 'supabase/functions/create-checkout-session/index.ts'), 'utf8')
  const webhookSource = readFileSync(resolve(root, 'supabase/functions/stripe-webhook/index.ts'), 'utf8')
  const getOrderSource = readFileSync(resolve(root, 'supabase/functions/get-order-by-session/index.ts'), 'utf8')
  const orderSuccessSource = readFileSync(resolve(root, 'app/src/views/OrderSuccess.vue'), 'utf8')
  const cartSource = readFileSync(resolve(root, 'app/src/stores/cart.js'), 'utf8')

  const capacityIndex = checkoutSource.indexOf('Validate inventory and capacity')
  const stripeCreateIndex = checkoutSource.indexOf('stripe.checkout.sessions.create')

  const checks = [
    {
      key: 'capacity-before-stripe',
      label: 'Capacity validation before Stripe session',
      passed: capacityIndex !== -1 && stripeCreateIndex !== -1 && capacityIndex < stripeCreateIndex,
      detail: 'create-checkout-session validates inventory/capacity before stripe.checkout.sessions.create'
    },
    {
      key: 'over-capacity-block',
      label: 'Over-capacity checkout block',
      passed: checkoutSource.includes('availableSpaces < item.quantity') &&
        checkoutSource.includes('only has') &&
        checkoutSource.includes('Please reduce the quantity'),
      detail: 'create-checkout-session rejects carts whose event quantity exceeds spaces_available'
    },
    {
      key: 'checkout-event-metadata',
      label: 'Checkout event metadata',
      passed: checkoutSource.includes('line_item_count') &&
        checkoutSource.includes('line_item_') &&
        checkoutSource.includes('item_${index}_attendees') &&
        checkoutSource.includes('event_id'),
      detail: 'checkout metadata carries line items and attendee arrays for webhook reconstruction'
    },
    {
      key: 'webhook-idempotency',
      label: 'Webhook idempotency',
      passed: webhookSource.includes("from('stripe_events')") &&
        webhookSource.includes("eq('stripe_checkout_session_id', session.id)") &&
        webhookSource.includes('Order already exists for checkout session'),
      detail: 'webhook tracks Stripe events and skips existing checkout sessions'
    },
    {
      key: 'webhook-order-booking-persistence',
      label: 'Webhook order and booking persistence',
      passed: webhookSource.includes("from('orders')") &&
        webhookSource.includes("from('order_items')") &&
        webhookSource.includes("from('bookings')") &&
        webhookSource.includes("from('booking_attendees')"),
      detail: 'webhook contains order, order item, booking, and attendee insert paths'
    },
    {
      key: 'webhook-capacity-decrement',
      label: 'Webhook capacity decrement',
      passed: webhookSource.includes("rpc('decrement_event_capacity'") &&
        webhookSource.includes('p_offering_event_id') &&
        webhookSource.includes('p_attendees'),
      detail: 'webhook calls decrement_event_capacity with event ID and attendee quantity'
    },
    {
      key: 'order-success-booking-display',
      label: 'Order success booking display',
      passed: orderSuccessSource.includes('Workshop Details') &&
        orderSuccessSource.includes('attendees') &&
        orderSuccessSource.includes('session_id') &&
        getOrderSource.includes('booking_attendees') &&
        getOrderSource.includes('bookings:'),
      detail: 'order success page reads session_id while get-order-by-session returns workshop and attendee details'
    },
    {
      key: 'cart-event-attendee-storage',
      label: 'Cart event attendee storage',
      passed: cartSource.includes('event_id') &&
        cartSource.includes('attendees') &&
        cartSource.includes('updateItemAttendees'),
      detail: 'cart store persists event IDs and attendee lists'
    }
  ]

  return checks
}

async function tableChecks() {
  const checks = [
    {
      table: 'orders',
      columns: 'id,stripe_checkout_session_id,customer_email,status'
    },
    {
      table: 'order_items',
      columns: 'id,order_id,offering_id,item_type,quantity,event_date,event_start_time'
    },
    {
      table: 'bookings',
      columns: 'id,order_id,order_item_id,offering_event_id,number_of_attendees,status'
    },
    {
      table: 'booking_attendees',
      columns: 'id,booking_id,first_name,last_name'
    },
    {
      table: 'event_capacity',
      columns: 'id,offering_event_id,total_capacity,spaces_booked,spaces_available'
    },
    {
      table: 'stripe_events',
      columns: 'id,type,processed_at'
    }
  ]

  const results = []

  for (const check of checks) {
    const { error } = await supabase
      .from(check.table)
      .select(check.columns)
      .limit(1)

    results.push({
      key: `table-${check.table}`,
      label: check.table,
      passed: !error,
      detail: check.columns,
      failure: error?.message || ''
    })
  }

  return results
}

function targetRows(targets) {
  return [
    ['Standard detail', targets.standard.offering.title, targets.standard.offering.slug, targets.standard.event_date, spacesAvailable(targets.standard), capacityConsistent(targets.standard) ? 'yes' : 'no'],
    ['Adult listing', targets.adult.offering.title, targets.adult.offering.slug, targets.adult.event_date, spacesAvailable(targets.adult), capacityConsistent(targets.adult) ? 'yes' : 'no'],
    ['Half-term listing', targets.halfTerm.offering.title, targets.halfTerm.offering.slug, targets.halfTerm.event_date, spacesAvailable(targets.halfTerm), capacityConsistent(targets.halfTerm) ? 'yes' : 'no']
  ]
}

function writeEvidence({ events, targets, browserResults, staticResults, schemaResults }) {
  const allResults = [...browserResults, ...staticResults, ...schemaResults]
  const failed = allResults.filter((result) => !result.passed)

  const markdown = `# Event Cart And Checkout Readiness Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Event Cart And Checkout Readiness](./event-cart-checkout-readiness.md)
Audit source: production Supabase, headless Chrome against ${appUrl}, and source code checks

## Run Summary

| Check | Result |
|-------|--------|
| Future published event rows considered | ${events.length} |
| Browser checks | ${browserResults.length} |
| Browser checks passed | ${browserResults.filter((result) => result.passed).length} |
| Static backend checks | ${staticResults.length} |
| Static backend checks passed | ${staticResults.filter((result) => result.passed).length} |
| Production table checks | ${schemaResults.length} |
| Production table checks passed | ${schemaResults.filter((result) => result.passed).length} |
| Failed checks | ${failed.length} |

## Event Targets

${formatTable(
  ['Surface', 'Title', 'Slug', 'Date', 'Spaces available', 'Capacity consistent'],
  targetRows(targets)
)}

## Browser Cart And Checkout Checks

${formatTable(
  ['Result', 'Check', 'Target', 'Detail', 'Failure'],
  browserResults.map((result) => [
    result.passed ? 'passed' : 'failed',
    result.label,
    result.target,
    result.detail,
    result.failure
  ])
)}

## Static Capacity And Webhook Checks

${formatTable(
  ['Result', 'Check', 'Detail'],
  staticResults.map((result) => [
    result.passed ? 'passed' : 'failed',
    result.label,
    result.detail
  ])
)}

## Production Table Checks

${formatTable(
  ['Result', 'Table', 'Columns checked', 'Failure'],
  schemaResults.map((result) => [
    result.passed ? 'passed' : 'failed',
    result.label,
    result.detail,
    result.failure
  ])
)}

## Notes

- The checkout payload browser check intercepts the Supabase Function request and returns a fake Stripe URL, so it does not create a real Stripe Checkout session.
- This audit proves frontend cart behavior, checkout payload construction, source-level capacity blocking before Stripe, webhook persistence paths, and production table reachability.
- A live Stripe test payment is still required before this workstream can be marked fully green.
`

  writeFileSync(evidencePath, markdown)
}

const events = await fetchLaunchEvents()
const targets = chooseTargets(events)
const browserResults = await runBrowserAudits(targets)
const staticResults = staticChecks()
const schemaResults = await tableChecks()

writeEvidence({ events, targets, browserResults, staticResults, schemaResults })

const allResults = [...browserResults, ...staticResults, ...schemaResults]
const failed = allResults.filter((result) => !result.passed)

console.log(`Event cart and checkout audit complete: ${allResults.length - failed.length}/${allResults.length} passed`)

if (failed.length > 0) {
  console.log(formatTable(
    ['Check', 'Detail', 'Failure'],
    failed.map((result) => [
      result.label,
      result.detail,
      result.failure || 'Check failed'
    ])
  ))
}

process.exit(failed.length > 0 ? 1 : 0)
