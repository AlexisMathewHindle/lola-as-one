<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
    
    <!-- Event Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Event Date <span class="text-red-500">*</span>
      </label>
      <input
        :value="modelValue.event_date"
        @input="updateField('event_date', $event.target.value)"
        type="date"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
    </div>
    
    <!-- Time Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Start Time <span class="text-red-500">*</span>
        </label>
        <input
          :value="modelValue.event_start_time"
          @input="updateField('event_start_time', $event.target.value)"
          type="time"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          End Time
        </label>
        <input
          :value="modelValue.event_end_time"
          @input="updateField('event_end_time', $event.target.value)"
          type="time"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
    </div>
    
    <!-- Location Fields -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Location Name
      </label>
      <input
        :value="modelValue.location_name"
        @input="updateField('location_name', $event.target.value)"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="e.g., Lola Creative Space"
      >
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Address
      </label>
      <input
        :value="modelValue.location_address"
        @input="updateField('location_address', $event.target.value)"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="Street address"
      >
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          City
        </label>
        <input
          :value="modelValue.location_city"
          @input="updateField('location_city', $event.target.value)"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Postcode
        </label>
        <input
          :value="modelValue.location_postcode"
          @input="updateField('location_postcode', $event.target.value)"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
      </div>
    </div>
    
    <!-- Capacity and Price -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Max Capacity <span class="text-red-500">*</span>
        </label>
        <input
          :value="modelValue.max_capacity"
          @input="updateField('max_capacity', parseInt($event.target.value) || 0)"
          type="number"
          required
          min="1"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., 12"
        >
      </div>
      
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
          placeholder="e.g., 45.00"
        >
      </div>
    </div>
    
    <!-- Category Metadata -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Category
      </label>
      <select
        :value="modelValue.category_id"
        @input="updateField('category_id', $event.target.value)"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Select category...</option>
        <optgroup
          v-for="parent in parentCategories"
          :key="parent.id"
          :label="parent.name"
        >
          <option :value="parent.id">{{ parent.name }}</option>
          <option
            v-for="child in getChildCategories(parent.id)"
            :key="child.id"
            :value="child.id"
            class="pl-4"
          >
            &nbsp;&nbsp;{{ child.name }}
          </option>
        </optgroup>
      </select>
      <p v-if="categoriesLoading" class="text-xs text-gray-500 mt-1">
        Loading categories...
      </p>
      <p v-if="categoriesError" class="text-xs text-red-500 mt-1">
        Error loading categories: {{ categoriesError }}
      </p>
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
          Enable waitlist when event is fully booked
        </label>
      </div>
      <p class="text-xs text-gray-500 mt-2 ml-1">
        When enabled, customers can join a waitlist if the event reaches max capacity. They'll be automatically notified if a spot becomes available.
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted } from 'vue'
import { useEventCategories } from '../../composables/useEventCategories'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      event_date: '',
      event_start_time: '',
      event_end_time: '',
      location_name: '',
      location_address: '',
      location_city: '',
      location_postcode: '',
      max_capacity: 12,
      price_gbp: 0,
      category_id: '',
      current_bookings: 0,
      waitlist_enabled: false
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Event categories composable
const {
  parentCategories,
  getChildCategories,
  fetchCategories,
  loading: categoriesLoading,
  error: categoriesError
} = useEventCategories()

// Fetch categories on mount
onMounted(async () => {
  await fetchCategories({ activeOnly: true })
})

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>

