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

    <!-- Inventory Details -->
    <div v-else-if="inventoryItem">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <router-link to="/admin/inventory" class="text-sm text-primary-600 hover:text-primary-800 mb-2 inline-block">
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Back to Inventory
          </router-link>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ getProductTitle() }}</h1>
          <p class="text-sm text-gray-600 mt-1">
            SKU: {{ inventoryItem.sku }}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="showAdjustmentModal = true"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <font-awesome-icon icon="box" class="w-4 h-4 mr-2" />
            Adjust Stock
          </button>
        </div>
      </div>

      <!-- Low Stock Warning -->
      <div
        v-if="inventoryItem.quantity_available <= inventoryItem.low_stock_threshold && inventoryItem.quantity_available > 0"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
      >
        <div class="flex items-start">
          <font-awesome-icon icon="times-circle" class="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-sm font-semibold text-yellow-900">Low Stock Warning</h3>
            <p class="text-sm text-yellow-700 mt-1">
              Stock level ({{ inventoryItem.quantity_available }}) is at or below the low stock threshold ({{ inventoryItem.low_stock_threshold }}).
              Consider restocking soon.
            </p>
          </div>
        </div>
      </div>

      <!-- Out of Stock Warning -->
      <div
        v-if="inventoryItem.quantity_available === 0"
        class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
      >
        <div class="flex items-start">
          <font-awesome-icon icon="times-circle" class="w-5 h-5 text-red-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-sm font-semibold text-red-900">Out of Stock</h3>
            <p class="text-sm text-red-700 mt-1">
              This item is currently out of stock. Restock immediately to fulfill orders.
            </p>
          </div>
        </div>
      </div>

      <!-- Main Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Inventory Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Inventory Details -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Inventory Details</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Product Name</span>
                <span class="text-sm text-gray-900">{{ getProductTitle() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">SKU</span>
                <span class="text-sm text-gray-900 font-mono">{{ inventoryItem.sku }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Item Type</span>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="inventoryItem.item_type === 'product_physical' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
                >
                  {{ inventoryItem.item_type === 'product_physical' ? 'Physical Product' : 'Subscription Box' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Quantity Available</span>
                <span class="text-sm font-semibold text-gray-900">{{ inventoryItem.quantity_available }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Quantity Reserved</span>
                <span class="text-sm text-gray-900">{{ inventoryItem.quantity_reserved }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Low Stock Threshold</span>
                <span class="text-sm text-gray-900">{{ inventoryItem.low_stock_threshold }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Last Counted</span>
                <span class="text-sm text-gray-900">
                  {{ inventoryItem.last_counted_at ? formatDateTime(inventoryItem.last_counted_at) : 'Never' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Created</span>
                <span class="text-sm text-gray-900">{{ formatDateTime(inventoryItem.created_at) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Last Updated</span>
                <span class="text-sm text-gray-900">{{ formatDateTime(inventoryItem.updated_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Stock Movement History -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Stock Movement History</h2>

            <!-- Loading Movements -->
            <div v-if="loadingMovements" class="flex items-center justify-center py-8">
              <font-awesome-icon icon="spinner" class="w-6 h-6 text-primary-600 animate-spin" />
            </div>

            <!-- Empty State -->
            <div v-else-if="movements.length === 0" class="text-center py-8">
              <font-awesome-icon icon="box" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-sm text-gray-600">No stock movements recorded yet</p>
            </div>

            <!-- Movements Table -->
            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="movement in movements" :key="movement.id">
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {{ formatDateTime(movement.created_at) }}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getMovementTypeClass(movement.movement_type)"
                      >
                        {{ formatMovementType(movement.movement_type) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span
                        class="text-sm font-semibold"
                        :class="movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ movement.quantity_change > 0 ? '+' : '' }}{{ movement.quantity_change }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">
                      {{ movement.notes || '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Stats Sidebar -->
        <div class="space-y-6">
          <!-- Stock Status Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Stock Status</h3>
            <div class="space-y-4">
              <div>
                <div class="text-xs text-gray-500 mb-1">Available</div>
                <div class="text-3xl font-bold text-gray-900">{{ inventoryItem.quantity_available }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">Reserved</div>
                <div class="text-2xl font-semibold text-gray-600">{{ inventoryItem.quantity_reserved }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">Total Stock</div>
                <div class="text-2xl font-semibold text-gray-900">
                  {{ inventoryItem.quantity_available + inventoryItem.quantity_reserved }}
                </div>
              </div>
              <div class="pt-4 border-t border-gray-200">
                <div class="text-xs text-gray-500 mb-1">Status</div>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStockStatusClass()"
                >
                  {{ getStockStatus() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="space-y-3">
              <button
                @click="showAdjustmentModal = true"
                class="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-sm font-medium"
              >
                <font-awesome-icon icon="box" class="w-4 h-4 mr-2" />
                Adjust Stock
              </button>
              <router-link
                v-if="inventoryItem.offering_product?.offering_id"
                :to="`/admin/offerings/${inventoryItem.offering_product.offering_id}`"
                class="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
              >
                View Product
              </router-link>
              <router-link
                v-else-if="inventoryItem.offering_id"
                :to="`/admin/offerings/${inventoryItem.offering_id}`"
                class="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
              >
                View Offering
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock Adjustment Modal -->
    <div
      v-if="showAdjustmentModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="showAdjustmentModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Adjust Stock</h3>

        <form @submit.prevent="submitAdjustment" class="space-y-4">
          <!-- Movement Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Movement Type</label>
            <select
              v-model="adjustmentForm.movement_type"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select type...</option>
              <option value="adjustment">Manual Adjustment</option>
              <option value="restock">Restock</option>
              <option value="damage">Damage/Loss</option>
              <option value="return">Customer Return</option>
            </select>
          </div>

          <!-- Quantity Change -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quantity Change</label>
            <input
              v-model.number="adjustmentForm.quantity_change"
              type="number"
              required
              placeholder="Enter positive or negative number"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Use positive numbers to add stock, negative to remove
            </p>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              v-model="adjustmentForm.notes"
              rows="3"
              placeholder="Add any relevant notes..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>

          <!-- Preview -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">New Stock Level</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ inventoryItem.quantity_available + (adjustmentForm.quantity_change || 0) }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showAdjustmentModal = false"
              class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 font-medium disabled:opacity-50"
            >
              <font-awesome-icon v-if="submitting" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
              {{ submitting ? 'Saving...' : 'Save Adjustment' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

// State
const inventoryItem = ref(null)
const movements = ref([])
const loading = ref(false)
const loadingMovements = ref(false)
const error = ref(null)

// Modal state
const showAdjustmentModal = ref(false)
const submitting = ref(false)

// Adjustment form
const adjustmentForm = ref({
  movement_type: '',
  quantity_change: 0,
  notes: ''
})

// Methods
const getProductTitle = () => {
  if (!inventoryItem.value) return 'Unknown Product'

  if (inventoryItem.value.item_type === 'product_physical' && inventoryItem.value.offering_product?.offering) {
    return inventoryItem.value.offering_product.offering.title
  } else if (inventoryItem.value.item_type === 'subscription_box' && inventoryItem.value.offering) {
    return inventoryItem.value.offering.title
  }
  return 'Unknown Product'
}

const getStockStatus = () => {
  if (!inventoryItem.value) return 'Unknown'
  if (inventoryItem.value.quantity_available === 0) return 'Out of Stock'
  if (inventoryItem.value.quantity_available <= inventoryItem.value.low_stock_threshold) return 'Low Stock'
  return 'In Stock'
}

const getStockStatusClass = () => {
  if (!inventoryItem.value) return 'bg-gray-100 text-gray-800'
  if (inventoryItem.value.quantity_available === 0) {
    return 'bg-red-100 text-red-800'
  }
  if (inventoryItem.value.quantity_available <= inventoryItem.value.low_stock_threshold) {
    return 'bg-yellow-100 text-yellow-800'
  }
  return 'bg-green-100 text-green-800'
}

const formatMovementType = (type) => {
  const types = {
    purchase: 'Purchase',
    sale: 'Sale',
    adjustment: 'Adjustment',
    return: 'Return',
    damage: 'Damage',
    restock: 'Restock'
  }
  return types[type] || type
}

const getMovementTypeClass = (type) => {
  const classes = {
    purchase: 'bg-blue-100 text-blue-800',
    sale: 'bg-purple-100 text-purple-800',
    adjustment: 'bg-gray-100 text-gray-800',
    return: 'bg-green-100 text-green-800',
    damage: 'bg-red-100 text-red-800',
    restock: 'bg-green-100 text-green-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchInventoryItem = async () => {
  loading.value = true
  error.value = null

  try {
    const inventoryId = route.params.id

    const { data, error: fetchError } = await supabase
      .from('inventory_items')
      .select(`
        *,
        offering_product:offering_products(
          id,
          offering_id,
          offering:offerings(id, title)
        ),
        offering:offerings(id, title)
      `)
      .eq('id', inventoryId)
      .single()

    if (fetchError) throw fetchError

    if (!data) {
      error.value = 'Inventory item not found'
      return
    }

    inventoryItem.value = data
  } catch (err) {
    console.error('Error fetching inventory item:', err)
    error.value = 'Failed to load inventory item. Please try again.'
  } finally {
    loading.value = false
  }
}

const fetchMovements = async () => {
  loadingMovements.value = true

  try {
    const inventoryId = route.params.id

    const { data, error: fetchError } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('inventory_item_id', inventoryId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (fetchError) throw fetchError

    movements.value = data || []
  } catch (err) {
    console.error('Error fetching movements:', err)
  } finally {
    loadingMovements.value = false
  }
}

const submitAdjustment = async () => {
  if (!adjustmentForm.value.movement_type || adjustmentForm.value.quantity_change === 0) {
    toastStore.error('Please select a movement type and enter a quantity change')
    return
  }

  submitting.value = true

  try {
    const inventoryId = route.params.id
    const now = new Date().toISOString()

    // Calculate new quantity
    const newQuantity = inventoryItem.value.quantity_available + adjustmentForm.value.quantity_change

    if (newQuantity < 0) {
      toastStore.error('Cannot reduce stock below 0')
      submitting.value = false
      return
    }

    // Update inventory item
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        quantity_available: newQuantity,
        last_counted_at: now,
        updated_at: now
      })
      .eq('id', inventoryId)

    if (updateError) throw updateError

    // Create movement record
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        inventory_item_id: inventoryId,
        movement_type: adjustmentForm.value.movement_type,
        quantity_change: adjustmentForm.value.quantity_change,
        notes: adjustmentForm.value.notes || null,
        reference_type: 'manual',
        created_at: now
      })

    if (movementError) throw movementError

    // Refresh data
    await fetchInventoryItem()
    await fetchMovements()

    // Reset form and close modal
    adjustmentForm.value = {
      movement_type: '',
      quantity_change: 0,
      notes: ''
    }
    showAdjustmentModal.value = false

    toastStore.success('Stock adjustment saved successfully!')
  } catch (err) {
    console.error('Error saving adjustment:', err)
    toastStore.error('Failed to save stock adjustment. Please try again.')
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchInventoryItem()
  fetchMovements()
})
</script>


