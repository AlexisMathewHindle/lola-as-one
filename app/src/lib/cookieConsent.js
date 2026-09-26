// Cookie-consent primitives: the stored choice, the anonymous visitor id, and the
// consent-record writer. The reactive layer lives in stores/consent.js; the tag
// gate that reads a decision lives in lib/consentedTags.js.
//
// Part of: COOKIE-CONSENT-BANNER-EPIC.md (Tickets 2 and 3).

import { supabase } from './supabase'

// Bumping this re-prompts every visitor and ties old records to the version they
// saw. Change it whenever the set of cookies the site uses materially changes.
export const CONSENT_POLICY_VERSION = '2026-09-26'

// Non-essential categories the banner controls. Necessary cookies are always on
// and are never offered as a choice.
export const CONSENT_CATEGORIES = ['analytics', 'marketing']

const CONSENT_COOKIE = 'lola_cookie_consent'
const CONSENT_COOKIE_MAX_AGE_DAYS = 182 // ~6 months, then re-ask

function defaultChoices() {
  return { analytics: false, marketing: false }
}

// --- low-level cookie access (guarded: cookies may be blocked) ---------------

function writeCookie(name, value, maxAgeDays) {
  try {
    const maxAge = Math.round(maxAgeDays * 24 * 60 * 60)
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
  } catch {
    // Cookies disabled; the banner will simply show again next time.
  }
}

function readCookie(name) {
  try {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null
  } catch {
    return null
  }
}

// --- anonymous visitor id ----------------------------------------------------
// A random id used only to group one visitor's own decisions over time. Not a
// personal identifier. Persisted inside the consent cookie payload.

function newVisitorId() {
  try {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  } catch {
    // fall through
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// --- stored decision ---------------------------------------------------------

/**
 * The visitor's saved decision, or null if none / invalid / made against an old
 * policy version (which forces a re-prompt).
 * Shape: { analytics, marketing, visitorId, version, timestamp }
 */
export function readConsent() {
  const raw = readCookie(CONSENT_COOKIE)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (parsed?.version !== CONSENT_POLICY_VERSION) return null
    return {
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      visitorId: typeof parsed.visitorId === 'string' ? parsed.visitorId : newVisitorId(),
      version: parsed.version,
      timestamp: parsed.timestamp || null
    }
  } catch {
    return null
  }
}

/**
 * Persist a decision to the cookie. Keeps the existing visitor id if there is one,
 * so repeat decisions stay linked. Returns the stored object.
 */
export function writeConsent(choices) {
  const existing = readConsent()
  const record = {
    analytics: choices.analytics === true,
    marketing: choices.marketing === true,
    visitorId: existing?.visitorId || newVisitorId(),
    version: CONSENT_POLICY_VERSION,
    timestamp: new Date().toISOString()
  }
  writeCookie(CONSENT_COOKIE, JSON.stringify(record), CONSENT_COOKIE_MAX_AGE_DAYS)
  return record
}

export { defaultChoices }

// --- consent record (proof) --------------------------------------------------

/**
 * Append one row to public.cookie_consents. Best-effort: a failure here must never
 * block the visitor or the UI. Records the categories chosen, how (action), the
 * policy version, the anonymous visitor id, and a coarse user-agent string.
 */
export async function recordConsent({ analytics, marketing, action, visitorId }) {
  try {
    await supabase.from('cookie_consents').insert({
      visitor_id: visitorId,
      analytics: analytics === true,
      marketing: marketing === true,
      action, // 'accept_all' | 'reject_all' | 'save'
      policy_version: CONSENT_POLICY_VERSION,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    })
  } catch (err) {
    // Never surface to the visitor; log for admins only.
    console.error('Failed to record cookie consent:', err)
  }
}
