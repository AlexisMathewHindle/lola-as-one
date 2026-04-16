<template>
  <section class="section-surface-cream section-frame py-16 sm:py-20">
    <div class="section-shell">
      <div class="mx-auto max-w-4xl rounded-[1.25rem] border border-secondary-200 bg-white px-6 py-10 text-center sm:px-10">
        <p
          v-if="config.eyebrow"
          class="section-kicker"
        >
          {{ config.eyebrow }}
        </p>
        <h2 class="section-title">
          {{ config.title || 'Stay Creative' }}
        </h2>
        <p
          v-if="config.intro"
          class="section-intro mx-auto max-w-2xl"
        >
          {{ config.intro }}
        </p>

        <form @submit.prevent="handleSubmit" class="mx-auto mt-8 max-w-md">
          <div class="flex flex-col gap-3 sm:flex-row">
            <input
              v-model="email"
              type="email"
              required
              :placeholder="config.placeholder || 'Enter your email'"
              :disabled="submitting"
              class="flex-1 rounded-full border border-dark-200 px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-secondary-300"
            >
            <button
              type="submit"
              :disabled="submitting"
              class="rounded-full bg-primary-600 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ submitting ? 'Submitting...' : (config.button_label || 'Subscribe') }}
            </button>
          </div>

          <div v-if="success" class="mt-4 text-success-700">
            <font-awesome-icon icon="check-circle" class="mr-2" />
            Thanks for subscribing!
          </div>

          <div v-if="errorMessage" class="mt-4 text-danger-700">
            <font-awesome-icon icon="exclamation-circle" class="mr-2" />
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const config = computed(() => props.section.config_json || {})
const email = ref('')
const submitting = ref(false)
const success = ref(false)
const errorMessage = ref(null)

const handleSubmit = async () => {
  try {
    submitting.value = true
    success.value = false
    errorMessage.value = null

    await new Promise(resolve => setTimeout(resolve, 1000))

    success.value = true
    email.value = ''
    setTimeout(() => {
      success.value = false
    }, 5000)
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    errorMessage.value = 'Failed to subscribe. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
