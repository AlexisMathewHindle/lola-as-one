<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <font-awesome-icon icon="spinner" class="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p class="text-gray-600">Loading your order details...</p>
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
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div class="text-center">
            <!-- Success Icon -->
            <div class="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-success-100 rounded-full flex items-center justify-center">
              <font-awesome-icon icon="check-circle" class="w-10 h-10 sm:w-12 sm:h-12 text-success-600" />
            </div>

            <!-- Success Heading -->
            <h1 class="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
              Thank You for Your Order!
            </h1>
            <p class="text-base sm:text-lg text-gray-600 mb-6">
              Your order has been successfully placed and confirmed.
            </p>

            <!-- Order Number -->
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <span class="text-sm text-gray-600">Order Number:</span>
              <span class="text-base font-bold text-gray-900">{{ orderNumber }}</span>
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
              v-for="item in orderItems"
              :key="item.id"
              class="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
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

          <!-- Digital Products -->
          <div v-if="hasDigitalProducts" class="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-start gap-3">
              <font-awesome-icon icon="download" class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-semibold text-purple-900 mb-1">Digital Downloads</p>
                <p class="text-sm text-purple-700">Your digital products are ready! Check your email for download links.</p>
              </div>
            </div>
          </div>

          <!-- Events -->
          <div v-if="hasEvents" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-start gap-3">
              <font-awesome-icon icon="calendar" class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-semibold text-blue-900 mb-1">Workshop Confirmation</p>
                <p class="text-sm text-blue-700">Your workshop booking is confirmed! We'll send you a reminder email before the event.</p>
              </div>
            </div>
          </div>

          <!-- Physical Items -->
          <div v-if="hasPhysicalItems" class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-start gap-3">
              <font-awesome-icon icon="box" class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-semibold text-green-900 mb-1">Shipping Updates</p>
                <p class="text-sm text-green-700">We'll send you tracking information once your order ships.</p>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

// State
const loading = ref(true)
const error = ref(null)
const orderNumber = ref('')
const customerEmail = ref('')
const orderItems = ref([])
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

// Computed properties
const hasPhysicalItems = computed(() => {
  return orderItems.value.some(item => item.item_type === 'product_physical')
})

const hasDigitalProducts = computed(() => {
  return orderItems.value.some(item => item.item_type === 'product_digital')
})

const hasEvents = computed(() => {
  return orderItems.value.some(item => item.item_type === 'event')
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
    default: return 'box'
  }
}

const getItemTypeBadgeClass = (itemType) => {
  switch (itemType) {
    case 'event': return 'bg-purple-100 text-purple-800'
    case 'product_digital': return 'bg-blue-100 text-blue-800'
    case 'product_physical': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getItemTypeLabel = (itemType) => {
  switch (itemType) {
    case 'event': return 'Workshop'
    case 'product_digital': return 'Digital Product'
    case 'product_physical': return 'Physical Product'
    default: return 'Product'
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

// Fetch order details
const fetchOrderDetails = async () => {
  try {
    loading.value = true
    error.value = null

    // Get session_id from URL query params
    const sessionId = route.query.session_id

    if (!sessionId) {
      error.value = 'No order session found. Please check your email for order confirmation.'
      return
    }

    // Call Supabase Edge Function to fetch order
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-by-session?session_id=${sessionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch order')
    }

    const data = await response.json()

    if (!data) {
      throw new Error('Order not found')
    }

    // Set order data
    orderNumber.value = data.orderNumber
    customerEmail.value = data.customerEmail
    orderItems.value = data.orderItems
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

  } catch (err) {
    console.error('Error fetching order:', err)
    console.error('Full error details:', JSON.stringify(err, null, 2))

    // More detailed error message
    if (err.message && err.message.includes('not found')) {
      error.value = 'Order is being processed. This page will automatically refresh in a few seconds...'

      // Auto-retry after 3 seconds (webhook might still be processing)
      setTimeout(() => {
        console.log('Retrying order fetch...')
        fetchOrderDetails()
      }, 3000)
    } else {
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
</script>


