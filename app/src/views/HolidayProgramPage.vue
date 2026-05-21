<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <font-awesome-icon icon="spinner" class="mb-4 h-12 w-12 animate-spin text-primary-600" />
        <p class="text-gray-600">Loading holiday workshops...</p>
      </div>
    </div>

    <div v-else-if="error" class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="rounded-lg border border-red-200 bg-red-50 p-6">
        <div class="mb-2 flex items-center">
          <font-awesome-icon icon="exclamation-circle" class="mr-2 h-5 w-5 text-red-600" />
          <h3 class="text-lg font-semibold text-red-900">Failed to load workshops</h3>
        </div>
        <p class="text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-4 text-primary-600 hover:text-primary-700"
          @click="fetchHolidayProgram"
        >
          Try Again
        </button>
      </div>
    </div>

    <div v-else-if="!category" class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <font-awesome-icon icon="calendar" class="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h1 class="text-2xl font-display font-bold text-gray-900">{{ fallbackTitle }} unavailable</h1>
        <p class="mt-3 text-gray-600">
          This holiday programme is not available right now.
        </p>
      </div>
    </div>

    <div v-else class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav class="mb-6">
        <router-link
          to="/workshops"
          class="flex items-center text-sm text-gray-600 hover:text-primary-600"
        >
          <font-awesome-icon icon="chevron-left" class="mr-1 h-3 w-3" />
          Back to Workshops
        </router-link>
      </nav>

      <WorkshopContentSingleSeries
        :workshop="representativeWorkshop"
        :age-group="categoryAgeLabel"
        :formatted-description="formattedDescription"
        :show-description-panel="false"
        :session-events="sessions"
        :session-quantities="sessionQuantities"
        @increment-term="incrementTermGroup"
        @decrement-term="decrementTermGroup"
        @increment-session="incrementSession"
        @decrement-session="decrementSession"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'
import WorkshopContentSingleSeries from '../components/workshops/WorkshopContentSingleSeries.vue'
import { useCartStore } from '../stores/cart'
import { formatAgeRange } from '../utils/workshopDisplay'

const props = defineProps({
  categorySlug: {
    type: String,
    required: true
  },
  categorySlugAliases: {
    type: Array,
    default: () => []
  },
  fallbackTitle: {
    type: String,
    required: true
  },
  fallbackDescription: {
    type: String,
    default: ''
  }
})

const cartStore = useCartStore()

const category = ref(null)
const sessions = ref([])
const loading = ref(true)
const error = ref(null)

const fallbackTitle = computed(() => props.fallbackTitle)

const categorySlugCandidates = computed(() => {
  return [...new Set([
    props.categorySlug,
    ...props.categorySlugAliases
  ].filter(Boolean))]
})

const pageHeading = computed(() => category.value?.name || props.fallbackTitle)

const pageDescription = computed(() => {
  if (category.value?.description?.trim()) {
    return category.value.description.trim()
  }

  return props.fallbackDescription || 'Browse upcoming holiday art workshops and book the sessions that work for your family.'
})

