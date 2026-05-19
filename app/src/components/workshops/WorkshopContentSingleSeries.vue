<template>
  <div class="space-y-8">
    <section class="overflow-hidden rounded-[2rem] border border-stone-200 bg-[#fcfaf6] shadow-[0_20px_60px_rgba(120,92,45,0.08)]">
      <div class="p-5 sm:p-8 lg:p-10">
        <div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div class="space-y-4">
            <div class="overflow-hidden rounded-[1.75rem] bg-stone-100 shadow-sm">
              <img
                v-if="activeImage"
                :src="activeImage"
                :alt="displayTitle"
                class="aspect-[4/3] w-full object-cover"
              />
              <div
                v-else
                class="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-stone-200 via-[#f2e3c9] to-stone-100"
              >
                <font-awesome-icon icon="palette" class="h-20 w-20 text-stone-400" />
              </div>
            </div>

            <div v-if="galleryImages.length > 1" class="grid grid-cols-4 gap-3 sm:grid-cols-5">
              <button
                v-for="(image, index) in galleryImages"
                :key="`${image}-${index}`"
                type="button"
                class="overflow-hidden rounded-2xl border transition-all"
                :class="activeImage === image ? 'border-[#d7b162] shadow-sm' : 'border-stone-200 hover:border-stone-300'"
                @click="activeImage = image"
              >
                <img :src="image" :alt="`${displayTitle} image ${index + 1}`" class="aspect-square w-full object-cover" />
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-if="workshop.category?.name"
                  class="inline-flex items-center rounded-full bg-[#efe1bc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700"
                >
                  {{ workshop.category.name }}
                </span>
              </div>

              <h1 class="mt-5 text-3xl font-display font-bold text-stone-900 sm:text-4xl">{{ displayTitle }}</h1>

              <p v-if="workshop.offering.description_short" class="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
                {{ workshop.offering.description_short }}
              </p>
            </div>

            <div class="max-w-md">
              <div class="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4">
                <div class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Price</div>
                <div class="mt-2 text-3xl font-semibold text-stone-900">{{ priceDisplay }}</div>
                <div class="mt-1 text-sm text-stone-500">per session</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(120,92,45,0.06)] sm:p-8 lg:p-10">
      <div v-if="termGroups.length > 0" class="mb-8 text-center">
        <h2 class="text-2xl font-display font-bold text-stone-900 sm:text-4xl">Book by term</h2>
      </div>

      <div v-if="sessionEvents.length === 0" class="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-stone-500">
        No upcoming sessions are scheduled right now.
      </div>

      <div v-if="termGroups.length > 0" class="space-y-4">
        <article
          v-for="termGroup in termGroups"
          :key="termGroup.key"
          class="rounded-[1.5rem] border border-stone-200 bg-[#fdfcf9] px-4 py-4 sm:px-6"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span class="inline-flex items-center rounded-full bg-[#efe1bc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700">
                  {{ termGroup.label }}
                </span>
                <span :class="termGroupAvailabilityClass(termGroup)" class="text-sm font-medium">
                  {{ termGroupAvailabilityLabel(termGroup) }}
                </span>
              </div>

              <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-stone-900 sm:text-xl">{{ termGroup.title }}</h3>
                  <div class="mt-1 text-sm text-stone-500">
                    {{ termGroup.sessions.length }} {{ termGroup.sessions.length === 1 ? 'session' : 'sessions' }}
                  </div>
                </div>
                <div class="text-left sm:text-right">
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Term total</div>
                  <div class="text-2xl font-semibold text-stone-900">{{ formatPrice(termGroup.unitPrice) }}</div>
                  <div class="text-sm text-stone-500">per attendee</div>
                </div>
              </div>

              <div class="mt-5 space-y-2">
                <div
                  v-for="session in termGroup.sessions"
                  :key="session.id"
                  class="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                >
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
                        <span>{{ formatDisplayDate(session.event_date) }}</span>
                        <span class="hidden text-stone-300 sm:inline">•</span>
                        <span>{{ formatTimeRange(session.event_start_time, session.event_end_time) }}</span>
                      </div>
                      <div class="mt-1 text-sm font-semibold text-stone-900 sm:text-base">
                        {{ session.offering.title }}
                      </div>
                    </div>
                    <span :class="availabilityClass(session)" class="shrink-0 text-sm font-medium">
                      {{ availabilityLabel(session) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 lg:min-w-[260px]">
              <button
                type="button"
                class="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="termGroupQuantity(termGroup) <= 0"
                @click="$emit('decrement-term', termGroup)"
              >
                <font-awesome-icon icon="minus" class="h-3 w-3" />
              </button>

              <div class="flex h-11 min-w-[3rem] items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-lg font-semibold text-stone-900">
                {{ termGroupQuantity(termGroup) }}
              </div>

              <button
                type="button"
                class="flex h-11 w-11 items-center justify-center rounded-full border border-[#d7b162] bg-[#d7b162] text-white transition-colors hover:bg-[#c39a48] hover:border-[#c39a48] disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200"
                :disabled="isTermIncrementDisabled(termGroup)"
                @click="$emit('increment-term', termGroup)"
              >
                <font-awesome-icon icon="plus" class="h-3 w-3" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-if="singleSessions.length > 0" class="space-y-4" :class="termGroups.length > 0 ? 'mt-10' : ''">
        <div class="text-center">
          <h2 class="text-2xl font-display font-bold text-stone-900 sm:text-4xl">
            {{ termGroups.length > 0 ? 'Single workshops' : 'Book your workshops below' }}
          </h2>
        </div>

        <article
          v-for="session in singleSessions"
          :key="session.id"
          class="rounded-[1.5rem] border border-stone-200 bg-[#fdfcf9] px-4 py-4 sm:px-6"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-500 sm:text-base">
                <span>{{ formatDisplayDate(session.event_date) }}</span>
                <span class="hidden text-stone-300 sm:inline">•</span>
                <span>{{ formatTimeRange(session.event_start_time, session.event_end_time) }}</span>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 class="text-lg font-semibold text-stone-900 sm:text-xl">{{ session.offering.title }}</h3>
                <span :class="availabilityClass(session)" class="text-sm font-medium">
                  {{ availabilityLabel(session) }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 lg:min-w-[260px]">
              <button
                type="button"
                class="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="sessionQuantity(session) <= 0"
                @click="$emit('decrement-session', session)"
              >
                <font-awesome-icon icon="minus" class="h-3 w-3" />
              </button>

              <div class="flex h-11 min-w-[3rem] items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-lg font-semibold text-stone-900">
                {{ sessionQuantity(session) }}
              </div>

              <button
                type="button"
                class="flex h-11 w-11 items-center justify-center rounded-full border border-[#d7b162] bg-[#d7b162] text-white transition-colors hover:bg-[#c39a48] hover:border-[#c39a48] disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200"
                :disabled="isSessionIncrementDisabled(session)"
                @click="$emit('increment-session', session)"
              >
                <font-awesome-icon icon="plus" class="h-3 w-3" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getTermData } from '../../utils/termFormatters'
import { groupTermSessions } from '../../utils/termGroups'

const props = defineProps({
  workshop: {
    type: Object,
    required: true
  },
  ageGroup: {
    type: String,
    default: null
  },
  formattedDescription: {
    type: String,
    required: true
  },
  showDescriptionPanel: {
    type: Boolean,
    default: true
  },
  sessionEvents: {
    type: Array,
    default: () => []
  },
  sessionQuantities: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['increment-term', 'decrement-term', 'increment-session', 'decrement-session'])

const galleryImages = computed(() => {
  const images = []

  if (props.workshop.offering.featured_image_url) {
    images.push(props.workshop.offering.featured_image_url)
  } else if (props.workshop.category?.featured_image_url) {
    images.push(props.workshop.category.featured_image_url)
  }

  const secondaryImages = Array.isArray(props.workshop.offering.secondary_images)
    ? [...props.workshop.offering.secondary_images]
    : []

  secondaryImages
    .sort((a, b) => (a?.order || 0) - (b?.order || 0))
    .forEach((image) => {
      const url = typeof image === 'string' ? image : image?.url
      if (url) {
        images.push(url)
      }
    })

  return [...new Set(images)]
})

const activeImage = ref(null)

watch(galleryImages, (images) => {
  activeImage.value = images[0] || null
}, { immediate: true })

const priceDisplay = computed(() => {
  if (
    props.workshop.price_gbp === null ||
    props.workshop.price_gbp === undefined ||
    props.workshop.price_gbp === ''
  ) {
    return 'TBC'
  }

  const price = Number(props.workshop.price_gbp)
  return Number.isFinite(price) ? `£${price.toFixed(2)}` : 'TBC'
})

const displayTitle = computed(() => {
  return props.workshop.category?.name || props.workshop.offering.title
})

const isTermSession = (session) => {
  const termData = getTermData(session?.offering || {})
  return Boolean(termData.season && termData.half)
}

const termSessions = computed(() => props.sessionEvents.filter(isTermSession))

const singleSessions = computed(() => props.sessionEvents.filter((session) => !isTermSession(session)))

const termGroups = computed(() => groupTermSessions(termSessions.value))

const getCapacity = (session) => {
  if (Array.isArray(session.capacity)) {
    return session.capacity[0] || null
  }

  return session.capacity || null
}

const getSpacesAvailable = (session) => {
  const capacity = getCapacity(session)

  if (capacity && typeof capacity.spaces_available === 'number') {
    return capacity.spaces_available
  }

  if (
    typeof session.max_capacity === 'number' &&
    typeof session.current_bookings === 'number'
  ) {
    return Math.max(session.max_capacity - session.current_bookings, 0)
  }

  return null
}

const sessionQuantity = (session) => props.sessionQuantities[session.id] || 0

const termGroupQuantity = (termGroup) => {
  if (!termGroup.sessions.length) {
    return 0
  }

  return Math.min(...termGroup.sessions.map(sessionQuantity))
}

const isSessionIncrementDisabled = (session) => {
  const spacesAvailable = getSpacesAvailable(session)

  if (spacesAvailable === null) {
    return false
  }

  return sessionQuantity(session) >= spacesAvailable
}

const getTermGroupSpacesAvailable = (termGroup) => {
  const availableCounts = termGroup.sessions
    .map(getSpacesAvailable)
    .filter((spacesAvailable) => spacesAvailable !== null)

  if (availableCounts.length === 0) {
    return null
  }

  return Math.min(...availableCounts)
}

const isTermIncrementDisabled = (termGroup) => {
  const spacesAvailable = getTermGroupSpacesAvailable(termGroup)

  if (spacesAvailable === null) {
    return false
  }

  return termGroupQuantity(termGroup) >= spacesAvailable
}

const termGroupAvailabilityLabel = (termGroup) => {
  const spacesAvailable = getTermGroupSpacesAvailable(termGroup)

  if (spacesAvailable === null) {
    return 'Availability on request'
  }

  if (spacesAvailable <= 0) {
    return 'Sold out'
  }

  if (spacesAvailable === 1) {
    return 'Only 1 full-term place left'
  }

  return `${spacesAvailable} full-term places left`
}

const termGroupAvailabilityClass = (termGroup) => {
  const spacesAvailable = getTermGroupSpacesAvailable(termGroup)

  if (spacesAvailable === null) {
    return 'text-stone-500'
  }

  if (spacesAvailable <= 0) {
    return 'text-red-600'
  }

  if (spacesAvailable <= 4) {
    return 'text-[#cf7f6c]'
  }

  return 'text-stone-500'
}

const availabilityLabel = (session) => {
  const spacesAvailable = getSpacesAvailable(session)

  if (spacesAvailable === null) {
    return 'Availability on request'
  }

  if (spacesAvailable <= 0) {
    return 'Sold out'
  }

  if (spacesAvailable === 1) {
    return 'Only 1 space left'
  }

  return `${spacesAvailable} spaces left`
}

const availabilityClass = (session) => {
  const spacesAvailable = getSpacesAvailable(session)

  if (spacesAvailable === null) {
    return 'text-stone-500'
  }

  if (spacesAvailable <= 0) {
    return 'text-red-600'
  }

  if (spacesAvailable <= 4) {
    return 'text-[#cf7f6c]'
  }

  return 'text-stone-500'
}

const formatDisplayDate = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
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

const formatPrice = (value) => {
  const price = Number(value)
  return Number.isFinite(price) ? `£${price.toFixed(2)}` : 'TBC'
}
</script>
