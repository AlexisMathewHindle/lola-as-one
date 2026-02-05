<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p class="text-sm text-gray-600 mt-1">
          Manage recurring customer subscriptions
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
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
            <option value="past_due">Past Due</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <!-- Billing Interval Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Billing Interval</label>
          <select
            v-model="filters.billingInterval"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Intervals</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>

        <!-- Sort By -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            v-model="filters.sortBy"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="next_billing_date">Next Billing Date</option>
            <option value="amount">Amount</option>
            <option value="created_at">Created Date</option>
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Customer email..."
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
    <div v-else-if="filteredSubscriptions.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <font-awesome-icon icon="box" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No subscriptions found</h3>
      <p class="text-gray-600">
        {{ filters.status || filters.search ? 'Try adjusting your filters' : 'Subscriptions will appear here once customers subscribe' }}
      </p>
    </div>

    <!-- Subscriptions Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Billing
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Billing
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="subscription in filteredSubscriptions"
              :key="subscription.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <!-- Customer -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ subscription.customer?.first_name }} {{ subscription.customer?.last_name }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ subscription.customer?.email }}
                </div>
              </td>

              <!-- Product -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ subscription.offering?.title || 'N/A' }}
                </div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(subscription.status)">
                  {{ formatStatus(subscription.status) }}
                </span>
              </td>


              <!-- Billing -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ formatBillingInterval(subscription.billing_interval) }}
                </div>
              </td>

              <!-- Next Billing -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{ subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'N/A' }}
                </div>
              </td>

              <!-- Amount -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  £{{ subscription.amount_gbp?.toFixed(2) }}
                </div>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <router-link
                  :to="`/admin/subscriptions/${subscription.id}`"
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
const subscriptions = ref([])
const loading = ref(true)
const error = ref(null)

// Filters
const filters = ref({
  status: '',
  billingInterval: '',
  sortBy: 'next_billing_date',
  search: ''
})

// Fetch subscriptions
const fetchSubscriptions = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        customer:customers(id, email, first_name, last_name),
        offering:offerings(id, title)
      `)
      .order('next_billing_date', { ascending: true })

    if (fetchError) throw fetchError

    subscriptions.value = data || []
  } catch (err) {
    console.error('Error fetching subscriptions:', err)
    error.value = 'Failed to load subscriptions. Please try again.'
  } finally {
    loading.value = false
  }
}

// Filtered and sorted subscriptions
const filteredSubscriptions = computed(() => {
  let result = subscriptions.value

  // Filter by status
  if (filters.value.status) {
    result = result.filter(s => s.status === filters.value.status)
  }

  // Filter by billing interval
  if (filters.value.billingInterval) {
    result = result.filter(s => s.billing_interval === filters.value.billingInterval)
  }

  // Filter by search (customer email)
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    result = result.filter(s =>
      s.customer?.email?.toLowerCase().includes(searchLower)
    )
  }

  // Sort
  if (filters.value.sortBy === 'next_billing_date') {
    result = result.sort((a, b) => {
      if (!a.next_billing_date) return 1
      if (!b.next_billing_date) return -1
      return new Date(a.next_billing_date) - new Date(b.next_billing_date)
    })
  } else if (filters.value.sortBy === 'amount') {
    result = result.sort((a, b) => (b.amount_gbp || 0) - (a.amount_gbp || 0))
  } else if (filters.value.sortBy === 'created_at') {
    result = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  return result
})

// Format status
const formatStatus = (status) => {
  const statusMap = {
    active: 'Active',
    paused: 'Paused',
    cancelled: 'Cancelled',
    past_due: 'Past Due',
    unpaid: 'Unpaid'
  }
  return statusMap[status] || status
}

// Get status badge class
const getStatusClass = (status) => {
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

// Lifecycle
onMounted(() => {
  fetchSubscriptions()
})
</script>
