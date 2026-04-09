<template>
  <section v-if="layout === 'columns'" class="bg-white py-10 sm:py-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <article
          v-for="(item, index) in items"
          :key="item.id || index"
          class="flex items-start gap-4"
        >
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fbf5ea] text-[#d1a13b]">
            <font-awesome-icon
              :icon="item.icon || 'book-open'"
              class="h-5 w-5"
            />
          </div>

          <div class="min-w-0">
            <h3 class="text-[1.7rem] font-semibold leading-tight text-stone-900">
              {{ item.title }}
            </h3>
            <p class="mt-2 text-lg leading-8 text-stone-600">
              {{ item.body }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section v-else class="bg-white py-12 sm:py-16">
    <div class="mx-auto max-w-7xl divide-y divide-stone-200 px-4 sm:px-6 lg:px-8">
      <article
        v-for="(item, index) in items"
        :key="item.id || index"
        class="grid gap-10 py-12 lg:grid-cols-2 lg:items-center"
      >
        <div :class="imageColumnClass(item, index)">
          <div class="overflow-hidden rounded-[0.7rem] bg-stone-100 shadow-sm">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              :alt="item.image_alt || item.title || `Banner image ${index + 1}`"
              class="h-full w-full object-cover"
            >
            <div
              v-else
              class="aspect-[1.12/1] bg-gradient-to-br from-[#ead9bf] to-[#d7a774]"
            ></div>
          </div>
        </div>

        <div :class="contentColumnClass(item, index)">
          <p
            v-if="item.eyebrow"
            class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d1a13b]"
          >
            {{ item.eyebrow }}
          </p>

          <h3 class="mt-3 text-4xl font-light tracking-[-0.02em] text-stone-800">
            {{ item.title }}
          </h3>

          <div class="mt-5 space-y-4 text-base leading-8 text-stone-600">
            <p
              v-for="(paragraph, paragraphIndex) in normalizeBody(item)"
              :key="`${index}-paragraph-${paragraphIndex}`"
            >
              {{ paragraph }}
            </p>
          </div>

          <div v-if="normalizeCtas(item).length" class="mt-6 flex flex-wrap gap-3">
            <template v-for="(cta, ctaIndex) in normalizeCtas(item)" :key="`${index}-cta-${ctaIndex}`">
              <router-link
                v-if="!isExternalCmsLink(cta)"
                :to="resolveCmsLink(cta)"
                class="inline-flex items-center rounded-[0.35rem] border border-[#e7d7b8] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c79b32] transition-colors hover:bg-[#fbf7ef]"
              >
                {{ cta.label }}
              </router-link>
              <a
                v-else
                :href="resolveCmsLink(cta)"
                :target="cta.open_in_new_tab ? '_blank' : undefined"
                :rel="cta.open_in_new_tab ? 'noreferrer noopener' : undefined"
                class="inline-flex items-center rounded-[0.35rem] border border-[#e7d7b8] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c79b32] transition-colors hover:bg-[#fbf7ef]"
              >
                {{ cta.label }}
              </a>
            </template>
          </div>

          <div v-if="normalizeIcons(item).length" class="mt-7 flex flex-wrap items-center gap-4 text-[1.9rem]">
            <span
              v-for="(icon, iconIndex) in normalizeIcons(item)"
              :key="`${index}-icon-${iconIndex}`"
              class="inline-flex items-center justify-center"
            >
              <img
                v-if="icon.image_url"
                :src="icon.image_url"
                :alt="icon.alt || item.title || `Banner icon ${iconIndex + 1}`"
                class="h-8 w-8 object-contain"
              >
              <font-awesome-icon
                v-else
                :icon="icon.name || icon"
                :style="{ color: icon.color || defaultIconColors[iconIndex % defaultIconColors.length] }"
              />
            </span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { isExternalCmsLink, resolveCmsLink } from '../../utils/cmsLink'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const fallbackColumnItems = [
  {
    icon: 'mug-hot',
    title: 'Redemption Roasters coffee',
    body: 'We proudly serve coffee from Redemption Roasters — rich speciality coffee that has social impact.'
  },
  {
    icon: 'cake-candles',
    title: 'Pastries & cakes',
    body: 'Freshly baked treats to enjoy while your child creates. From buttery croissants to homemade cakes.'
  },
  {
    icon: 'book-open',
    title: 'The book corner',
    body: 'Browse our curated collection of children\'s art books — from Little People, Big Dreams to Phaidon\'s My Art Book series.'
  }
]

const fallbackBannerItems = [
  {
    eyebrow: 'Ages 4+',
    title: 'After School Art Clubs',
    body: [
      'A joyful creative moment in your child\'s week — learning about artists and art styles, exploring new materials, and having fun in a beautiful space.',
      'Wednesday classes explore changing themes through the year, with term-time registration by age band.'
    ],
    ctas: [
      { label: 'Register — Wednesday (4+)', href: '/workshops' },
      { label: 'Register — Thursday (4-8)', href: '/workshops' },
      { label: 'Register — Thursday (9-13)', href: '/workshops' }
    ],
    icons: ['heart', 'gift', 'mug-hot', 'paint-brush', 'palette', 'star']
  },
  {
    eyebrow: 'Ages 2-4',
    title: 'Little Ones',
    body: [
      'All about the process, not the result. LoLA for Little Ones helps young children explore creativity through texture, colour and new materials in a relaxed, playful environment.',
      'We ask that you stay and co-create alongside your child. Sessions are first come, first served — book online to secure your place.'
    ],
    ctas: [
      { label: 'Register — Tuesday', href: '/workshops' },
      { label: 'Register — Friday', href: '/workshops' },
      { label: 'Register — Saturday', href: '/workshops' }
    ],
    icons: ['baby', 'gift', 'paint-brush', 'palette', 'cake-candles', 'heart']
  },
  {
    eyebrow: 'All ages',
    title: 'Open Studio',
    body: [
      'Drop in, grab a coffee, and let your child get freely creative. Open Studio sessions offer open-ended projects at the art table — no instruction, just inspiration.',
      'A member of the LoLA team will be present, but this is not a taught session. We kindly ask that parents stay within the café and help supervise each child. Each ticket is for one hour.'
    ],
    ctas: [
      { label: 'Book Open Studio', href: '/workshops' }
    ],
    icons: ['palette', 'paint-brush', 'heart', 'gift', 'star']
  }
]

const defaultIconColors = ['#8ca0a0', '#d7b15d', '#dd9965', '#8aa7a6', '#b6a36f', '#c48c79']

const config = computed(() => props.section.config_json || {})
const layout = computed(() => config.value.layout_style === 'banners' ? 'banners' : 'columns')
const items = computed(() => {
  const rawItems = config.value.items
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems
  }

  return layout.value === 'banners' ? fallbackBannerItems : fallbackColumnItems
})

const normalizeBody = (item) => {
  if (Array.isArray(item.body)) return item.body
  if (item.body) return [item.body]
  if (item.body_html) return [item.body_html]
  return []
}

const normalizeCtas = (item) => Array.isArray(item.ctas) ? item.ctas.filter(cta => cta?.label) : []
const normalizeIcons = (item) => Array.isArray(item.icons) ? item.icons : []

const isImageFirst = (item, index) => {
  if (item.image_side === 'right') return false
  if (item.image_side === 'left') return true
  return index % 2 === 0
}

const imageColumnClass = (item, index) => isImageFirst(item, index) ? 'order-1' : 'order-1 lg:order-2'
const contentColumnClass = (item, index) => isImageFirst(item, index) ? 'order-2' : 'order-2 lg:order-1'
</script>