const formattedDescription = computed(() => {
  const source = pageDescription.value || 'No description available.'

  return source
    .split('\n\n')
    .map((paragraph) => `<p class="mb-4">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
})

const categoryAgeLabel = computed(() => {
  const ageRange = category.value?.age_range
  if (!ageRange) return null

  const min = toFiniteNumber(ageRange.min)
  const max = toFiniteNumber(ageRange.max)

  if ((min === null || min === 0) && max === null) {
    return 'All ages'
  }

  return formatAgeRange(ageRange)
})

const firstSession = computed(() => sessions.value[0] || null)

const heroImage = computed(() => {
  return category.value?.featured_image_url || null
})

const primaryPrice = computed(() => {
  const prices = sessions.value
    .map((session) => toFiniteNumber(session.price_gbp))
    .filter((price) => price !== null)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
})

const locationSummary = computed(() => {
  const locations = [...new Set(sessions.value.map((session) => session.location_name).filter(Boolean))]

  if (locations.length === 1) {
    return locations[0]
  }

  if (locations.length > 1) {
    return 'Various locations'
  }

  return firstSession.value?.location_name || 'TBA'
})

const representativeWorkshop = computed(() => {
  const session = firstSession.value || {}
  const offering = session.offering || {}

  return {
    ...session,
    id: category.value?.id || session.id || props.categorySlug,
    price_gbp: session.price_gbp ?? primaryPrice.value,
    location_name: locationSummary.value,
    location_city: locationSummary.value === 'Various locations' ? '' : session.location_city,
    location_postcode: locationSummary.value === 'Various locations' ? '' : session.location_postcode,
    offering: {
      ...offering,
      title: pageHeading.value,
      description_short: pageDescription.value,
      description_long: pageDescription.value,
      featured_image_url: heroImage.value,
      secondary_images: []
    },
    category: category.value
  }
})

const sessionQuantities = computed(() => {
  return cartStore.items.reduce((quantities, item) => {
    if (Array.isArray(item.items) && item.items.length > 0) {
      item.items.forEach((session) => {
        const sessionKey = session.event_id || session.id || session.offering_event_id

        if (sessionKey) {
          quantities[sessionKey] = (quantities[sessionKey] || 0) + item.quantity
        }
      })
    }

    const eventId = item.event_id || item.id || item.productId

    if (eventId) {
      quantities[eventId] = (quantities[eventId] || 0) + item.quantity
    }

    return quantities
  }, {})
})

const getLocalDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const fetchHolidayProgram = async () => {
  try {
    loading.value = true
    error.value = null
    category.value = null
    sessions.value = []

    const { data: categoryMatches, error: categoryError } = await supabase
      .from('event_categories')
      .select('id, name, slug, description, age_range, color_hex, icon, featured_image_url, layout_key, parent_id, is_active')
      .in('slug', categorySlugCandidates.value)
      .eq('is_active', true)

    if (categoryError) throw categoryError

    const categoryData = categorySlugCandidates.value
      .map((slug) => (categoryMatches || []).find((match) => match.slug === slug))
      .find(Boolean) || null

    category.value = categoryData

    if (!categoryData) {
      return
    }

    const { data: childCategories, error: childCategoryError } = await supabase
      .from('event_categories')
      .select('id')
      .eq('parent_id', categoryData.id)
      .eq('is_active', true)

    if (childCategoryError) throw childCategoryError

    const categoryIds = [
      categoryData.id,
      ...(childCategories || []).map((childCategory) => childCategory.id)
    ]

    const { data, error: sessionsError } = await supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings!inner(*),
        capacity:event_capacity(*),
        category:event_categories(
          id,
          name,
          slug,
          description,
          age_range,
          color_hex,
          icon,
          featured_image_url,
          layout_key,
          parent_id
        )
      `)
      .in('category_id', categoryIds)
      .eq('offering.status', 'published')
      .gte('event_date', getLocalDateString())
      .order('event_date', { ascending: true })
      .order('event_start_time', { ascending: true })

    if (sessionsError) throw sessionsError

    sessions.value = data || []
  } catch (err) {
    console.error('Error fetching holiday program:', err)
    error.value = 'Failed to load holiday workshops. Please try again.'
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

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getCapacity = (session) => {
  if (Array.isArray(session.capacity)) {
    return session.capacity[0] || null
  }

  return session.capacity || null
}

const getAvailableSpaces = (session) => {
  const capacity = getCapacity(session)
  const capacitySpaces = toFiniteNumber(capacity?.spaces_available)

  if (capacitySpaces !== null) {
    return capacitySpaces
  }

  const maxCapacity = toFiniteNumber(session.max_capacity)
  const currentBookings = toFiniteNumber(session.current_bookings)

  if (maxCapacity !== null && currentBookings !== null) {
    return Math.max(maxCapacity - currentBookings, 0)
  }

  return toFiniteNumber(session.available_spaces)
}

const getSessionQuantity = (session) => {
  return sessionQuantities.value[session.id] || 0
}

const getTermGroupCartItem = (termGroup) => {
  return cartStore.items.find((item) =>
    item.term_group_key === termGroup.key ||
    item.termGroupKey === termGroup.key ||
    item.id === termGroup.key ||
    item.productId === termGroup.key
  ) || null
}

const getTermGroupQuantity = (termGroup) => {
  const cartItem = getTermGroupCartItem(termGroup)

  if (cartItem) {
    return cartItem.quantity
  }

  if (!termGroup.sessions.length) {
    return 0
  }

  return Math.min(...termGroup.sessions.map(getSessionQuantity))
}

const getTermGroupSpacesAvailable = (termGroup) => {
  const availableCounts = termGroup.sessions
    .map(getAvailableSpaces)
    .filter((availableSpaces) => availableSpaces !== null)

  if (availableCounts.length === 0) {
    return null
  }

  return Math.min(...availableCounts)
}

const getSessionImage = (session) => {
  return session.offering?.featured_image_url || session.category?.featured_image_url || category.value?.featured_image_url || null
}

const buildTermCartItem = (termGroup) => {
  const firstSession = termGroup.sessions[0]

  return {
    id: termGroup.key,
    productId: termGroup.key,
    offering_id: firstSession?.offering?.id || firstSession?.offering_id || null,
    event_id: termGroup.key,
    type: 'event',
    title: `${termGroup.title} - ${termGroup.label}`,
    price: termGroup.unitPrice,
    image: getSessionImage(firstSession),
    slug: firstSession?.offering?.slug,
    termLabel: termGroup.label,
    term_group_key: termGroup.key,
    isTermBundle: true,
    categoryLayout: firstSession?.category?.layout_key || category.value?.layout_key || 'standard',
    categorySlug: firstSession?.category?.slug || category.value?.slug || props.categorySlug,
    categoryName: firstSession?.category?.name || category.value?.name || null,
    items: termGroup.sessions.map((session) => ({
      id: session.id,
      event_id: session.id,
      offering_event_id: session.id,
      offering_id: session.offering?.id || session.offering_id || null,
      title: session.offering?.title || termGroup.title,
      price: toFiniteNumber(session.price_gbp) || 0,
      image: getSessionImage(session),
      slug: session.offering?.slug,
      eventDate: session.event_date,
      eventTime: session.event_start_time,
      eventEndTime: session.event_end_time,
      categoryLayout: session.category?.layout_key || category.value?.layout_key || 'standard',
      categorySlug: session.category?.slug || category.value?.slug || props.categorySlug,
      categoryName: session.category?.name || category.value?.name || null
    }))
  }
}

const incrementSession = (session) => {
  const currentQuantity = getSessionQuantity(session)
  const availableSpaces = getAvailableSpaces(session)

  if (availableSpaces !== null && currentQuantity >= availableSpaces) {
    return
  }

  if (currentQuantity > 0) {
    cartStore.updateQuantity(session.id, currentQuantity + 1)
    return
  }

  cartStore.addItem({
    id: session.offering.id,
    offering_id: session.offering.id,
    event_id: session.id,
    type: 'event',
    title: session.offering.title,
    price: session.price_gbp,
    image: session.offering?.featured_image_url || session.category?.featured_image_url || category.value?.featured_image_url || null,
    slug: session.offering.slug,
    eventDate: session.event_date,
    eventTime: session.event_start_time,
    categoryLayout: session.category?.layout_key || category.value?.layout_key || 'standard',
    categorySlug: session.category?.slug || category.value?.slug || props.categorySlug,
    categoryName: session.category?.name || category.value?.name || null
  })
}

const decrementSession = (session) => {
  const currentQuantity = getSessionQuantity(session)

  if (currentQuantity <= 0) {
    return
  }

  cartStore.updateQuantity(session.id, currentQuantity - 1)
}

const incrementTermGroup = (termGroup) => {
  const currentQuantity = getTermGroupQuantity(termGroup)
  const availableSpaces = getTermGroupSpacesAvailable(termGroup)

  if (availableSpaces !== null && currentQuantity >= availableSpaces) {
    return
  }

  const cartItem = getTermGroupCartItem(termGroup)

  if (cartItem) {
    cartStore.updateQuantity(cartItem.productId || cartItem.id, cartItem.quantity + 1, cartItem.variantId)
    return
  }

  if (currentQuantity > 0) {
    termGroup.sessions.forEach(incrementSession)
    return
  }

  cartStore.addItem(buildTermCartItem(termGroup))
}

const decrementTermGroup = (termGroup) => {
  const currentQuantity = getTermGroupQuantity(termGroup)

  if (currentQuantity <= 0) {
    return
  }

  const cartItem = getTermGroupCartItem(termGroup)

  if (cartItem) {
    cartStore.updateQuantity(cartItem.productId || cartItem.id, cartItem.quantity - 1, cartItem.variantId)
    return
  }

  termGroup.sessions.forEach(decrementSession)
}

watch(() => props.categorySlug, () => {
  fetchHolidayProgram()
})

onMounted(() => {
  fetchHolidayProgram()
})
</script>
