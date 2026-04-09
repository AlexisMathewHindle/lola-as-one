<template>
  <div class="min-h-screen bg-white">
    <div v-if="loading" class="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <div class="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      <p class="mt-4 text-sm text-gray-600">Loading homepage content...</p>
    </div>

    <div v-else-if="error" class="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <div class="rounded-[1.5rem] border border-danger-200 bg-danger-50 px-6 py-12">
        <h1 class="text-2xl font-display text-gray-900">Homepage unavailable</h1>
        <p class="mt-3 text-sm text-danger-700">{{ error }}</p>
      </div>
    </div>

    <template v-else>
      <HomeSectionRenderer
        v-for="section in sections"
        :key="section.id"
        :section="section"
      />
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import HomeSectionRenderer from '../components/home/HomeSectionRenderer.vue'
import { getPageWithSectionsByKey } from '../lib/cms'

const loading = ref(true)
const error = ref(null)
const sections = ref([])

const defaultHomeScheduleSection = {
  id: 'default-home-schedule',
  section_key: 'home_schedule',
  section_type: 'schedule_grid',
  sort_order: 20,
  config_json: {
    eyebrow: "What's On",
    title: 'Lola Art Classes',
    intro: 'The homepage reuses the live workshops calendar so this section stays aligned with the real schedule.',
    show_view_toggle: false,
    primary_cta: {
      label: 'View all workshops',
      page_key: 'workshops'
    }
  }
}

const defaultHomeFeatureColumnsSection = {
  id: 'default-home-feature-columns',
  section_key: 'home_feature_columns',
  section_type: 'feature_split',
  sort_order: 35,
  config_json: {
    layout_style: 'columns',
    items: [
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
        body: "Browse our curated collection of children's art books — from Little People, Big Dreams to Phaidon's My Art Book series."
      }
    ]
  }
}

const defaultHomeBannersSection = {
  id: 'default-home-banners',
  section_key: 'home_banners',
  section_type: 'feature_split',
  sort_order: 45,
  config_json: {
    layout_style: 'banners',
    items: [
      {
        image_side: 'left',
        eyebrow: 'Ages 4+',
        title: 'After School Art Clubs',
        body: [
          "A joyful creative moment in your child's week — learning about artists and art styles, exploring new materials, and having fun in a beautiful space.",
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
        image_side: 'right',
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
        image_side: 'left',
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
  }
}

const defaultHomeTestimonialsSection = {
  id: 'default-home-testimonials',
  section_key: 'home_testimonials',
  section_type: 'testimonial_strip',
  sort_order: 55,
  config_json: {
    eyebrow: 'What People Say',
    title: 'Loved by families & educators',
    autoplay_ms: 6000,
    items: [
      {
        quote: "LoLA has been the highlight of my daughter's week. She comes home buzzing with excitement and covered in paint — exactly what childhood should look like.",
        name: 'Sarah M.',
        role: 'Parent',
        stars: 5
      },
      {
        quote: 'The studio feels thoughtful, calm and genuinely creative. Every session introduces artists and materials in a way children can really connect with.',
        name: 'Emma R.',
        role: 'Teacher',
        stars: 5
      },
      {
        quote: 'Open Studio is our favourite weekend ritual. Coffee for us, paint for them, and everyone leaves happier than they arrived.',
        name: 'James T.',
        role: 'Parent',
        stars: 5
      }
    ]
  }
}

const normalizeHomeSections = (rawSections) => {
  const currentSections = Array.isArray(rawSections)
    ? rawSections.filter(section => ![
        'home_featured_workshops',
        'home_featured_boxes',
        'home_about_intro',
        'home_newsletter'
      ].includes(section.section_key))
    : []
  const hasScheduleSection = currentSections.some(section => section.section_key === 'home_schedule')
  const hasFeatureColumnsSection = currentSections.some(section => section.section_key === 'home_feature_columns')
  const hasBannersSection = currentSections.some(section => section.section_key === 'home_banners')
  const hasTestimonialsSection = currentSections.some(section => section.section_key === 'home_testimonials')

  if (!hasScheduleSection) {
    currentSections.push(defaultHomeScheduleSection)
  }

  if (!hasFeatureColumnsSection) {
    currentSections.push(defaultHomeFeatureColumnsSection)
  }

  if (!hasBannersSection) {
    currentSections.push(defaultHomeBannersSection)
  }

  if (!hasTestimonialsSection) {
    currentSections.push(defaultHomeTestimonialsSection)
  }

  return currentSections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

const loadHomePage = async () => {
  try {
    loading.value = true
    error.value = null

    const homePage = await getPageWithSectionsByKey('home')
    sections.value = normalizeHomeSections(homePage.sections)
  } catch (err) {
    console.error('Error loading homepage sections:', err)
    error.value = err.message || 'Failed to load homepage content.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHomePage()
})
</script>
