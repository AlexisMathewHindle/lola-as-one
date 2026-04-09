<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div v-if="workshop.offering.featured_image_url" class="aspect-video bg-gray-100">
        <img
          :src="workshop.offering.featured_image_url"
          :alt="workshop.offering.title"
          class="w-full h-full object-cover"
        />
      </div>
      <div v-else class="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
        <font-awesome-icon icon="palette" class="w-24 h-24 text-primary-400" />
      </div>

      <div class="p-6 sm:p-8">
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-if="workshop.category?.name"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700"
          >
            {{ workshop.category.name }}
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {{ layoutLabel }}
          </span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
          {{ workshop.offering.title }}
        </h1>

        <p v-if="workshop.offering.description_short" class="text-lg text-gray-600 mb-6">
          {{ workshop.offering.description_short }}
        </p>

        <div
          v-if="layoutLabel === 'Enquiry Only'"
          class="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800"
        >
          This event is booked by enquiry. Use the email option on the right to check availability and arrange details.
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div class="flex items-start">
            <font-awesome-icon icon="calendar" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
            <div>
              <div class="text-sm font-medium text-gray-500">Date</div>
              <div class="text-base font-semibold text-gray-900">{{ formatDate(workshop.event_date) }}</div>
            </div>
          </div>

          <div class="flex items-start">
            <font-awesome-icon icon="clock" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
            <div>
              <div class="text-sm font-medium text-gray-500">Time</div>
              <div class="text-base font-semibold text-gray-900">
                {{ formatTimeRange(workshop.event_start_time, workshop.event_end_time) }}
                <span v-if="duration" class="text-sm text-gray-500">({{ duration }})</span>
              </div>
            </div>
          </div>

          <div class="flex items-start">
            <font-awesome-icon icon="map-marker-alt" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
            <div>
              <div class="text-sm font-medium text-gray-500">Location</div>
              <div class="text-base font-semibold text-gray-900">{{ workshop.location_name || 'TBA' }}</div>
              <div v-if="workshop.location_city" class="text-sm text-gray-600">
                {{ workshop.location_city }}{{ workshop.location_postcode ? ', ' + workshop.location_postcode : '' }}
              </div>
            </div>
          </div>

          <div v-if="ageGroup" class="flex items-start">
            <font-awesome-icon icon="users" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
            <div>
              <div class="text-sm font-medium text-gray-500">Age Group</div>
              <div class="text-base font-semibold text-gray-900">{{ ageGroup }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">About This Workshop</h2>
      <div class="prose max-w-none text-gray-700" v-html="formattedDescription"></div>
    </div>

    <div v-if="relatedWorkshops.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">More Workshops</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="related in relatedWorkshops"
          :key="related.id"
          @click="$emit('select-related', related)"
          class="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
        >
          <h3 class="font-semibold text-gray-900 mb-2">{{ related.offering.title }}</h3>
          <div class="text-sm text-gray-600 space-y-1">
            <div class="flex items-center">
              <font-awesome-icon icon="calendar" class="w-3 h-3 mr-2" />
              {{ formatDate(related.event_date) }}
            </div>
            <div class="flex items-center">
              <font-awesome-icon icon="clock" class="w-3 h-3 mr-2" />
              {{ formatTime(related.event_start_time) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getWorkshopLayoutLabel } from '../../utils/workshopDisplay'

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

const layoutLabel = computed(() => getWorkshopLayoutLabel(props.workshop))

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
