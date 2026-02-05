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

    <!-- Order Details -->
    <div v-else-if="order">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <router-link to="/admin/orders" class="text-sm text-primary-600 hover:text-primary-800 mb-2 inline-block">
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Back to Orders
          </router-link>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Order {{ order.order_number }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            Placed on {{ formatDateTime(order.created_at) }}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            v-if="order.status === 'paid' && (!fulfillment || fulfillment.status === 'pending')"
            @click="showFulfillmentModal = true"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <font-awesome-icon icon="box" class="w-4 h-4 mr-2" />
            Mark as Fulfilled
          </button>
          <a
            v-if="order.stripe_payment_intent_id"
            :href="`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`"
            target="_blank"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <font-awesome-icon icon="external-link-alt" class="w-4 h-4 mr-2" />
            View in Stripe
          </a>
        </div>
      </div>

      <!-- Status Banner -->
      <div
        v-if="order.status === 'cancelled' || order.status === 'refunded'"
        class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
      >
        <div class="flex items-start">
          <font-awesome-icon icon="times-circle" class="w-5 h-5 text-red-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-sm font-semibold text-red-900">Order {{ order.status === 'cancelled' ? 'Cancelled' : 'Refunded' }}</h3>
            <p class="text-sm text-red-700 mt-1">
              This order has been {{ order.status }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Order Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Order Items -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div class="space-y-4">
              <div
                v-for="item in orderItems"
                :key="item.id"
                class="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0 last:pb-0"
              >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ formatItemType(item.item_type) }}
                    <span v-if="item.sku"> • SKU: {{ item.sku }}</span>
                  </p>
                  <p v-if="item.event_date" class="text-xs text-gray-500 mt-1">
                    Event Date: {{ formatDate(item.event_date) }}
                    <span v-if="item.event_start_time"> at {{ item.event_start_time }}</span>
                  </p>
                </div>
                <div class="text-right ml-4">
                  <p class="text-sm text-gray-900">Qty: {{ item.quantity }}</p>
                  <p class="text-sm font-medium text-gray-900">£{{ item.total_price_gbp.toFixed(2) }}</p>
                  <p class="text-xs text-gray-500">£{{ item.unit_price_gbp.toFixed(2) }} each</p>
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="mt-6 pt-6 border-t border-gray-200 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal</span>
                <span class="text-gray-900">£{{ order.subtotal_gbp.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Shipping</span>
                <span class="text-gray-900">£{{ order.shipping_gbp.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tax (VAT)</span>
                <span class="text-gray-900">£{{ order.tax_gbp.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                <span class="text-gray-900">Total</span>
                <span class="text-gray-900">£{{ order.total_gbp.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Payment Status</span>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getPaymentStatusClass(payment?.status || 'pending')"
                >
                  {{ formatStatus(payment?.status || 'pending') }}
                </span>
              </div>
              <div v-if="payment?.payment_method" class="flex justify-between">
                <span class="text-sm text-gray-600">Payment Method</span>
                <span class="text-sm text-gray-900">{{ formatPaymentMethod(payment.payment_method) }}</span>
              </div>
              <div v-if="order.stripe_payment_intent_id" class="flex justify-between">
                <span class="text-sm text-gray-600">Stripe Payment ID</span>
                <span class="text-xs text-gray-500 font-mono">{{ order.stripe_payment_intent_id }}</span>
              </div>
              <div v-if="payment?.created_at" class="flex justify-between">
                <span class="text-sm text-gray-600">Payment Date</span>
                <span class="text-sm text-gray-900">{{ formatDateTime(payment.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Fulfillment Info -->
          <div v-if="fulfillment" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Fulfillment Information</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Fulfillment Status</span>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getFulfillmentStatusClass(fulfillment.status)"
                >
                  {{ formatStatus(fulfillment.status) }}
                </span>
              </div>

              <div v-if="fulfillment.carrier" class="flex justify-between">
                <span class="text-sm text-gray-600">Carrier</span>
                <span class="text-sm text-gray-900">{{ fulfillment.carrier }}</span>
              </div>
              <div v-if="fulfillment.tracking_number" class="flex justify-between">
                <span class="text-sm text-gray-600">Tracking Number</span>
                <span class="text-sm text-gray-900 font-mono">{{ fulfillment.tracking_number }}</span>
              </div>
              <div v-if="fulfillment.tracking_url" class="flex justify-between">
                <span class="text-sm text-gray-600">Track Shipment</span>
                <a :href="fulfillment.tracking_url" target="_blank" class="text-sm text-primary-600 hover:text-primary-800">
                  View Tracking →
                </a>
              </div>
              <div v-if="fulfillment.shipped_at" class="flex justify-between">
                <span class="text-sm text-gray-600">Shipped Date</span>
                <span class="text-sm text-gray-900">{{ formatDateTime(fulfillment.shipped_at) }}</span>
              </div>
              <div v-if="fulfillment.delivered_at" class="flex justify-between">
                <span class="text-sm text-gray-600">Delivered Date</span>
                <span class="text-sm text-gray-900">{{ formatDateTime(fulfillment.delivered_at) }}</span>
              </div>
              <div v-if="fulfillment.notes" class="pt-3 border-t border-gray-200">
                <p class="text-sm text-gray-600 mb-1">Notes</p>
                <p class="text-sm text-gray-900">{{ fulfillment.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Customer Info -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-600">Name</p>
                <p class="text-sm text-gray-900">{{ order.shipping_name || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Email</p>
                <a :href="`mailto:${order.customer_email}`" class="text-sm text-primary-600 hover:text-primary-800">
                  {{ order.customer_email }}
                </a>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Order Number</p>
                <p class="text-sm text-gray-900">{{ order.order_number }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Order Type</p>
                <p class="text-sm text-gray-900">{{ formatOrderType(order.order_type) }}</p>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div class="text-sm text-gray-900 space-y-1">
              <p>{{ order.shipping_name }}</p>
              <p v-if="order.shipping_address_line1">{{ order.shipping_address_line1 }}</p>
              <p v-if="order.shipping_address_line2">{{ order.shipping_address_line2 }}</p>
              <p v-if="order.shipping_city || order.shipping_postcode">
                {{ order.shipping_city }}<span v-if="order.shipping_city && order.shipping_postcode">, </span>{{ order.shipping_postcode }}
              </p>
              <p v-if="order.shipping_country">{{ order.shipping_country }}</p>
            </div>
          </div>

          <!-- Order Timeline -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <div class="space-y-4">
              <div class="flex items-start">
                <div class="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-1.5 mr-3"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Order Created</p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(order.created_at) }}</p>
                </div>
              </div>
              <div v-if="payment?.created_at" class="flex items-start">
                <div class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Payment Received</p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(payment.created_at) }}</p>
                </div>
              </div>
              <div v-if="fulfillment?.shipped_at" class="flex items-start">
                <div class="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5 mr-3"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Order Shipped</p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(fulfillment.shipped_at) }}</p>
                </div>
              </div>
              <div v-if="fulfillment?.delivered_at" class="flex items-start">
                <div class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Order Delivered</p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(fulfillment.delivered_at) }}</p>
                </div>
              </div>
              <div v-if="order.fulfilled_at" class="flex items-start">
                <div class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Order Fulfilled</p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(order.fulfilled_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fulfillment Modal -->
    <div
      v-if="showFulfillmentModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showFulfillmentModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Mark Order as Fulfilled</h3>

        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Carrier (Optional)</label>
            <input
              v-model="fulfillmentForm.carrier"
              type="text"
              placeholder="e.g., Royal Mail, DPD, UPS"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tracking Number (Optional)</label>
            <input
              v-model="fulfillmentForm.tracking_number"
              type="text"
              placeholder="Enter tracking number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tracking URL (Optional)</label>
            <input
              v-model="fulfillmentForm.tracking_url"
              type="url"
              placeholder="https://..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              v-model="fulfillmentForm.notes"
              rows="3"
              placeholder="Add any notes about this fulfillment..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="markAsFulfilled"
            :disabled="fulfilling"
            class="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
          >
            <font-awesome-icon :icon="fulfilling ? 'spinner' : 'check'" :class="{ 'animate-spin': fulfilling }" class="w-4 h-4 mr-2" />
            {{ fulfilling ? 'Processing...' : 'Mark as Fulfilled' }}
          </button>
          <button
            @click="showFulfillmentModal = false"
            :disabled="fulfilling"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const orderId = route.params.id
const toastStore = useToastStore()

// State
const order = ref(null)
const orderItems = ref([])
const payment = ref(null)
const fulfillment = ref(null)
const loading = ref(true)
const error = ref(null)
const showFulfillmentModal = ref(false)
const fulfilling = ref(false)

// Fulfillment form
const fulfillmentForm = ref({
  carrier: '',
  tracking_number: '',
  tracking_url: '',
  notes: ''
})

// Fetch order details
const fetchOrderDetails = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError
    order.value = orderData

    // Fetch order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (itemsError) throw itemsError
    orderItems.value = itemsData || []

    // Fetch payment
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (!paymentError) {
      payment.value = paymentData
    }

    // Fetch fulfillment
    const { data: fulfillmentData, error: fulfillmentError } = await supabase
      .from('fulfillments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (!fulfillmentError) {
      fulfillment.value = fulfillmentData
    }

  } catch (err) {
    console.error('Error fetching order details:', err)
    error.value = 'Failed to load order details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Mark as fulfilled
const markAsFulfilled = async () => {
  try {
    fulfilling.value = true

    const now = new Date().toISOString()

    // Create or update fulfillment record
    if (fulfillment.value) {
      // Update existing fulfillment
      const { error: updateError } = await supabase
        .from('fulfillments')
        .update({
          status: 'shipped',
          carrier: fulfillmentForm.value.carrier || null,
          tracking_number: fulfillmentForm.value.tracking_number || null,
          tracking_url: fulfillmentForm.value.tracking_url || null,
          notes: fulfillmentForm.value.notes || null,
          shipped_at: now,
          updated_at: now
        })
        .eq('id', fulfillment.value.id)

      if (updateError) throw updateError
    } else {
      // Create new fulfillment
      const { error: createError } = await supabase
        .from('fulfillments')
        .insert({
          order_id: orderId,
          status: 'shipped',
          carrier: fulfillmentForm.value.carrier || null,
          tracking_number: fulfillmentForm.value.tracking_number || null,
          tracking_url: fulfillmentForm.value.tracking_url || null,
          notes: fulfillmentForm.value.notes || null,
          shipped_at: now
        })

      if (createError) throw createError
    }

    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'fulfilled',
        fulfilled_at: now,
        updated_at: now
      })
      .eq('id', orderId)

    if (orderError) throw orderError

    // Refresh data
    await fetchOrderDetails()

    // Close modal and reset form
    showFulfillmentModal.value = false
    fulfillmentForm.value = {
      carrier: '',
      tracking_number: '',
      tracking_url: '',
      notes: ''
    }

  } catch (err) {
    console.error('Error marking as fulfilled:', err)
    toastStore.error('Failed to mark order as fulfilled. Please try again.')
  } finally {
    fulfilling.value = false
  }
}

// Format helpers
const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatOrderType = (type) => {
  const types = {
    'one_time': 'One-Time Purchase',
    'subscription_initial': 'Subscription (Initial)',
    'subscription_renewal': 'Subscription (Renewal)'
  }
  return types[type] || type
}

const formatItemType = (type) => {
  const types = {
    'event': 'Event/Workshop',
    'product_physical': 'Physical Product',
    'product_digital': 'Digital Product'
  }
  return types[type] || type
}

const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatPaymentMethod = (method) => {
  const methods = {
    'card': 'Credit/Debit Card',
    'bank_transfer': 'Bank Transfer'
  }
  return methods[method] || method
}

const getPaymentStatusClass = (status) => {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'succeeded': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'refunded': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getFulfillmentStatusClass = (status) => {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'packed': 'bg-blue-100 text-blue-800',
    'shipped': 'bg-primary-100 text-primary-800',
    'delivered': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Lifecycle
onMounted(() => {
  fetchOrderDetails()
})
</script>
