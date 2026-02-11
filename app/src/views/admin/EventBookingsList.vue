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
        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            v-model="filters.categoryId"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Categories</option>
            <option
              v-for="category in hierarchicalCategories"
              :key="category.id"
              :value="category.id"
              :class="{ 'pl-4': category.level === 1 }"
            >
              {{ category.level === 1 ? '— ' : '' }}{{ category.name }}
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
        {{ filters.categoryId || filters.status || filters.eventDate || filters.search ? 'Try adjusting your filters' : 'Bookings will appear here once customers book events' }}
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
                <div class="text-sm font-medium text-gray-900">{{ booking.offering_event?.offering?.title || 'N/A' }}</div>
                <div class="text-xs text-gray-500">
                  {{ formatDate(booking.offering_event?.event_date) }} at {{ booking.offering_event?.event_start_time || 'N/A' }}
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
                <div class="flex items-center justify-end space-x-3">
                  <!-- View Event Attendees button -->
                  <router-link
                    v-if="booking.offering_event?.id"
                    :to="`/admin/events/${booking.offering_event.id}`"
                    class="text-blue-600 hover:text-blue-800 transition-colors"
                    title="View Event Attendees"
                  >
                    <font-awesome-icon icon="users" class="w-4 h-4" />
                  </router-link>
                  <!-- View Booking Details -->
                  <router-link
                    :to="`/admin/bookings/${booking.id}`"
                    class="text-primary-600 hover:text-primary-800 transition-colors whitespace-nowrap"
                  >
                    View
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { useEventCategories } from '../../composables/useEventCategories'

const bookings = ref([])
const loading = ref(true)
const error = ref(null)

// Use event categories composable
const { categories, hierarchicalCategories, fetchCategories } = useEventCategories()

const filters = ref({
  categoryId: '',
  status: '',
  eventDate: '',
  search: ''
})

// Fetch bookings with server-side filtering
const fetchBookings = async () => {
  try {
    loading.value = true
    error.value = null

    let query = supabase
      .from('bookings')
      .select(`
        *,
        order:orders(order_number),
        offering_event:offering_events(
          id,
          event_date,
          event_start_time,
          category_id,
          offering:offerings(title)
        )
      `)

    // Apply status filter at database level
    if (filters.value.status) {
      query = query.eq('status', filters.value.status)
    }

    // Apply search filter at database level
    if (filters.value.search) {
      const searchTerm = `%${filters.value.search}%`
      query = query.or(`customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm}`)
    }

    const { data, error: fetchError } = await query.order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    // Debug: Check for bookings with missing offering_event
    const missingEvents = (data || []).filter(b => !b.offering_event)
    if (missingEvents.length > 0) {
      console.warn(`⚠️  Found ${missingEvents.length} bookings with missing offering_event:`, missingEvents.slice(0, 3))
    }

    // Apply client-side filters (for nested relations that can't be filtered server-side)
    let filteredData = data || []

    // Category filter
    if (filters.value.categoryId) {
      filteredData = filteredData.filter(booking =>
        booking.offering_event?.category_id === filters.value.categoryId
      )
    }

    // Date filter
    if (filters.value.eventDate) {
      filteredData = filteredData.filter(booking =>
        booking.offering_event?.event_date === filters.value.eventDate
      )
    }

    bookings.value = filteredData
  } catch (err) {
    console.error('Error fetching bookings:', err)
    error.value = 'Failed to load bookings. Please try again.'
  } finally {
    loading.value = false
  }
}

// Use bookings directly (no computed filter needed since we filter server-side)
const filteredBookings = computed(() => bookings.value)

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(filters.value.categoryId || filters.value.status || filters.value.eventDate || filters.value.search)
})

// Clear all filters
const clearFilters = () => {
  filters.value.categoryId = ''
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

// Watch filters and refetch when they change
watch(
  () => [filters.value.categoryId, filters.value.status, filters.value.eventDate, filters.value.search],
  () => {
    fetchBookings()
  }
)

onMounted(async () => {
  await Promise.all([
    fetchBookings(),
    fetchCategories({ activeOnly: true })
  ])
})
</script>

