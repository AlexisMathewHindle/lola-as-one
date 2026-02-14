<template>
  <div class="max-w-4xl">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p class="mt-4 text-gray-600">Loading offering...</p>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start mb-6">
      <font-awesome-icon icon="exclamation-triangle" class="w-5 h-5 text-danger-600 mt-0.5 mr-3 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-sm font-semibold text-danger-800">Error</h3>
        <p class="text-sm text-danger-700 mt-1">{{ error }}</p>
      </div>
      <button @click="error = null" class="text-danger-600 hover:text-danger-800">
        <font-awesome-icon icon="times" class="w-4 h-4" />
      </button>
    </div>

    <template v-if="!loading">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <router-link
          to="/admin/offerings"
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <font-awesome-icon icon="chevron-left" class="w-3 h-3 mr-2" />
          Back to Offerings
        </router-link>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          {{ isEdit ? 'Edit Offering' : 'Create New Offering' }}
        </h1>
      </div>

      <!-- Type Selector (only on create) -->
    <div v-if="!isEdit && !selectedType" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Select Offering Type</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          @click="selectedType = 'event'"
          class="border-2 border-gray-300 rounded-xl p-6 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-left group"
        >
          <div class="text-4xl mb-3">🎨</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Event / Workshop</h3>
          <p class="text-sm text-gray-600">
            Time-based offering with date, location, and capacity
          </p>
        </button>

        <button
          @click="selectedType = 'product_physical'"
          class="border-2 border-gray-300 rounded-xl p-6 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-left group"
        >
          <div class="text-4xl mb-3">📦</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Physical Product</h3>
          <p class="text-sm text-gray-600">
            One-time purchase box with inventory tracking
          </p>
        </button>

        <button
          @click="selectedType = 'subscription'"
          class="border-2 border-gray-300 rounded-xl p-6 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-left group"
        >
          <div class="text-4xl mb-3">🔄</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Subscription</h3>
          <p class="text-sm text-gray-600">
            Recurring monthly box with Stripe integration
          </p>
        </button>

        <button
          @click="selectedType = 'product_digital'"
          class="border-2 border-gray-300 rounded-xl p-6 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-left group"
        >
          <div class="text-4xl mb-3">💾</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">Digital Product</h3>
          <p class="text-sm text-gray-600">
            Gift cards, downloads, PDFs, or videos
          </p>
        </button>
      </div>
    </div>
    
    <!-- Form (shown after type selection or on edit) -->
    <form v-if="selectedType" @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Type Badge (on edit) -->
      <div v-if="isEdit" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
            <span class="text-2xl">{{ getTypeIcon(selectedType) }}</span>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wide">Offering Type</p>
            <p class="text-lg font-semibold text-gray-900">{{ getTypeName(selectedType) }}</p>
          </div>
        </div>
      </div>

      <!-- Common Fields -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
        <div class="flex items-center mb-2">
          <font-awesome-icon icon="file-alt" class="w-4 h-4 text-gray-500 mr-2" />
          <h3 class="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Title <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="e.g., Watercolor Workshop for Beginners"
          >
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Slug <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.slug"
              type="text"
              required
              @blur="checkSlugAvailability"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              :class="{ 'border-red-300': slugCheckResult === 'taken', 'border-green-300': slugCheckResult === 'available' }"
              placeholder="e.g., watercolor-workshop-beginners"
            >
            <div v-if="checkingSlug" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <font-awesome-icon icon="spinner" class="w-4 h-4 text-gray-400 animate-spin" />
            </div>
            <div v-else-if="slugCheckResult === 'available'" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <font-awesome-icon icon="check-circle" class="w-4 h-4 text-green-500" />
            </div>
            <div v-else-if="slugCheckResult === 'taken'" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <font-awesome-icon icon="exclamation-circle" class="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p class="text-xs mt-2 flex items-center" :class="slugCheckResult === 'taken' ? 'text-red-600' : 'text-gray-500'">
            <font-awesome-icon icon="external-link-alt" class="w-3 h-3 mr-1" />
            <span v-if="slugCheckResult === 'taken'">This slug is already in use. Please choose a different one.</span>
            <span v-else-if="slugCheckResult === 'available'">This slug is available!</span>
            <span v-else>URL-friendly version of the title</span>
          </p>
        </div>

        <!-- Short Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Short Description <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="form.description_short"
            required
            rows="2"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            placeholder="Brief summary (1-2 sentences)"
          ></textarea>
        </div>

        <!-- Long Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Long Description
          </label>
          <RichTextEditor
            v-model="form.description_long"
            placeholder="Write a detailed description with formatting..."
          />
        </div>

        <!-- Images -->
        <div>
          <MultipleImageUploader
            :main-image="form.featured_image_url"
            :secondary-images-data="form.secondary_images"
            :bucket="getImageBucket()"
            :max-size-m-b="5"
            @update:mainImage="handleMainImageUpdate"
            @update:secondaryImagesData="handleSecondaryImagesUpdate"
            @upload-error="handleImageError"
          />
        </div>
      </div>
      
      <!-- Type-Specific Fields -->
      <EventFields v-if="selectedType === 'event'" v-model="typeSpecificData" />
      <ProductFields v-if="selectedType === 'product_physical'" v-model="typeSpecificData" />
      <SubscriptionFields v-if="selectedType === 'subscription'" v-model="typeSpecificData" />

      <!-- Subscription: Eligible Boxes -->
      <div
        v-if="selectedType === 'subscription'"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-4"
      >
        <div class="flex items-center mb-2">
          <font-awesome-icon icon="boxes" class="w-4 h-4 text-gray-500 mr-2" />
          <h3 class="text-lg font-semibold text-gray-900">Eligible Boxes for this Subscription</h3>
        </div>

        <p class="text-sm text-gray-600">
          Select which physical box products can be chosen by customers for this subscription plan.
        </p>

        <div v-if="loadingSubscriptionBoxes" class="text-sm text-gray-500">
          Loading boxes...
        </div>

        <div v-else-if="availableBoxProducts.length === 0" class="text-sm text-gray-500">
          No physical box products found. Create physical product offerings first.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            v-for="product in availableBoxProducts"
            :key="product.id"
            class="flex items-start space-x-3 p-3 border rounded-lg hover:border-primary-500 cursor-pointer bg-white"
          >
            <input
              v-model="selectedBoxProductIds"
              type="checkbox"
              class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
              :value="product.id"
            >
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ product.offering?.title || product.sku }}
              </p>
	              <p class="text-xs text-gray-500">
	                £{{ Number(product.price_gbp).toFixed(2) }}
	                <span v-if="product.offering?.slug" class="ml-1">
	                  · {{ product.offering.slug }}
	                </span>
	              </p>
            </div>
          </label>
        </div>
      </div>

      <DigitalProductFields v-if="selectedType === 'product_digital'" v-model="typeSpecificData" />

      <!-- Publishing Options -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
        <div class="flex items-center mb-2">
          <font-awesome-icon icon="cog" class="w-4 h-4 text-gray-500 mr-2" />
          <h3 class="text-lg font-semibold text-gray-900">Publishing</h3>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Status <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.status"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white transition-all"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <font-awesome-icon icon="chevron-down" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Featured -->
        <div class="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            v-model="form.featured"
            type="checkbox"
            id="featured"
            class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-all"
          >
          <label for="featured" class="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
            <font-awesome-icon icon="star" class="w-4 h-4 text-yellow-500 mr-1" />
            Feature this offering on the homepage
          </label>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 sticky bottom-0 bg-white p-4 sm:p-6 -mx-4 sm:-mx-0 border-t border-gray-200 sm:border-0 sm:bg-transparent sm:static">
        <router-link
          to="/admin/offerings"
          class="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
        >
          <font-awesome-icon icon="times" class="w-4 h-4 mr-2" />
          Cancel
        </router-link>
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium"
        >
          <font-awesome-icon v-if="saving" icon="clock" class="w-4 h-4 mr-2 animate-spin" />
          <font-awesome-icon v-else icon="save" class="w-4 h-4 mr-2" />
          {{ saving ? 'Saving...' : (isEdit ? 'Update Offering' : 'Create Offering') }}
        </button>
      </div>
    </form>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import EventFields from '../../components/admin/EventFields.vue'
