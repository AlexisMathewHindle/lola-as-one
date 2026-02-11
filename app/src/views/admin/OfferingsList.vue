<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Offerings</h1>
        <p class="text-sm text-gray-600 mt-1">
          Manage workshops, products, subscriptions, and digital downloads
        </p>
      </div>
      <router-link
        to="/admin/offerings/new"
        class="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
      >
        <font-awesome-icon icon="plus" class="w-4 h-4 mr-2" />
        Create Offering
      </router-link>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <font-awesome-icon icon="filter" class="w-4 h-4 text-gray-500 mr-2" />
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filters</h3>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div class="relative">
            <select
              v-model="filters.type"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Types</option>
              <option value="event">🎨 Events (Workshops)</option>
              <option value="product_physical">📦 Physical Products</option>
              <option value="subscription">🔄 Subscriptions</option>
              <option value="product_digital">💾 Digital Products</option>
            </select>
            <font-awesome-icon icon="chevron-down" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div class="relative">
            <select
              v-model="filters.status"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <font-awesome-icon icon="chevron-down" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <div class="relative">
            <font-awesome-icon icon="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search by title..."
              class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
          </div>
        </div>
      </div>
    </div>
    
    <!-- Offerings Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
        <p class="text-gray-500">Loading offerings...</p>
      </div>

      <div v-else-if="filteredOfferings.length === 0" class="text-center py-16">
        <font-awesome-icon icon="box" class="w-16 h-16 text-gray-300 mb-4" />
        <p class="text-lg font-medium text-gray-900 mb-2">No offerings found</p>
        <p class="text-sm text-gray-500">Try adjusting your filters or create a new offering</p>
      </div>

      <!-- Desktop Table View -->
      <div v-else class="overflow-x-auto">
        <table class="hidden lg:table min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Price
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                :class="{ 'cursor-pointer hover:bg-gray-100 transition-colors': canSortByEventDate }"
                @click="toggleEventDateSort"
              >
                <div class="flex items-center space-x-1">
                  <span>Details</span>
                  <font-awesome-icon
                    v-if="canSortByEventDate"
                    :icon="sortByEventDate ? 'arrow-down' : 'arrow-up'"
                    class="w-3 h-3 text-primary-600"
                  />
                </div>
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="offering in filteredOfferings" :key="offering.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-2xl">{{ getTypeIcon(offering.type) }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-semibold text-gray-900">{{ offering.title }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ offering.slug }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ formatPrice(offering) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ getOfferingDetails(offering) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="getStatusClass(offering.status)"
                >
                  {{ offering.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-3">
                  <router-link
                    :to="`/admin/offerings/${offering.id}/edit`"
                    class="text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    <font-awesome-icon icon="edit" class="w-4 h-4" />
                  </router-link>
                  <button
                    @click="deleteOffering(offering)"
                    class="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <font-awesome-icon icon="trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile Card View -->
        <div class="lg:hidden divide-y divide-gray-200">
          <div
            v-for="offering in filteredOfferings"
            :key="offering.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">{{ getTypeIcon(offering.type) }}</span>
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">{{ offering.title }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ offering.slug }}</p>
                </div>
              </div>
              <span
                class="px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0"
                :class="getStatusClass(offering.status)"
              >
                {{ offering.status }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span class="text-gray-500">Price:</span>
                <span class="ml-1 font-medium text-gray-900">{{ formatPrice(offering) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Details:</span>
                <span class="ml-1 text-gray-600">{{ getOfferingDetails(offering) }}</span>
              </div>
            </div>
            <div class="flex items-center space-x-3 pt-3 border-t border-gray-100">
              <router-link
                :to="`/admin/offerings/${offering.id}/edit`"
                class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
              >
                <font-awesome-icon icon="edit" class="w-4 h-4 mr-2" />
                Edit
              </router-link>
              <button
                @click="deleteOffering(offering)"
                class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <font-awesome-icon icon="trash" class="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()
const offerings = ref([])
const loading = ref(true)

const filters = ref({
  type: '',
  status: '',
  search: ''
})

const sortByEventDate = ref(false)

// Watch for type filter changes to auto-enable descending sort for events
watch(() => filters.value.type, (newType) => {
  if (newType === 'event') {
    sortByEventDate.value = true
  }
})

const fetchOfferings = async () => {
  try {
    loading.value = true

    const { data, error } = await supabase
      .from('offerings')
      .select(`
        *,
        offering_events (*),
        offering_products (*),
        offering_digital_products (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    offerings.value = data || []

    // Debug: Log the fetched data to see what we're getting
    console.log('Fetched offerings:', data)
    if (data && data.length > 0) {
      console.log('First offering:', data[0])
      console.log('First offering events:', data[0].offering_events)
      console.log('First offering products:', data[0].offering_products)
    }
  } catch (error) {
    console.error('Error fetching offerings:', error)
  } finally {
    loading.value = false
  }
}

const filteredOfferings = computed(() => {
  let filtered = offerings.value.filter(offering => {
    // Type filter
    if (filters.value.type && offering.type !== filters.value.type) {
      return false
    }

    // Status filter
    if (filters.value.status && offering.status !== filters.value.status) {
      return false
    }

    // Search filter
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      return offering.title.toLowerCase().includes(searchLower) ||
             offering.slug.toLowerCase().includes(searchLower)
    }

    return true
  })

  // Sort by event date if filtering events only (always sort events by date descending)
  if (filters.value.type === 'event') {
    filtered = filtered.sort((a, b) => {
      const eventA = Array.isArray(a.offering_events) ? a.offering_events[0] : a.offering_events
      const eventB = Array.isArray(b.offering_events) ? b.offering_events[0] : b.offering_events

      if (!eventA?.event_date) return 1
      if (!eventB?.event_date) return -1

      // Sort descending (newest first) if sortByEventDate is true, otherwise ascending
      if (sortByEventDate.value) {
        return new Date(eventB.event_date) - new Date(eventA.event_date)
      } else {
        return new Date(eventA.event_date) - new Date(eventB.event_date)
      }
    })
  }

  return filtered
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(filters.value.type || filters.value.status || filters.value.search)
})

// Clear all filters
const clearFilters = () => {
  filters.value.type = ''
  filters.value.status = ''
  filters.value.search = ''
  sortByEventDate.value = false
}

// Check if we should show the sort option for Details column
const canSortByEventDate = computed(() => {
  return filters.value.type === 'event'
})

// Toggle sort by event date
const toggleEventDateSort = () => {
  if (canSortByEventDate.value) {
    sortByEventDate.value = !sortByEventDate.value
  }
}

const getTypeIcon = (type) => {
  const icons = {
    event: '🎨',
    product_physical: '📦',
    subscription: '🔄',
    product_digital: '💾'
  }
  return icons[type] || '📄'
}

const formatPrice = (offering) => {
  // Handle offering_events (can be object or array)
  if (offering.offering_events) {
    const event = Array.isArray(offering.offering_events)
      ? offering.offering_events[0]
      : offering.offering_events
    if (event && event.price_gbp !== undefined) {
      return `£${event.price_gbp}`
    }
  }

  // Handle offering_products (can be object or array)
  if (offering.offering_products) {
    const product = Array.isArray(offering.offering_products)
      ? offering.offering_products[0]
      : offering.offering_products
    if (product && product.price_gbp !== undefined) {
      return `£${product.price_gbp}`
    }
  }

  // Handle offering_digital_products (can be object or array)
  if (offering.offering_digital_products) {
    const digital = Array.isArray(offering.offering_digital_products)
      ? offering.offering_digital_products[0]
      : offering.offering_digital_products
    if (digital && digital.price_gbp !== undefined) {
      return `£${digital.price_gbp}`
    }
  }

  return '—'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const getOfferingDetails = (offering) => {
  // Handle event offerings
  if (offering.type === 'event' && offering.offering_events) {
    const event = Array.isArray(offering.offering_events)
      ? offering.offering_events[0]
      : offering.offering_events
    if (event) {
      const formattedDate = formatDate(event.event_date)
      return `${formattedDate} • ${event.current_bookings}/${event.max_capacity} booked`
    }
  }

  // Handle physical product offerings
  if (offering.type === 'product_physical' && offering.offering_products) {
    const product = Array.isArray(offering.offering_products)
      ? offering.offering_products[0]
      : offering.offering_products
    if (product) {
      return product.track_inventory ? `Stock: ${product.stock_quantity}` : 'No tracking'
    }
  }

  // Handle subscription offerings
  if (offering.type === 'subscription' && offering.offering_products) {
    return 'Recurring monthly'
  }

  // Handle digital product offerings
  if (offering.type === 'product_digital' && offering.offering_digital_products) {
    const digital = Array.isArray(offering.offering_digital_products)
      ? offering.offering_digital_products[0]
      : offering.offering_digital_products
    if (digital) {
      return digital.product_type === 'gift_card' ? 'Gift Card' : 'Download'
    }
  }

  return '—'
}

const getStatusClass = (status) => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const deleteOffering = async (offering) => {
  if (!confirm(`Are you sure you want to delete "${offering.title}"?`)) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('offerings')
      .delete()
      .eq('id', offering.id)
    
    if (error) throw error
    
    // Remove from local array
    offerings.value = offerings.value.filter(o => o.id !== offering.id)
  } catch (error) {
    console.error('Error deleting offering:', error)
    toastStore.error('Failed to delete offering')
  }
}

onMounted(() => {
  fetchOfferings()
})
</script>

