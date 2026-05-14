#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const appUrl = (process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const renderTimeoutMs = Number(process.env.LEGACY_ROUTE_RENDER_TIMEOUT_MS || 18000)
const evidencePath = resolve(root, 'docs/public-discovery-legacy-route-evidence.md')

if (!existsSync(chromePath)) {
  throw new Error(`Chrome executable not found: ${chromePath}`)
}

const routeChecks = [
  {
    label: 'Adult workshop listing',
    path: '/adult-art-workshops',
    expectedPath: '/adult-workshops',
    requiredText: ['Adult Art Workshops']
  },
  {
    label: 'Summer programme listing',
    path: '/summer-workshops',
    expectedPath: '/summer-holiday',
    requiredText: ['Summer Holiday']
  },
  {
    label: 'Half-term programme listing',
    path: '/holiday-workshops',
    expectedPath: '/half-term',
    requiredText: ['Half Term']
  },
  {
    label: 'Legacy behaviour policy',
    path: '/behaviour-policy',
    expectedPath: '/terms-and-conditions',
    requiredText: ['Terms and Conditions']
  },
  {
    label: 'Legacy basket',
    path: '/basket',
    expectedPath: '/cart',
    requiredText: ['Shopping Cart']
  },
  {
    label: 'Legacy registration',
    path: '/registration',
    expectedPath: '/workshops',
    requiredText: ['Workshops']
  },
  {
    label: 'Private parties',
    path: '/private-parties',
    expectedPathPrefix: '/workshops/private-party-',
    requiredText: ['Private Party', 'Book By Email']
  },
  {
    label: 'Legacy category route',
    path: '/category/story-of-art-club-4-8',
    expectedPathPrefix: '/workshops/',
    requiredText: ['Book your workshops below']
  },
  {
    label: 'Current-style event detail legacy route',
    path: '/event-details/ht_lo_tues',
    expectedPath: '/workshops/ht_lo_tues',
    requiredText: ['Book your workshops below']
  },
  {
    label: 'Current slug prefix event detail',
    path: '/event-details/su02_story_of_art_club_9_13',
    expectedPathPrefix: '/workshops/su02_story_of_art_club_9_13-',
    requiredText: ['Book your workshops below']
  },
  {
    label: 'Old homepage Story of Art route',
    path: '/event-details/aw01_story_of_art_club_4_8',
    expectedPathPrefix: '/workshops/',
    requiredText: ['Book your workshops below']
  },
  {
    label: 'Old homepage Little Ones route',
    path: '/event-details/aw01_lo_tues',
    expectedPathPrefix: '/workshops/',
    requiredText: ['Book your workshops below']
  },
  {
    label: 'Legacy booking event route',
    path: '/booking/aw01_sat',
    expectedPathPrefix: '/workshops/',
    requiredText: ['Book your workshops below']
  },
  {
    label: 'Unknown legacy event fallback',
    path: '/event-details/legacy-missing-route-proof',
    expectedPath: '/workshops',
    requiredText: ['Workshops']
  }
]

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

