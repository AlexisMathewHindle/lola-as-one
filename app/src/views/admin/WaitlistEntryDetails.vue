<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-display font-bold text-dark-900">Waitlist Entry Details</h1>
        <p class="text-gray-600 mt-1">View and manage waitlist entry</p>
      </div>
      <router-link :to="`/admin/waitlists/${type}s`" class="px-4 py-2 bg-gray-200 text-dark-900 rounded-lg hover:bg-gray-300">
        <font-awesome-icon icon="arrow-left" class="mr-2" />
        Back to List
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <font-awesome-icon icon="spinner" class="w-8 h-8 text-primary-600 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-danger-50 border border-danger-200 rounded-lg p-4">
      <div class="flex items-center">
        <font-awesome-icon icon="exclamation-triangle" class="w-5 h-5 text-danger-600 mr-3" />
        <p class="text-danger-800">{{ error }}</p>
      </div>
    </div>

    <!-- Entry Details -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Entry Information -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-dark-900 mb-4">Entry Information</h2>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Entry ID</p>
              <p class="text-sm font-medium text-dark-900">{{ entry.id }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Status</p>
              <span :class="getStatusClass(entry.status)" class="inline-block px-2 py-1 text-xs font-medium rounded-full">
                {{ entry.status }}
              </span>
            </div>
            <div>
              <p class="text-sm text-gray-600">Created</p>
              <p class="text-sm font-medium text-dark-900">{{ formatDateTime(entry.created_at) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">{{ type === 'event' ? 'Spaces Requested' : 'Quantity Requested' }}</p>
              <p class="text-sm font-medium text-dark-900">{{ type === 'event' ? entry.spaces_requested : entry.quantity_requested }}</p>
            </div>
          </div>

          <div v-if="entry.notes" class="mt-4">
            <p class="text-sm text-gray-600">Customer Notes</p>
            <p class="text-sm text-dark-900 mt-1">{{ entry.notes }}</p>
          </div>
        </div>

        <!-- Event/Product Details -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-dark-900 mb-4">{{ type === 'event' ? 'Event' : 'Product' }} Details</h2>
          
          <div class="flex items-start gap-4">
            <img 
              v-if="offeringDetails.featured_image_url" 
              :src="offeringDetails.featured_image_url" 
              :alt="offeringDetails.title"
              class="w-24 h-24 object-cover rounded-lg"
            />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-dark-900">{{ offeringDetails.title }}</h3>
              <p v-if="type === 'event'" class="text-sm text-gray-600 mt-1">
                Date: {{ formatDate(offeringDetails.event_date) }}
              </p>
              <p v-else class="text-sm text-gray-600 mt-1">
                SKU: {{ offeringDetails.sku }} • Stock: {{ offeringDetails.stock_quantity }}
              </p>
            </div>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-dark-900 mb-4">Customer Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Name</p>
              <p class="text-sm font-medium text-dark-900">{{ entry.customer_name || 'Not provided' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Email</p>
              <p class="text-sm font-medium text-dark-900">
                <a :href="`mailto:${entry.customer_email}`" class="text-primary-600 hover:text-primary-700">
                  {{ entry.customer_email }}
                </a>
              </p>
            </div>
            <div v-if="entry.customer_phone">
              <p class="text-sm text-gray-600">Phone</p>
              <p class="text-sm font-medium text-dark-900">{{ entry.customer_phone }}</p>
            </div>
          </div>
        </div>

        <!-- Notification History -->
        <div v-if="entry.status === 'notified' || entry.notified_at" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-dark-900 mb-4">Notification History</h2>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-dark-900">Customer Notified</p>
                <p class="text-sm text-gray-600">{{ formatDateTime(entry.notified_at) }}</p>
              </div>
              <font-awesome-icon icon="bell" class="w-5 h-5 text-warning-600" />
            </div>
            
            <div v-if="entry.expires_at" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="text-sm font-medium text-dark-900">Expires</p>
                <p class="text-sm text-gray-600">{{ formatDateTime(entry.expires_at) }}</p>
                <p v-if="entry.status === 'notified'" class="text-xs text-warning-600 mt-1">
                  {{ getTimeRemaining(entry.expires_at) }}
                </p>
              </div>
              <font-awesome-icon icon="clock" class="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <!-- Status Timeline -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-dark-900 mb-4">Status Timeline</h2>
          
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="check" class="w-4 h-4 text-success-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-dark-900">Created</p>
                <p class="text-sm text-gray-600">{{ formatDateTime(entry.created_at) }}</p>
              </div>
            </div>
            
            <div v-if="entry.notified_at" class="flex items-start gap-3">
              <div class="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="bell" class="w-4 h-4 text-warning-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-dark-900">Notified</p>
                <p class="text-sm text-gray-600">{{ formatDateTime(entry.notified_at) }}</p>
              </div>
            </div>
            
            <div v-if="entry.status === 'converted' && entry.updated_at" class="flex items-start gap-3">
              <div class="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="check-circle" class="w-4 h-4 text-success-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-dark-900">Converted</p>
                <p class="text-sm text-gray-600">{{ formatDateTime(entry.updated_at) }}</p>
              </div>
            </div>
            
            <div v-if="entry.status === 'expired' && entry.updated_at" class="flex items-start gap-3">
              <div class="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="times-circle" class="w-4 h-4 text-danger-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-dark-900">Expired</p>
                <p class="text-sm text-gray-600">{{ formatDateTime(entry.updated_at) }}</p>
              </div>
            </div>
            
            <div v-if="entry.status === 'cancelled' && entry.updated_at" class="flex items-start gap-3">
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <font-awesome-icon icon="ban" class="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-dark-900">Cancelled</p>
                <p class="text-sm text-gray-600">{{ formatDateTime(entry.updated_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Actions -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-dark-900 mb-4">Actions</h2>
          
          <div class="space-y-3">
            <button 
              v-if="entry.status === 'waiting'"
              @click="notifyCustomer" 
              class="w-full px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 flex items-center justify-center"
            >
              <font-awesome-icon icon="bell" class="mr-2" />
              Send Notification
            </button>
            
            <button 
              v-if="['waiting', 'notified'].includes(entry.status)"
              @click="markAsConverted" 
              class="w-full px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 flex items-center justify-center"
            >
              <font-awesome-icon icon="check-circle" class="mr-2" />
              Mark as Converted
            </button>
            
            <button 
              v-if="['waiting', 'notified'].includes(entry.status)"
              @click="cancelEntry" 
              class="w-full px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 flex items-center justify-center"
            >
              <font-awesome-icon icon="ban" class="mr-2" />
              Cancel Entry
            </button>
            
            <a 
              :href="`mailto:${entry.customer_email}`"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center"
            >
              <font-awesome-icon icon="envelope" class="mr-2" />
              Contact Customer
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const router = useRouter()
const route = useRoute()
const toastStore = useToastStore()
const loading = ref(true)
const error = ref(null)

// Get type and ID from route
const type = route.params.type // 'event' or 'product'
const entryId = route.params.id

// Data
const entry = ref({})
const offeringDetails = ref({})

// Fetch entry details
const fetchEntry = async () => {
  try {
    loading.value = true
    error.value = null

    if (type === 'event') {
      const { data, error: fetchError } = await supabase
        .from('event_waitlist_entries')
        .select(`
          *,
          offering_event:offering_events(
            id,
            event_date,
            event_time,
            location,
            offering:offerings(title, slug, featured_image_url)
          )
        `)
        .eq('id', entryId)
        .single()

      if (fetchError) throw fetchError

      entry.value = data
      offeringDetails.value = {
        title: data.offering_event.offering.title,
        featured_image_url: data.offering_event.offering.featured_image_url,
        event_date: data.offering_event.event_date
      }
    } else {
      const { data, error: fetchError } = await supabase
        .from('product_waitlist_entries')
        .select(`
          *,
          offering_product:offering_products(
            id,
            sku,
            stock_quantity,
            offering:offerings(title, slug, featured_image_url)
          )
        `)
        .eq('id', entryId)
        .single()

      if (fetchError) throw fetchError

      entry.value = data
      offeringDetails.value = {
        title: data.offering_product.offering.title,
        featured_image_url: data.offering_product.offering.featured_image_url,
        sku: data.offering_product.sku,
        stock_quantity: data.offering_product.stock_quantity
      }
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Notify customer
const notifyCustomer = async () => {
  if (!confirm('Send notification to this customer?')) return

  try {
    const table = type === 'event' ? 'event_waitlist_entries' : 'product_waitlist_entries'
    const expiryHours = type === 'event' ? 24 : 48

    const { error: updateError } = await supabase
      .from(table)
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
      })
      .eq('id', entryId)

    if (updateError) throw updateError

    toastStore.success('Customer notified successfully!')
    fetchEntry()
  } catch (err) {
    toastStore.error(`Error: ${err.message}`)
  }
}

// Mark as converted
const markAsConverted = async () => {
  if (!confirm('Mark this entry as converted?')) return

  try {
    const table = type === 'event' ? 'event_waitlist_entries' : 'product_waitlist_entries'

    const { error: updateError } = await supabase
      .from(table)
      .update({ status: 'converted' })
      .eq('id', entryId)

    if (updateError) throw updateError

    toastStore.success('Entry marked as converted!')
    fetchEntry()
  } catch (err) {
    toastStore.error(`Error: ${err.message}`)
  }
}

// Cancel entry
const cancelEntry = async () => {
  if (!confirm('Cancel this waitlist entry?')) return

  try {
    const table = type === 'event' ? 'event_waitlist_entries' : 'product_waitlist_entries'

    const { error: updateError } = await supabase
      .from(table)
      .update({ status: 'cancelled' })
      .eq('id', entryId)

    if (updateError) throw updateError

    toastStore.success('Entry cancelled!')
    router.push(`/admin/waitlists/${type}s`)
  } catch (err) {
    toastStore.error(`Error: ${err.message}`)
  }
}

// Helper functions
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTimeRemaining = (expiryDate) => {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffMs = expiry - now

  if (diffMs < 0) return 'Expired'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m remaining`
  } else {
    return `${diffMins}m remaining`
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case 'waiting': return 'bg-gray-100 text-gray-800'
    case 'notified': return 'bg-warning-100 text-warning-800'
    case 'converted': return 'bg-success-100 text-success-800'
    case 'expired': return 'bg-danger-100 text-danger-800'
    case 'cancelled': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Lifecycle
onMounted(() => {
  fetchEntry()
})
</script>

