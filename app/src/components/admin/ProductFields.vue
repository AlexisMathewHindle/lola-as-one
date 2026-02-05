<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
    
    <!-- SKU -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        SKU <span class="text-red-500">*</span>
      </label>
      <input
        :value="modelValue.sku"
        @input="updateField('sku', $event.target.value)"
        type="text"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="e.g., BOX-WATERCOLOR-001"
      >
      <p class="text-xs text-gray-500 mt-1">Unique product identifier</p>
    </div>
    
    <!-- Price -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Price (£) <span class="text-red-500">*</span>
      </label>
      <input
        :value="modelValue.price_gbp"
        @input="updateField('price_gbp', parseFloat($event.target.value) || 0)"
        type="number"
        required
        min="0"
        step="0.01"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="e.g., 35.00"
      >
    </div>
    
    <!-- Inventory Tracking -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center mb-4">
        <input
          :checked="modelValue.track_inventory"
          @change="updateField('track_inventory', $event.target.checked)"
          type="checkbox"
          id="track_inventory"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        >
        <label for="track_inventory" class="ml-2 block text-sm font-medium text-gray-700">
          Track inventory for this product
        </label>
      </div>
      
      <div v-if="modelValue.track_inventory" class="space-y-4 pl-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity <span class="text-red-500">*</span>
            </label>
            <input
              :value="modelValue.stock_quantity"
              @input="updateField('stock_quantity', parseInt($event.target.value) || 0)"
              type="number"
              required
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 50"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              :value="modelValue.low_stock_threshold"
              @input="updateField('low_stock_threshold', parseInt($event.target.value) || 0)"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 5"
            >
            <p class="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Shipping -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center mb-4">
        <input
          :checked="modelValue.requires_shipping"
          @change="updateField('requires_shipping', $event.target.checked)"
          type="checkbox"
          id="requires_shipping"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        >
        <label for="requires_shipping" class="ml-2 block text-sm font-medium text-gray-700">
          This product requires shipping
        </label>
      </div>

      <div v-if="modelValue.requires_shipping" class="pl-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Weight (grams)
        </label>
        <input
          :value="modelValue.weight_grams"
          @input="updateField('weight_grams', parseInt($event.target.value) || 0)"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., 500"
        >
        <p class="text-xs text-gray-500 mt-1">Used for shipping calculations</p>
      </div>
    </div>

    <!-- Waitlist Settings -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
        <input
          :checked="modelValue.waitlist_enabled"
          @change="updateField('waitlist_enabled', $event.target.checked)"
          type="checkbox"
          id="waitlist_enabled"
          class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-all"
        >
        <label for="waitlist_enabled" class="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
          <font-awesome-icon icon="clock" class="w-4 h-4 text-blue-600 mr-1" />
          Enable "Notify Me" waitlist when out of stock
        </label>
      </div>
      <p class="text-xs text-gray-500 mt-2 ml-1">
        When enabled, customers can join a waitlist when this product is out of stock. They'll be automatically notified when it's back in stock.
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      sku: '',
      price_gbp: 0,
      track_inventory: true,
      stock_quantity: 0,
      low_stock_threshold: 5,
      requires_shipping: true,
      weight_grams: 0,
      waitlist_enabled: false
    })
  }
})

const emit = defineEmits(['update:modelValue'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>

