<template>
  <section class="section-surface-muted section-frame py-20 sm:py-24">
    <div class="section-shell">
      <div class="section-header">
        <p
          v-if="config.eyebrow"
          class="section-kicker"
        >
          {{ config.eyebrow }}
        </p>
        <h2 class="section-title mt-4 sm:text-[2.8rem]">
          {{ config.title }}
        </h2>
        <p
          v-if="config.intro"
          class="section-intro mx-auto mt-4 max-w-2xl text-sm sm:text-base"
        >
          {{ config.intro }}
        </p>
      </div>

      <div
        v-if="currentItem"
        class="section-card mx-auto mt-12 max-w-4xl rounded-[1.2rem] px-6 py-10 text-center sm:px-10"
      >
        <div class="flex justify-center gap-1 text-secondary-500">
          <font-awesome-icon
            v-for="star in currentItem.stars"
            :key="star"
            icon="star"
            class="h-4 w-4"
          />
        </div>

        <blockquote class="mx-auto mt-8 max-w-3xl text-[1.8rem] italic leading-[1.55] text-gray-800 sm:text-[2.1rem]">
          “{{ currentItem.quote }}”
        </blockquote>

        <div class="mt-10">
          <p class="text-[1.4rem] font-medium text-gray-900">{{ currentItem.name }}</p>
          <p
            v-if="currentItem.role"
            class="mt-2 text-[12px] uppercase tracking-[0.18em] text-gray-500"
          >
            {{ currentItem.role }}
          </p>
        </div>

        <div
          v-if="items.length > 1"
          class="mt-12 flex items-center justify-center gap-5"
        >
          <button
            type="button"
            class="flex h-12 w-12 items-center justify-center rounded-full border border-dark-300 bg-white text-gray-800 transition-colors hover:border-primary-400 hover:text-primary-600"
            aria-label="Previous review"
            @click="goToPrevious"
          >
            <font-awesome-icon icon="chevron-left" class="h-4 w-4" />
          </button>

          <div class="flex items-center gap-3">
            <button
              v-for="(_, index) in items"
              :key="`testimonial-dot-${index}`"
              type="button"
              class="h-2.5 w-2.5 rounded-full transition-colors"
              :class="index === currentIndex ? 'bg-secondary-500' : 'bg-dark-300 hover:bg-dark-400'"
              :aria-label="`Go to review ${index + 1}`"
              @click="goTo(index)"
            />
          </div>

          <button
            type="button"
            class="flex h-12 w-12 items-center justify-center rounded-full border border-dark-300 bg-white text-gray-800 transition-colors hover:border-primary-400 hover:text-primary-600"
            aria-label="Next review"
            @click="goToNext(true)"
          >
            <font-awesome-icon icon="chevron-right" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const currentIndex = ref(0)
let autoplayTimer = null

const config = computed(() => props.section.config_json || {})
const items = computed(() => {
  if (!Array.isArray(config.value.items)) return []

  return config.value.items
    .map((item = {}) => ({
      quote: item.quote || '',
      name: item.name || '',
      role: item.role || '',
      stars: Math.min(5, Math.max(1, Number(item.stars) || 5))
    }))
    .filter(item => item.quote || item.name)
})
const currentItem = computed(() => items.value[currentIndex.value] || null)

function stopAutoplay() {
  if (autoplayTimer) {
    window.clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function startAutoplay() {
  stopAutoplay()

  if (items.value.length <= 1) return

  const delay = Math.max(2500, Number(config.value.autoplay_ms) || 6000)
  autoplayTimer = window.setInterval(() => {
    goToNext()
  }, delay)
}

function goTo(index) {
  if (!items.value.length) {
    currentIndex.value = 0
    return
  }

  const total = items.value.length
  currentIndex.value = ((index % total) + total) % total
}

function goToPrevious() {
  goTo(currentIndex.value - 1)
  startAutoplay()
}

function goToNext(restart = false) {
  goTo(currentIndex.value + 1)
  if (restart) {
    startAutoplay()
  }
}

watch(
  () => [items.value.length, config.value.autoplay_ms],
  () => {
    if (currentIndex.value >= items.value.length) {
      currentIndex.value = 0
    }
    startAutoplay()
  },
  { immediate: true }
)

onMounted(() => {
  startAutoplay()
})

onBeforeUnmount(() => {
  stopAutoplay()
})
</script>
