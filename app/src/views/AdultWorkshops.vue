<template>
  <div class="min-h-screen bg-[#f8f4ec]">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div v-if="loading" class="rounded-[2rem] border border-stone-200 bg-white p-12 text-center shadow-sm">
        <font-awesome-icon icon="spinner" spin class="mx-auto mb-4 h-10 w-10 text-rose-700" />
        <p class="text-gray-600">Loading adult workshops...</p>
      </div>

      <div v-else-if="error" class="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-center">
        <font-awesome-icon icon="exclamation-circle" class="mx-auto mb-3 h-10 w-10 text-red-600" />
        <p class="mb-2 font-semibold text-red-900">Failed to load adult workshops</p>
        <p class="mb-4 text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          @click="fetchAdultWorkshops"
          class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </button>
      </div>

      <div v-else-if="workshops.length === 0" class="rounded-[2rem] border border-stone-200 bg-white p-12 text-center shadow-sm">
        <font-awesome-icon icon="calendar" class="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p class="mb-2 text-lg font-semibold text-gray-900">No adult workshops scheduled</p>
        <p class="text-gray-600">Check back soon for upcoming sessions.</p>
      </div>

      <div v-else class="space-y-8">
        <section class="rounded-[2rem] border border-stone-200 bg-[#fcfaf6] shadow-[0_18px_50px_rgba(120,92,45,0.08)]">
          <div class="p-5 sm:p-8 lg:p-10">
            <div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div class="overflow-hidden rounded-[1.75rem] bg-stone-100 shadow-sm">
                <img
                  v-if="heroImage"
                  :src="heroImage"
                  :alt="heroTitle"
                  class="aspect-[4/3] w-full object-cover"
                />
                <div v-else class="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-stone-200 via-[#f2e3c9] to-stone-100">
                  <font-awesome-icon icon="paint-brush" class="h-20 w-20 text-stone-400" />
                </div>
              </div>

              <div class="space-y-6">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-[#efe1bc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                      Adult Workshops
                    </span>
                    <!-- <span v-if="heroTitle" class="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500 ring-1 ring-stone-200">
                      {{ heroTitle }}
                    </span> -->
                  </div>

                  <h1 class="mt-5 text-3xl font-display font-bold text-stone-900 sm:text-4xl">Adult Art Workshops</h1>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4">
                    <div class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Price</div>
                    <div class="mt-2 text-3xl font-semibold text-stone-900">{{ priceRangeLabel }}</div>
                    <div class="mt-1 text-sm text-stone-500">session prices</div>
                  </div>

                  <div class="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4">
                    <div class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Location</div>
                    <div class="mt-2 text-base font-semibold text-stone-900">{{ heroLocationName }}</div>
                    <div class="mt-1 text-sm text-stone-500">{{ heroLocationDetail }}</div>
                  </div>
                </div>

                <div class="rounded-[1.75rem] border border-stone-200 bg-white px-6 py-5">
                  <div class="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">About These Workshops</div>
                  <p class="mt-4 whitespace-pre-line text-base leading-relaxed text-stone-700">
                    {{ heroDescription }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(120,92,45,0.06)] sm:p-8">
          <div class="mb-6 text-center">
            <div class="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Upcoming Sessions</div>
            <h2 class="mt-3 text-2xl font-display font-bold text-stone-900 sm:text-3xl">Adult Workshops Coming Up</h2>
          </div>

          <div class="space-y-4">
            <article
              v-for="workshop in workshops"
              :key="workshop.id"
              class="rounded-[1.5rem] border border-stone-200 bg-[#fdfcf9] p-4 shadow-[0_8px_24px_rgba(120,92,45,0.04)] sm:p-5"
            >
              <div class="grid gap-4 sm:grid-cols-[110px_1fr] lg:grid-cols-[110px_1fr_190px] lg:items-center">
                <button
                  type="button"
                  class="overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-100 text-left"
                  @click="goToWorkshop(workshop)"
                >
                  <img
                    v-if="getWorkshopImage(workshop)"
                    :src="getWorkshopImage(workshop)"
                    :alt="workshop.offering.title"
                    class="aspect-[3/4] w-full object-cover"
                  />
                  <div v-else class="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-stone-200 via-[#f2e3c9] to-stone-100">
                    <font-awesome-icon icon="palette" class="h-10 w-10 text-stone-400" />
                  </div>
                </button>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      v-if="workshopAgeLabel(workshop)"
                      class="inline-flex items-center rounded-full bg-[#efe1bc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700"
                    >
                      {{ workshopAgeLabel(workshop) }}
                    </span>
                    <span
                      v-if="workshop.category?.name"
                      class="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 ring-1 ring-stone-200"
                    >
                      {{ workshop.category.name }}
                    </span>
                  </div>

                  <button type="button" class="mt-3 text-left" @click="goToWorkshop(workshop)">
                    <h3 class="text-lg font-semibold text-stone-900 transition-colors hover:text-[#b4883f] sm:text-xl">
                      {{ workshop.offering.title }}
                    </h3>
                  </button>

                  <p
                    v-if="workshop.offering.description_short"
                    class="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600"
                  >
                    {{ workshop.offering.description_short }}
                  </p>

                  <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
                    <span>{{ formatDate(workshop.event_date) }}</span>
                    <span>{{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}</span>
                    <span>{{ workshop.location_name || 'TBA' }}</span>
                  </div>

                  <div class="mt-4 space-y-1">
                    <div class="text-base font-semibold text-stone-900">£{{ Number(workshop.price_gbp || 0).toFixed(2) }}</div>
                    <div class="text-sm font-medium" :class="availabilityClass(workshop)">
                      {{ availabilityLabel(workshop) }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-end gap-2 rounded-[1.25rem] border border-stone-200 bg-white px-4 py-3">
                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                      :disabled="getWorkshopQuantity(workshop) <= 0"
                      @click="decrementWorkshop(workshop)"
                    >
                      <font-awesome-icon icon="minus" class="h-3 w-3" />
                    </button>

                    <div class="flex h-10 min-w-[3rem] items-center justify-center rounded-2xl border border-stone-200 bg-white px-3 text-lg font-semibold text-stone-900">
                      {{ getWorkshopQuantity(workshop) }}
                    </div>

                    <button
                      type="button"
                      class="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7b162] bg-[#d7b162] text-white transition-colors hover:border-[#c39a48] hover:bg-[#c39a48] disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200"
                      :disabled="isIncrementDisabled(workshop)"
                      @click="incrementWorkshop(workshop)"
                    >
                      <font-awesome-icon icon="plus" class="h-3 w-3" />
                    </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../stores/cart'
import { getWorkshopAgeLabel, isAdultWorkshopLayout } from '../utils/workshopDisplay'

const router = useRouter()
const cartStore = useCartStore()

const workshops = ref([])
const loading = ref(true)
const error = ref(null)

const heroCategory = computed(() => {
  return workshops.value.find((workshop) => workshop.category)?.category || null
})

const heroTitle = computed(() => {
  return heroCategory.value?.name || 'Adult Art Workshops'
})

const heroDescription = computed(() => {
  if (heroCategory.value?.description?.trim()) {
    return heroCategory.value.description.trim()
  }

  return 'A chance to get freely creative with friends while enjoying delicious drinks and nibbles! Each adult class is focused on one open-ended project and is a perfect evening out - be inspired and let your creative juices flow!'
})

const heroImage = computed(() => {
  if (!heroCategory.value) return null

  const workshopImage = workshops.value.find((workshop) => workshop.category?.id === heroCategory.value.id)?.offering?.featured_image_url
  return workshopImage || heroCategory.value.featured_image_url || null
})

const quantityByEventId = computed(() => {
  return cartStore.items.reduce((quantities, item) => {
    const eventId = item.event_id || item.id || item.productId

    if (eventId) {
      quantities[eventId] = item.quantity
    }

    return quantities
  }, {})
})

const priceRangeLabel = computed(() => {
  if (workshops.value.length === 0) {
    return '£0'
  }

  const prices = workshops.value
    .map((workshop) => Number(workshop.price_gbp || 0))
    .filter((price) => Number.isFinite(price))

  if (prices.length === 0) {
    return 'TBC'
  }

  const minimum = Math.min(...prices)
  const maximum = Math.max(...prices)

  if (minimum === maximum) {
    return `£${minimum.toFixed(0)}`
  }

  return `£${minimum.toFixed(0)}-£${maximum.toFixed(0)}`
})

const uniqueLocationNames = computed(() => {
  return [...new Set(workshops.value.map((workshop) => workshop.location_name).filter(Boolean))]
})

const primaryLocationWorkshop = computed(() => {
  return workshops.value.find((workshop) => workshop.location_name || workshop.location_city || workshop.location_postcode) || null
})

const heroLocationName = computed(() => {
  if (uniqueLocationNames.value.length === 1) {
    return uniqueLocationNames.value[0]
  }

  if (uniqueLocationNames.value.length > 1) {
    return 'Various locations'
  }

  return 'TBA'
})

const heroLocationDetail = computed(() => {
  if (uniqueLocationNames.value.length > 1) {
    return 'See each session below for venue details'
  }

  const workshop = primaryLocationWorkshop.value
  if (!workshop) {
    return 'Location details to be confirmed'
  }

  const locationParts = [workshop.location_city, workshop.location_postcode].filter(Boolean)
  if (locationParts.length > 0) {
    return locationParts.join(', ')
  }

  return 'See session details below'
})

const fetchAdultWorkshops = async () => {
  try {
    loading.value = true
    error.value = null

    const today = new Date().toISOString().split('T')[0]

    const { data, error: fetchError } = await supabase
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
      .eq('offering.status', 'published')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_start_time', { ascending: true })

    if (fetchError) throw fetchError

    workshops.value = (data || []).filter(isAdultWorkshopLayout)
  } catch (err) {
    console.error('Error fetching adult workshops:', err)
    error.value = 'Failed to load adult workshops. Please try again.'
  } finally {
    loading.value = false
  }
}

const getWorkshopImage = (workshop) => {
  return workshop.offering.featured_image_url || workshop.category?.featured_image_url || null
}

const workshopAgeLabel = (workshop) => {
  return getWorkshopAgeLabel(workshop)
}

const getCapacity = (workshop) => {
  if (Array.isArray(workshop.capacity)) {
    return workshop.capacity[0] || null
  }

  return workshop.capacity || null
}

const getAvailableSpaces = (workshop) => {
  const capacity = getCapacity(workshop)

  if (capacity && typeof capacity.spaces_available === 'number') {
    return capacity.spaces_available
  }

  if (
    typeof workshop.max_capacity === 'number' &&
    typeof workshop.current_bookings === 'number'
  ) {
    return Math.max(workshop.max_capacity - workshop.current_bookings, 0)
  }

  if (typeof workshop.available_spaces === 'number') {
    return workshop.available_spaces
  }

  return null
}

const availabilityLabel = (workshop) => {
  const availableSpaces = getAvailableSpaces(workshop)

  if (availableSpaces === null) {
    return 'Availability on request'
  }

  if (availableSpaces <= 0) {
    return 'Sold out'
  }

  if (availableSpaces === 1) {
    return 'Only 1 place left'
  }

  if (availableSpaces <= 4) {
    return `Only ${availableSpaces} places left`
  }

  return `${availableSpaces} places available`
}

const availabilityClass = (workshop) => {
  const availableSpaces = getAvailableSpaces(workshop)

  if (availableSpaces === null) {
    return 'text-stone-500'
  }

  if (availableSpaces <= 0) {
    return 'text-red-600'
  }

  if (availableSpaces <= 4) {
    return 'text-[#cf7f6c]'
  }

  return 'text-emerald-700'
}

const formatDate = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (timeString) => {
  if (!timeString) return ''

  const [hour, minute] = timeString.split(':').map(Number)
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const minuteString = minute ? `:${minute.toString().padStart(2, '0')}` : ''

  return `${hour12}${minuteString}${period}`
}

const formatTimeRange = (startTime, endTime) => {
  if (!endTime) return formatTime(startTime)
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

const getWorkshopQuantity = (workshop) => {
  return quantityByEventId.value[workshop.id] || 0
}

const isIncrementDisabled = (workshop) => {
  const availableSpaces = getAvailableSpaces(workshop)

  if (availableSpaces === null) {
    return false
  }

  return getWorkshopQuantity(workshop) >= availableSpaces
}

const incrementWorkshop = (workshop) => {
  const currentQuantity = getWorkshopQuantity(workshop)
  const availableSpaces = getAvailableSpaces(workshop)

  if (availableSpaces !== null && currentQuantity >= availableSpaces) {
    return
  }

  if (currentQuantity > 0) {
    cartStore.updateQuantity(workshop.id, currentQuantity + 1)
    return
  }

  cartStore.addItem({
    id: workshop.offering.id,
    offering_id: workshop.offering.id,
    event_id: workshop.id,
    type: 'event',
    title: workshop.offering.title,
    price: workshop.price_gbp,
    image: getWorkshopImage(workshop),
    slug: workshop.offering.slug,
    eventDate: workshop.event_date,
    eventTime: workshop.event_start_time
  })
}

const decrementWorkshop = (workshop) => {
  const currentQuantity = getWorkshopQuantity(workshop)

  if (currentQuantity <= 0) {
    return
  }

  cartStore.updateQuantity(workshop.id, currentQuantity - 1)
}

const goToWorkshop = (workshop) => {
  router.push(`/workshops/${workshop.offering.slug}`)
}

onMounted(() => {
  fetchAdultWorkshops()
})
</script>
