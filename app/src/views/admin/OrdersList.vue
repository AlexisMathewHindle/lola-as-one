<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
        <p class="text-sm text-gray-600 mt-1">
          Manage all customer orders and fulfillment
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <!-- Order Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
          <select
            v-model="filters.orderType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="one_time">One-Time</option>
            <option value="subscription_initial">Subscription (Initial)</option>
            <option value="subscription_renewal">Subscription (Renewal)</option>
          </select>
        </div>

        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Date From</label>
          <input
            v-model="filters.dateFrom"
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
            placeholder="Order # or customer email..."
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
    <div v-else-if="filteredOrders.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <font-awesome-icon icon="shopping-cart" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
      <p class="text-gray-600">
        {{ filters.status || filters.search ? 'Try adjusting your filters' : 'Orders will appear here once customers make purchases' }}
      </p>
    </div>

    <!-- Orders Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="order in filteredOrders"
              :key="order.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ order.order_number }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ order.shipping_name || 'N/A' }}</div>
                <div class="text-sm text-gray-500">{{ order.customer_email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(order.created_at) }}</div>
                <div class="text-sm text-gray-500">{{ formatTime(order.created_at) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-700">
                  {{ formatOrderType(order.order_type) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  £{{ order.total_gbp.toFixed(2) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(order.status)"
                >
                  {{ formatStatus(order.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <router-link
                  :to="`/admin/orders/${order.id}`"
                  class="text-primary-600 hover:text-primary-900 font-medium"
                >
                  View Details
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
import { supabase } from '@/lib/supabase'

// State
const orders = ref([])
const loading = ref(true)
const error = ref(null)

// Filters
const filters = ref({
  status: '',
  orderType: '',
  dateFrom: '',
  search: ''
})

// Fetch orders
const fetchOrders = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(count),
        payments(status),
        fulfillments(status)
      `)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    orders.value = data || []
  } catch (err) {
    console.error('Error fetching orders:', err)
    error.value = 'Failed to load orders. Please try again.'
  } finally {
    loading.value = false
  }
}

// Filtered orders
const filteredOrders = computed(() => {
  let result = orders.value

  // Filter by status
  if (filters.value.status) {
    result = result.filter(order => order.status === filters.value.status)
  }

  // Filter by order type
  if (filters.value.orderType) {
    result = result.filter(order => order.order_type === filters.value.orderType)
  }

  // Filter by date
  if (filters.value.dateFrom) {
    const fromDate = new Date(filters.value.dateFrom)
    result = result.filter(order => new Date(order.created_at) >= fromDate)
  }

  // Filter by search
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    result = result.filter(order =>
      order.order_number.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower) ||
      (order.shipping_name && order.shipping_name.toLowerCase().includes(searchLower))
    )
  }

  return result
})

// Format helpers
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatOrderType = (type) => {
  const types = {
    'one_time': 'One-Time',
    'subscription_initial': 'Subscription (Initial)',
    'subscription_renewal': 'Subscription (Renewal)'
  }
  return types[type] || type
}

const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const getStatusClass = (status) => {
  const classes = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'paid': 'bg-blue-100 text-blue-800',
    'fulfilled': 'bg-green-100 text-green-800',
    'cancelled': 'bg-gray-100 text-gray-800',
    'refunded': 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Lifecycle
onMounted(() => {
  fetchOrders()
})
</script>
