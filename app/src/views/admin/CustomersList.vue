<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
        <p class="text-sm text-gray-600 mt-1">
          View and manage customer accounts
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Filters</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name or email..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @input="fetchCustomers"
          />
        </div>

        <!-- Filter by Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Filter</label>
          <select
            v-model="filterStatus"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="fetchCustomers"
          >
            <option value="all">All Customers</option>
            <option value="has_orders">Has Orders</option>
            <option value="has_subscriptions">Has Subscriptions</option>
            <option value="marketing_opt_in">Marketing Opt-In</option>
          </select>
        </div>

        <!-- Sort By -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            v-model="sortBy"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="fetchCustomers"
          >
            <option value="created_at">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="last_name">Name (A-Z)</option>
            <option value="email">Email (A-Z)</option>
          </select>
        </div>

        <!-- Stats Summary -->
        <div class="flex items-end">
          <div class="w-full p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="text-xs text-gray-500 mb-1">Total Customers</div>
            <div class="text-2xl font-bold text-gray-900">{{ customers.length }}</div>
          </div>
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
    <div v-else-if="customers.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <font-awesome-icon icon="users" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
      <p class="text-gray-600">
        {{ searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Customers will appear here once they create accounts or make purchases' }}
      </p>
    </div>

    <!-- Customers Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <!-- Desktop Table View -->
        <table class="hidden xl:table min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-3 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th class="px-3 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Orders
              </th>
              <th class="px-3 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Subscriptions
              </th>
              <th class="px-3 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Total Spent
              </th>
              <th class="px-3 xl:px-6 py-3 xl:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Member Since
              </th>
              <th class="px-3 xl:px-6 py-3 xl:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="customer in customers"
              :key="customer.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-3 xl:px-6 py-3 xl:py-4">
                <div class="text-xs xl:text-sm font-medium text-gray-900 break-words">
                  {{ customer.first_name }} {{ customer.last_name }}
                </div>
              </td>
              <td class="px-3 xl:px-6 py-3 xl:py-4">
                <div class="text-xs xl:text-sm text-gray-600 break-all">{{ customer.email }}</div>
              </td>
              <td class="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                <div class="text-xs xl:text-sm text-gray-900">{{ customer.order_count || 0 }}</div>
              </td>
              <td class="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                <div class="text-xs xl:text-sm text-gray-900">{{ customer.subscription_count || 0 }}</div>
              </td>
              <td class="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                <div class="text-xs xl:text-sm font-medium text-gray-900">£{{ formatPrice(customer.total_spent || 0) }}</div>
              </td>
              <td class="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                <div class="text-xs xl:text-sm text-gray-600">{{ formatDate(customer.created_at) }}</div>
              </td>
              <td class="px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-right text-xs xl:text-sm font-medium">
                <router-link
                  :to="`/admin/customers/${customer.id}`"
                  class="text-primary-600 hover:text-primary-900 transition-colors"
                >
                  View
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile/Tablet Card View -->
        <div class="xl:hidden divide-y divide-gray-200">
          <div
            v-for="customer in customers"
            :key="customer.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-900">
                  {{ customer.first_name }} {{ customer.last_name }}
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ customer.email }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span class="text-gray-500">Orders:</span>
                <span class="ml-1 text-gray-900">{{ customer.order_count || 0 }}</span>
              </div>
              <div>
                <span class="text-gray-500">Subscriptions:</span>
                <span class="ml-1 text-gray-900">{{ customer.subscription_count || 0 }}</span>
              </div>
              <div>
                <span class="text-gray-500">Total Spent:</span>
                <span class="ml-1 font-medium text-gray-900">£{{ formatPrice(customer.total_spent || 0) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Member Since:</span>
                <span class="ml-1 text-gray-600">{{ formatDate(customer.created_at) }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-3 pt-3 border-t border-gray-100">
              <router-link
                :to="`/admin/customers/${customer.id}`"
                class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
              >
                View Details
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

// State
const customers = ref([])
const loading = ref(true)
const error = ref(null)

// Filters
const searchQuery = ref('')
const filterStatus = ref('all')
const sortBy = ref('created_at')


// Fetch customers
const fetchCustomers = async () => {
  try {
    loading.value = true
    error.value = null

    // Start with base query
    let query = supabase
      .from('customers')
      .select(`
        *,
        orders(id, total_gbp),
        subscriptions(id)
      `)

    // Apply search filter
    if (searchQuery.value) {
      query = query.or(`first_name.ilike.%${searchQuery.value}%,last_name.ilike.%${searchQuery.value}%,email.ilike.%${searchQuery.value}%`)
    }

    // Apply status filter
    if (filterStatus.value === 'marketing_opt_in') {
      query = query.eq('marketing_opt_in', true)
    }

    // Apply sorting
    if (sortBy.value === 'created_at') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy.value === 'created_at_asc') {
      query = query.order('created_at', { ascending: true })
    } else if (sortBy.value === 'last_name') {
      query = query.order('last_name', { ascending: true })
    } else if (sortBy.value === 'email') {
      query = query.order('email', { ascending: true })
    }

    const { data, error: fetchError } = await query

    if (fetchError) throw fetchError

    // Process data to add computed fields
    customers.value = (data || []).map(customer => {
      const orderCount = customer.orders?.length || 0
      const subscriptionCount = customer.subscriptions?.length || 0
      const totalSpent = customer.orders?.reduce((sum, order) => sum + parseFloat(order.total_gbp || 0), 0) || 0

      return {
        ...customer,
        order_count: orderCount,
        subscription_count: subscriptionCount,
        total_spent: totalSpent
      }
    })

    // Apply additional filters that require computed data
    if (filterStatus.value === 'has_orders') {
      customers.value = customers.value.filter(c => c.order_count > 0)
    } else if (filterStatus.value === 'has_subscriptions') {
      customers.value = customers.value.filter(c => c.subscription_count > 0)
    }

  } catch (err) {
    console.error('Error fetching customers:', err)
    error.value = 'Failed to load customers. Please try again.'
  } finally {
    loading.value = false
  }
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

// Lifecycle
onMounted(() => {
  fetchCustomers()
})
</script>

