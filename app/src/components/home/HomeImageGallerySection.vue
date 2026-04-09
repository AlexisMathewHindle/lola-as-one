<template>
  <section class="bg-white py-16 sm:py-20">
    <div class="mx-auto max-w-[116rem] px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <div class="mb-10 text-center">
          <p
            v-if="config.eyebrow"
            class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-600"
          >
            {{ config.eyebrow }}
          </p>
          <h2 class="text-3xl font-display font-bold text-stone-900 sm:text-4xl">
            {{ config.title || 'Gallery' }}
          </h2>
          <p
            v-if="config.intro"
            class="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-600"
          >
            {{ config.intro }}
          </p>
        </div>
      </div>

      <div class="mx-auto max-w-[112rem]">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="(item, index) in visibleItems"
            :key="item.id || `${currentPage}-${index}`"
            class="overflow-hidden bg-stone-100"
          >
            <div class="aspect-[1.04/1] overflow-hidden" :style="fallbackBackground(item)">
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.alt || item.title || `Gallery image ${index + 1}`"
                class="h-full w-full object-cover"
              >
            </div>
          </article>
        </div>

        <div v-if="pageCount > 1" class="mt-8 flex items-center justify-center gap-5">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            @click="previous"
          >
            <font-awesome-icon icon="chevron-left" class="h-4 w-4" />
          </button>

          <div class="flex items-center gap-4">
            <button
              v-for="page in pageCount"
              :key="page"
              type="button"
              class="h-3 w-3 rounded-full transition-colors"
              :class="page - 1 === currentPage ? 'bg-[#c9a23f]' : 'bg-stone-300 hover:bg-stone-400'"
              @click="goTo(page - 1)"
            ></button>
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            @click="next"
          >
            <font-awesome-icon icon="chevron-right" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const config = computed(() => props.section.config_json || {})
const items = computed(() => Array.isArray(config.value.items) ? config.value.items : [])
const windowWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
const currentPage = ref(0)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const itemsPerPage = computed(() => {
  if (windowWidth.value >= 1280) return 4
  if (windowWidth.value >= 768) return 2
  return 1
})

const pageCount = computed(() => {
  if (items.value.length === 0) return 0
  return Math.ceil(items.value.length / itemsPerPage.value)
})

const visibleItems = computed(() => {
  const start = currentPage.value * itemsPerPage.value
  return items.value.slice(start, start + itemsPerPage.value)
})

const goTo = (pageIndex) => {
  if (pageCount.value === 0) return
  currentPage.value = pageIndex
}

const next = () => {
  if (pageCount.value <= 1) return
  currentPage.value = (currentPage.value + 1) % pageCount.value
}

const previous = () => {
  if (pageCount.value <= 1) return
  currentPage.value = (currentPage.value - 1 + pageCount.value) % pageCount.value
}

watch([itemsPerPage, pageCount], () => {
  if (currentPage.value >= pageCount.value) {
    currentPage.value = Math.max(0, pageCount.value - 1)
  }
})

const fallbackBackground = (item) => ({
  background: item.background || 'linear-gradient(135deg, #ead9bf, #d7a774)'
})

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})
</script>
