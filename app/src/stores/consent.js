import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  readConsent,
  writeConsent,
  recordConsent,
  defaultChoices
} from '../lib/cookieConsent'

// The single source of truth for cookie consent. The banner and preferences panel
// read and write it; lib/consentedTags.js watches it to decide when a tag may load.
//
// Necessary cookies are always on and are not represented here as a choice. Only
// non-essential categories (analytics, marketing) are tracked, and both default to
// OFF until the visitor actively decides.
//
// Part of: COOKIE-CONSENT-BANNER-EPIC.md (Ticket 2).

export const useConsentStore = defineStore('consent', () => {
  const analytics = ref(false)
  const marketing = ref(false)
  const hasDecided = ref(false)
  const showPreferences = ref(false)
  const visitorId = ref(null)

  // The banner shows only before a (current-version) decision exists.
  const showBanner = computed(() => !hasDecided.value)

  const choices = computed(() => ({
    analytics: analytics.value,
    marketing: marketing.value
  }))

  // Read any saved decision on startup. Call once from main.js.
  function initialize() {
    const saved = readConsent()
    if (saved) {
      analytics.value = saved.analytics
      marketing.value = saved.marketing
      visitorId.value = saved.visitorId
      hasDecided.value = true
    } else {
      const defaults = defaultChoices()
      analytics.value = defaults.analytics
      marketing.value = defaults.marketing
      hasDecided.value = false
    }
  }

  // Persist a decision to the cookie, record it as proof, and update state.
  function commit(next, action) {
    analytics.value = next.analytics === true
    marketing.value = next.marketing === true
    hasDecided.value = true
    showPreferences.value = false

    const stored = writeConsent({ analytics: analytics.value, marketing: marketing.value })
    visitorId.value = stored.visitorId

    // Best-effort audit record; never blocks the UI.
    recordConsent({
      analytics: analytics.value,
      marketing: marketing.value,
      action,
      visitorId: stored.visitorId
    })
  }

  function acceptAll() {
    commit({ analytics: true, marketing: true }, 'accept_all')
  }

  function rejectAll() {
    commit({ analytics: false, marketing: false }, 'reject_all')
  }

  function save(next) {
    commit(next, 'save')
  }

  function openPreferences() {
    showPreferences.value = true
  }

  function closePreferences() {
    showPreferences.value = false
  }

  return {
    analytics,
    marketing,
    hasDecided,
    showBanner,
    showPreferences,
    visitorId,
    choices,
    initialize,
    acceptAll,
    rejectAll,
    save,
    openPreferences,
    closePreferences
  }
})
