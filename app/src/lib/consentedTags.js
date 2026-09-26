// The single gate for every non-essential third-party tag. A tag loads only when
// BOTH are true: the admin has switched it on with an id set (public site
// settings), AND the visitor has consented to that tag's category.
//
// Nothing here runs until initConsentedTags() is called from main.js. No tag
// snippet lives in index.html; both live here, behind the gate.
//
// Part of: COOKIE-CONSENT-BANNER-EPIC.md (Ticket 8),
//          GOOGLE-ANALYTICS-EPIC.md (GA-3, GA-4),
//          META-PIXEL-EPIC.md (PX-3, PX-4).

import { watch } from 'vue'
import { getPublicSettingsMap } from './cms'
import { useConsentStore } from '../stores/consent'

// Admin config, loaded once at startup. Changes take effect on the visitor's next
// page load (documented behaviour), which keeps the gate simple.
let adminConfig = {
  ga: { enabled: false, measurementId: '' },
  pixel: { enabled: false, pixelId: '' }
}

// Which tags have been injected this session. We only gate LOADING; a script
// already injected cannot be cleanly removed, so a withdrawal takes effect on the
// next visit. Page-view sending, however, is guarded live (see trackPageView).
const loaded = { analytics: false, marketing: false }

let consentStore = null

async function loadAdminConfig() {
  try {
    const settings = await getPublicSettingsMap()
    const ga = settings.analytics_ga || {}
    const pixel = settings.marketing_meta_pixel || {}
    adminConfig = {
      ga: {
        enabled: ga.enabled === true,
        measurementId: typeof ga.measurement_id === 'string' ? ga.measurement_id.trim() : ''
      },
      pixel: {
        enabled: pixel.enabled === true,
        pixelId: typeof pixel.pixel_id === 'string' ? pixel.pixel_id.trim() : ''
      }
    }
  } catch (err) {
    // No admin config means no non-essential tags. Fail safe (off).
    console.error('Failed to load tag settings:', err)
  }
}

// --- Google Analytics (GA4) --------------------------------------------------

function loadGoogleAnalytics(measurementId) {
  if (loaded.analytics) return
  loaded.analytics = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  // We send page views manually on route change (SPA), so disable the automatic one
  // to avoid double counting.
  window.gtag('config', measurementId, { send_page_view: false })

  // Count the page the visitor is on right now (route change fires only on the next
  // navigation).
  sendGaPageView(window.location.pathname + window.location.search)
}

function sendGaPageView(path) {
  if (!loaded.analytics || typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title
  })
}

// --- Meta Pixel --------------------------------------------------------------

function loadMetaPixel(pixelId) {
  if (loaded.marketing) return
  loaded.marketing = true

  /* eslint-disable */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'
    n.queue = []; t = b.createElement(e); t.async = !0
    t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq('init', pixelId)
  // Base code would normally auto-fire PageView here; we drive all page views from
  // the route change for one consistent mechanism, so count the current page now.
  sendPixelPageView()
}

function sendPixelPageView() {
  if (!loaded.marketing || typeof window.fbq !== 'function') return
  window.fbq('track', 'PageView')
}

// --- gate --------------------------------------------------------------------

// Load any tag that is now allowed (admin on + id set + consent given). Called on
// startup and whenever consent changes.
function evaluate() {
  if (!consentStore) return

  if (
    consentStore.analytics &&
    adminConfig.ga.enabled &&
    adminConfig.ga.measurementId &&
    !loaded.analytics
  ) {
    loadGoogleAnalytics(adminConfig.ga.measurementId)
  }

  if (
    consentStore.marketing &&
    adminConfig.pixel.enabled &&
    adminConfig.pixel.pixelId &&
    !loaded.marketing
  ) {
    loadMetaPixel(adminConfig.pixel.pixelId)
  }
}

/**
 * Send a page view to every tag that is loaded AND still consented. Call from the
 * router's afterEach. Guarding on current consent means that if a visitor withdraws
 * mid-session, page views stop even though the script stays in memory.
 */
export function trackPageView(path) {
  if (!consentStore) return
  if (consentStore.analytics) sendGaPageView(path)
  if (consentStore.marketing) sendPixelPageView()
}

/**
 * Wire up the gate. Call once from main.js after Pinia is active. Loads admin
 * config, evaluates once, then re-evaluates whenever consent changes.
 */
export async function initConsentedTags() {
  consentStore = useConsentStore()
  await loadAdminConfig()
  evaluate()
  watch(
    () => [consentStore.analytics, consentStore.marketing],
    () => evaluate()
  )
}
