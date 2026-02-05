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

    <!-- Event Details -->
    <div v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <router-link to="/admin/events/bookings" class="text-sm text-primary-600 hover:text-primary-800 mb-2 inline-block">
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Back to Bookings
          </router-link>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ event.offering.title }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            {{ formatDate(event.event_date) }} at {{ event.event_start_time }}
          </p>
        </div>
        <router-link
          :to="`/admin/events/${event.id}/checkin`"
          class="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
        >
          <font-awesome-icon icon="check" class="w-4 h-4 mr-2" />
          Check-In
        </router-link>
      </div>

      <!-- Event Info Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Capacity -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Capacity</h3>
            <font-awesome-icon icon="users" class="w-5 h-5 text-blue-600" />
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ capacity.spaces_booked }} / {{ capacity.total_capacity }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ capacity.spaces_available }} spaces available</p>
        </div>

        <!-- Bookings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Bookings</h3>
            <font-awesome-icon icon="calendar" class="w-5 h-5 text-success-600" />
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ bookings.length }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ confirmedBookings }} confirmed</p>
        </div>

        <!-- Waitlist -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Waitlist</h3>
            <font-awesome-icon icon="clock" class="w-5 h-5 text-warning-600" />
          </div>
          <p class="text-3xl font-bold text-gray-900">{{ capacity.waitlist_count || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ capacity.waitlist_enabled ? 'Enabled' : 'Disabled' }}</p>
        </div>

        <!-- Revenue -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-600">Revenue</h3>
            <font-awesome-icon icon="pound-sign" class="w-5 h-5 text-primary-600" />
          </div>
          <p class="text-3xl font-bold text-gray-900">£{{ totalRevenue.toFixed(2) }}</p>
          <p class="text-xs text-gray-500 mt-1">From confirmed bookings</p>
        </div>
      </div>

      <!-- Event Details Card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-600">Date & Time</p>
            <p class="text-sm text-gray-900">{{ formatDate(event.event_date) }} at {{ event.event_start_time }}</p>
            <p v-if="event.event_end_time" class="text-xs text-gray-500">Ends at {{ event.event_end_time }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Location</p>
            <p class="text-sm text-gray-900">{{ event.location_name || 'N/A' }}</p>
            <p v-if="event.location_address" class="text-xs text-gray-500">
              {{ event.location_address }}, {{ event.location_city }} {{ event.location_postcode }}
            </p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Price</p>
            <p class="text-sm text-gray-900">£{{ event.price_gbp }} (+ {{ event.vat_rate }}% VAT)</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Status</p>
            <span
              class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
              :class="getStatusClass(event.offering.status)"
            >
              {{ event.offering.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Attendees List -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Attendees ({{ totalAttendees }})</h2>
        </div>

        <!-- Empty State -->
        <div v-if="bookings.length === 0" class="p-12 text-center">
          <font-awesome-icon icon="users" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
          <p class="text-gray-600">Bookings will appear here once customers book this event</p>
        </div>

        <!-- Bookings Table -->
        <div v-else class="overflow-x-auto">
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
              <tr v-for="booking in bookings" :key="booking.id" class="hover:bg-gray-50 transition-colors">
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
                    :class="getBookingStatusClass(booking.status)"
                  >
                    {{ booking.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <router-link
                    :to="`/admin/bookings/${booking.id}`"
                    class="text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    <font-awesome-icon icon="eye" class="w-4 h-4" />
                  </router-link>
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

const route = useRoute()
const eventId = route.params.id

const event = ref(null)
const capacity = ref(null)
const bookings = ref([])
const loading = ref(true)
const error = ref(null)

// Fetch event details
const fetchEvent = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings(*)
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

// Fetch capacity
const fetchCapacity = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('event_capacity')
      .select('*')
      .eq('offering_event_id', eventId)
      .single()

    if (fetchError) throw fetchError

    capacity.value = data
  } catch (err) {
    console.error('Error fetching capacity:', err)
    // Set default capacity if not found
    capacity.value = {
      total_capacity: event.value?.max_capacity || 0,
      spaces_booked: 0,
      spaces_reserved: 0,
      spaces_available: event.value?.max_capacity || 0,
      waitlist_enabled: false,
      waitlist_count: 0
    }
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
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    bookings.value = data || []
  } catch (err) {
    console.error('Error fetching bookings:', err)
  }
}

// Computed properties
const confirmedBookings = computed(() => {
  return bookings.value.filter(b => b.status === 'confirmed').length
})

const totalAttendees = computed(() => {
  return bookings.value
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.number_of_attendees, 0)
})

const totalRevenue = computed(() => {
  if (!event.value) return 0
  return bookings.value
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.number_of_attendees * event.value.price_gbp), 0)
})

// Status badge classes
const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    published: 'bg-success-100 text-success-800',
    archived: 'bg-warning-100 text-warning-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getBookingStatusClass = (status) => {
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
    month: 'long',
    year: 'numeric'
  })
}

onMounted(async () => {
  await fetchEvent()
  await fetchCapacity()
  await fetchBookings()
})
</script>

