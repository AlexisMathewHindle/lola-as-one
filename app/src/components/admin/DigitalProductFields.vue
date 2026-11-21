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
    
    <!-- Price (not for gift cards, which use a set of amounts instead) -->
    <div v-if="modelValue.product_type !== 'gift_card'">
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
    <div v-if="modelValue.product_type === 'gift_card'" class="border-t border-gray-200 pt-4 space-y-6">
      <h4 class="text-sm font-semibold text-gray-900">Gift Card Settings</h4>

      <!-- Amounts customers can buy -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Gift card amounts <span class="text-red-500">*</span>
        </label>
        <p class="text-xs text-gray-500 mb-3">
          The set amounts a customer can choose from. Untick an amount to hide it from the shop without deleting it.
        </p>

        <div v-if="denominations.length === 0" class="text-sm text-gray-500 italic mb-3">
          No amounts yet. Add at least one (for example £25).
        </div>

        <div class="space-y-2">
          <div
            v-for="(denom, index) in denominations"
            :key="index"
            class="flex items-center gap-3"
          >
            <div class="flex items-center">
              <span class="text-gray-500 mr-1">£</span>
              <input
                :value="denom.amount_gbp"
                @input="updateDenomination(index, 'amount_gbp', parseFloat($event.target.value) || 0)"
                type="number"
                min="0"
                step="0.01"
                class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="25.00"
              >
            </div>
            <label class="inline-flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                :checked="denom.active !== false"
                @change="updateDenomination(index, 'active', $event.target.checked)"
                class="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              Shown in shop
            </label>
            <button
              type="button"
              @click="removeDenomination(index)"
              class="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>

        <button
          type="button"
          @click="addDenomination"
          class="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add amount
        </button>
      </div>

      <!-- How long a card lasts before it expires -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Card expires after (months) <span class="text-red-500">*</span>
        </label>
        <input
          :value="modelValue.gift_card_expiry_months ?? 12"
          @input="updateField('gift_card_expiry_months', parseInt($event.target.value) || 12)"
          type="number"
          min="1"
          class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="12"
        >
        <p class="text-xs text-gray-500 mt-1">
          A newly bought card expires this many months after purchase. Applies to new cards only; you can change an
          individual card's expiry later. Default is 12 months.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

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
      stripe_product_id: '',
      gift_card_expiry_months: 12,
      denominations: []
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

// Gift card amounts (denominations) live on modelValue.denominations
const denominations = computed(() =>
  Array.isArray(props.modelValue.denominations) ? props.modelValue.denominations : []
)

const addDenomination = () => {
  updateField('denominations', [
    ...denominations.value,
    { amount_gbp: 0, active: true, sort_order: denominations.value.length }
  ])
}

const updateDenomination = (index, field, value) => {
  const next = denominations.value.map((denom, i) =>
    i === index ? { ...denom, [field]: value } : denom
  )
  updateField('denominations', next)
}

const removeDenomination = (index) => {
  updateField('denominations', denominations.value.filter((_, i) => i !== index))
}
</script>

