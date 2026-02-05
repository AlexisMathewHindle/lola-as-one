<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-display font-bold text-dark-900">Event Waitlists</h1>
        <p class="text-gray-600 mt-1">Manage customers waiting for sold-out events</p>
      </div>
      <router-link to="/admin/waitlists" class="px-4 py-2 bg-gray-200 text-dark-900 rounded-lg hover:bg-gray-300">
        <font-awesome-icon icon="arrow-left" class="mr-2" />
        Back to Dashboard
      </router-link>
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
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Event Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Event</label>
          <select v-model="filters.eventId" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="">All Events</option>
            <option v-for="event in availableEvents" :key="event.id" :value="event.id">
              {{ event.title }} - {{ formatDate(event.event_date) }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="filters.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            <option value="">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="notified">Notified</option>
            <option value="converted">Converted</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Customer name or email..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- Actions -->
        <div class="flex items-end">
          <button @click="applyFilters" class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <font-awesome-icon icon="filter" class="mr-2" />
            Apply Filters
          </button>
        </div>
      </div>
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

    <!-- Waitlist Entries Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <!-- Table Header with Bulk Actions -->
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="selectAll" 
              @change="toggleSelectAll"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="ml-2 text-sm text-gray-700">Select All</span>
          </label>
          <span v-if="selectedEntries.length > 0" class="text-sm text-gray-600">
            {{ selectedEntries.length }} selected
          </span>
        </div>

        <div v-if="selectedEntries.length > 0" class="flex items-center gap-2">
          <button @click="bulkNotify" class="px-3 py-1 bg-warning-600 text-white rounded-lg hover:bg-warning-700 text-sm">
            <font-awesome-icon icon="bell" class="mr-1" />
            Notify Selected
          </button>
          <button @click="bulkCancel" class="px-3 py-1 bg-danger-600 text-white rounded-lg hover:bg-danger-700 text-sm">
            <font-awesome-icon icon="ban" class="mr-1" />
            Cancel Selected
          </button>
          <button @click="exportToCSV" class="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
            <font-awesome-icon icon="download" class="mr-1" />
            Export CSV
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="entries.length === 0" class="text-center py-12">
        <font-awesome-icon icon="users" class="w-16 h-16 text-gray-300 mb-4" />
        <p class="text-gray-600 text-lg">No waitlist entries found</p>
        <p class="text-gray-500 text-sm mt-2">Waitlist entries will appear here when customers join</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" class="w-4 h-4 opacity-0" />
              </th>
              <th class="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th class="hidden md:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th class="hidden lg:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spaces</th>
              <th class="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="hidden xl:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th class="hidden xl:table-cell px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notified</th>
              <th class="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in entries" :key="entry.id" class="hover:bg-gray-50">
              <td class="px-3 sm:px-4 py-4">
                <input
                  type="checkbox"
                  :value="entry.id"
                  v-model="selectedEntries"
                  class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </td>
              <td class="px-3 sm:px-4 py-4">
                <div class="text-sm font-medium text-dark-900">{{ entry.offering_event.offering.title }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(entry.offering_event.event_date) }}</div>
                <div class="md:hidden text-xs text-gray-500 mt-1">
                  {{ entry.customer_name }}
                </div>
              </td>
              <td class="hidden md:table-cell px-3 sm:px-4 py-4">
                <div class="text-sm font-medium text-dark-900">{{ entry.customer_name }}</div>
                <div class="text-xs text-gray-500">{{ entry.customer_email }}</div>
              </td>
              <td class="hidden lg:table-cell px-3 sm:px-4 py-4 text-sm text-gray-900">{{ entry.spaces_requested }}</td>
              <td class="px-3 sm:px-4 py-4">
                <span :class="getStatusClass(entry.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                  {{ entry.status }}
                </span>
                <div class="lg:hidden text-xs text-gray-500 mt-1">
                  {{ entry.spaces_requested }} spaces
                </div>
              </td>
              <td class="hidden xl:table-cell px-3 sm:px-4 py-4 text-sm text-gray-500">{{ formatDate(entry.created_at) }}</td>
              <td class="hidden xl:table-cell px-3 sm:px-4 py-4 text-sm text-gray-500">
                {{ entry.notified_at ? formatDate(entry.notified_at) : '-' }}
              </td>
              <td class="px-3 sm:px-4 py-4">
                <div class="flex items-center gap-2">
                  <button 
                    v-if="entry.status === 'waiting'"
                    @click="notifyEntry(entry.id)" 
                    class="text-warning-600 hover:text-warning-700"
                    title="Notify Customer"
                  >
                    <font-awesome-icon icon="bell" class="w-4 h-4" />
                  </button>
                  <button 
                    v-if="['waiting', 'notified'].includes(entry.status)"
                    @click="convertEntry(entry.id)" 
                    class="text-success-600 hover:text-success-700"
                    title="Mark as Converted"
                  >
                    <font-awesome-icon icon="check-circle" class="w-4 h-4" />
                  </button>
                  <router-link 
                    :to="`/admin/waitlists/event/${entry.id}`" 
                    class="text-primary-600 hover:text-primary-700"
                    title="View Details"
                  >
                    <font-awesome-icon icon="eye" class="w-4 h-4" />
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../stores/toast'

