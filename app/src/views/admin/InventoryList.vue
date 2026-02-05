<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Product Inventory</h1>
        <p class="text-sm text-gray-600 mt-1">
          Track stock levels and manage inventory
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-900">Filters</h3>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by SKU or product..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @input="fetchInventory"
          />
        </div>

        <!-- Filter by Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Item Type</label>
          <select
            v-model="filterType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="fetchInventory"
          >
            <option value="all">All Items</option>
            <option value="product_physical">Physical Products</option>
            <option value="subscription_box">Subscription Boxes</option>
          </select>
        </div>

        <!-- Filter by Stock Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
          <select
            v-model="filterStock"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="fetchInventory"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <!-- Sort By -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            v-model="sortBy"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            @change="fetchInventory"
          >
            <option value="sku">SKU (A-Z)</option>
            <option value="quantity_available">Quantity Available</option>
            <option value="last_counted_at">Last Counted</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="text-xs text-gray-500 mb-1">Total Items</div>
        <div class="text-2xl font-bold text-gray-900">{{ inventoryItems.length }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="text-xs text-gray-500 mb-1">In Stock</div>
        <div class="text-2xl font-bold text-success-600">{{ inStockCount }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="text-xs text-gray-500 mb-1">Low Stock</div>
        <div class="text-2xl font-bold text-warning-600">{{ lowStockCount }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="text-xs text-gray-500 mb-1">Out of Stock</div>
        <div class="text-2xl font-bold text-danger-600">{{ outOfStockCount }}</div>
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
    <div v-else-if="inventoryItems.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <font-awesome-icon icon="box" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No inventory items found</h3>
      <p class="text-gray-600">
        {{ searchQuery || filterType !== 'all' || filterStock !== 'all' ? 'Try adjusting your filters' : 'Inventory items will appear here once products are added' }}
      </p>
    </div>

    <!-- Inventory Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reserved
              </th>
              <th class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Threshold
              </th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="item in inventoryItems"
              :key="item.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <!-- Product -->
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ getProductTitle(item) }}
                </div>
              </td>

              <!-- SKU -->
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-mono">{{ item.sku }}</div>
              </td>

              <!-- Type -->
              <td class="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="item.item_type === 'product_physical' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
                >
                  {{ item.item_type === 'product_physical' ? 'Physical Product' : 'Subscription Box' }}
                </span>
              </td>

              <!-- Available -->
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900">{{ item.quantity_available }}</div>
              </td>

              <!-- Reserved -->
              <td class="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ item.quantity_reserved }}</div>
              </td>

              <!-- Threshold -->
              <td class="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-600">{{ item.low_stock_threshold }}</div>
              </td>

              <!-- Status -->
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStockStatusClass(item)"
                >
                  {{ getStockStatus(item) }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <router-link
                  :to="`/admin/inventory/${item.id}`"
                  class="text-primary-600 hover:text-primary-900 transition-colors duration-150"
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
const inventoryItems = ref([])
const loading = ref(false)
const error = ref(null)

// Filters
const searchQuery = ref('')
const filterType = ref('all')
const filterStock = ref('all')
const sortBy = ref('sku')

// Computed stats
const inStockCount = computed(() => {
  return inventoryItems.value.filter(item =>
    item.quantity_available > item.low_stock_threshold
  ).length
})

const lowStockCount = computed(() => {
  return inventoryItems.value.filter(item =>
    item.quantity_available > 0 && item.quantity_available <= item.low_stock_threshold
  ).length
})

const outOfStockCount = computed(() => {
  return inventoryItems.value.filter(item => item.quantity_available === 0).length
})

// Methods
const getProductTitle = (item) => {
  if (item.item_type === 'product_physical' && item.offering_product?.offering) {
    return item.offering_product.offering.title
  } else if (item.item_type === 'subscription_box' && item.offering) {
    return item.offering.title
  }
  return 'Unknown Product'
}

const getStockStatus = (item) => {
  if (item.quantity_available === 0) return 'Out of Stock'
  if (item.quantity_available <= item.low_stock_threshold) return 'Low Stock'
  return 'In Stock'
}

const getStockStatusClass = (item) => {
  if (item.quantity_available === 0) {
    return 'bg-red-100 text-red-800'
  }
  if (item.quantity_available <= item.low_stock_threshold) {
    return 'bg-yellow-100 text-yellow-800'
  }
  return 'bg-green-100 text-green-800'
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || filterType.value !== 'all' || filterStock.value !== 'all')
})

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  filterType.value = 'all'
  filterStock.value = 'all'
  fetchInventory()
}

const fetchInventory = async () => {
  loading.value = true
  error.value = null

  try {
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        offering_product:offering_products(
          id,
          offering:offerings(id, title)
        ),
        offering:offerings(id, title)
      `)

    // Apply type filter
    if (filterType.value !== 'all') {
      query = query.eq('item_type', filterType.value)
    }

    // Apply search filter
    if (searchQuery.value) {
      query = query.or(`sku.ilike.%${searchQuery.value}%`)
    }

    // Apply sorting
    if (sortBy.value === 'sku') {
      query = query.order('sku', { ascending: true })
    } else if (sortBy.value === 'quantity_available') {
      query = query.order('quantity_available', { ascending: false })
    } else if (sortBy.value === 'last_counted_at') {
      query = query.order('last_counted_at', { ascending: false, nullsFirst: false })
    }

    const { data, error: fetchError } = await query

    if (fetchError) throw fetchError

    // Apply stock status filter (client-side)
    let filteredData = data || []
    if (filterStock.value === 'in_stock') {
      filteredData = filteredData.filter(item => item.quantity_available > item.low_stock_threshold)
    } else if (filterStock.value === 'low_stock') {
      filteredData = filteredData.filter(item =>
        item.quantity_available > 0 && item.quantity_available <= item.low_stock_threshold
      )
    } else if (filterStock.value === 'out_of_stock') {
      filteredData = filteredData.filter(item => item.quantity_available === 0)
    }

    inventoryItems.value = filteredData
  } catch (err) {
    console.error('Error fetching inventory:', err)
    error.value = 'Failed to load inventory items. Please try again.'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchInventory()
})
</script>


