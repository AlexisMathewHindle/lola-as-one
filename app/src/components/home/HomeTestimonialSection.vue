<template>
  <section class="bg-stone-50 py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <p
          v-if="config.eyebrow"
          class="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600"
        >
          {{ config.eyebrow }}
        </p>
        <h2 class="mt-4 font-display text-3xl text-gray-900 sm:text-5xl">
          {{ config.title }}
        </h2>
        <p
          v-if="config.intro"
          class="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base"
        >
          {{ config.intro }}
        </p>
      </div>

      <div
        v-if="currentItem"
        class="mx-auto mt-12 max-w-4xl text-center"
      >
        <div class="flex justify-center gap-1 text-primary-500">
          <font-awesome-icon
            v-for="star in currentItem.stars"
            :key="star"
            icon="star"
            class="h-4 w-4"
          />
        </div>

        <blockquote class="mx-auto mt-8 max-w-3xl text-2xl italic leading-relaxed text-gray-800 sm:text-[2rem]">
          “{{ currentItem.quote }}”
        </blockquote>

        <div class="mt-10">
          <p class="text-2xl font-semibold text-gray-900">{{ currentItem.name }}</p>
          <p
            v-if="currentItem.role"
            class="mt-2 text-sm uppercase tracking-[0.24em] text-gray-500"
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
            class="flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-gray-800 transition-colors hover:border-primary-400 hover:text-primary-600"
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
              :class="index === currentIndex ? 'bg-primary-500' : 'bg-stone-300 hover:bg-stone-400'"
              :aria-label="`Go to review ${index + 1}`"
              @click="goTo(index)"
            />
          </div>

          <button
            type="button"
            class="flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-gray-800 transition-colors hover:border-primary-400 hover:text-primary-600"
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
