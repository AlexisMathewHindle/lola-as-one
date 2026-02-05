<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
    
    <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
      <p class="text-sm text-blue-800">
        💡 Subscriptions are recurring products that charge customers monthly. Make sure to configure the corresponding Stripe product and price.
      </p>
    </div>
    
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
        placeholder="e.g., SUB-MONTHLY-001"
      >
    </div>
    
    <!-- Price -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Monthly Price (£) <span class="text-red-500">*</span>
      </label>
      <input
        :value="modelValue.price_gbp"
        @input="updateField('price_gbp', parseFloat($event.target.value) || 0)"
        type="number"
        required
        min="0"
        step="0.01"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="e.g., 29.99"
      >
      <p class="text-xs text-gray-500 mt-1">Amount charged each billing cycle</p>
    </div>
    
    <!-- Billing Interval -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Billing Interval
      </label>
      <select
        :value="modelValue.billing_interval"
        @input="updateField('billing_interval', $event.target.value)"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="month">Monthly</option>
        <option value="year">Yearly</option>
      </select>
    </div>
    
    <!-- Stripe Integration -->
    <div class="border-t border-gray-200 pt-4 space-y-4">
      <h4 class="text-sm font-semibold text-gray-900">Stripe Integration</h4>
      
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
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Stripe Price ID
        </label>
        <input
          :value="modelValue.stripe_price_id"
          @input="updateField('stripe_price_id', $event.target.value)"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="price_..."
        >
        <p class="text-xs text-gray-500 mt-1">From Stripe Dashboard → Products → Pricing</p>
      </div>
    </div>
    
    <!-- Availability -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center">
        <input
          :checked="modelValue.available_for_subscription"
          @change="updateField('available_for_subscription', $event.target.checked)"
          type="checkbox"
          id="available_for_subscription"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        >
        <label for="available_for_subscription" class="ml-2 block text-sm font-medium text-gray-700">
          Available for new subscriptions
        </label>
      </div>
      <p class="text-xs text-gray-500 mt-1 ml-6">Uncheck to prevent new customers from subscribing</p>
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
      billing_interval: 'month',
      stripe_product_id: '',
      stripe_price_id: '',
      available_for_subscription: true
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

