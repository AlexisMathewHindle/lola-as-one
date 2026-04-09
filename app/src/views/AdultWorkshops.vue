<template>
  <div class="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="mb-8 sm:mb-10">
        <h1 class="text-3xl sm:text-5xl font-display font-bold text-gray-900">
          Adult Art Workshops
        </h1>
        <p class="mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-gray-600">
          Evening creative sessions for adults, shown in a dedicated list view instead of the main workshop calendar.
        </p>
      </div>

      <div v-if="heroCategory" class="mb-10 overflow-hidden rounded-[2rem] border border-rose-200 bg-white shadow-sm">
        <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="min-h-[260px] bg-rose-100">
            <img
              v-if="heroImage"
              :src="heroImage"
              :alt="heroCategory.name"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full items-center justify-center bg-gradient-to-br from-rose-200 to-amber-200">
              <font-awesome-icon icon="paint-brush" class="w-24 h-24 text-rose-700/60" />
            </div>
          </div>
          <div class="p-6 sm:p-8 lg:p-10">
            <div class="inline-flex rounded-full bg-rose-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Adult Workshop Template
            </div>
            <h2 class="mt-4 text-2xl sm:text-3xl font-display font-bold text-gray-900">
              {{ heroCategory.name }}
            </h2>
            <p v-if="heroCategory.description" class="mt-4 text-base leading-relaxed text-gray-700">
              {{ heroCategory.description }}
            </p>
            <p v-else class="mt-4 text-base leading-relaxed text-gray-700">
              Browse upcoming adult sessions below. These events are driven by the category template flag in the backend.
            </p>
          </div>
        </div>
      </div>

      <div v-if="loading" class="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <font-awesome-icon icon="spinner" spin class="w-10 h-10 text-rose-700 mx-auto mb-4" />
        <p class="text-gray-600">Loading adult workshops...</p>
      </div>

      <div v-else-if="error" class="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
        <font-awesome-icon icon="exclamation-circle" class="w-10 h-10 text-red-600 mx-auto mb-3" />
        <p class="font-semibold text-red-900 mb-2">Failed to load adult workshops</p>
        <p class="text-sm text-red-700 mb-4">{{ error }}</p>
        <button
          @click="fetchAdultWorkshops"
          class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>

      <div v-else-if="workshops.length === 0" class="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <font-awesome-icon icon="calendar" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-lg font-semibold text-gray-900 mb-2">No adult workshops scheduled</p>
        <p class="text-gray-600">Check back soon for upcoming sessions.</p>
      </div>

      <div v-else class="space-y-6">
        <article
          v-for="workshop in workshops"
          :key="workshop.id"
          class="overflow-hidden rounded-[2rem] border border-rose-200/80 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
            <div class="bg-rose-100 min-h-[220px]">
              <img
                v-if="getWorkshopImage(workshop)"
                :src="getWorkshopImage(workshop)"
                :alt="workshop.offering.title"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full items-center justify-center bg-gradient-to-br from-rose-100 to-amber-100">
                <font-awesome-icon icon="palette" class="w-20 h-20 text-rose-600/60" />
              </div>
            </div>

            <div class="p-6 sm:p-8">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div class="flex flex-wrap gap-2 mb-3">
                    <span
                      v-if="workshop.category?.name"
                      class="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      {{ workshop.category.name }}
                    </span>
                    <span
                      v-if="workshopAgeLabel(workshop)"
                      class="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                    >
                      {{ workshopAgeLabel(workshop) }}
                    </span>
                  </div>

                  <button
                    type="button"
                    @click="goToWorkshop(workshop)"
                    class="text-left"
                  >
                    <h2 class="text-2xl sm:text-3xl font-display font-bold text-gray-900 hover:text-rose-700 transition-colors">
                      {{ workshop.offering.title }}
                    </h2>
                  </button>

                  <p v-if="workshop.offering.description_short" class="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">
                    {{ workshop.offering.description_short }}
                  </p>
                </div>

                <div class="shrink-0 rounded-2xl bg-rose-700 px-4 py-3 text-white shadow-sm">
                  <div class="text-xs uppercase tracking-wide text-white/80">Price</div>
                  <div class="text-2xl font-bold">£{{ Number(workshop.price_gbp).toFixed(2) }}</div>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</div>
                  <div class="mt-1 text-sm font-semibold text-gray-900">{{ formatDate(workshop.event_date) }}</div>
                </div>

                <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Time</div>
                  <div class="mt-1 text-sm font-semibold text-gray-900">
                    {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
                  </div>
                </div>

                <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Venue</div>
                  <div class="mt-1 text-sm font-semibold text-gray-900">{{ workshop.location_name || 'TBA' }}</div>
                </div>
              </div>

              <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div class="text-sm" :class="availabilityClass(workshop)">
                  {{ availabilityLabel(workshop) }}
                </div>

                <button
                  type="button"
                  @click="goToWorkshop(workshop)"
                  class="inline-flex items-center rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                  View Workshop
                  <font-awesome-icon icon="chevron-right" class="ml-2 w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { getWorkshopAgeLabel, isAdultWorkshopLayout } from '../utils/workshopDisplay'

const router = useRouter()

const workshops = ref([])
const loading = ref(true)
const error = ref(null)

const heroCategory = computed(() => {
  return workshops.value.find(workshop => workshop.category)?.category || null
})

const heroImage = computed(() => {
  if (!heroCategory.value) return null

  const workshopImage = workshops.value.find(workshop => workshop.category?.id === heroCategory.value.id)?.offering?.featured_image_url
  return workshopImage || heroCategory.value.featured_image_url || null
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

const availabilityLabel = (workshop) => {
  const capacity = workshop.capacity

  if (!capacity) {
    if (typeof workshop.available_spaces === 'number') {
      return workshop.available_spaces <= 0 ? 'Sold out' : `${workshop.available_spaces} places available`
    }

    return 'Availability on request'
  }

  if (capacity.spaces_available <= 0) {
    return capacity.waitlist_enabled ? 'Sold out, waitlist available' : 'Sold out'
  }

  if (capacity.spaces_available <= 3) {
    return `Only ${capacity.spaces_available} places left`
  }

  return `${capacity.spaces_available} places available`
}

const availabilityClass = (workshop) => {
  const availableSpaces = workshop.capacity?.spaces_available ?? workshop.available_spaces

  if (typeof availableSpaces === 'number' && availableSpaces <= 0) {
    return 'font-semibold text-red-600'
  }

  if (typeof availableSpaces === 'number' && availableSpaces <= 3) {
    return 'font-semibold text-amber-700'
  }

  return 'font-semibold text-emerald-700'
}

const formatDate = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatTime = (timeString) => {
  if (!timeString) return ''

  const [hour, minute] = timeString.split(':').map(Number)
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const minuteStr = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : ''

  return `${hour12}${minuteStr}${period}`
}

const formatTimeRange = (startTime, endTime) => {
  if (!endTime) return formatTime(startTime)
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

const goToWorkshop = (workshop) => {
  router.push(`/workshops/${workshop.offering.slug}`)
}

onMounted(() => {
  fetchAdultWorkshops()
})
</script>
