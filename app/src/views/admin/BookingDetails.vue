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

    <!-- Booking Details -->
    <div v-else-if="booking">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <router-link to="/admin/events/bookings" class="text-sm text-primary-600 hover:text-primary-800 mb-2 inline-block">
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Back to Bookings
          </router-link>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Booking #{{ booking.orders?.order_number || 'N/A' }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            Booked on {{ formatDateTime(booking.created_at) }}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            v-if="booking.status === 'confirmed'"
            @click="cancelBooking"
            :disabled="cancelling"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50"
          >
            <font-awesome-icon :icon="cancelling ? 'spinner' : 'times'" :class="{ 'animate-spin': cancelling }" class="w-4 h-4 mr-2" />
            Cancel Booking
          </button>
        </div>
      </div>

      <!-- Status Banner -->
      <div 
        v-if="booking.status === 'cancelled'"
        class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
      >
        <div class="flex items-start">
          <font-awesome-icon icon="times-circle" class="w-5 h-5 text-red-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-sm font-semibold text-red-900">Booking Cancelled</h3>
            <p class="text-sm text-red-700 mt-1">
              Cancelled on {{ formatDateTime(booking.cancelled_at) }}
            </p>
            <p v-if="booking.cancel_reason" class="text-sm text-red-700 mt-1">
              Reason: {{ booking.cancel_reason }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Booking Info -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Booking Information</h2>
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-gray-600">Event</p>
              <p class="text-sm text-gray-900 font-medium">{{ booking.offering_events?.offerings?.title || 'N/A' }}</p>
              <p class="text-xs text-gray-500">
                {{ formatDate(booking.offering_events?.event_date) }} at {{ booking.offering_events?.event_start_time || 'N/A' }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Location</p>
              <p class="text-sm text-gray-900">{{ booking.offering_events?.location_name || 'N/A' }}</p>
              <p v-if="booking.offering_events?.location_address" class="text-xs text-gray-500">
                {{ booking.offering_events.location_address }}, {{ booking.offering_events.location_city }} {{ booking.offering_events.location_postcode }}
              </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-600">Number of Attendees</p>
                <p class="text-sm text-gray-900">{{ booking.number_of_attendees }} {{ booking.number_of_attendees === 1 ? 'person' : 'people' }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Status</p>
                <span
                  class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(booking.status)"
                >
                  {{ booking.status }}
                </span>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Total Price</p>
              <p class="text-lg font-bold text-gray-900">
                £{{ (booking.number_of_attendees * (booking.offering_events?.price_gbp || 0)).toFixed(2) }}
              </p>
              <p class="text-xs text-gray-500">
                £{{ booking.offering_events?.price_gbp || 0 }} per person (+ {{ booking.offering_events?.vat_rate || 0 }}% VAT)
              </p>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div class="space-y-4">
            <div>
              <p class="text-sm font-medium text-gray-600">Name</p>
              <p class="text-sm text-gray-900">{{ booking.customer_name }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Email</p>
              <a :href="`mailto:${booking.customer_email}`" class="text-sm text-primary-600 hover:text-primary-800">
                {{ booking.customer_email }}
              </a>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Order Number</p>
              <p class="text-sm text-gray-900">#{{ booking.orders?.order_number || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600">Booking ID</p>
              <p class="text-xs text-gray-500 font-mono">{{ booking.id }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendees List -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Attendees ({{ attendees.length }})</h2>
        </div>

        <!-- Empty State -->
        <div v-if="attendees.length === 0" class="p-12 text-center">
          <font-awesome-icon icon="users" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No attendee details</h3>
          <p class="text-gray-600">Individual attendee information has not been provided for this booking</p>
        </div>

        <!-- Attendees Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="attendee in attendees" :key="attendee.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ attendee.first_name }} {{ attendee.last_name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ attendee.email || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ attendee.phone || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ attendee.notes || 'N/A' }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Cancel Booking Modal -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Cancel Booking</h3>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason (Optional)</label>
          <textarea
            v-model="cancelReason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter reason for cancellation..."
          ></textarea>
        </div>
        <div class="flex gap-3">
          <button
            @click="showCancelModal = false"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Keep Booking
          </button>
          <button
            @click="confirmCancel"
            :disabled="cancelling"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {{ cancelling ? 'Cancelling...' : 'Cancel Booking' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const router = useRouter()
const bookingId = route.params.id
const toastStore = useToastStore()

const booking = ref(null)
const attendees = ref([])
const loading = ref(true)
const error = ref(null)
const showCancelModal = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)

// Fetch booking details
const fetchBooking = async () => {
  try {
    loading.value = true
    error.value = null

    console.log('Fetching booking with ID:', bookingId)

    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        orders(order_number),
        offering_events(
          *,
          offerings(title)
        )
      `)
      .eq('id', bookingId)
      .single()

    console.log('Booking data:', data)
    console.log('Booking error:', fetchError)

    if (fetchError) throw fetchError

    booking.value = data
  } catch (err) {
    console.error('Error fetching booking:', err)
    error.value = 'Failed to load booking details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch attendees
const fetchAttendees = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('booking_attendees')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError

    attendees.value = data || []
  } catch (err) {
    console.error('Error fetching attendees:', err)
  }
}

// Cancel booking
const cancelBooking = () => {
  showCancelModal.value = true
}

const confirmCancel = async () => {
  try {
    cancelling.value = true

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason.value || null
      })
      .eq('id', bookingId)

    if (updateError) throw updateError

    // Refresh booking data
    await fetchBooking()
    showCancelModal.value = false
    cancelReason.value = ''
  } catch (err) {
    console.error('Error cancelling booking:', err)
    toastStore.error('Failed to cancel booking. Please try again.')
  } finally {
    cancelling.value = false
  }
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
    month: 'long',
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

onMounted(async () => {
  await fetchBooking()
  await fetchAttendees()
})
</script>

