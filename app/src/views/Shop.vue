<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2">
          Shop All Products
        </h1>
        <p class="text-base sm:text-lg text-gray-600">
          Browse our full collection of art boxes and digital downloads
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
              placeholder="Search products..."
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

          <!-- Availability Filter (Physical products only) -->
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
            class="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear all
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div class="aspect-square bg-gray-200 rounded-lg mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Products Grid -->
      <div v-else-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          @click="navigateToProduct(product)"
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <!-- Product Image -->
          <div class="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
            <img
              v-if="product.offering?.featured_image_url"
              :src="product.offering.featured_image_url"
              :alt="product.offering?.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="flex items-center justify-center h-full">
              <font-awesome-icon
                :icon="product.productType === 'digital' ? 'download' : 'box'"
                class="w-16 h-16 text-gray-300"
              />
            </div>

            <!-- Product Type Badge -->
            <div class="absolute top-3 left-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-semibold"
                :class="productTypeBadgeClass(product)"
              >
                {{ productTypeBadgeText(product) }}
              </span>
            </div>

            <!-- Stock Status Badge (Physical products only) -->
            <div v-if="product.productType === 'physical'" class="absolute top-3 right-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-semibold"
                :class="stockBadgeClass(product)"
              >
                {{ stockBadgeText(product) }}
              </span>
            </div>
          </div>

          <!-- Product Info -->
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {{ product.offering?.title }}
            </h3>
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">
              {{ product.offering?.description_short }}
            </p>

            <!-- Price -->
            <div class="flex items-center justify-between mb-4">
              <span class="text-2xl font-bold text-gray-900">
                £{{ formatPrice(product.price_gbp) }}
              </span>
              <span v-if="product.productType === 'physical' && product.available_for_subscription" class="text-sm text-gray-500">
                or subscribe
              </span>
            </div>

            <!-- Action Button -->
            <button
              @click.stop="handleProductAction(product)"
              class="w-full py-2.5 px-4 rounded-lg font-medium transition-colors"
              :class="actionButtonClass(product)"
              :disabled="isOutOfStock(product) && !product.waitlist_enabled"
            >
              <font-awesome-icon :icon="actionButtonIcon(product)" class="w-4 h-4 mr-2" />
              {{ actionButtonText(product) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <font-awesome-icon icon="shopping-bag" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
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
const physicalProducts = ref([])
const digitalProducts = ref([])
const loading = ref(true)
const error = ref(null)
const activeTab = ref('all')
const searchQuery = ref('')
const sortBy = ref('newest')
const availabilityFilter = ref('all')

// Fetch products from Supabase
const fetchProducts = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch physical products (boxes)
    const { data: physicalData, error: physicalError } = await supabase
      .from('offering_products')
      .select(`
        *,
        offering:offerings!inner(*)
      `)
      .in('offering.type', ['product_physical', 'subscription'])
      .eq('offering.status', 'published')
      .order('created_at', { ascending: false })

    if (physicalError) throw physicalError

    // Fetch digital products
    const { data: digitalData, error: digitalError } = await supabase
      .from('offering_digital_products')
      .select(`
        *,
        offering:offerings!inner(*)
      `)
      .eq('offering.type', 'product_digital')
      .eq('offering.status', 'published')
      .order('created_at', { ascending: false })

    if (digitalError) throw digitalError

    // Add productType field for easier filtering
    physicalProducts.value = (physicalData || []).map(p => ({
      ...p,
      // Treat subscription offerings separately from standard physical products
      productType: p.offering?.type === 'subscription' ? 'subscription' : 'physical'
    }))
    digitalProducts.value = (digitalData || []).map(p => ({ ...p, productType: 'digital' }))

    console.log('Fetched products:', {
      physical: physicalProducts.value.length,
      digital: digitalProducts.value.length,
      total: physicalProducts.value.length + digitalProducts.value.length
    })
  } catch (err) {
    console.error('Error fetching products:', err)
    error.value = 'Failed to load products. Please try again.'
  } finally {
    loading.value = false
  }
}

