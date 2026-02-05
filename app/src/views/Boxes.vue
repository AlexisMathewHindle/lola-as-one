<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2">
          Art Boxes
        </h1>
        <p class="text-base sm:text-lg text-gray-600">
          Curated art supplies and creative kits delivered to your door
        </p>
      </div>

      <!-- Product Type Tabs -->
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="activeTab = tab.value"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors touch-manipulation"
              :class="activeTab === tab.value
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            >
              {{ tab.label }}
              <span v-if="tab.count !== null" class="ml-2 py-0.5 px-2 rounded-full text-xs"
                :class="activeTab === tab.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'">
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Filters and Search Bar -->
      <div class="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <font-awesome-icon icon="search" class="w-4 h-4 mr-1" />
              Search
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search boxes..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <!-- Sort -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              v-model="sortBy"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>

          <!-- Availability Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              v-model="availabilityFilter"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <!-- Active Filters Display -->
        <div v-if="hasActiveFilters" class="mt-4 flex items-center gap-2 flex-wrap">
          <span class="text-sm text-gray-600">Active filters:</span>
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700 hover:bg-primary-200"
          >
            Search: "{{ searchQuery }}"
            <font-awesome-icon icon="times" class="w-3 h-3 ml-2" />
          </button>
          <button
            v-if="availabilityFilter !== 'all'"
            @click="availabilityFilter = 'all'"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700 hover:bg-primary-200"
          >
            {{ availabilityFilterLabel }}
            <font-awesome-icon icon="times" class="w-3 h-3 ml-2" />
          </button>
          <button
            @click="clearFilters"
            class="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear all
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
          <div class="aspect-square bg-gray-200"></div>
          <div class="p-6 space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-full"></div>
            <div class="h-3 bg-gray-200 rounded w-5/6"></div>
            <div class="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center mb-2">
          <font-awesome-icon icon="exclamation-circle" class="w-5 h-5 text-red-600 mr-2" />
          <h3 class="text-lg font-semibold text-red-900">Error Loading Boxes</h3>
        </div>
        <p class="text-red-700">{{ error }}</p>
      </div>

      <!-- Product Grid -->
      <div v-else-if="filteredBoxes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="box in filteredBoxes"
          :key="box.id"
          @click="goToBox(box.offering.slug)"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <!-- Product Image -->
          <div class="aspect-square bg-gray-100 relative overflow-hidden">
            <img
              v-if="box.offering.featured_image_url"
              :src="box.offering.featured_image_url"
              :alt="box.offering.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <font-awesome-icon icon="box" class="w-20 h-20 text-primary-400" />
            </div>

            <!-- Subscription Badge -->
            <div v-if="box.available_for_subscription" class="absolute top-3 left-3">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white shadow-lg">
                <font-awesome-icon icon="calendar-check" class="w-3 h-3 mr-1" />
                Subscription
              </span>
            </div>

            <!-- Stock Status Badge -->
            <div class="absolute top-3 right-3">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-lg"
                :class="stockStatusBadgeClass(box)"
              >
                {{ stockStatusText(box) }}
              </span>
            </div>
          </div>

          <!-- Product Info -->
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {{ box.offering.title }}
            </h3>
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">
              {{ box.offering.description_short || 'Curated art supplies and creative materials' }}
            </p>

            <!-- Price -->
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-2xl font-bold text-gray-900">
                  £{{ formatPrice(box.price_gbp) }}
                </span>
                <span v-if="box.available_for_subscription" class="text-sm text-gray-500 ml-1">
                  /month
                </span>
              </div>
            </div>

            <!-- Action Button -->
            <button
              @click.stop="handleAction(box)"
              class="w-full py-2.5 px-4 rounded-lg font-medium transition-colors"
              :class="actionButtonClass(box)"
              :disabled="isOutOfStock(box) && !box.waitlist_enabled"
            >
              <font-awesome-icon :icon="actionButtonIcon(box)" class="w-4 h-4 mr-2" />
              {{ actionButtonText(box) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <font-awesome-icon icon="box" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No boxes found</h3>
        <p class="text-gray-600 mb-6">
          {{ emptyStateMessage }}
        </p>
        <button
          @click="clearFilters"
          class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <font-awesome-icon icon="times" class="w-4 h-4 mr-2" />
          Clear Filters
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const cartStore = useCartStore()
const toastStore = useToastStore()

// State
const boxes = ref([])
const loading = ref(true)
const error = ref(null)
const activeTab = ref('all')
const searchQuery = ref('')
const sortBy = ref('newest')
const availabilityFilter = ref('all')

// Fetch boxes from Supabase
const fetchBoxes = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('offering_products')
      .select(`
        *,
        offering:offerings!inner(*)
      `)
      .eq('offering.type', 'product_physical')
      .eq('offering.status', 'published')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    boxes.value = data || []
  } catch (err) {
    console.error('Error fetching boxes:', err)
    error.value = 'Failed to load boxes. Please try again.'
  } finally {
    loading.value = false
  }
}

// Computed: Subscription boxes
const subscriptionBoxes = computed(() => {
  return boxes.value.filter(box => box.available_for_subscription)
})

// Computed: One-time boxes
const oneTimeBoxes = computed(() => {
  return boxes.value.filter(box => !box.available_for_subscription)
})

// Computed: Tabs with counts
const tabs = computed(() => [
  { label: 'All Boxes', value: 'all', count: boxes.value.length },
  { label: 'Subscription Boxes', value: 'subscription', count: subscriptionBoxes.value.length },
  { label: 'One-Time Boxes', value: 'one-time', count: oneTimeBoxes.value.length }
])