const router = useRouter()
const route = useRoute()
const toastStore = useToastStore()
const loading = ref(true)
const error = ref(null)

// Filters
const filters = ref({
  eventId: route.query.event || '',
  status: '',
  search: ''
})

// Data
const entries = ref([])
const availableEvents = ref([])
const selectedEntries = ref([])
const selectAll = ref(false)

// Fetch available events
const fetchAvailableEvents = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        id,
        event_date,
        offering:offerings(title)
      `)
      .order('event_date', { ascending: false })

    if (fetchError) throw fetchError

    availableEvents.value = data.map(e => ({
      id: e.id,
      title: e.offering.title,
      event_date: e.event_date
    }))
  } catch (err) {
    console.error('Error fetching events:', err)
  }
}

// Fetch waitlist entries
const fetchEntries = async () => {
  try {
    loading.value = true
    error.value = null

    let query = supabase
      .from('event_waitlist_entries')
      .select(`
        *,
        offering_event:offering_events(
          id,
          event_date,
          offering:offerings(title, slug, featured_image_url)
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.value.eventId) {
      query = query.eq('offering_event_id', filters.value.eventId)
    }

    if (filters.value.status) {
      query = query.eq('status', filters.value.status)
    }

    if (filters.value.search) {
      query = query.or(`customer_name.ilike.%${filters.value.search}%,customer_email.ilike.%${filters.value.search}%`)
    }

    const { data, error: fetchError } = await query

    if (fetchError) throw fetchError

    entries.value = data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(filters.value.eventId || filters.value.status || filters.value.search)
})

// Apply filters
const applyFilters = () => {
  fetchEntries()
}

// Clear all filters
const clearFilters = () => {
  filters.value.eventId = route.query.event || ''
  filters.value.status = ''
  filters.value.search = ''
  fetchEntries()
}

// Toggle select all
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedEntries.value = entries.value.map(e => e.id)
  } else {
    selectedEntries.value = []
  }
}

// Notify single entry
const notifyEntry = async (entryId) => {
  try {
    const { error: updateError } = await supabase
      .from('event_waitlist_entries')
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .eq('id', entryId)

    if (updateError) throw updateError

    toastStore.success('Customer notified successfully!')
    fetchEntries()
  } catch (err) {
    toastStore.error(`Error: ${err.message}`)
  }
}

// Convert entry
const convertEntry = async (entryId) => {
  if (!confirm('Mark this entry as converted?')) return

  try {
    const { error: updateError } = await supabase
      .from('event_waitlist_entries')
      .update({ status: 'converted' })
      .eq('id', entryId)

    if (updateError) throw updateError

    toastStore.success('Entry marked as converted!')
    fetchEntries()
  } catch (err) {
    toastStore.error(`Error: ${err.message}`)
  }
}

// Bulk notify
const bulkNotify = async () => {
  if (!confirm(`Notify ${selectedEntries.value.length} customers?`)) return

  try {
    const { error: updateError } = await supabase
      .from('event_waitlist_entries')
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .in('id', selectedEntries.value)

    if (updateError) throw updateError

    toastStore.success(`${selectedEntries.value.length} customers notified!`)
    selectedEntries.value = []
    selectAll.value = false
    fetchEntries()
  } catch (err) {
    toastStore.error(`Error: ${err.message}`)
  }
}

// Bulk cancel
const bulkCancel = async () => {
  if (!confirm(`Cancel ${selectedEntries.value.length} waitlist entries?`)) return

  try {
    const { error: updateError } = await supabase
      .from('event_waitlist_entries')
      .update({ status: 'cancelled' })
      .in('id', selectedEntries.value)

    if (updateError) throw updateError

    toastStore.success(`${selectedEntries.value.length} entries cancelled!`)
    selectedEntries.value = []
    selectAll.value = false
    fetchEntries()
  } catch (err) {
    toastStore.error(`Error: ${err.message}`)
  }
}

// Export to CSV
const exportToCSV = () => {
  const selectedData = entries.value.filter(e => selectedEntries.value.includes(e.id))

  const csvContent = [
    ['Event', 'Event Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Spaces', 'Status', 'Joined', 'Notified'].join(','),
    ...selectedData.map(e => [
      e.offering_event.offering.title,
      e.offering_event.event_date,
      e.customer_name,
      e.customer_email,
      e.customer_phone || '',
      e.spaces_requested,
      e.status,
      e.created_at,
      e.notified_at || ''
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `event-waitlist-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// Helper functions
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
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
onMounted(async () => {
  await fetchAvailableEvents()
  await fetchEntries()
})

// Watch for route changes
watch(() => route.query.event, (newEventId) => {
  if (newEventId) {
    filters.value.eventId = newEventId
    fetchEntries()
  }
})
</script>

