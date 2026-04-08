<template>
  <div class="space-y-6">
    <div class="overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-rose-50 to-white shadow-sm">
      <div class="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        <div class="min-h-[280px] bg-amber-100">
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="workshop.offering.title"
            class="h-full w-full object-cover"
          />
          <div v-else class="h-full flex items-center justify-center bg-gradient-to-br from-rose-200 to-amber-200">
            <font-awesome-icon icon="paint-brush" class="w-24 h-24 text-rose-700/70" />
          </div>
        </div>

        <div class="p-6 sm:p-8 lg:p-10">
          <div class="inline-flex items-center rounded-full bg-rose-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Adult Workshop
          </div>
          <div v-if="workshop.category?.name" class="mt-3 text-sm font-medium text-rose-900/80">
            {{ workshop.category.name }}
          </div>

          <h1 class="mt-4 text-3xl sm:text-4xl font-display font-bold text-gray-900">
            {{ workshop.offering.title }}
          </h1>

          <p v-if="workshop.offering.description_short" class="mt-4 text-lg leading-relaxed text-gray-700">
            {{ workshop.offering.description_short }}
          </p>

          <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-2xl bg-white/80 p-4 border border-white shadow-sm">
              <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</div>
              <div class="mt-1 text-sm font-semibold text-gray-900">{{ formatDate(workshop.event_date) }}</div>
            </div>

            <div class="rounded-2xl bg-white/80 p-4 border border-white shadow-sm">
              <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Time</div>
              <div class="mt-1 text-sm font-semibold text-gray-900">
                {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
              </div>
              <div v-if="duration" class="mt-1 text-xs text-gray-500">{{ duration }}</div>
            </div>

            <div class="rounded-2xl bg-white/80 p-4 border border-white shadow-sm">
              <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</div>
              <div class="mt-1 text-sm font-semibold text-gray-900">{{ workshop.location_name || 'TBA' }}</div>
              <div v-if="workshop.location_city" class="mt-1 text-xs text-gray-500">
                {{ workshop.location_city }}{{ workshop.location_postcode ? ', ' + workshop.location_postcode : '' }}
              </div>
            </div>

            <div class="rounded-2xl bg-white/80 p-4 border border-white shadow-sm">
              <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">Audience</div>
              <div class="mt-1 text-sm font-semibold text-gray-900">
                {{ ageGroup || 'General admission' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
      <div class="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">About This Session</h2>
        <div class="prose max-w-none text-gray-700" v-html="formattedDescription"></div>
      </div>

      <div class="space-y-6">
        <div class="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 class="text-xl font-display font-bold text-gray-900 mb-4">Workshop Snapshot</h2>
          <div class="space-y-3 text-sm text-gray-700">
            <div class="flex items-start gap-3">
              <font-awesome-icon icon="pound-sign" class="w-4 h-4 mt-0.5 text-rose-700" />
              <div>
                <div class="font-semibold text-gray-900">Price</div>
                <div>£{{ formattedPrice }} per person</div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <font-awesome-icon icon="users" class="w-4 h-4 mt-0.5 text-rose-700" />
              <div>
                <div class="font-semibold text-gray-900">Age Guidance</div>
                <div>{{ ageGroup || 'See booking details for attendee guidance.' }}</div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <font-awesome-icon icon="map-marker-alt" class="w-4 h-4 mt-0.5 text-rose-700" />
              <div>
                <div class="font-semibold text-gray-900">Venue</div>
                <div>{{ workshop.location_name || 'Location details to be confirmed' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="workshop.category?.description" class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-display font-bold text-gray-900 mb-3">Category Notes</h2>
          <p class="text-sm leading-relaxed text-gray-700">{{ workshop.category.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="relatedWorkshops.length > 0" class="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">More Adult Workshops</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="related in relatedWorkshops"
          :key="related.id"
          type="button"
          @click="$emit('select-related', related)"
          class="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-left hover:border-rose-300 hover:bg-rose-50 transition-colors"
        >
          <div class="text-xs font-semibold uppercase tracking-wide text-rose-700">Upcoming Session</div>
          <div class="mt-2 text-lg font-semibold text-gray-900">{{ related.offering.title }}</div>
          <div class="mt-3 space-y-1 text-sm text-gray-600">
            <div>{{ formatDate(related.event_date) }}</div>
            <div>{{ formatTime(related.event_start_time) }}</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  workshop: {
    type: Object,
    required: true
  },
  ageGroup: {
    type: String,
    default: null
  },
  duration: {
    type: String,
    default: ''
  },
  formattedDescription: {
    type: String,
    required: true
  },
  relatedWorkshops: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select-related'])

const heroImage = computed(() => {
  return props.workshop.offering.featured_image_url || props.workshop.category?.featured_image_url || null
})

const formattedPrice = computed(() => {
  const price = Number(props.workshop.price_gbp || 0)
  return price.toFixed(2)
})

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
</script>
