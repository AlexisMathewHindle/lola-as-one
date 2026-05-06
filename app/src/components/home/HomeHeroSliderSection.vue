<template>
  <section class="relative overflow-hidden bg-dark-800 text-white">
    <div class="relative min-h-[24rem] sm:min-h-[28rem] lg:min-h-[32rem]">
      <div
        class="absolute inset-0 transition-all duration-700"
        :style="activeBackgroundStyle"
      ></div>
      <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(51,47,44,0.1),rgba(51,47,44,0.34))]"></div>

      <button
        type="button"
        class="absolute left-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:left-6"
        @click="previous"
      >
        <font-awesome-icon icon="chevron-left" class="h-4 w-4" />
      </button>

      <button
        type="button"
        class="absolute right-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:right-6"
        @click="next"
      >
        <font-awesome-icon icon="chevron-right" class="h-4 w-4" />
      </button>

      <div class="relative z-[1] mx-auto flex min-h-[24rem] max-w-7xl items-center justify-center px-6 py-16 text-center sm:min-h-[28rem] sm:px-10 lg:min-h-[32rem]">
        <div class="max-w-4xl">
          <p
            v-if="activeSlide.eyebrow"
            class="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90"
          >
            {{ activeSlide.eyebrow }}
          </p>

          <h1 class="font-display text-[3rem] leading-[0.96] !text-white sm:text-[4.25rem] lg:text-[4.9rem]">
            {{ activeSlide.headline }}
          </h1>

          <p
            v-if="activeSlide.subheading"
            class="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/90 sm:text-lg"
          >
            {{ activeSlide.subheading }}
          </p>
        </div>
      </div>

      <div class="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id || index"
          type="button"
          class="h-2.5 rounded-full transition-all"
          :class="index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/80'"
          @click="goTo(index)"
        ></button>
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

const activeIndex = ref(0)
let intervalId = null

const gradientThemes = [
  'linear-gradient(135deg, rgba(91,51,46,0.92), rgba(178,103,88,0.76))',
  'linear-gradient(135deg, rgba(63,79,67,0.9), rgba(216,176,97,0.72))',
  'linear-gradient(135deg, rgba(76,68,62,0.92), rgba(197,139,118,0.72))',
  'linear-gradient(135deg, rgba(104,83,52,0.92), rgba(178,103,88,0.68))'
]

const slides = computed(() => {
  const config = props.section.config_json || {}

  if (Array.isArray(config.slides) && config.slides.length > 0) {
    return config.slides.map((slide, index) => ({
      id: slide.id || `${props.section.id}-${index}`,
      eyebrow: slide.eyebrow || config.eyebrow || null,
      headline: slide.headline || config.headline || 'Lola As One',
      subheading: slide.subheading || config.subheading || null,
      image_url: slide.image_url || null,
      primary_cta: slide.primary_cta || config.primary_cta || null,
      secondary_cta: slide.secondary_cta || config.secondary_cta || null,
      background: slide.background || gradientThemes[index % gradientThemes.length],
      preview_background: slide.preview_background || gradientThemes[(index + 1) % gradientThemes.length]
    }))
  }

  return [
    {
      id: `${props.section.id}-legacy`,
      eyebrow: config.eyebrow || null,
      headline: config.headline || 'Welcome to Lola As One',
      subheading: config.subheading || null,
      image_url: config.image_url || null,
      primary_cta: config.primary_cta || null,
      secondary_cta: config.secondary_cta || null,
      background: gradientThemes[0],
      preview_background: gradientThemes[1]
    }
  ]
})

const activeSlide = computed(() => slides.value[activeIndex.value] || slides.value[0] || {})

const activeBackgroundStyle = computed(() => {
  const slide = activeSlide.value
  if (slide.image_url) {
    return {
      backgroundImage: `url('${slide.image_url}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }

  return {
    backgroundImage: slide.background || gradientThemes[0]
  }
})

const autoplayMs = computed(() => {
  const raw = Number(props.section.config_json?.autoplay_ms)
  return raw >= 2500 ? raw : 5000
})

const clearAutoplay = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const startAutoplay = () => {
  clearAutoplay()

  if (slides.value.length <= 1) return

  intervalId = setInterval(() => {
    next()
  }, autoplayMs.value)
}

const goTo = (index) => {
  activeIndex.value = index
  startAutoplay()
}

const next = () => {
  activeIndex.value = (activeIndex.value + 1) % slides.value.length
}

const previous = () => {
  activeIndex.value = (activeIndex.value - 1 + slides.value.length) % slides.value.length
}

watch(slides, () => {
  if (activeIndex.value >= slides.value.length) {
    activeIndex.value = 0
  }
  startAutoplay()
}, { deep: true })

onMounted(() => {
  startAutoplay()
})

onBeforeUnmount(() => {
  clearAutoplay()
})
</script>