function pathFromHref(href) {
  try {
    return new URL(href).pathname
  } catch {
    return ''
  }
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
  const userDataDir = mkdtempSync(join(tmpdir(), 'lola-legacy-route-audit-'))
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

function classifyRoute(page, check) {
  const text = page.text || ''
  const pathname = pathFromHref(page.href)
  const failedMarkers = [
    'Error Loading Workshop',
    'Workshop not found',
    'Failed to load workshop',
    'This site can\'t be reached',
    'ERR_CONNECTION',
    'Cannot GET'
  ].filter((marker) => includesText(text, marker))

  const pathMatches = check.expectedPath
    ? pathname === check.expectedPath
    : pathname.startsWith(check.expectedPathPrefix)

  const missingText = check.requiredText.filter((marker) => !includesText(text, marker))

  return {
    passed: pathMatches && failedMarkers.length === 0 && missingText.length === 0,
    pathname,
    failedMarkers,
    missingText,
    pathMatches
  }
}

async function auditRoute(cdp, check) {
  const url = `${appUrl}${check.path}`
  const loadPromise = cdp.waitForEvent('Page.loadEventFired', 15000).catch(() => null)
  await cdp.send('Page.navigate', { url })
  await loadPromise

  const startedAt = Date.now()
  let lastPage = await readPage(cdp)
  let lastClassification = classifyRoute(lastPage, check)

  while (Date.now() - startedAt < renderTimeoutMs) {
    if (lastClassification.passed) break
    if (lastClassification.failedMarkers.length > 0) break

    await delay(350)
    lastPage = await readPage(cdp)
    lastClassification = classifyRoute(lastPage, check)
  }

  return {
    ...check,
    passed: lastClassification.passed,
    finalPath: lastClassification.pathname,
    finalUrl: lastPage.href,
    failure: [
      !lastClassification.pathMatches
        ? `Expected ${check.expectedPath || `${check.expectedPathPrefix}*`}, got ${lastClassification.pathname || '-'}`
        : null,
      ...lastClassification.failedMarkers,
      lastClassification.missingText.length > 0
        ? `Missing text: ${lastClassification.missingText.join(', ')}`
        : null
    ].filter(Boolean).join('; '),
    textSample: normalizeText(lastPage.text).slice(0, 180)
  }
}

function writeEvidence(results) {
  const failed = results.filter((result) => !result.passed)
  const markdown = `# Public Discovery Legacy Route Evidence

Status: current
Last updated: ${auditDate}
Parent workstream: [Public Discovery And Event Detail Flow](./public-discovery-event-detail-flow.md)
Audit source: headless Chrome route checks against ${appUrl}

## Run Summary

| Check | Result |
|-------|--------|
| Legacy routes checked | ${results.length} |
| Passed | ${results.filter((result) => result.passed).length} |
| Failed | ${failed.length} |

## Route Checks

${formatTable(
  ['Result', 'Legacy URL', 'Expected target', 'Actual target', 'Required marker', 'Failure'],
  results.map((result) => [
    result.passed ? 'passed' : 'failed',
    result.path,
    result.expectedPath || `${result.expectedPathPrefix}*`,
    result.finalPath,
    result.requiredText.join(', '),
    result.failure
  ])
)}

## Handling Rules

| Legacy pattern | Handling |
|---|---|
| /adult-art-workshops | Static redirect to /adult-workshops |
| /summer-workshops | Static redirect to /summer-holiday |
| /holiday-workshops | Static redirect to /half-term |
| /behaviour-policy | Static redirect to /terms-and-conditions |
| /basket | Static redirect to /cart |
| /registration | Static redirect to /workshops because old registration/cart state cannot be recovered safely |
| /private-parties | Resolves to the next published Private Party event detail page |
| /category/:categorySlug | Resolves direct programme categories or the next published event for that category |
| /event-details/:id | Resolves exact current event IDs, current slug prefixes, or known old homepage event IDs to the next relevant published event |
| /booking/:id | Uses the same event resolver as /event-details/:id, then falls back to /workshops |

## Notes

- Known old homepage IDs such as aw01_story_of_art_club_4_8 and aw01_lo_tues no longer exist as production event IDs. They are handled as course/category hints and route to the next matching published event.
- Unknown legacy event IDs fall back to /workshops instead of showing a dead page.
- Static redirects are also present in netlify.toml for the legacy routes that do not require Supabase lookup.
`

  writeFileSync(evidencePath, markdown)
}

let chromeSession

try {
  chromeSession = await launchChrome()
  const results = []

  for (const check of routeChecks) {
    results.push(await auditRoute(chromeSession.cdp, check))
  }

  writeEvidence(results)

  const failed = results.filter((result) => !result.passed)
  console.log(`Legacy workshop route audit complete: ${results.length - failed.length}/${results.length} passed`)

  if (failed.length > 0) {
    console.log(formatTable(
      ['Legacy URL', 'Expected', 'Actual', 'Failure'],
      failed.map((result) => [
        result.path,
        result.expectedPath || `${result.expectedPathPrefix}*`,
        result.finalPath,
        result.failure
      ])
    ))
    process.exitCode = 1
  }
} finally {
  if (chromeSession) {
    await stopChrome(chromeSession)
  }
}
