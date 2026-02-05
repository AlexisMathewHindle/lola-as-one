<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <font-awesome-icon icon="spinner" class="w-8 h-8 text-primary-600 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Check-In Interface -->
    <div v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <router-link :to="`/admin/events/${event.id}`" class="text-sm text-primary-600 hover:text-primary-800 mb-2 inline-block">
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Back to Event Details
          </router-link>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ event.offering.title }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            {{ formatDate(event.event_date) }} at {{ event.event_start_time }}
          </p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- Total Attendees -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Total Attendees</h3>
            <font-awesome-icon icon="users" class="w-5 h-5 text-blue-600" />
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ totalAttendees }}</p>
        </div>

        <!-- Checked In -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Checked In</h3>
            <font-awesome-icon icon="check-circle" class="w-5 h-5 text-success-600" />
          </div>
          <p class="text-3xl font-bold text-success-600">{{ checkedInCount }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ checkedInPercentage }}%</p>
        </div>

        <!-- Not Checked In -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Not Checked In</h3>
            <font-awesome-icon icon="clock" class="w-5 h-5 text-warning-600" />
          </div>
          <p class="text-3xl font-bold text-warning-600">{{ notCheckedInCount }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
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
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              v-model="filters.status" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Attendees</option>
              <option value="checked_in">Checked In</option>
              <option value="not_checked_in">Not Checked In</option>
            </select>
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

      <!-- Empty State -->
      <div v-if="filteredBookings.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <font-awesome-icon icon="users" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No attendees found</h3>
        <p class="text-gray-600">
          {{ filters.status || filters.search ? 'Try adjusting your filters' : 'No confirmed bookings for this event' }}
        </p>
      </div>

      <!-- Attendees List -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendees
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="booking in filteredBookings" :key="booking.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ booking.customer_name }}</div>
                  <div class="text-xs text-gray-500">{{ booking.customer_email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">#{{ booking.order.order_number }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ booking.number_of_attendees }} {{ booking.number_of_attendees === 1 ? 'person' : 'people' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="booking.checked_in ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ booking.checked_in ? 'Checked In' : 'Not Checked In' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="toggleCheckIn(booking)"
                    :disabled="checkingIn === booking.id"
                    class="inline-flex items-center px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
                    :class="booking.checked_in 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-success-600 text-white hover:bg-success-700'"
                  >
                    <font-awesome-icon 
                      :icon="checkingIn === booking.id ? 'spinner' : (booking.checked_in ? 'times' : 'check')" 
                      :class="{ 'animate-spin': checkingIn === booking.id }"
                      class="w-4 h-4 mr-2" 
                    />
                    {{ booking.checked_in ? 'Undo Check-In' : 'Check In' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const eventId = route.params.id
const toastStore = useToastStore()

const event = ref(null)
const bookings = ref([])
const loading = ref(true)
const error = ref(null)
const checkingIn = ref(null)

const filters = ref({
  status: '',
  search: ''
})

// Fetch event details
const fetchEvent = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings(title)
      `)
      .eq('id', eventId)
      .single()

    if (fetchError) throw fetchError

    event.value = data
  } catch (err) {
    console.error('Error fetching event:', err)
    error.value = 'Failed to load event details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch bookings
const fetchBookings = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        order:orders(order_number)
      `)
      .eq('offering_event_id', eventId)
      .eq('status', 'confirmed')
      .order('customer_name', { ascending: true })

    if (fetchError) throw fetchError

    bookings.value = data || []
  } catch (err) {
    console.error('Error fetching bookings:', err)
  }
}

// Computed properties
const totalAttendees = computed(() => {
  return bookings.value.reduce((sum, b) => sum + b.number_of_attendees, 0)
})

const checkedInCount = computed(() => {
  return bookings.value
    .filter(b => b.checked_in)
    .reduce((sum, b) => sum + b.number_of_attendees, 0)
})

const notCheckedInCount = computed(() => {
  return totalAttendees.value - checkedInCount.value
})

const checkedInPercentage = computed(() => {
  if (totalAttendees.value === 0) return 0
  return Math.round((checkedInCount.value / totalAttendees.value) * 100)
})

// Filtered bookings
const filteredBookings = computed(() => {
  return bookings.value.filter(booking => {
    // Status filter
    if (filters.value.status === 'checked_in' && !booking.checked_in) {
      return false
    }
    if (filters.value.status === 'not_checked_in' && booking.checked_in) {
      return false
    }

    // Search filter
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      return (
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.customer_email.toLowerCase().includes(searchLower) ||
        booking.order.order_number.toLowerCase().includes(searchLower)
      )
    }

    return true
  })
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(filters.value.status || filters.value.search)
})

// Clear all filters
const clearFilters = () => {
  filters.value.status = ''
  filters.value.search = ''
}

// Toggle check-in
const toggleCheckIn = async (booking) => {
  try {
    checkingIn.value = booking.id

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        checked_in: !booking.checked_in,
        checked_in_at: !booking.checked_in ? new Date().toISOString() : null
      })
      .eq('id', booking.id)

    if (updateError) throw updateError

    // Update local state
    booking.checked_in = !booking.checked_in
    booking.checked_in_at = booking.checked_in ? new Date().toISOString() : null
  } catch (err) {
    console.error('Error updating check-in status:', err)
    toastStore.error('Failed to update check-in status. Please try again.')
  } finally {
    checkingIn.value = null
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

onMounted(async () => {
  await fetchEvent()
  await fetchBookings()
})
</script>

