<script setup>
// First-visit cookie banner. Shows until the visitor makes a decision. Accept and
// Reject are identical in size and prominence (UK ICO requirement: refusing must be
// as easy as accepting). "Manage" opens the per-category panel.
//
// Part of: COOKIE-CONSENT-BANNER-EPIC.md (Ticket 4).
import { useConsentStore } from '../../stores/consent'
import CookiePreferences from './CookiePreferences.vue'

const consent = useConsentStore()
</script>

<template>
  <CookiePreferences />

  <Transition name="cookie-banner">
    <div
      v-if="consent.showBanner"
      class="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
    >
      <div class="mx-auto max-w-3xl rounded-xl border border-dark-200 bg-white p-5 shadow-2xl sm:p-6">
        <h2 id="cookie-banner-title" class="font-display text-lg font-bold text-gray-900">
          Cookies on this site
        </h2>
        <p id="cookie-banner-text" class="mt-2 text-sm text-dark-700">
          We use cookies to run this site and, if you agree, to measure how it is used
          and how our advertising performs. Necessary cookies keep the site working and
          are always on. You can accept them, reject them, or choose which ones.
          <router-link to="/cookie-policy" class="text-primary-600 underline hover:text-primary-700">
            Read our cookie policy
          </router-link>.
        </p>

        <div class="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            class="w-full rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:flex-1"
            @click="consent.acceptAll()"
          >
            Accept all
          </button>
          <button
            type="button"
            class="w-full rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:flex-1"
            @click="consent.rejectAll()"
          >
            Reject all
          </button>
          <button
            type="button"
            class="w-full rounded-lg border border-dark-300 bg-white px-5 py-3 text-sm font-semibold text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-600 sm:flex-1"
            @click="consent.openPreferences()"
          >
            Manage preferences
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.cookie-banner-enter-from,
.cookie-banner-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
