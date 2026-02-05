<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Event Bookings</h1>
        <p class="text-sm text-gray-600 mt-1">
          Manage all workshop and event bookings
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900">Filters</h3>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Event Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Event</label>
          <select
            v-model="filters.eventId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Events</option>
            <option v-for="event in events" :key="event.id" :value="event.id">
              {{ event.offering.title }} - {{ formatDate(event.event_date) }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>

        <!-- Date Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
          <input
            v-model="filters.eventDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Customer name or email..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <font-awesome-icon icon="spinner" class="w-8 h-8 text-primary-600 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredBookings.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <font-awesome-icon icon="calendar" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
      <p class="text-gray-600">
        {{ filters.eventId || filters.status || filters.eventDate || filters.search ? 'Try adjusting your filters' : 'Bookings will appear here once customers book events' }}
      </p>
    </div>

    <!-- Bookings Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendees
              </th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booked
              </th>
              <th class="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="booking in filteredBookings" :key="booking.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 sm:px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ booking.offering_event.offering.title }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(booking.offering_event.event_date) }} at {{ booking.offering_event.event_start_time }}
                </div>
                <div class="md:hidden text-xs text-gray-500 mt-1">
                  {{ booking.customer_name }}
                </div>
              </td>
              <td class="hidden md:table-cell px-4 sm:px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ booking.customer_name }}</div>
                <div class="text-xs text-gray-500">{{ booking.customer_email }}</div>
              </td>
              <td class="hidden lg:table-cell px-4 sm:px-6 py-4">
                <div class="text-sm text-gray-900">{{ booking.number_of_attendees }} {{ booking.number_of_attendees === 1 ? 'person' : 'people' }}</div>
              </td>
              <td class="px-4 sm:px-6 py-4">
                <span
                  class="px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(booking.status)"
                >
                  {{ booking.status }}
                </span>
                <div class="lg:hidden text-xs text-gray-500 mt-1">
                  {{ booking.number_of_attendees }} {{ booking.number_of_attendees === 1 ? 'person' : 'people' }}
                </div>
              </td>
              <td class="hidden xl:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                {{ formatDateTime(booking.created_at) }}
              </td>
              <td class="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                <router-link
                  :to="`/admin/bookings/${booking.id}`"
                  class="text-primary-600 hover:text-primary-800 transition-colors whitespace-nowrap"
                >
                  View
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const bookings = ref([])
const events = ref([])
const loading = ref(true)
const error = ref(null)

const filters = ref({
  eventId: '',
  status: '',
  eventDate: '',
  search: ''
})

// Fetch all bookings
const fetchBookings = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        order:orders(order_number),
        offering_event:offering_events(
          id,
          event_date,
          event_start_time,
          offering:offerings(title)
        )
      `)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    bookings.value = data || []
  } catch (err) {
    console.error('Error fetching bookings:', err)
    error.value = 'Failed to load bookings. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch all events for filter dropdown
const fetchEvents = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        id,
        event_date,
        offering:offerings(title)
      `)
      .order('event_date', { ascending: false })

    if (fetchError) throw fetchError

    events.value = data || []
  } catch (err) {
    console.error('Error fetching events:', err)
  }
}

// Filtered bookings
const filteredBookings = computed(() => {
  return bookings.value.filter(booking => {
    // Event filter
    if (filters.value.eventId && booking.offering_event_id !== filters.value.eventId) {
      return false
    }

    // Status filter
    if (filters.value.status && booking.status !== filters.value.status) {
      return false
    }

    // Date filter - exact date match
    if (filters.value.eventDate) {
      // Compare just the date part (YYYY-MM-DD) to avoid timezone issues
      const eventDate = booking.offering_event.event_date
      if (eventDate !== filters.value.eventDate) {
        return false
      }
    }

    // Search filter
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      return (
        booking.customer_name?.toLowerCase().includes(searchLower) ||
        booking.customer_email?.toLowerCase().includes(searchLower) ||
        booking.order?.order_number?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(filters.value.eventId || filters.value.status || filters.value.eventDate || filters.value.search)
})

// Clear all filters
const clearFilters = () => {
  filters.value.eventId = ''
  filters.value.status = ''
  filters.value.eventDate = ''
  filters.value.search = ''
}

// Status badge classes
const getStatusClass = (status) => {
  const classes = {
    confirmed: 'bg-success-100 text-success-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-warning-100 text-warning-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchBookings()
  fetchEvents()
})
</script>

