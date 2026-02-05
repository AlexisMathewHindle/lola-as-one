<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Digital Product Details</h3>
    
    <!-- Product Type -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Product Type <span class="text-red-500">*</span>
      </label>
      <select
        :value="modelValue.product_type"
        @input="updateField('product_type', $event.target.value)"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Select type...</option>
        <option value="gift_card">Gift Card</option>
        <option value="download">Download (PDF, Video, etc.)</option>
      </select>
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
        placeholder="e.g., 10.00"
      >
    </div>
    
    <!-- Download-specific fields -->
    <div v-if="modelValue.product_type === 'download'" class="border-t border-gray-200 pt-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-900">Download Settings</h4>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          File URL
        </label>
        <input
          :value="modelValue.file_url"
          @input="updateField('file_url', $event.target.value)"
          type="url"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="https://..."
        >
        <p class="text-xs text-gray-500 mt-1">Upload file to Supabase Storage and paste URL here</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            File Type
          </label>
          <select
            :value="modelValue.file_type"
            @input="updateField('file_type', $event.target.value)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select type...</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="image">Image</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            File Size (MB)
          </label>
          <input
            :value="modelValue.file_size_mb"
            @input="updateField('file_size_mb', parseFloat($event.target.value) || 0)"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., 2.5"
          >
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Download Limit
          </label>
          <input
            :value="modelValue.download_limit"
            @input="updateField('download_limit', parseInt($event.target.value) || 0)"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., 3"
          >
          <p class="text-xs text-gray-500 mt-1">Max downloads per purchase (0 = unlimited)</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Download Expiry (days)
          </label>
          <input
            :value="modelValue.download_expiry_days"
            @input="updateField('download_expiry_days', parseInt($event.target.value) || 0)"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., 30"
          >
          <p class="text-xs text-gray-500 mt-1">Days until download link expires (0 = never)</p>
        </div>
      </div>
    </div>
    
    <!-- Gift Card-specific fields -->
    <div v-if="modelValue.product_type === 'gift_card'" class="border-t border-gray-200 pt-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-900">Gift Card Settings</h4>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Stripe Product ID
        </label>
        <input
          :value="modelValue.stripe_product_id"
          @input="updateField('stripe_product_id', $event.target.value)"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="prod_..."
        >
        <p class="text-xs text-gray-500 mt-1">From Stripe Dashboard → Products</p>
      </div>
      
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p class="text-sm text-yellow-800">
          💡 Gift cards are typically handled through Stripe's gift card functionality or a custom implementation.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      product_type: '',
      price_gbp: 0,
      file_url: '',
      file_type: '',
      file_size_mb: 0,
      download_limit: 0,
      download_expiry_days: 30,
      stripe_product_id: ''
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