// Computed: All products combined
const allProducts = computed(() => {
  return [...physicalProducts.value, ...digitalProducts.value]
})

// Computed: Tabs with counts
const tabs = computed(() => [
  { label: 'All Products', value: 'all', count: allProducts.value.length },
  { label: 'Physical Products', value: 'physical', count: physicalProducts.value.length },
  { label: 'Digital Products', value: 'digital', count: digitalProducts.value.length }
])

// Computed: Filtered products by tab
const tabFilteredProducts = computed(() => {
  if (activeTab.value === 'physical') {
    return physicalProducts.value
  } else if (activeTab.value === 'digital') {
    return digitalProducts.value
  }
  return allProducts.value
})

// Computed: Filtered products by search
const searchFilteredProducts = computed(() => {
  if (!searchQuery.value.trim()) {
    return tabFilteredProducts.value
  }

  const query = searchQuery.value.toLowerCase()
  return tabFilteredProducts.value.filter(product => {
    const title = product.offering?.title?.toLowerCase() || ''
    const description = product.offering?.description_short?.toLowerCase() || ''
    return title.includes(query) || description.includes(query)
  })
})

// Computed: Filtered products by availability (physical products only)
const availabilityFilteredProducts = computed(() => {
  if (availabilityFilter.value === 'all') {
    return searchFilteredProducts.value
  }

  return searchFilteredProducts.value.filter(product => {
	    // Digital products and non-inventory-tracked items (e.g. subscriptions)
	    // are always treated as "in stock" for availability filtering
	    if (product.productType === 'digital' || product.track_inventory === false) {
	      return availabilityFilter.value === 'in-stock'
	    }

	    // Physical products with inventory tracking check stock
	    const stock = product.stock_quantity || 0
	    const lowThreshold = product.low_stock_threshold || 5

	    if (availabilityFilter.value === 'in-stock') {
	      return stock > lowThreshold
	    } else if (availabilityFilter.value === 'low-stock') {
	      return stock > 0 && stock <= lowThreshold
	    } else if (availabilityFilter.value === 'out-of-stock') {
	      return stock === 0
	    }

	    return true
  })
})

// Computed: Sorted and filtered products
const filteredProducts = computed(() => {
  const products = [...availabilityFilteredProducts.value]

  // Sort products
  products.sort((a, b) => {
    if (sortBy.value === 'price-low') {
      return (a.price_gbp || 0) - (b.price_gbp || 0)
    } else if (sortBy.value === 'price-high') {
      return (b.price_gbp || 0) - (a.price_gbp || 0)
    } else if (sortBy.value === 'name') {
      const aTitle = a.offering?.title || ''
      const bTitle = b.offering?.title || ''
      return aTitle.localeCompare(bTitle)
    } else {
      // newest (default)
      return new Date(b.created_at) - new Date(a.created_at)
    }
  })

  return products
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
    return `No products match "${searchQuery.value}". Try adjusting your search or filters.`
  }
  if (availabilityFilter.value !== 'all') {
    return 'No products match your filters. Try adjusting your selection.'
  }
  return 'No products available at the moment. Check back soon!'
})

// Helper: Check if product is out of stock
const isOutOfStock = (product) => {
	  if (product.productType === 'digital') return false
	  if (product.track_inventory === false) return false
	  return (product.stock_quantity || 0) === 0
}

// Helper: Check if product is low stock
const isLowStock = (product) => {
	  if (product.productType === 'digital') return false
	  if (product.track_inventory === false) return false
	  const stock = product.stock_quantity || 0
	  const threshold = product.low_stock_threshold || 5
	  return stock > 0 && stock <= threshold
}

// Helper: Product type badge class
const productTypeBadgeClass = (product) => {
  if (product.productType === 'digital') {
    return 'bg-purple-100 text-purple-700'
  }
  if (product.available_for_subscription) {
    return 'bg-blue-100 text-blue-700'
  }
  return 'bg-gray-100 text-gray-700'
}

