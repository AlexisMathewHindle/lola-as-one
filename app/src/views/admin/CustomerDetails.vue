<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <font-awesome-icon icon="spinner" spin class="text-4xl text-primary-500" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-800">{{ error }}</p>
      <router-link to="/admin/customers" class="text-primary-500 hover:text-primary-600 font-medium mt-2 inline-block">
        <font-awesome-icon icon="arrow-left" class="mr-2" />
        Back to Customers
      </router-link>
    </div>

    <!-- Customer Details -->
    <div v-else-if="customer">
      <!-- Header -->
      <div class="mb-6">
        <router-link
          to="/admin/customers"
          class="text-primary-500 hover:text-primary-600 font-medium mb-4 inline-block"
        >
          <font-awesome-icon icon="arrow-left" class="mr-2" />
          Back to Customers
        </router-link>
        <h1 class="text-2xl font-bold text-gray-900">{{ customer.first_name }} {{ customer.last_name }}</h1>
        <p class="mt-1 text-sm text-gray-600">Customer Details</p>
      </div>

      <!-- Customer Information Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Name</p>
            <p class="text-base font-medium text-gray-900">{{ customer.first_name }} {{ customer.last_name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Email</p>
            <p class="text-base font-medium text-gray-900">
              <a :href="`mailto:${customer.email}`" class="text-primary-500 hover:text-primary-600">
                {{ customer.email }}
              </a>
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Phone</p>
            <p class="text-base font-medium text-gray-900">{{ customer.phone || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Member Since</p>
            <p class="text-base font-medium text-gray-900">{{ formatDate(customer.created_at) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Marketing Opt-In</p>
            <p class="text-base font-medium text-gray-900">
              <span v-if="customer.marketing_opt_in" class="text-green-600">Yes</span>
              <span v-else class="text-gray-500">No</span>
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Stripe Customer ID</p>
            <p class="text-base font-medium text-gray-900">
              <span v-if="customer.stripe_customer_id">
                {{ customer.stripe_customer_id }}
                <a
                  :href="`https://dashboard.stripe.com/customers/${customer.stripe_customer_id}`"
                  target="_blank"
                  class="text-primary-500 hover:text-primary-600 ml-2"
                >
                  <font-awesome-icon icon="external-link-alt" />
                </a>
              </span>
              <span v-else class="text-gray-500">N/A</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Orders</p>
              <p class="text-2xl font-bold text-gray-900">{{ orders.length }}</p>
            </div>
            <font-awesome-icon icon="shopping-cart" class="text-3xl text-primary-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Active Subscriptions</p>
              <p class="text-2xl font-bold text-gray-900">{{ activeSubscriptions.length }}</p>
            </div>
            <font-awesome-icon icon="calendar" class="text-3xl text-green-500" />
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Lifetime Value</p>
              <p class="text-2xl font-bold text-gray-900">£{{ formatPrice(lifetimeValue) }}</p>
            </div>
            <font-awesome-icon icon="pound-sign" class="text-3xl text-yellow-500" />
          </div>
        </div>
      </div>

      <!-- Orders Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Order History</h2>
        <div v-if="orders.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ order.order_number }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{{ formatDateTime(order.created_at) }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{{ formatOrderType(order.order_type) }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">£{{ formatPrice(order.total_gbp) }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span :class="getStatusClass(order.status)">{{ formatStatus(order.status) }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <router-link
                    :to="`/admin/orders/${order.id}`"
                    class="text-primary-500 hover:text-primary-600 font-medium"
                  >
                    View Details
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          No orders found for this customer.
        </div>
      </div>

      <!-- Subscriptions Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Subscriptions</h2>
        <div v-if="subscriptions.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Billing</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="subscription in subscriptions" :key="subscription.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ subscription.offering?.title || 'N/A' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span :class="getSubscriptionStatusClass(subscription.status)">
                    {{ formatSubscriptionStatus(subscription.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ formatBillingInterval(subscription.billing_interval) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  £{{ formatPrice(subscription.amount_gbp) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ formatDate(subscription.next_billing_date) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <router-link
                    :to="`/admin/subscriptions/${subscription.id}`"
                    class="text-primary-500 hover:text-primary-600 font-medium"
                  >
                    View Details
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          No subscriptions found for this customer.
        </div>
      </div>

      <!-- Bookings Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Event Bookings</h2>
        <div v-if="bookings.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="booking in bookings" :key="booking.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ booking.offering_event?.offering?.title || 'N/A' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ formatDate(booking.offering_event?.event_date) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ booking.number_of_attendees }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span :class="getBookingStatusClass(booking.status)">
                    {{ formatBookingStatus(booking.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <router-link
                    :to="`/admin/bookings/${booking.id}`"
                    class="text-primary-500 hover:text-primary-600 font-medium"
                  >
                    View Details
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          No event bookings found for this customer.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const customerId = route.params.id

// State
const customer = ref(null)
const orders = ref([])
const subscriptions = ref([])
const bookings = ref([])
const loading = ref(true)
const error = ref(null)

// Computed
const activeSubscriptions = computed(() => {
  return subscriptions.value.filter(s => s.status === 'active')
})

const lifetimeValue = computed(() => {
  return orders.value.reduce((sum, order) => sum + parseFloat(order.total_gbp || 0), 0)
})

// Fetch customer data
const fetchCustomer = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch customer
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (customerError) throw customerError
    customer.value = customerData

    // Fetch orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError
    orders.value = ordersData || []

    // Fetch subscriptions
    const { data: subscriptionsData, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        offering:offerings(id, title)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (subscriptionsError) throw subscriptionsError
    subscriptions.value = subscriptionsData || []

    // Fetch bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        offering_event:offering_events(
          id,
          event_date,
          offering:offerings(id, title)
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (bookingsError) throw bookingsError
    bookings.value = bookingsData || []

  } catch (err) {
    console.error('Error fetching customer:', err)
    error.value = 'Failed to load customer details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Format order type
const formatOrderType = (type) => {
  const typeMap = {
    one_time: 'One-Time',
    subscription_initial: 'Subscription (Initial)',
    subscription_renewal: 'Subscription (Renewal)'
  }
  return typeMap[type] || type
}

// Format status
const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    paid: 'Paid',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
    refunded: 'Refunded'
  }
  return statusMap[status] || status
}

// Get status badge class
const getStatusClass = (status) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusClasses = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    fulfilled: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-red-100 text-red-800'
  }
  return `${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`
}

// Format subscription status
const formatSubscriptionStatus = (status) => {
  const statusMap = {
    active: 'Active',
    paused: 'Paused',
    cancelled: 'Cancelled',
    past_due: 'Past Due',
    unpaid: 'Unpaid'
  }
  return statusMap[status] || status
}

// Get subscription status class
const getSubscriptionStatusClass = (status) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusClasses = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800',
    past_due: 'bg-red-100 text-red-800',
    unpaid: 'bg-red-100 text-red-800'
  }
  return `${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`
}

// Format billing interval
const formatBillingInterval = (interval) => {
  return interval === 'month' ? 'Monthly' : interval === 'year' ? 'Yearly' : interval
}

// Format booking status
const formatBookingStatus = (status) => {
  const statusMap = {
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    no_show: 'No Show'
  }
  return statusMap[status] || status
}

// Get booking status class
const getBookingStatusClass = (status) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusClasses = {
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    no_show: 'bg-red-100 text-red-800'
  }
  return `${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`
}

// Format price
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
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

// Lifecycle
onMounted(() => {
  fetchCustomer()
})
</script>




