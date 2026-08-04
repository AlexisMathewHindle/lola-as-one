<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <font-awesome-icon icon="spinner" class="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p class="text-gray-600">Loading party details...</p>
      </div>
    </div>

    <div v-else-if="error" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center mb-2">
          <font-awesome-icon icon="exclamation-circle" class="w-5 h-5 text-red-600 mr-2" />
          <h3 class="text-lg font-semibold text-red-900">Error Loading Parties</h3>
        </div>
        <p class="text-red-700">{{ error }}</p>
        <router-link
          to="/workshops"
          class="inline-block mt-4 text-primary-600 hover:text-primary-700"
        >
          &larr; Back to Workshops
        </router-link>
      </div>
    </div>

    <div v-else-if="partyWorkshop" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <nav class="mb-6">
        <router-link
          to="/workshops"
          class="text-sm text-gray-600 hover:text-primary-600 flex items-center"
        >
          <font-awesome-icon icon="chevron-left" class="w-3 h-3 mr-1" />
          Back to Workshops
        </router-link>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <WorkshopContentDefault
            :workshop="partyWorkshop"
            :age-group="ageGroup"
            :duration="duration"
            :formatted-description="formattedDescription"
            :related-workshops="[]"
          />
        </div>

        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
            <div v-if="hasPrice" class="mb-6">
              <div class="text-sm text-gray-600 mb-1">Event price</div>
              <div class="text-4xl font-bold text-gray-900">
                £{{ formattedPrice }}
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-xl border border-primary-200 bg-primary-50 p-4">
                <div class="flex items-center mb-2">
                  <font-awesome-icon icon="envelope" class="w-5 h-5 text-primary-700 mr-2" />
                  <span class="font-semibold text-primary-900">Book By Email</span>
                </div>
                <p class="text-sm text-primary-800">
                  This event is arranged by enquiry rather than instant checkout. Email us to check availability and tell us what you have in mind.
                </p>
              </div>

              <a
                :href="enquiryEmailHref"
                class="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                <font-awesome-icon icon="envelope" class="w-4 h-4 mr-2" />
                Email to enquire
              </a>

              <router-link
                to="/contact"
                class="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                Go To Contact Page
              </router-link>

              <p class="text-xs text-gray-500 text-center">
                We’ll confirm availability and next steps by email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import WorkshopContentDefault from '../components/workshops/WorkshopContentDefault.vue'
import { setPageSeo } from '../lib/seo'
import { supabase } from '../lib/supabase'
import { getWorkshopAgeLabel } from '../utils/workshopDisplay'

const props = defineProps({
  categorySlug: {
    type: String,
    default: 'private-party'
  }
})

const category = ref(null)
const loading = ref(true)
const error = ref(null)

const categoryDescription = computed(() => category.value?.description?.trim() || '')

const pageTitle = computed(() => category.value?.name || 'Parties')

const partyImageUrl = computed(() => category.value?.featured_image_url || null)

const parsedPrice = computed(() => {
  const match = categoryDescription.value.match(/£\s*([0-9]+(?:\.[0-9]{1,2})?)/)
  return match ? Number(match[1]) : null
})

const enquiryEmail = computed(() => {
  const match = categoryDescription.value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0] || 'hello@lotsoflovelyart.com'
})

const partyWorkshop = computed(() => {
  if (!category.value) return null

  return {
    id: category.value.id,
    price_gbp: parsedPrice.value,
    event_date: null,
    event_start_time: null,
    event_end_time: null,
    location_name: null,
    location_city: null,
    location_postcode: null,
    offering: {
      id: category.value.id,
      title: pageTitle.value,
      slug: 'parties',
      description_short: null,
      description_long: categoryDescription.value,
      featured_image_url: partyImageUrl.value
    },
    category: {
      ...category.value,
      layout_key: 'enquiry_only'
    }
  }
})

const ageGroup = computed(() => getWorkshopAgeLabel(partyWorkshop.value))

const duration = computed(() => '')

const formattedDescription = computed(() => {
  if (!categoryDescription.value) {
    return '<p class="text-gray-600">No description available.</p>'
  }

  return categoryDescription.value
    .split(/\n\s*\n/)
    .map((paragraph) => `<p class="mb-4">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
})

const hasPrice = computed(() => parsedPrice.value !== null)

const formattedPrice = computed(() => {
  if (!hasPrice.value) return null
  return parsedPrice.value.toFixed(2)
})

const enquiryEmailHref = computed(() => {
  const subject = pageTitle.value
    ? `Booking enquiry: ${pageTitle.value}`
    : 'Booking enquiry'

  return `mailto:${enquiryEmail.value}?subject=${encodeURIComponent(subject)}`
})

async function loadPartyCategory() {
  try {
    loading.value = true
    error.value = null

    const { data, error: categoryError } = await supabase
      .from('event_categories')
      .select('id, name, slug, description, age_range, color_hex, icon, parent_id, featured_image_url, layout_key, is_active')
      .eq('slug', props.categorySlug)
      .eq('is_active', true)
      .maybeSingle()

    if (categoryError) throw categoryError
    if (!data) throw new Error(`No active event category found for ${props.categorySlug}`)

    category.value = data
  } catch (err) {
    console.error('Error loading party category:', err)
    error.value = 'Party details could not be loaded. Please email hello@lotsoflovelyart.com to enquire.'
  } finally {
    loading.value = false
  }
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const normalizeSeoText = (value) => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const truncateSeoText = (value, maxLength = 155) => {
  const cleanValue = normalizeSeoText(value)
  if (cleanValue.length <= maxLength) return cleanValue
  return `${cleanValue.slice(0, maxLength - 3).trim()}...`
}

onMounted(async () => {
  await loadPartyCategory()

  setPageSeo({
    title: pageTitle.value,
    description: truncateSeoText(categoryDescription.value || 'Birthday art workshop party enquiries at LoLA Creative Space.'),
    path: '/parties',
    image: partyImageUrl.value || undefined
  })
})
</script>