// Helper: Product type badge text
const productTypeBadgeText = (product) => {
  if (product.productType === 'digital') {
    return product.product_type === 'gift_card' ? 'Gift Card' : 'Digital Download'
  }
  if (product.available_for_subscription) {
    return 'Subscription'
  }
  return 'Physical Product'
}

// Helper: Stock badge class
const stockBadgeClass = (product) => {
  if (isOutOfStock(product)) {
    return 'bg-red-100 text-red-700'
  }
  if (isLowStock(product)) {
    return 'bg-yellow-100 text-yellow-700'
  }
  return 'bg-green-100 text-green-700'
}

// Helper: Stock badge text
const stockBadgeText = (product) => {
  if (isOutOfStock(product)) {
    return 'Out of Stock'
  }
  if (isLowStock(product)) {
    const stock = product.stock_quantity || 0
    return `Only ${stock} left`
  }
  return 'In Stock'
}

// Helper: Action button class
const actionButtonClass = (product) => {
  if (product.productType === 'digital') {
    return 'bg-purple-600 text-white hover:bg-purple-700'
  }
  if (isOutOfStock(product)) {
    if (product.waitlist_enabled) {
      return 'bg-gray-600 text-white hover:bg-gray-700'
    }
    return 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }
  if (product.available_for_subscription) {
    return 'bg-blue-600 text-white hover:bg-blue-700'
  }
  return 'bg-primary-600 text-white hover:bg-primary-700'
}

// Helper: Action button icon
const actionButtonIcon = (product) => {
  if (product.productType === 'digital') {
    return 'download'
  }
  if (isOutOfStock(product)) {
    if (product.waitlist_enabled) {
      return 'bell'
    }
    return 'times-circle'
  }
  if (product.available_for_subscription) {
    return 'sync'
  }
  return 'shopping-cart'
}

// Helper: Action button text
const actionButtonText = (product) => {
  if (product.productType === 'digital') {
    return 'View Details'
  }
  if (isOutOfStock(product)) {
    if (product.waitlist_enabled) {
      return 'Join Waitlist'
    }
    return 'Out of Stock'
  }
  if (product.available_for_subscription) {
    return 'Subscribe'
  }
  return 'Add to Cart'
}

// Helper: Format price
const formatPrice = (price) => {
  return parseFloat(price || 0).toFixed(2)
}

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  availabilityFilter.value = 'all'
  activeTab.value = 'all'
}

// Navigate to product detail page
const navigateToProduct = (product) => {
  const slug = product.offering?.slug
  if (!slug) return

  if (product.productType === 'digital') {
    router.push(`/products/${slug}`)
  } else if (product.offering?.type === 'subscription') {
    // Subscription offerings go to the dedicated subscription detail view
    router.push(`/subscriptions/${slug}`)
  } else {
    router.push(`/boxes/${slug}`)
  }
}

// Handle product action (add to cart, subscribe, join waitlist, etc.)
const handleProductAction = (product) => {
  // For digital products, always navigate to detail page
  if (product.productType === 'digital') {
    navigateToProduct(product)
    return
  }

  // For subscriptions, navigate to detail page
  if (product.available_for_subscription) {
    navigateToProduct(product)
    return
  }

  // For out of stock items with waitlist, navigate to detail page
  if (isOutOfStock(product) && product.waitlist_enabled) {
    navigateToProduct(product)
    return
  }

  // For out of stock items without waitlist, do nothing
  if (isOutOfStock(product)) {
    return
  }

  // For physical products in stock, add to cart
  try {
    cartStore.addItem({
      id: product.offering.id,
      type: 'product_physical',
      title: product.offering.title,
      price: product.price_gbp,
      image: product.offering.featured_image_url,
      slug: product.offering.slug
    }, 1)
  } catch (err) {
    console.error('Error adding to cart:', err)
    toastStore.error('Failed to add to cart. Please try again.')
  }
}

// Lifecycle
onMounted(() => {
  fetchProducts()
})
</script>


