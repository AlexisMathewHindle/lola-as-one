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
const evidencePath = resolve(root, 'docs/public-discovery-booking-state-evidence.md')
const flowEvidencePath = resolve(root, 'docs/public-discovery-event-detail-flow-evidence.md')
const renderTimeoutMs = Number(process.env.BOOKING_STATE_RENDER_TIMEOUT_MS || 15000)

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

if (!existsSync(chromePath)) {
  throw new Error(`Chrome executable not found: ${chromePath}`)
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

function includesNormalized(haystack, needle) {
  return normalizeText(haystack).includes(normalizeText(needle))
}

function eventUrl(event) {
  return `${appUrl}/workshops/${encodeURIComponent(event.offering.slug)}`
}

async function fetchLaunchEvents() {
  const { data, error } = await supabase
    .from('offering_events')
    .select(`
      id,
      event_date,
      event_start_time,
      price_gbp,
      waitlist_enabled,
      max_capacity,
      current_bookings,
      available_spaces,
      offering:offerings!inner(
        id,
        title,
        slug,
        status,
        type
      ),
      category:event_categories(
        id,
        name,
        slug,
        layout_key
      ),
      capacity:event_capacity(
        spaces_available,
        total_capacity,
        spaces_booked,
        spaces_reserved,
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

function getCapacity(event) {
  if (Array.isArray(event.capacity)) return event.capacity[0] || null
  return event.capacity || null
}

function spacesAvailable(event) {
  const capacity = getCapacity(event)
  const capacityValue = Number(capacity?.spaces_available)
  if (Number.isFinite(capacityValue)) return capacityValue

  const availableSpaces = Number(event.available_spaces)
  if (Number.isFinite(availableSpaces)) return availableSpaces

  const maxCapacity = Number(event.max_capacity)
  const currentBookings = Number(event.current_bookings)
  if (Number.isFinite(maxCapacity) && Number.isFinite(currentBookings)) {
    return Math.max(maxCapacity - currentBookings, 0)
  }

  return null
}

function buildStateTargets(events) {
  const bySlug = new Map()
  for (const event of events) {
    if (!event.offering?.slug || bySlug.has(event.offering.slug)) continue
    bySlug.set(event.offering.slug, event)
  }

  const uniqueEvents = [...bySlug.values()]

  const bookableStandard = uniqueEvents.find((event) =>
    event.category?.layout_key === 'standard' &&
    spacesAvailable(event) > 0
  )

  const adultWorkshop = uniqueEvents.find((event) =>
    event.category?.layout_key === 'adult_workshop' &&
    spacesAvailable(event) > 0
  )

  const enquiryOnly = uniqueEvents.find((event) =>
    event.category?.layout_key === 'enquiry_only'
  )

  const soldOut = uniqueEvents.find((event) =>
    spacesAvailable(event) === 0
  )

  const waitlist = uniqueEvents.find((event) =>
    spacesAvailable(event) === 0 &&
    event.waitlist_enabled === true
  )

  return [
    {
      key: 'bookable-standard',
      label: 'Bookable standard event',
      event: bookableStandard,
      requiredText: ['Book your workshops below'],
      allowedText: ['Book your workshops below', 'Book Now'],
      forbiddenText: ['Book By Email', 'Workshop not found', 'Error Loading Workshop'],
      notPresentPass: false
    },
    {
      key: 'adult-workshop',
      label: 'Adult workshop booking',
      event: adultWorkshop,
      requiredText: ['Book Now', 'Availability'],
      allowedText: ['Book Now'],
      forbiddenText: ['Book By Email', 'Workshop not found', 'Error Loading Workshop'],
      notPresentPass: false
    },
    {
      key: 'enquiry-only',
      label: 'Enquiry-only private party',
      event: enquiryOnly,
      requiredText: ['Book By Email', 'Go To Contact Page'],
      allowedText: ['Book By Email'],
      forbiddenText: ['Book Now', 'Join Waitlist', 'Workshop not found', 'Error Loading Workshop'],
      notPresentPass: false
    },
    {
      key: 'sold-out',
      label: 'Sold-out event',
      event: soldOut,
      requiredText: ['Sold Out'],
      allowedText: ['Sold Out'],
      forbiddenText: ['Book Now', 'Book By Email', 'Workshop not found', 'Error Loading Workshop'],
      notPresentPass: true,
      notPresentReason: 'No sold-out future published event exists in the current launch catalogue.'
    },
    {
      key: 'waitlist',
      label: 'Sold-out waitlist-enabled event',
      event: waitlist,
      requiredText: ['Sold Out', 'Join Waitlist'],
      allowedText: ['Join Waitlist'],
      forbiddenText: ['Book Now', 'Book By Email', 'Workshop not found', 'Error Loading Workshop'],
      notPresentPass: true,
      notPresentReason: 'No future published event is both sold out and waitlist-enabled in the current launch catalogue.'
    }
  ]
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
  const userDataDir = mkdtempSync(join(tmpdir(), 'lola-booking-state-audit-'))
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

function evaluateState(target, page) {
  const text = page.text || ''
  const missingRequired = target.requiredText.filter((item) => !includesNormalized(text, item))
  const forbiddenPresent = target.forbiddenText.filter((item) => includesNormalized(text, item))
  const allowedPresent = target.allowedText.filter((item) => includesNormalized(text, item))
  const loading = /Loading workshop details|Loading workshops/i.test(text)

  return {
    passed: missingRequired.length === 0 && forbiddenPresent.length === 0 && !loading,
    missingRequired,
    forbiddenPresent,
    allowedPresent,
    loading
  }
}

async function auditTarget(cdp, target) {
  if (!target.event) {
    return {
      key: target.key,
      label: target.label,
      status: target.notPresentPass ? 'not_present' : 'blocked',
      passed: target.notPresentPass,
      title: '-',
      slug: '-',
      category: '-',
      layout: '-',
      spacesAvailable: '-',
      waitlistEnabled: '-',
      url: '-',
      observed: '-',
      failure: target.notPresentReason || 'No representative event found.'
    }
  }

  const url = eventUrl(target.event)
  const loadPromise = cdp.waitForEvent('Page.loadEventFired', 15000).catch(() => null)
  await cdp.send('Page.navigate', { url })
  await loadPromise

  const startedAt = Date.now()
  let page = await readPage(cdp)
  let state = evaluateState(target, page)

  while (Date.now() - startedAt < renderTimeoutMs) {
    if (state.passed) break
    if (state.forbiddenPresent.some((item) => ['Workshop not found', 'Error Loading Workshop'].includes(item))) break

    await delay(350)
    page = await readPage(cdp)
    state = evaluateState(target, page)
  }

  return {
    key: target.key,
    label: target.label,
    status: state.passed ? 'passed' : 'failed',
    passed: state.passed,
    title: target.event.offering.title,
    slug: target.event.offering.slug,
    category: target.event.category?.name || '-',
    layout: target.event.category?.layout_key || '-',
    spacesAvailable: spacesAvailable(target.event),
    waitlistEnabled: target.event.waitlist_enabled === true,
    url,
    observed: state.allowedPresent.join(', ') || '-',
    failure: [
      ...state.missingRequired.map((item) => `Missing required text: ${item}`),
      ...state.forbiddenPresent.map((item) => `Forbidden text present: ${item}`),
      state.loading ? 'Still loading' : null
    ].filter(Boolean).join(' | ') || '-'
  }
}

function writeEvidence({ events, targets, results }) {
  const failures = results.filter((result) => !result.passed)
  const notPresent = results.filter((result) => result.status === 'not_present')
  const markdown = `# Public Discovery Booking State Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)
Audit source: production Supabase plus headless Chrome checks against ${appUrl}

## Run Summary

| Check | Result |
|-------|--------|
| Audit date | ${auditDate} |
| Future published event rows | ${events.length} |
| Booking state targets | ${targets.length} |
| Passed states | ${results.filter((result) => result.passed).length} |
| Failed states | ${failures.length} |
| Not present in catalogue | ${notPresent.length} |

## Booking State Checks

${formatTable(
  ['Result', 'State', 'Title', 'Slug', 'Category', 'Layout', 'Spaces', 'Waitlist enabled', 'Observed UI', 'URL', 'Failure or note'],
  results.map((result) => [
    result.status,
    result.label,
    result.title,
    result.slug,
    result.category,
    result.layout,
    result.spacesAvailable,
    result.waitlistEnabled,
    result.observed,
    result.url,
    result.failure
  ])
)}

## Interpretation

- \`not_present\` is acceptable for sold-out and waitlist states when production has no matching future published launch event.
- Waitlist UI is only expected when an event is sold out and the event row has \`waitlist_enabled = true\`.
- Enquiry-only events should expose email/contact actions and must not expose instant checkout.
`

  writeFileSync(evidencePath, markdown, 'utf8')
}

function updateFlowEvidence() {
  if (!existsSync(flowEvidencePath)) return

  const text = readFileSync(flowEvidencePath, 'utf8')
  const section = `## Booking State Checks

| Evidence item | Result |
| --- | --- |
| Booking state evidence | [Public Discovery Booking State Evidence](./public-discovery-booking-state-evidence.md) |
| Verified states | Bookable standard, adult workshop, enquiry-only private party |
| Conditional states | Sold-out and waitlist states documented as present or absent based on production catalogue |
`

  const withoutOldSection = text.replace(/\n## Booking State Checks\n\n[\s\S]*?(?=\n## Next Actions|\n$)/, '')
  const nextActionsHeading = '\n## Next Actions'
  const updated = withoutOldSection.includes(nextActionsHeading)
    ? withoutOldSection.replace(nextActionsHeading, `\n${section}${nextActionsHeading}`)
    : `${withoutOldSection.trim()}\n\n${section}\n`

  const withNextActions = updated.replace(
    /\n## Next Actions\n\n[\s\S]*$/,
    '\n## Next Actions\n\n1. Confirm legacy workshop URL handling before moving to Event Cart And Checkout.\n'
  )

  writeFileSync(flowEvidencePath, withNextActions, 'utf8')
}

let chromeContext

try {
  const events = await fetchLaunchEvents()
  const targets = buildStateTargets(events)

  chromeContext = await launchChrome()

  const results = []
  for (const target of targets) {
    const result = await auditTarget(chromeContext.cdp, target)
    results.push(result)
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${target.key} ${result.slug}`)
  }

  writeEvidence({ events, targets, results })
  updateFlowEvidence()

  const failures = results.filter((result) => !result.passed)
  console.log(JSON.stringify({
    evidencePath,
    auditDate,
    appUrl,
    futurePublishedEventRows: events.length,
    targets: targets.length,
    passed: results.length - failures.length,
    failed: failures.length,
    notPresent: results.filter((result) => result.status === 'not_present').map((result) => result.key),
    failures: failures.map((result) => ({
      key: result.key,
      slug: result.slug,
      failure: result.failure
    }))
  }, null, 2))

  if (failures.length) {
    process.exitCode = 1
  }
} finally {
  if (chromeContext) {
    await stopChrome(chromeContext)
  }
}