// Computed: Filtered boxes by tab
const tabFilteredBoxes = computed(() => {
  if (activeTab.value === 'subscription') {
    return subscriptionBoxes.value
  } else if (activeTab.value === 'one-time') {
    return oneTimeBoxes.value
  }
  return boxes.value
})

// Computed: Filtered boxes by search
const searchFilteredBoxes = computed(() => {
  if (!searchQuery.value.trim()) {
    return tabFilteredBoxes.value
  }

  const query = searchQuery.value.toLowerCase()
  return tabFilteredBoxes.value.filter(box => {
    const title = box.offering.title?.toLowerCase() || ''
    const description = box.offering.description_short?.toLowerCase() || ''
    return title.includes(query) || description.includes(query)
  })
})

// Computed: Filtered boxes by availability
const availabilityFilteredBoxes = computed(() => {
  if (availabilityFilter.value === 'all') {
    return searchFilteredBoxes.value
  }

  return searchFilteredBoxes.value.filter(box => {
    const stockStatus = getStockStatus(box)
    return stockStatus === availabilityFilter.value
  })
})

// Computed: Sorted and filtered boxes
const filteredBoxes = computed(() => {
  const sorted = [...availabilityFilteredBoxes.value]

  switch (sortBy.value) {
    case 'price-low':
      sorted.sort((a, b) => a.price_gbp - b.price_gbp)
      break
    case 'price-high':
      sorted.sort((a, b) => b.price_gbp - a.price_gbp)
      break
    case 'name':
      sorted.sort((a, b) => a.offering.title.localeCompare(b.offering.title))
      break
    case 'newest':
    default:
      // Already sorted by created_at desc from query
      break
  }

  return sorted
})

// Computed: Has active filters
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || availabilityFilter.value !== 'all'
})

// Computed: Availability filter label
const availabilityFilterLabel = computed(() => {
  const labels = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock'
  }
  return labels[availabilityFilter.value] || ''
})

// Computed: Empty state message
const emptyStateMessage = computed(() => {
  if (searchQuery.value.trim()) {
    return `No boxes match your search "${searchQuery.value}"`
  }
  if (availabilityFilter.value !== 'all') {
    return `No boxes match the selected filters`
  }
  if (activeTab.value === 'subscription') {
    return 'No subscription boxes available at the moment'
  }
  if (activeTab.value === 'one-time') {
    return 'No one-time boxes available at the moment'
  }
  return 'No boxes available at the moment'
})

// Helper: Get stock status
const getStockStatus = (box) => {
  if (!box.track_inventory) return 'in-stock'

  if (box.stock_quantity === 0) {
    return 'out-of-stock'
  } else if (box.stock_quantity <= box.low_stock_threshold) {
    return 'low-stock'
  }
  return 'in-stock'
}

// Helper: Is out of stock
const isOutOfStock = (box) => {
  return box.track_inventory && box.stock_quantity === 0
}

// Helper: Stock status text
const stockStatusText = (box) => {
  const status = getStockStatus(box)

  if (status === 'out-of-stock') {
    return 'Out of Stock'
  } else if (status === 'low-stock') {
    return `Only ${box.stock_quantity} left`
  }
  return 'In Stock'
}

// Helper: Stock status badge class
const stockStatusBadgeClass = (box) => {
  const status = getStockStatus(box)

  if (status === 'out-of-stock') {
    return 'bg-red-500 text-white'
  } else if (status === 'low-stock') {
    return 'bg-warning-500 text-white'
  }
  return 'bg-success-500 text-white'
}

// Helper: Action button text
const actionButtonText = (box) => {
  if (isOutOfStock(box)) {
    if (box.waitlist_enabled) {
      return 'Join Waitlist'
    }
    return 'Out of Stock'
  }

  if (box.available_for_subscription) {
    return 'Subscribe'
  }

  return 'Add to Cart'
}

// Helper: Action button icon
const actionButtonIcon = (box) => {
  if (isOutOfStock(box)) {
    return box.waitlist_enabled ? 'bell' : 'times-circle'
  }

  if (box.available_for_subscription) {
    return 'calendar-check'
  }

  return 'shopping-cart'
}

// Helper: Action button class
const actionButtonClass = (box) => {
  if (isOutOfStock(box)) {
    if (box.waitlist_enabled) {
      return 'bg-gray-600 text-white hover:bg-gray-700'
    }
    return 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }

  if (box.available_for_subscription) {
    return 'bg-primary-600 text-white hover:bg-primary-700'
  }

  return 'bg-primary-600 text-white hover:bg-primary-700'
}

// Helper: Format price
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  availabilityFilter.value = 'all'
  sortBy.value = 'newest'
}

// Navigate to box detail page
const goToBox = (slug) => {
  router.push(`/boxes/${slug}`)
}

// Handle action button click
const handleAction = (box) => {
  // For out of stock items with waitlist, navigate to detail page
  if (isOutOfStock(box)) {
    if (box.waitlist_enabled) {
      goToBox(box.offering.slug)
    }
    return
  }

  // For subscriptions, navigate to detail page for subscription options
  if (box.available_for_subscription) {
    goToBox(box.offering.slug)
    return
  }

  // For regular boxes, add to cart
  try {
    cartStore.addItem({
      id: box.offering.id,
      type: 'product_physical',
      title: box.offering.title,
      price: box.price_gbp,
      image: box.offering.featured_image_url,
      slug: box.offering.slug
    }, 1)

    // Show success message
    toastStore.success(`${box.offering.title} added to cart!`)
  } catch (err) {
    console.error('Error adding to cart:', err)
    toastStore.error('Failed to add to cart. Please try again.')
  }
}

// Lifecycle
onMounted(() => {
  fetchBoxes()
})
</script>

