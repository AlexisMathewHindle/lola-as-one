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
const outputPath = resolve(root, 'docs/public-discovery-event-detail-flow-evidence.md')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const detailLimit = Number(process.env.DETAIL_AUDIT_LIMIT || 0)
const renderTimeoutMs = Number(process.env.DETAIL_RENDER_TIMEOUT_MS || 15000)

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

function readExistingManualEvidence() {
  if (!existsSync(outputPath)) {
    return {
      statusByRoute: new Map(),
      manualSection: ''
    }
  }

  const text = readFileSync(outputPath, 'utf8')
  const statusByRoute = new Map()

  const categorySection = text.match(/## Category Page Spot-Check Targets\n\n[\s\S]*?(?=\n## Manual Browser Spot Checks|\n## Next Actions|\n$)/)?.[0] || ''

  for (const line of categorySection.split(/\r?\n/)) {
    const match = line.match(/^\| (\/[^|]+) \| [^|]+ \| ([^|]+) \|$/)
    if (match && match[2].trim() !== 'Manual status') {
      statusByRoute.set(match[1].trim(), match[2].trim())
    }
  }

  const manualSectionMatch = text.match(/## Manual Browser Spot Checks\n\n[\s\S]*?(?=\n## Next Actions|\n$)/)

  return {
    statusByRoute,
    manualSection: manualSectionMatch ? manualSectionMatch[0].trim() : ''
  }
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function includesText(haystack, needle) {
  return normalizeText(haystack).includes(normalizeText(needle))
}

function publicUrlForSlug(slug) {
  return `${appUrl}/workshops/${encodeURIComponent(slug)}`
}

async function fetchLaunchEvents() {
  const { data, error } = await supabase
    .from('offering_events')
    .select(`
      id,
      event_date,
      event_start_time,
      event_end_time,
      price_gbp,
      current_bookings,
      max_capacity,
      available_spaces,
      location_name,
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

function buildSlugTargets(events) {
  const groups = new Map()
  for (const event of events) {
    const slug = event.offering?.slug
    if (!slug) continue
    const group = groups.get(slug) || []
    group.push(event)
    groups.set(slug, group)
  }

  const targets = [...groups.entries()]
    .map(([slug, group]) => ({
      slug,
      title: group[0].offering?.title || slug,
      eventCount: group.length,
      firstDate: group[0].event_date,
      category: group[0].category?.name || '-',
      layout: group[0].category?.layout_key || '-',
      url: publicUrlForSlug(slug)
    }))
    .sort((a, b) => {
      const dateCompare = String(a.firstDate).localeCompare(String(b.firstDate))
      if (dateCompare !== 0) return dateCompare
      return a.title.localeCompare(b.title)
    })

  return detailLimit > 0 ? targets.slice(0, detailLimit) : targets
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
  const parsed = new URL(wsUrl)
  return parsed.port
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
  const userDataDir = mkdtempSync(join(tmpdir(), 'lola-event-detail-audit-'))
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

function classifyRender(page, target) {
  const text = page.text || ''
  const failedMarkers = [
    'Error Loading Workshop',
    'Workshop not found',
    'Failed to load workshop',
    'This site can\'t be reached',
    'ERR_CONNECTION',
    'Cannot GET'
  ].filter((marker) => includesText(text, marker))

  const stillLoading = includesText(text, 'Loading workshop details')
  const hasTitle = includesText(text, target.title)
  const successMarkers = [
    'Book Now',
    'Book By Email',
    'Sold Out',
    'Join Waitlist',
    'Book your workshops below',
    'Availability'
  ].filter((marker) => includesText(text, marker))

  return {
    passed: failedMarkers.length === 0 && !stillLoading && hasTitle && successMarkers.length > 0,
    hasTitle,
    successMarkers,
    failedMarkers,
    stillLoading
  }
}

async function auditDetailTarget(cdp, target) {
  const loadPromise = cdp.waitForEvent('Page.loadEventFired', 15000).catch(() => null)
  await cdp.send('Page.navigate', { url: target.url })
  await loadPromise

  const startedAt = Date.now()
  let lastPage = await readPage(cdp)
  let lastClassification = classifyRender(lastPage, target)

  while (Date.now() - startedAt < renderTimeoutMs) {
    if (lastClassification.passed) break
    if (lastClassification.failedMarkers.length > 0) break

    await delay(350)
    lastPage = await readPage(cdp)
    lastClassification = classifyRender(lastPage, target)
  }

  return {
    ...target,
    finalUrl: lastPage.href,
    passed: lastClassification.passed,
    hasTitle: lastClassification.hasTitle,
    markers: lastClassification.successMarkers.join(', '),
    failure: [
      ...lastClassification.failedMarkers,
      lastClassification.stillLoading ? 'Still loading' : null,
      !lastClassification.hasTitle ? 'Expected title not rendered' : null,
      lastClassification.successMarkers.length === 0 ? 'No booking/detail marker rendered' : null
    ].filter(Boolean).join('; '),
    textSample: normalizeText(lastPage.text).slice(0, 180)
  }
}

function writeEvidence({ events, targets, results, categoryRoutes }) {
  const failed = results.filter((result) => !result.passed)
  const duplicatedSlugTargets = targets.filter((target) => target.eventCount > 1)
  const manualEvidence = readExistingManualEvidence()
  const categoryRouteRows = categoryRoutes.map((route) => [
    route.path,
    route.expected,
    manualEvidence.statusByRoute.get(route.path) || 'Pending manual browser spot check'
  ])
  const manualChecksComplete = categoryRouteRows.every((row) => row[2].startsWith('Passed'))

  const markdown = `# Public Discovery And Event Detail Flow Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)
Audit source: production Supabase plus headless Chrome render checks against ${appUrl}

## Run Summary

| Check | Result |
|-------|--------|
| Audit date | ${auditDate} |
| Future published event rows | ${events.length} |
| Unique event detail slugs checked | ${results.length} |
| Passed detail renders | ${results.filter((result) => result.passed).length} |
| Failed detail renders | ${failed.length} |
| Duplicate slug groups | ${duplicatedSlugTargets.length} |

## Detail Render Checks

${formatTable(
  ['Result', 'Title', 'Slug', 'Date', 'Category', 'Layout', 'URL', 'Marker', 'Failure'],
  results.map((result) => [
    result.passed ? 'passed' : 'failed',
    result.title,
    result.slug,
    result.firstDate,
    result.category,
    result.layout,
    result.url,
    result.markers || '-',
    result.failure || '-'
  ])
)}

## Duplicate Slug Groups

${formatTable(
  ['Slug', 'Title', 'Future event rows'],
  duplicatedSlugTargets.map((target) => [target.slug, target.title, target.eventCount])
)}

## Category Page Spot-Check Targets

${formatTable(
  ['Route', 'Expected coverage', 'Manual status'],
  categoryRouteRows
)}

${manualEvidence.manualSection ? `${manualEvidence.manualSection}\n\n` : ''}## Next Actions

${failed.length
  ? '1. Fix failed event detail renders before checkout validation.\n2. Re-run `node scripts/audit-public-event-detail-flow.mjs`.\n3. Complete manual browser spot checks for the category routes above.'
  : [
    !manualChecksComplete ? 'Complete manual browser spot checks for the category routes above.' : null,
    'Capture mobile and desktop screenshots for key public flows.',
    'Verify booking-state examples for bookable, enquiry-only, sold-out, and waitlist-enabled events.',
    'Confirm legacy workshop URL handling before moving to Event Cart And Checkout.'
  ].filter(Boolean).map((action, index) => `${index + 1}. ${action}`).join('\n')}
`

  writeFileSync(outputPath, markdown, 'utf8')
}

const categoryRoutes = [
  { path: '/workshops', expected: 'Calendar/listing shows general launch events and links to detail pages' },
  { path: '/adult-workshops', expected: 'Adult workshop layout shows adult workshops and booking controls' },
  { path: '/half-term', expected: 'Half term holiday sessions render with series booking controls where applicable' },
  { path: '/summer-holiday', expected: 'Summer holiday route handles its current production category state cleanly' }
]

let chromeContext

try {
  const events = await fetchLaunchEvents()
  const targets = buildSlugTargets(events)

  chromeContext = await launchChrome()

  const results = []
  for (const target of targets) {
    const result = await auditDetailTarget(chromeContext.cdp, target)
    results.push(result)
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${target.slug}`)
  }

  writeEvidence({ events, targets, results, categoryRoutes })

  const failed = results.filter((result) => !result.passed)
  console.log(JSON.stringify({
    outputPath,
    auditDate,
    appUrl,
    futurePublishedEventRows: events.length,
    uniqueSlugsChecked: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    duplicateSlugGroups: targets.filter((target) => target.eventCount > 1).length,
    failedSlugs: failed.map((result) => ({
      slug: result.slug,
      failure: result.failure
    }))
  }, null, 2))

  if (failed.length) {
    process.exitCode = 1
  }
} finally {
  if (chromeContext) {
    await stopChrome(chromeContext)
  }
}
