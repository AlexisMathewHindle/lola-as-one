<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <font-awesome-icon icon="spinner" class="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p class="text-gray-600">{{ loadingMessage }}</p>
      </div>

      <!-- Pending State -->
      <div v-else-if="pending" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
        <div class="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <font-awesome-icon icon="spinner" class="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
          Finalising Your Order
        </h1>
        <p class="text-gray-600 mb-2">
          Stripe has confirmed your payment. We are waiting for the booking record to finish processing.
        </p>
        <p class="text-sm text-gray-500">
          This page will refresh automatically.
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
        <div class="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <font-awesome-icon icon="exclamation-triangle" class="w-12 h-12 text-red-600" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
          Order Not Found
        </h1>
        <p class="text-gray-600 mb-6">
          {{ error }}
        </p>
        <router-link
          to="/shop"
          class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          <font-awesome-icon icon="shopping-bag" class="w-4 h-4 mr-2" />
          Continue Shopping
        </router-link>
      </div>

      <!-- Success State -->
      <div v-else class="space-y-6">
        <!-- Success Message -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-primary-500 p-6 sm:p-8">
          <div class="text-center">
            <!-- Success Icon -->
            <div class="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-success-100 rounded-full flex items-center justify-center">
              <font-awesome-icon icon="check-circle" class="w-10 h-10 sm:w-12 sm:h-12 text-success-600" />
            </div>

            <!-- Success Heading -->
            <h1 class="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
              Your booking is confirmed
            </h1>
            <p class="text-base sm:text-lg text-gray-600 mb-6">
              We have received your payment and saved your order details.
            </p>

            <div class="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 text-left sm:grid-cols-3 sm:divide-x sm:divide-gray-200">
              <div class="p-4">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Order number</p>
                <p class="mt-1 text-base font-bold text-gray-900">{{ orderNumber }}</p>
              </div>
              <div class="p-4">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Total paid</p>
                <p class="mt-1 text-base font-bold text-gray-900">£{{ total.toFixed(2) }}</p>
              </div>
              <div class="p-4">
                <p class="text-xs font-medium uppercase tracking-wide text-gray-500">Placed on</p>
                <p class="mt-1 text-base font-bold text-gray-900">{{ formatDateTime(createdAt) }}</p>
              </div>
            </div>

            <!-- Email Confirmation Notice -->
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-start gap-3">
                <font-awesome-icon icon="envelope" class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div class="text-left">
                  <p class="text-sm font-semibold text-blue-900 mb-1">
                    Confirmation Email Sent
                  </p>
                  <p class="text-sm text-blue-700">
                    We've sent a confirmation email to <span class="font-semibold">{{ customerEmail }}</span> with your order details and receipt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
            Order Summary
          </h2>

          <!-- Order Items -->
          <div class="space-y-4 mb-6">
            <div
              v-for="item in displayOrderItems"
              :key="item.id"
              class="flex flex-col gap-4 pb-5 border-b border-gray-200 last:border-0 last:pb-0 sm:flex-row"
            >
              <!-- Item Icon/Image -->
              <div class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                  <font-awesome-icon
                    :icon="getItemIcon(item.item_type)"
                    class="w-6 h-6 text-white"
                  />
                </div>
              </div>

              <!-- Item Details -->
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-gray-900 mb-1">
                  {{ item.title }}
                </h3>
                <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="getItemTypeBadgeClass(item.item_type)">
                    {{ getItemTypeLabel(item.item_type) }}
                  </span>
                  <span v-if="item.quantity > 1">Qty: {{ item.quantity }}</span>
                  <span v-if="item.event_date" class="flex items-center gap-1">
                    <font-awesome-icon icon="calendar" class="w-3 h-3" />
                    {{ formatDate(item.event_date) }}
                  </span>
                  <span v-if="item.event_start_time" class="flex items-center gap-1">
                    <font-awesome-icon icon="clock" class="w-3 h-3" />
                    {{ formatTime(item.event_start_time) }}
                  </span>
                </div>

                <div v-if="item.attendees && item.attendees.length" class="mt-3">
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Attendees
                  </p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="(attendee, attendeeIndex) in item.attendees"
                      :key="attendee.id || `${item.id}-attendee-${attendeeIndex}`"
                      class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
                    >
                      {{ attendeeFullName(attendee, attendeeIndex) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Item Price -->
              <div class="text-right flex-shrink-0">
                <p class="text-base font-semibold text-gray-900">
                  £{{ item.total_price_gbp.toFixed(2) }}
                </p>
                <p v-if="item.quantity > 1" class="text-xs text-gray-500">
                  £{{ item.unit_price_gbp.toFixed(2) }} each
                </p>
              </div>
            </div>
          </div>

          <!-- Totals -->
          <div class="border-t border-gray-200 pt-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Subtotal</span>
              <span class="font-semibold text-gray-900">£{{ subtotal.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Shipping</span>
              <span class="font-semibold text-gray-900">
                {{ shipping === 0 ? 'FREE' : `£${shipping.toFixed(2)}` }}
              </span>
            </div>

            <div v-if="discountAmount > 0" class="flex justify-between text-sm">
              <span class="text-gray-600">Discount</span>
              <span class="font-semibold text-green-700">-£{{ discountAmount.toFixed(2) }}</span>
            </div>

            <div class="flex justify-between text-xs text-gray-500">
              <span>VAT (20% included)</span>
              <span>£{{ vat.toFixed(2) }}</span>
            </div>

            <div class="border-t border-gray-200 pt-2 flex justify-between">
              <span class="text-base font-bold text-gray-900">Total Paid</span>
              <span class="text-base font-bold text-gray-900">£{{ total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Booking Details -->
        <div v-if="eventBookings.length" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-xl font-display font-bold text-gray-900">
                Workshop Details
              </h2>
              <p class="mt-1 text-sm text-gray-600">
                {{ totalBookedAttendees }} {{ totalBookedAttendees === 1 ? 'place' : 'places' }} booked across {{ eventBookings.length }} {{ eventBookings.length === 1 ? 'workshop' : 'workshops' }}.
              </p>
            </div>
          </div>

          <div class="divide-y divide-gray-200">
            <div
              v-for="booking in eventBookings"
              :key="booking.id"
              class="py-5 first:pt-0 last:pb-0"
            >
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 class="text-base font-semibold text-gray-900">
                    {{ booking.title }}
                  </h3>
                  <div class="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span v-if="booking.eventDate" class="inline-flex items-center gap-1">
                      <font-awesome-icon icon="calendar" class="h-3 w-3" />
                      {{ formatDate(booking.eventDate) }}
                    </span>
                    <span v-if="booking.eventStartTime" class="inline-flex items-center gap-1">
                      <font-awesome-icon icon="clock" class="h-3 w-3" />
                      {{ formatTime(booking.eventStartTime) }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-800">
                    {{ formatStatusLabel(booking.status || 'confirmed') }}
                  </span>
                  <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {{ booking.numberOfAttendees }} {{ booking.numberOfAttendees === 1 ? 'attendee' : 'attendees' }}
                  </span>
                </div>
              </div>

              <div class="mt-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Attendee names
                </p>
                <div v-if="booking.attendees && booking.attendees.length" class="mt-2 grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="(attendee, attendeeIndex) in booking.attendees"
                    :key="attendee.id || `${booking.id}-attendee-${attendeeIndex}`"
                    class="rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <p class="text-sm font-semibold text-gray-900">
                      {{ attendeeFullName(attendee, attendeeIndex) }}
                    </p>
                    <p v-if="attendee.email" class="mt-0.5 text-xs text-gray-500">
                      {{ attendee.email }}
                    </p>
                  </div>
                </div>
                <p v-else class="mt-2 text-sm text-gray-600">
                  Attendee names were not captured for this booking.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Shipping Information (only if physical items) -->
        <div v-if="hasPhysicalItems" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 class="text-xl font-display font-bold text-gray-900 mb-4">
            Shipping Information
          </h2>
          <div class="space-y-2 text-sm">
            <p class="font-semibold text-gray-900">{{ shippingName }}</p>
            <p class="text-gray-600">{{ shippingAddressLine1 }}</p>
            <p v-if="shippingAddressLine2" class="text-gray-600">{{ shippingAddressLine2 }}</p>
            <p class="text-gray-600">{{ shippingCity }}, {{ shippingPostcode }}</p>
            <p class="text-gray-600">{{ shippingCountry }}</p>

            <!-- Estimated delivery -->
            <div class="mt-4 p-3 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-600 mb-1">Estimated Delivery</p>
              <p class="font-semibold text-gray-900">{{ estimatedDelivery }}</p>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
            What's Next?
          </h2>

          <div class="grid gap-4">
            <div
              v-for="step in nextStepCards"
              :key="step.title"
              class="rounded-lg border p-4"
              :class="getStepCardClass(step.tone)"
            >
              <div class="flex items-start gap-3">
                <font-awesome-icon
                  :icon="step.icon"
                  class="mt-0.5 h-5 w-5 flex-shrink-0"
                  :class="getStepIconClass(step.tone)"
                />
                <div>
                  <p class="font-semibold text-gray-900 mb-1">{{ step.title }}</p>
                  <p class="text-sm text-gray-700">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/shop"
            class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <font-awesome-icon icon="shopping-bag" class="w-4 h-4 mr-2" />
            Continue Shopping
          </router-link>
          <router-link
            to="/account"
            class="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            View My Orders
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import {
  clearPendingCheckoutSession,
  fetchOrderByCheckoutSession
} from '../utils/pendingCheckoutSession'

const route = useRoute()
const cartStore = useCartStore()

// State
const loading = ref(true)
const pending = ref(false)
const error = ref(null)
const orderNumber = ref('')
const customerEmail = ref('')
const createdAt = ref('')
const orderItems = ref([])
const bookings = ref([])
const subtotal = ref(0)
const shipping = ref(0)
const vat = ref(0)
const total = ref(0)
const shippingName = ref('')
const shippingAddressLine1 = ref('')
const shippingAddressLine2 = ref('')
const shippingCity = ref('')
const shippingPostcode = ref('')
const shippingCountry = ref('')
const retryAttempts = ref(0)
const retryTimer = ref(null)
const MAX_ORDER_FETCH_ATTEMPTS = 12
const ORDER_RETRY_DELAY_MS = 3000

// Computed properties
const loadingMessage = computed(() => {
  return pending.value
    ? 'Finalising your order details...'
    : 'Loading your order details...'
})

const displayOrderItems = computed(() => {
  return orderItems.value.filter(item => item.item_type !== 'discount')
})

const eventBookings = computed(() => {
  if (bookings.value.length > 0) {
    return bookings.value
  }

  return displayOrderItems.value
    .filter(item => item.item_type === 'event')
    .map(item => ({
      id: item.booking?.id || item.id,
      orderItemId: item.id,
      title: item.title,
      eventDate: item.event_date,
      eventStartTime: item.event_start_time,
      status: item.booking?.status || 'confirmed',
      numberOfAttendees: item.booking?.numberOfAttendees || item.quantity,
      attendees: item.attendees || []
    }))
})

const totalBookedAttendees = computed(() => {
  return eventBookings.value.reduce((sum, booking) => {
    return sum + Number(booking.numberOfAttendees || 0)
  }, 0)
})

const discountAmount = computed(() => {
  return Math.abs(
    orderItems.value
      .filter(item => item.item_type === 'discount')
      .reduce((sum, item) => sum + item.total_price_gbp, 0)
  )
})

const hasPhysicalItems = computed(() => {
  return displayOrderItems.value.some(item => item.item_type === 'product_physical')
})

const hasDigitalProducts = computed(() => {
  return displayOrderItems.value.some(item => item.item_type === 'product_digital')
})

const hasEvents = computed(() => {
  return eventBookings.value.length > 0
})

const hasSubscription = computed(() => {
  return displayOrderItems.value.some(item =>
    item.item_type === 'subscription' ||
    item.item_type === 'subscription_box' ||
    item.item_type === 'subscription_initial'
  )
})

const nextStepCards = computed(() => {
  const cards = []

  if (hasEvents.value) {
    cards.push({
      tone: 'blue',
      icon: 'calendar-check',
      title: 'Workshop confirmation',
      description: 'Your workshop place is confirmed. We will email any practical details and reminders before the session.'
    })
  }

  if (hasDigitalProducts.value) {
    cards.push({
      tone: 'purple',
      icon: 'download',
      title: 'Digital downloads',
      description: 'Download links and access details will be sent to your confirmation email address.'
    })
  }

  if (hasPhysicalItems.value) {
    cards.push({
      tone: 'green',
      icon: 'box',
      title: 'Shipping updates',
      description: 'We will send tracking information once your physical items have been packed and shipped.'
    })
  }

  if (hasSubscription.value) {
    cards.push({
      tone: 'amber',
      icon: 'sync',
      title: 'Subscription setup',
      description: 'Your subscription is being set up. You will receive subscription and billing details by email.'
    })
  }

  cards.push({
    tone: 'gray',
    icon: 'envelope',
    title: 'Keep your confirmation email',
    description: `A receipt and order summary has been sent to ${customerEmail.value || 'your email address'}.`
  })

  return cards
})

const estimatedDelivery = computed(() => {
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 5) // 5 business days
  return deliveryDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Helper functions
const getItemIcon = (itemType) => {
  switch (itemType) {
    case 'event': return 'calendar'
    case 'product_digital': return 'download'
    case 'product_physical': return 'box'
    case 'subscription':
    case 'subscription_box':
      return 'sync'
    default: return 'box'
  }
}

const getItemTypeBadgeClass = (itemType) => {
  switch (itemType) {
    case 'event': return 'bg-purple-100 text-purple-800'
    case 'product_digital': return 'bg-blue-100 text-blue-800'
    case 'product_physical': return 'bg-orange-100 text-orange-800'
    case 'subscription':
    case 'subscription_box':
      return 'bg-success-100 text-success-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getItemTypeLabel = (itemType) => {
  switch (itemType) {
    case 'event': return 'Workshop'
    case 'product_digital': return 'Digital Product'
    case 'product_physical': return 'Physical Product'
    case 'subscription':
    case 'subscription_box':
      return 'Subscription'
    default: return 'Product'
  }
}

const attendeeFullName = (attendee, attendeeIndex) => {
  const fullName = [attendee?.firstName, attendee?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || `Attendee ${attendeeIndex + 1}`
}

const formatStatusLabel = (status) => {
  if (!status) return ''
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getStepCardClass = (tone) => {
  switch (tone) {
    case 'blue': return 'border-blue-200 bg-blue-50'
    case 'purple': return 'border-purple-200 bg-purple-50'
    case 'green': return 'border-green-200 bg-green-50'
    case 'amber': return 'border-warning-200 bg-warning-50'
    default: return 'border-gray-200 bg-gray-50'
  }
}

const getStepIconClass = (tone) => {
  switch (tone) {
    case 'blue': return 'text-blue-600'
    case 'purple': return 'text-purple-600'
    case 'green': return 'text-green-600'
    case 'amber': return 'text-warning-700'
    default: return 'text-gray-600'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  return timeString.substring(0, 5) // HH:MM format
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'Today'
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return 'Today'
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const clearRetryTimer = () => {
  if (retryTimer.value) {
    clearTimeout(retryTimer.value)
    retryTimer.value = null
  }
}

const scheduleOrderRetry = () => {
  retryAttempts.value += 1

  if (retryAttempts.value > MAX_ORDER_FETCH_ATTEMPTS) {
    pending.value = false
    error.value = 'We could not load your order details yet. Please check your email for confirmation, or contact us if it does not arrive shortly.'
    return
  }

  pending.value = true
  error.value = null
  clearRetryTimer()
  retryTimer.value = setTimeout(() => {
    fetchOrderDetails()
  }, ORDER_RETRY_DELAY_MS)
}

// Fetch order details
const fetchOrderDetails = async () => {
  const showLoadingState = !pending.value

  try {
    loading.value = showLoadingState
    error.value = null

    // Get session_id from URL query params
    const sessionId = route.query.session_id

    if (!sessionId) {
      pending.value = false
      error.value = 'No order session found. Please check your email for order confirmation.'
      return
    }

    const data = await fetchOrderByCheckoutSession(sessionId)

    if (data?.pending) {
      scheduleOrderRetry()
      return
    }

    if (!data) {
      throw new Error('Order not found')
    }

    pending.value = false
    retryAttempts.value = 0
    clearRetryTimer()

    // Set order data
    orderNumber.value = data.orderNumber
    customerEmail.value = data.customerEmail
    createdAt.value = data.createdAt || ''
    orderItems.value = Array.isArray(data.orderItems) ? data.orderItems : []
    bookings.value = Array.isArray(data.bookings) ? data.bookings : []
    subtotal.value = data.subtotal
    shipping.value = data.shipping
    vat.value = data.vat
    total.value = data.total
    shippingName.value = data.shippingName
    shippingAddressLine1.value = data.shippingAddressLine1
    shippingAddressLine2.value = data.shippingAddressLine2
    shippingCity.value = data.shippingCity
    shippingPostcode.value = data.shippingPostcode
    shippingCountry.value = data.shippingCountry

    // Clear cart after successful order
    cartStore.clearCart()
    clearPendingCheckoutSession(sessionId)

  } catch (err) {
    console.error('Error fetching order:', err)
    console.error('Full error details:', JSON.stringify(err, null, 2))

    // More detailed error message
    if (err.message && err.message.includes('not found')) {
      scheduleOrderRetry()
    } else {
      pending.value = false
      error.value = 'Failed to load order details. Please check your email for confirmation.'
    }
  } finally {
    loading.value = false
  }
}

// Initialize
onMounted(() => {
  fetchOrderDetails()
})

onBeforeUnmount(() => {
  clearRetryTimer()
})
</script>
