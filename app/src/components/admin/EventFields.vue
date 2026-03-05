<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>

    <!-- Term Information Section -->
    <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
      <div class="flex items-start mb-3">
        <font-awesome-icon icon="calendar-alt" class="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-gray-900 mb-1">Term Information</h4>
          <p class="text-xs text-gray-600">
            For term-based events, specify the season and half. Leave blank for single/one-off events.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Season -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Season
          </label>
          <select
            :value="modelValue.term_season || ''"
            @change="handleTermChange('term_season', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Single Event (No Term)</option>
            <option value="autumn">Autumn</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
          </select>
        </div>

        <!-- Half -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Half
          </label>
          <select
            :value="modelValue.term_half || ''"
            @change="handleTermChange('term_half', $event.target.value)"
            :disabled="!modelValue.term_season"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Half</option>
            <option value="first">First Half</option>
            <option value="second">Second Half</option>
            <option value="full">Full Term</option>
          </select>
        </div>

        <!-- Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <input
            :value="modelValue.term_year || currentYear"
            @input="handleTermChange('term_year', parseInt($event.target.value) || null)"
            type="number"
            :min="currentYear"
            :max="currentYear + 2"
            :disabled="!modelValue.term_season"
            placeholder="e.g., 2025"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
        </div>
      </div>

      <!-- Term Display -->
      <div v-if="termLabel" class="mt-3 p-3 bg-white rounded-md border border-purple-200">
        <p class="text-sm text-gray-700">
          <span class="font-medium">Term Label:</span>
          <span class="text-purple-700 font-semibold">{{ termLabel }}</span>
        </p>
        <p class="text-xs text-gray-500 mt-1">
          <span class="font-medium">Legacy Format:</span>
          <code class="bg-gray-100 px-2 py-0.5 rounded">{{ legacyTermString }}</code>
        </p>
      </div>
    </div>

    <!-- Event Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Event Date <span class="text-red-500">*</span>
      </label>
      <input
        :value="modelValue.event_date"
        @input="updateField('event_date', $event.target.value)"
        type="date"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
    </div>
    
    <!-- Time Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Start Time <span class="text-red-500">*</span>
        </label>
        <input
          :value="modelValue.event_start_time"
          @input="updateField('event_start_time', $event.target.value)"
          type="time"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          End Time
        </label>
        <input
          :value="modelValue.event_end_time"
          @input="updateField('event_end_time', $event.target.value)"
          type="time"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
    </div>
    
    <!-- Location Fields -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Location Name
      </label>
      <input
        :value="modelValue.location_name"
        @input="updateField('location_name', $event.target.value)"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="e.g., Lola Creative Space"
      >
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Address
      </label>
      <input
        :value="modelValue.location_address"
        @input="updateField('location_address', $event.target.value)"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Street address"
      >
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          City
        </label>
        <input
          :value="modelValue.location_city"
          @input="updateField('location_city', $event.target.value)"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Postcode
        </label>
        <input
          :value="modelValue.location_postcode"
          @input="updateField('location_postcode', $event.target.value)"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
    </div>
    
    <!-- Capacity and Price -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Max Capacity (Physical Limit) <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            :value="modelValue.max_capacity"
            @input="updateField('max_capacity', parseInt($event.target.value) || 0)"
            type="number"
            required
            :min="Math.max(modelValue.current_bookings || 0, modelValue.available_spaces || 0, 1)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., 12"
          >
        </div>
        <p class="text-xs text-gray-500 mt-1">
          The maximum physical capacity of the venue/space
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Price (£) <span class="text-red-500">*</span>
        </label>
        <input
          :value="modelValue.price_gbp"
          @input="updateField('price_gbp', parseFloat($event.target.value) || 0)"
          type="number"
          required
          min="0"
          step="0.01"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., 45.00"
        >
      </div>
    </div>

    <!-- Available Spaces (Inventory Control) -->
    <div class="border-t border-gray-200 pt-4">
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div class="flex items-start mb-3">
          <font-awesome-icon icon="warehouse" class="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-gray-900 mb-1">Available Spaces (Inventory Control)</h4>
            <p class="text-xs text-gray-600">
              Control how many spaces are available for booking. Set this lower than max capacity to limit sales.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Available Spaces <span class="text-red-500">*</span>
            </label>
            <input
              :value="modelValue.available_spaces"
              @input="updateField('available_spaces', parseInt($event.target.value) || 0)"
              type="number"
              required
              :min="modelValue.current_bookings || 0"
              :max="modelValue.max_capacity"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              :class="{ 'border-yellow-400 bg-yellow-50': modelValue.available_spaces < modelValue.max_capacity }"
              placeholder="e.g., 10"
            >
            <div class="mt-2 space-y-1">
              <p class="text-xs text-gray-600">
                <span class="font-medium">Current bookings:</span> {{ modelValue.current_bookings || 0 }}
              </p>
              <p class="text-xs text-gray-600">
                <span class="font-medium">Spaces remaining:</span>
                <span :class="spacesRemaining <= 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'">
                  {{ spacesRemaining }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center">
            <div class="bg-white rounded-lg p-4 border border-gray-200 w-full">
              <div class="text-xs text-gray-600 space-y-2">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span><strong>Max Capacity:</strong> {{ modelValue.max_capacity || 0 }}</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span><strong>Available:</strong> {{ modelValue.available_spaces || 0 }}</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span><strong>Booked:</strong> {{ modelValue.current_bookings || 0 }}</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                  <span><strong>Remaining:</strong> {{ spacesRemaining }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Warning if available < max -->
        <div v-if="modelValue.available_spaces < modelValue.max_capacity" class="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
          <div class="flex items-start">
            <font-awesome-icon icon="exclamation-triangle" class="w-4 h-4 text-yellow-700 mt-0.5 mr-2 flex-shrink-0" />
            <p class="text-xs text-yellow-800">
              <strong>Limited availability:</strong> You're only making {{ modelValue.available_spaces }} out of {{ modelValue.max_capacity }} spaces available for booking.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Category Metadata -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Category
      </label>
      <select
        :value="modelValue.category_id"
        @input="updateField('category_id', $event.target.value)"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Select category...</option>
        <optgroup
          v-for="parent in parentCategories"
          :key="parent.id"
          :label="parent.name"
        >
          <option :value="parent.id">{{ parent.name }}</option>
          <option
            v-for="child in getChildCategories(parent.id)"
            :key="child.id"
            :value="child.id"
            class="pl-4"
          >
            &nbsp;&nbsp;{{ child.name }}
          </option>
        </optgroup>
      </select>
      <p v-if="categoriesLoading" class="text-xs text-gray-500 mt-1">
        Loading categories...
      </p>
      <p v-if="categoriesError" class="text-xs text-red-500 mt-1">
        Error loading categories: {{ categoriesError }}
      </p>
    </div>

    <!-- Waitlist Settings -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
        <input
          :checked="modelValue.waitlist_enabled"
          @change="updateField('waitlist_enabled', $event.target.checked)"
          type="checkbox"
          id="waitlist_enabled"
          class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-all"
        >
        <label for="waitlist_enabled" class="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
          <font-awesome-icon icon="clock" class="w-4 h-4 text-blue-600 mr-1" />
          Enable waitlist when event is fully booked
        </label>
      </div>
      <p class="text-xs text-gray-500 mt-2 ml-1">
        When enabled, customers can join a waitlist if the event reaches max capacity. They'll be automatically notified if a spot becomes available.
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, computed } from 'vue'
import { useEventCategories } from '../../composables/useEventCategories'
import { formatTermLabel, generateLegacyTerm } from '../../utils/termFormatters'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      event_date: '',
      event_start_time: '',
      event_end_time: '',
      location_name: '',
      location_address: '',
      location_city: '',
      location_postcode: '',
      max_capacity: 12,
      available_spaces: 12,
      price_gbp: 0,
      category_id: '',
      current_bookings: 0,
      waitlist_enabled: false,
      term_season: null,
      term_half: null,
      term_year: null
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Event categories composable
const {
  parentCategories,
  getChildCategories,
  fetchCategories,
  loading: categoriesLoading,
  error: categoriesError
} = useEventCategories()

// Current year for term year input
const currentYear = new Date().getFullYear()

// Term label for display
const termLabel = computed(() => {
  if (!props.modelValue.term_season || !props.modelValue.term_half) {
    return null
  }
  return formatTermLabel({
    term_season: props.modelValue.term_season,
    term_half: props.modelValue.term_half,
    term_year: props.modelValue.term_year
  })
})

// Legacy term string for backward compatibility
const legacyTermString = computed(() => {
  if (!props.modelValue.term_season || !props.modelValue.term_half) {
    return null
  }
  return generateLegacyTerm(
    props.modelValue.term_season,
    props.modelValue.term_half
  )
})

// Computed property for available spaces (old - based on max_capacity)
const availableSpaces = computed(() => {
  const capacity = props.modelValue.max_capacity || 0
  const booked = props.modelValue.current_bookings || 0
  return Math.max(0, capacity - booked)
})

// Computed property for spaces remaining (new - based on available_spaces)
const spacesRemaining = computed(() => {
  const available = props.modelValue.available_spaces || 0
  const booked = props.modelValue.current_bookings || 0
  return Math.max(0, available - booked)
})

// Fetch categories on mount
onMounted(async () => {
  await fetchCategories({ activeOnly: true })
})

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

// Handle term field changes
const handleTermChange = (field, value) => {
  const updates = { [field]: value || null }

  // If season is cleared, clear half and year too
  if (field === 'term_season' && !value) {
    updates.term_half = null
    updates.term_year = null
  }

  // If season is set and year is not set, default to current year
  if (field === 'term_season' && value && !props.modelValue.term_year) {
    updates.term_year = currentYear
  }

  // If half is cleared, clear year too
  if (field === 'term_half' && !value) {
    updates.term_year = null
  }

  emit('update:modelValue', {
    ...props.modelValue,
    ...updates
  })
}
</script>

