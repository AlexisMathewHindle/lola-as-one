<script setup>
// Per-category cookie preferences. Non-essential categories start OFF every time the
// panel opens (no pre-ticked boxes). Necessary is shown, locked on. Opens from the
// banner and from the footer "Cookie settings" link.
//
// Part of: COOKIE-CONSENT-BANNER-EPIC.md (Ticket 5).
import { reactive, watch } from 'vue'
import { useConsentStore } from '../../stores/consent'

const consent = useConsentStore()

// A local working copy so nothing is saved until the visitor clicks Save. Seeded
// from the current saved choice (defaults are off before any decision).
const local = reactive({ analytics: false, marketing: false })

watch(
  () => consent.showPreferences,
  (open) => {
    if (open) {
      local.analytics = consent.analytics
      local.marketing = consent.marketing
    }
  }
)

function save() {
  consent.save({ analytics: local.analytics, marketing: local.marketing })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cookie-modal">
      <div
        v-if="consent.showPreferences"
        class="fixed inset-0 z-[60] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
        @click.self="consent.closePreferences()"
      >
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl sm:p-8" @click.stop>
            <button
              type="button"
              class="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Close"
              @click="consent.closePreferences()"
            >
              <font-awesome-icon icon="times" class="h-5 w-5" />
            </button>

            <h2 id="cookie-prefs-title" class="font-display text-2xl font-bold text-gray-900">
              Cookie preferences
            </h2>
            <p class="mt-2 text-sm text-dark-700">
              Choose which cookies you allow. Necessary cookies keep the site working
              and cannot be turned off.
              <router-link to="/cookie-policy" class="text-primary-600 underline hover:text-primary-700">
                Read our cookie policy
              </router-link>.
            </p>

            <div class="mt-6 space-y-4">
              <!-- Necessary: locked on -->
              <div class="flex items-start justify-between gap-4 rounded-lg border border-dark-200 bg-gray-50 p-4">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">Necessary</h3>
                  <p class="mt-1 text-sm text-dark-700">
                    Keep the site working: your basket, sign-in, and secure checkout.
                  </p>
                </div>
                <span class="mt-1 shrink-0 text-xs font-semibold uppercase tracking-wide text-dark-500">
                  Always on
                </span>
              </div>

              <!-- Analytics -->
              <label class="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-dark-200 p-4">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">Analytics</h3>
                  <p class="mt-1 text-sm text-dark-700">
                    Measure how people use the site so we can improve it.
                  </p>
                </div>
                <input
                  v-model="local.analytics"
                  type="checkbox"
                  class="mt-1 h-5 w-5 shrink-0 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                />
              </label>

              <!-- Marketing -->
              <label class="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-dark-200 p-4">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">Marketing</h3>
                  <p class="mt-1 text-sm text-dark-700">
                    Measure our advertising and show more relevant ads on other sites.
                  </p>
                </div>
                <input
                  v-model="local.marketing"
                  type="checkbox"
                  class="mt-1 h-5 w-5 shrink-0 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="w-full rounded-lg border border-dark-300 bg-white px-5 py-3 text-sm font-semibold text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-600 sm:flex-1"
                @click="consent.rejectAll()"
              >
                Reject all
              </button>
              <button
                type="button"
                class="w-full rounded-lg border border-dark-300 bg-white px-5 py-3 text-sm font-semibold text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-600 sm:flex-1"
                @click="consent.acceptAll()"
              >
                Accept all
              </button>
              <button
                type="button"
                class="w-full rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:flex-1"
                @click="save()"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cookie-modal-enter-active,
.cookie-modal-leave-active {
  transition: opacity 0.2s ease;
}
.cookie-modal-enter-from,
.cookie-modal-leave-to {
  opacity: 0;
}
</style>
