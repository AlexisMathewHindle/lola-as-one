<template>
  <section class="bg-primary-600 py-16 sm:py-20">
    <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
      <p
        v-if="config.eyebrow"
        class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-100"
      >
        {{ config.eyebrow }}
      </p>
      <h2 class="text-3xl font-display font-bold text-white sm:text-4xl">
        {{ config.title || 'Stay Creative' }}
      </h2>
      <p
        v-if="config.intro"
        class="mt-4 text-lg text-primary-100"
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
            class="flex-1 rounded-full px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-white"
          >
          <button
            type="submit"
            :disabled="submitting"
            class="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ submitting ? 'Submitting...' : (config.button_label || 'Subscribe') }}
          </button>
        </div>

        <div v-if="success" class="mt-4 text-white">
          <font-awesome-icon icon="check-circle" class="mr-2" />
          Thanks for subscribing!
        </div>

        <div v-if="errorMessage" class="mt-4 text-red-100">
          <font-awesome-icon icon="exclamation-circle" class="mr-2" />
          {{ errorMessage }}
        </div>
      </form>
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