import ProductFields from '../../components/admin/ProductFields.vue'
import SubscriptionFields from '../../components/admin/SubscriptionFields.vue'
import DigitalProductFields from '../../components/admin/DigitalProductFields.vue'
import MultipleImageUploader from '../../components/shared/MultipleImageUploader.vue'
import RichTextEditor from '../../components/shared/RichTextEditor.vue'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const selectedType = ref(null)
const saving = ref(false)
const error = ref(null)
const loading = ref(false)
const checkingSlug = ref(false)
const slugCheckResult = ref(null) // null, 'available', or 'taken'

const form = ref({
  title: '',
  slug: '',
  description_short: '',
  description_long: '',
  featured_image_url: '',
  secondary_images: [],
  status: 'draft',
  featured: false,
  scheduled_publish_at: null,
  meta_title: '',
  meta_description: ''
})

const typeSpecificData = ref({})

// Subscription plan box configuration
const availableBoxProducts = ref([])
const selectedBoxProductIds = ref([])
const loadingSubscriptionBoxes = ref(false)

const getTypeIcon = (type) => {
  const icons = {
    event: '🎨',
    product_physical: '📦',
    subscription: '🔄',
    product_digital: '💾'
  }
  return icons[type] || '📄'
}

const getTypeName = (type) => {
  const names = {
    event: 'Event / Workshop',
    product_physical: 'Physical Product',
    subscription: 'Subscription',
    product_digital: 'Digital Product'
  }
  return names[type] || type
}

// Get appropriate storage bucket based on offering type
const getImageBucket = () => {
  if (!selectedType.value) return 'product-images'

  const bucketMap = {
    event: 'workshop-images',
    product_physical: 'product-images',
    subscription: 'product-images',
    product_digital: 'product-images'
  }

  return bucketMap[selectedType.value] || 'product-images'
}

// Handle main image update
const handleMainImageUpdate = (url) => {
  form.value.featured_image_url = url
}

// Handle secondary images update
const handleSecondaryImagesUpdate = (images) => {
  form.value.secondary_images = images
}

// Handle image upload error
const handleImageError = (err) => {
  error.value = `Image upload failed: ${err.message || 'Unknown error'}`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Auto-generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

// Watch title and auto-generate slug if slug is empty or matches previous title
watch(() => form.value.title, (newTitle, oldTitle) => {
  // Only auto-generate if slug is empty or matches the old title's slug
  const oldSlug = generateSlug(oldTitle || '')
  if (!form.value.slug || form.value.slug === oldSlug) {
    form.value.slug = generateSlug(newTitle)
  }
})

// Reset slug check when slug changes
watch(() => form.value.slug, () => {
  slugCheckResult.value = null
})

// When switching to a subscription offering, load available physical box products
watch(selectedType, async (newType) => {
  if (newType === 'subscription') {
    // Reset selected boxes when changing to a subscription type
    selectedBoxProductIds.value = []
    await loadAvailableBoxProducts()
  }
})

// Check if slug already exists
const checkSlugExists = async (slug) => {
  const { data, error: checkError } = await supabase
    .from('offerings')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (checkError) {
    console.error('Error checking slug:', checkError)
    return false
  }

  // If editing, ignore the current offering's slug
  if (isEdit.value && data?.id === route.params.id) {
    return false
  }

  return !!data
}

// Check slug availability with visual feedback
const checkSlugAvailability = async () => {
  if (!form.value.slug?.trim()) {
    slugCheckResult.value = null
    return
  }

  checkingSlug.value = true
  slugCheckResult.value = null

  try {
    const exists = await checkSlugExists(form.value.slug)
    slugCheckResult.value = exists ? 'taken' : 'available'
  } catch (err) {
    console.error('Error checking slug availability:', err)
    slugCheckResult.value = null
  } finally {
    checkingSlug.value = false
  }
}

// Validate form
const validateForm = async () => {
  error.value = null

  // Common validation
  if (!form.value.title?.trim()) {
    error.value = 'Title is required'
    return false
  }

  if (!form.value.slug?.trim()) {
    error.value = 'Slug is required'
    return false
  }

  // Check if slug already exists
  const slugExists = await checkSlugExists(form.value.slug)
  if (slugExists) {
    error.value = `The slug "${form.value.slug}" is already in use. Please choose a different slug.`
    return false
  }

  if (!selectedType.value) {
    error.value = 'Please select an offering type'
    return false
  }

  // Type-specific validation
  if (selectedType.value === 'event') {
    if (!typeSpecificData.value.event_date) {
      error.value = 'Event date is required'
      return false
    }
    if (!typeSpecificData.value.event_start_time) {
      error.value = 'Event start time is required'
      return false
    }
    if (!typeSpecificData.value.max_capacity || typeSpecificData.value.max_capacity < 1) {
      error.value = 'Max capacity must be at least 1'
      return false
    }
    if (!typeSpecificData.value.price_gbp || typeSpecificData.value.price_gbp < 0) {
      error.value = 'Price is required and must be 0 or greater'
      return false
    }
  }

  if (selectedType.value === 'product_physical') {
    if (!typeSpecificData.value.sku?.trim()) {
      error.value = 'SKU is required for products'
      return false
    }
    if (typeSpecificData.value.price_gbp === undefined || typeSpecificData.value.price_gbp < 0) {
      error.value = 'Price is required and must be 0 or greater'
      return false
    }
    if (typeSpecificData.value.track_inventory && typeSpecificData.value.stock_quantity < 0) {
      error.value = 'Stock quantity cannot be negative'
      return false
    }
  }

  if (selectedType.value === 'subscription') {
    if (!typeSpecificData.value.sku?.trim()) {
      error.value = 'SKU is required for subscriptions'
      return false
    }
    if (typeSpecificData.value.price_gbp === undefined || typeSpecificData.value.price_gbp < 0) {
      error.value = 'Price is required and must be 0 or greater'
      return false
    }
  }

  if (selectedType.value === 'product_digital') {
    if (!typeSpecificData.value.product_type) {
      error.value = 'Digital product type is required'
      return false
    }
    if (typeSpecificData.value.price_gbp === undefined || typeSpecificData.value.price_gbp < 0) {
      error.value = 'Price is required and must be 0 or greater'
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  // Validate form (now async)
  const isValid = await validateForm()
  if (!isValid) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  saving.value = true
  error.value = null

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('You must be logged in to create offerings')
    }

    // Prepare offering data
    const offeringData = {
      type: selectedType.value,
      title: form.value.title.trim(),
      slug: form.value.slug.trim(),
      description_short: form.value.description_short?.trim() || null,
      description_long: form.value.description_long?.trim() || null,
      featured_image_url: form.value.featured_image_url?.trim() || null,
      secondary_images: form.value.secondary_images || [],
      status: form.value.status,
      scheduled_publish_at: form.value.scheduled_publish_at || null,
      featured: form.value.featured,
      meta_title: form.value.meta_title?.trim() || null,
      meta_description: form.value.meta_description?.trim() || null,
      updated_by: user.id
    }

    // Set published_at if status is published and it's a new offering
    if (form.value.status === 'published' && !isEdit.value) {
      offeringData.published_at = new Date().toISOString()
    }

    if (!isEdit.value) {
      offeringData.created_by = user.id
    }

    let offeringId

    if (isEdit.value) {
      // Update existing offering
      const { data, error: updateError } = await supabase
        .from('offerings')
        .update(offeringData)
        .eq('id', route.params.id)
        .select()
        .single()

      if (updateError) throw updateError
      offeringId = data.id
    } else {
      // Create new offering
      const { data, error: insertError } = await supabase
        .from('offerings')
        .insert(offeringData)
        .select()
        .single()

      if (insertError) throw insertError
      offeringId = data.id
    }

    // Now handle type-specific data
    await saveTypeSpecificData(offeringId)

    // Success! Redirect to offerings list
    router.push({ name: 'AdminOfferings' })

  } catch (err) {
    console.error('Error saving offering:', err)
    error.value = err.message || 'Failed to save offering. Please try again.'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    saving.value = false
  }
}

const saveTypeSpecificData = async (offeringId) => {
	if (selectedType.value === 'event') {
		await saveEventData(offeringId)
	} else if (selectedType.value === 'product_physical') {
		await saveProductData(offeringId)
	} else if (selectedType.value === 'subscription') {
		await saveSubscriptionData(offeringId)
		await syncSubscriptionPlanBoxes(offeringId)
	} else if (selectedType.value === 'product_digital') {
		await saveDigitalProductData(offeringId)
	}
}

const saveEventData = async (offeringId) => {
  const eventData = {
    offering_id: offeringId,
    event_date: typeSpecificData.value.event_date,
    event_start_time: typeSpecificData.value.event_start_time,
    event_end_time: typeSpecificData.value.event_end_time || null,
    location_name: typeSpecificData.value.location_name || null,
    location_address: typeSpecificData.value.location_address || null,
    location_city: typeSpecificData.value.location_city || null,
    location_postcode: typeSpecificData.value.location_postcode || null,
    max_capacity: typeSpecificData.value.max_capacity,
    available_spaces: typeSpecificData.value.available_spaces || typeSpecificData.value.max_capacity,
    current_bookings: typeSpecificData.value.current_bookings || 0,
    price_gbp: typeSpecificData.value.price_gbp,
    vat_rate: 20.00,
    waitlist_enabled: typeSpecificData.value.waitlist_enabled ?? false,
    category_id: typeSpecificData.value.category_id || null
  }

  let eventId

  if (isEdit.value) {
    // Check if event data exists
    const { data: existing } = await supabase
      .from('offering_events')
      .select('id')
      .eq('offering_id', offeringId)
      .single()

    if (existing) {
      eventId = existing.id
      const { error } = await supabase
        .from('offering_events')
        .update(eventData)
        .eq('offering_id', offeringId)

      if (error) throw error
    } else {
      const { data: inserted, error } = await supabase
        .from('offering_events')
        .insert(eventData)
        .select('id')
        .single()

      if (error) throw error
      eventId = inserted.id
    }
  } else {
    const { data: inserted, error } = await supabase
      .from('offering_events')
      .insert(eventData)
      .select('id')
      .single()

    if (error) throw error
    eventId = inserted.id
  }

  // Sync event_capacity table with available_spaces
  // The event_capacity table is the source of truth for real-time capacity tracking
  const availableSpaces = typeSpecificData.value.available_spaces || typeSpecificData.value.max_capacity

  console.log('🔄 Syncing event_capacity for event:', eventId)
  console.log('📊 Available spaces to set:', availableSpaces)

  // Use RPC function to update event_capacity (bypasses RLS with SECURITY DEFINER)
  const { error: rpcError } = await supabase.rpc('update_event_capacity_total', {
    p_offering_event_id: eventId,
    p_total_capacity: availableSpaces,
    p_waitlist_enabled: typeSpecificData.value.waitlist_enabled ?? false
  })

  if (rpcError) {
    console.error('❌ Error updating event_capacity via RPC:', rpcError)
    throw rpcError
  }

  console.log('✅ Successfully updated event_capacity total_capacity to', availableSpaces)
}

const saveProductData = async (offeringId) => {
  const productData = {
    offering_id: offeringId,
    sku: typeSpecificData.value.sku,
    price_gbp: typeSpecificData.value.price_gbp,
    vat_rate: 20.00,
    track_inventory: typeSpecificData.value.track_inventory ?? true,
    stock_quantity: typeSpecificData.value.stock_quantity || 0,
    low_stock_threshold: typeSpecificData.value.low_stock_threshold || 5,
    requires_shipping: typeSpecificData.value.requires_shipping ?? true,
    weight_grams: typeSpecificData.value.weight_grams || null,
    available_for_subscription: false,
    waitlist_enabled: typeSpecificData.value.waitlist_enabled ?? false
  }

  if (isEdit.value) {
    const { data: existing } = await supabase
      .from('offering_products')
      .select('id')
      .eq('offering_id', offeringId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('offering_products')
        .update(productData)
        .eq('offering_id', offeringId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('offering_products')
        .insert(productData)

      if (error) throw error
    }
  } else {
    const { error } = await supabase
      .from('offering_products')
      .insert(productData)

    if (error) throw error
  }
}

const saveSubscriptionData = async (offeringId) => {
  const subscriptionData = {
    offering_id: offeringId,
    sku: typeSpecificData.value.sku,
    price_gbp: typeSpecificData.value.price_gbp,
    vat_rate: 20.00,
    track_inventory: false,
    stock_quantity: 0,
    low_stock_threshold: 0,
    requires_shipping: true,
    weight_grams: null,
    available_for_subscription: typeSpecificData.value.available_for_subscription ?? true
  }

  if (isEdit.value) {
    const { data: existing } = await supabase
      .from('offering_products')
      .select('id')
      .eq('offering_id', offeringId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('offering_products')
        .update(subscriptionData)
        .eq('offering_id', offeringId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('offering_products')
        .insert(subscriptionData)

      if (error) throw error
    }
  } else {
    const { error } = await supabase
      .from('offering_products')
      .insert(subscriptionData)

    if (error) throw error
  }

  // Store Stripe IDs and billing interval in metadata
  const metadata = {
    billing_interval: typeSpecificData.value.billing_interval || 'month',
    stripe_product_id: typeSpecificData.value.stripe_product_id || null,
    stripe_price_id: typeSpecificData.value.stripe_price_id || null
  }

  await supabase
    .from('offerings')
    .update({ metadata })
    .eq('id', offeringId)
}

// Load all physical box products that can be used in subscription plans
const loadAvailableBoxProducts = async () => {
	loadingSubscriptionBoxes.value = true

	try {
		const { data, error: productsError } = await supabase
			.from('offering_products')
			.select(`
				id,
				sku,
				price_gbp,
				offering:offerings!inner(id, title, slug, status, type)
			`)
			.eq('offering.type', 'product_physical')

		if (productsError) throw productsError

		// Optionally filter to published boxes; for now, include all physical products
		availableBoxProducts.value = (data || []).filter((p) => p.offering)
	} catch (err) {
		console.error('Error loading physical box products for subscriptions:', err)
		error.value = 'Failed to load physical boxes for this subscription plan'
	} finally {
		loadingSubscriptionBoxes.value = false
	}
}

const saveDigitalProductData = async (offeringId) => {
  const digitalProductData = {
    offering_id: offeringId,
    product_type: typeSpecificData.value.product_type,
    price_gbp: typeSpecificData.value.price_gbp,
    vat_rate: 20.00,
    file_url: typeSpecificData.value.file_url || null,
    file_size_bytes: typeSpecificData.value.file_size_mb ? Math.round(typeSpecificData.value.file_size_mb * 1024 * 1024) : null,
    file_type: typeSpecificData.value.file_type || null,
    download_limit: typeSpecificData.value.download_limit || null,
    download_expiry_days: typeSpecificData.value.download_expiry_days || null,
    stripe_product_id: typeSpecificData.value.stripe_product_id || null
  }

  if (isEdit.value) {
    const { data: existing } = await supabase
      .from('offering_digital_products')
      .select('id')
      .eq('offering_id', offeringId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('offering_digital_products')
        .update(digitalProductData)
        .eq('offering_id', offeringId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('offering_digital_products')
        .insert(digitalProductData)

      if (error) throw error
    }
  } else {
    const { error } = await supabase
      .from('offering_digital_products')
      .insert(digitalProductData)

    if (error) throw error
  }
}

const loadOffering = async () => {
  loading.value = true
  error.value = null

  try {
    // Load main offering data
    const { data: offering, error: offeringError } = await supabase
      .from('offerings')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (offeringError) throw offeringError

    if (!offering) {
      throw new Error('Offering not found')
    }

    // Set form data
    form.value = {
      title: offering.title,
      slug: offering.slug,
      description_short: offering.description_short || '',
      description_long: offering.description_long || '',
      featured_image_url: offering.featured_image_url || '',
      secondary_images: offering.secondary_images || [],
      status: offering.status,
      featured: offering.featured,
      scheduled_publish_at: offering.scheduled_publish_at || null,
      meta_title: offering.meta_title || '',
      meta_description: offering.meta_description || ''
    }

    selectedType.value = offering.type

    // Load type-specific data
    await loadTypeSpecificData(offering.id, offering.type, offering.metadata)

  } catch (err) {
    console.error('Error loading offering:', err)
    error.value = err.message || 'Failed to load offering'
  } finally {
    loading.value = false
  }
}

const loadTypeSpecificData = async (offeringId, type, metadata) => {
  if (type === 'event') {
    const { data, error } = await supabase
      .from('offering_events')
      .select('*')
      .eq('offering_id', offeringId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

    if (data) {
      // Load event_capacity to get the real-time available spaces
      const { data: capacityData } = await supabase
        .from('event_capacity')
        .select('total_capacity, spaces_booked, waitlist_enabled')
        .eq('offering_event_id', data.id)
        .single()

      // Use event_capacity.total_capacity as the source of truth for available_spaces
      // Fall back to offering_events.available_spaces or max_capacity if capacity record doesn't exist
      const availableSpaces = capacityData?.total_capacity ?? data.available_spaces ?? data.max_capacity
      const currentBookings = capacityData?.spaces_booked ?? data.current_bookings ?? 0
      const waitlistEnabled = capacityData?.waitlist_enabled ?? data.waitlist_enabled ?? false

      typeSpecificData.value = {
        event_date: data.event_date,
        event_start_time: data.event_start_time,
        event_end_time: data.event_end_time,
        location_name: data.location_name,
        location_address: data.location_address,
        location_city: data.location_city,
        location_postcode: data.location_postcode,
        max_capacity: data.max_capacity,
        available_spaces: availableSpaces,
        current_bookings: currentBookings,
        price_gbp: parseFloat(data.price_gbp),
        category_id: data.category_id || '',
        waitlist_enabled: waitlistEnabled
      }
    }
  } else if (type === 'product_physical') {
    const { data, error } = await supabase
      .from('offering_products')
      .select('*')
      .eq('offering_id', offeringId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (data) {
      typeSpecificData.value = {
        sku: data.sku,
        price_gbp: parseFloat(data.price_gbp),
        track_inventory: data.track_inventory,
        stock_quantity: data.stock_quantity,
        low_stock_threshold: data.low_stock_threshold,
        requires_shipping: data.requires_shipping,
        weight_grams: data.weight_grams
      }
    }
  } else if (type === 'subscription') {
    const { data, error } = await supabase
      .from('offering_products')
      .select('*')
      .eq('offering_id', offeringId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

		if (data) {
			typeSpecificData.value = {
				sku: data.sku,
				price_gbp: parseFloat(data.price_gbp),
				billing_interval: metadata?.billing_interval || 'month',
				stripe_product_id: metadata?.stripe_product_id || '',
				stripe_price_id: metadata?.stripe_price_id || '',
				available_for_subscription: data.available_for_subscription
			}

			// Load available physical boxes and the current mapping for this subscription
			await loadAvailableBoxProducts()
			await loadSubscriptionPlanBoxes(offeringId)
		}
  } else if (type === 'product_digital') {
    const { data, error } = await supabase
      .from('offering_digital_products')
      .select('*')
      .eq('offering_id', offeringId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (data) {
      typeSpecificData.value = {
        product_type: data.product_type,
        price_gbp: parseFloat(data.price_gbp),
        file_url: data.file_url,
        file_type: data.file_type,
        file_size_mb: data.file_size_bytes ? data.file_size_bytes / (1024 * 1024) : 0,
        download_limit: data.download_limit,
        download_expiry_days: data.download_expiry_days,
        stripe_product_id: data.stripe_product_id
      }
    }
	}
}

// Load existing subscription_plan_boxes rows for this subscription offering
const loadSubscriptionPlanBoxes = async (offeringId) => {
	loadingSubscriptionBoxes.value = true

	try {
		const { data, error: mappingError } = await supabase
			.from('subscription_plan_boxes')
			.select('offering_product_id')
			.eq('subscription_offering_id', offeringId)

		if (mappingError) throw mappingError

		selectedBoxProductIds.value = (data || []).map((row) => row.offering_product_id)
	} catch (err) {
		console.error('Error loading subscription plan boxes:', err)
		error.value = 'Failed to load selected boxes for this subscription plan'
	} finally {
		loadingSubscriptionBoxes.value = false
	}
}

// Sync subscription_plan_boxes table with current selections from the UI
const syncSubscriptionPlanBoxes = async (offeringId) => {
	try {
		const { data: existing, error: existingError } = await supabase
			.from('subscription_plan_boxes')
			.select('id, offering_product_id')
			.eq('subscription_offering_id', offeringId)

		if (existingError) throw existingError

		const existingByProductId = new Map(
			(existing || []).map((row) => [row.offering_product_id, row.id])
		)

		const desiredIds = new Set(selectedBoxProductIds.value)

		// Determine which mappings to insert
		const toInsert = Array.from(desiredIds).filter(
			(productId) => !existingByProductId.has(productId)
		)

		if (toInsert.length > 0) {
			const rows = toInsert.map((productId) => ({
				subscription_offering_id: offeringId,
				offering_product_id: productId
			}))

			const { error: insertError } = await supabase
				.from('subscription_plan_boxes')
				.insert(rows)

			if (insertError) throw insertError
		}

		// Determine which mappings to delete
		const toDeleteIds = (existing || [])
			.filter((row) => !desiredIds.has(row.offering_product_id))
			.map((row) => row.id)

		if (toDeleteIds.length > 0) {
			const { error: deleteError } = await supabase
				.from('subscription_plan_boxes')
				.delete()
				.in('id', toDeleteIds)

			if (deleteError) throw deleteError
		}
	} catch (err) {
		console.error('Error syncing subscription plan boxes:', err)
		error.value = 'Failed to save eligible boxes for this subscription plan'
		throw err
	}
}

onMounted(async () => {
  if (isEdit.value) {
    await loadOffering()
  }
})
</script>

