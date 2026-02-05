<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-display font-bold text-dark-900">Waitlist Management</h1>
        <p class="text-gray-600 mt-1">Manage customer waitlists for events and products</p>
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

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Active Entries -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Active</p>
              <p class="text-3xl font-bold text-dark-900 mt-1">{{ stats.totalActive }}</p>
            </div>
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <font-awesome-icon icon="users" class="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Waiting customers</p>
        </div>

        <!-- Pending Notifications -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Pending Notifications</p>
              <p class="text-3xl font-bold text-warning-600 mt-1">{{ stats.pendingNotifications }}</p>
            </div>
            <div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <font-awesome-icon icon="bell" class="w-6 h-6 text-warning-600" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Awaiting response</p>
        </div>

        <!-- Conversion Rate -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Conversion Rate</p>
              <p class="text-3xl font-bold text-success-600 mt-1">{{ stats.conversionRate }}%</p>
            </div>
            <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <font-awesome-icon icon="chart-line" class="w-6 h-6 text-success-600" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Notified → Converted</p>
        </div>

        <!-- Expired (Last 7 Days) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Expired (7 days)</p>
              <p class="text-3xl font-bold text-gray-600 mt-1">{{ stats.expiredLast7Days }}</p>
            </div>
            <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <font-awesome-icon icon="clock" class="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Missed opportunities</p>
        </div>
      </div>

      <!-- Quick Lists -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <!-- Events with Active Waitlists -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-dark-900">Events with Waitlists</h2>
            <router-link to="/admin/waitlists/events" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All →
            </router-link>
          </div>

          <div v-if="eventsWithWaitlists.length === 0" class="text-center py-8 text-gray-500">
            <font-awesome-icon icon="calendar" class="w-12 h-12 mb-3 opacity-50" />
            <p>No events with active waitlists</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="event in eventsWithWaitlists" :key="event.id" 
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div class="flex-1">
                <p class="font-medium text-dark-900">{{ event.offering.title }}</p>
                <p class="text-sm text-gray-600">
                  {{ formatDate(event.event_date) }} • {{ event.waitlist_count }} waiting
                </p>
              </div>
              <router-link :to="`/admin/waitlists/events?event=${event.id}`" 
                           class="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                View
              </router-link>
            </div>
          </div>
        </div>

        <!-- Products with Active Waitlists -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-dark-900">Products with Waitlists</h2>
            <router-link to="/admin/waitlists/products" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All →
            </router-link>
          </div>

          <div v-if="productsWithWaitlists.length === 0" class="text-center py-8 text-gray-500">
            <font-awesome-icon icon="box" class="w-12 h-12 mb-3 opacity-50" />
            <p>No products with active waitlists</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="product in productsWithWaitlists" :key="product.id" 
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div class="flex-1">
                <p class="font-medium text-dark-900">{{ product.offering.title }}</p>
                <p class="text-sm text-gray-600">
                  SKU: {{ product.sku }} • Stock: {{ product.stock_quantity }} • {{ product.waitlist_count }} waiting
                </p>
              </div>
              <router-link :to="`/admin/waitlists/products?product=${product.id}`" 
                           class="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                View
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h2 class="text-lg font-semibold text-dark-900 mb-4">Recent Activity</h2>

        <div v-if="recentActivity.length === 0" class="text-center py-8 text-gray-500">
          <font-awesome-icon icon="clock" class="w-12 h-12 mb-3 opacity-50" />
          <p>No recent waitlist activity</p>
        </div>

        <div v-else class="space-y-3">
          <div v-for="activity in recentActivity" :key="activity.id" 
               class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                 :class="getActivityIconClass(activity.status)">
              <font-awesome-icon :icon="getActivityIcon(activity.status)" class="w-4 h-4" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-dark-900">{{ activity.customer_name }}</p>
              <p class="text-sm text-gray-600">{{ getActivityDescription(activity) }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ formatRelativeTime(activity.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'

const router = useRouter()
const loading = ref(true)
const error = ref(null)

// Stats
const stats = ref({
  totalActive: 0,
  pendingNotifications: 0,
  conversionRate: 0,
  expiredLast7Days: 0
})

// Lists
const eventsWithWaitlists = ref([])
const productsWithWaitlists = ref([])
const recentActivity = ref([])

// Fetch stats
const fetchStats = async () => {
  try {
    // Total active (waiting + notified)
    const { count: eventActive } = await supabase
      .from('event_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .in('status', ['waiting', 'notified'])

    const { count: productActive } = await supabase
      .from('product_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .in('status', ['waiting', 'notified'])

    stats.value.totalActive = (eventActive || 0) + (productActive || 0)

    // Pending notifications (notified status)
    const { count: eventNotified } = await supabase
      .from('event_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'notified')

    const { count: productNotified } = await supabase
      .from('product_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'notified')

    stats.value.pendingNotifications = (eventNotified || 0) + (productNotified || 0)

    // Conversion rate
    const { count: totalNotified } = await supabase
      .from('event_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .in('status', ['notified', 'converted'])

    const { count: totalConverted } = await supabase
      .from('event_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted')

    if (totalNotified && totalNotified > 0) {
      stats.value.conversionRate = Math.round((totalConverted / totalNotified) * 100)
    }

    // Expired last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: eventExpired } = await supabase
      .from('event_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')
      .gte('updated_at', sevenDaysAgo.toISOString())

    const { count: productExpired } = await supabase
      .from('product_waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')
      .gte('updated_at', sevenDaysAgo.toISOString())

    stats.value.expiredLast7Days = (eventExpired || 0) + (productExpired || 0)

  } catch (err) {
    console.error('Error fetching stats:', err)
  }
}

// Fetch events with waitlists
const fetchEventsWithWaitlists = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('event_capacity')
      .select(`
        *,
        offering_event:offering_events(
          id,
          event_date,
          offering:offerings(title)
        )
      `)
      .eq('waitlist_enabled', true)
      .gt('waitlist_count', 0)
      .order('waitlist_count', { ascending: false })
      .limit(5)

    if (fetchError) throw fetchError

    eventsWithWaitlists.value = data.map(item => ({
      id: item.offering_event.id,
      event_date: item.offering_event.event_date,
      waitlist_count: item.waitlist_count,
      offering: item.offering_event.offering
    }))
  } catch (err) {
    console.error('Error fetching events with waitlists:', err)
  }
}

// Fetch products with waitlists
const fetchProductsWithWaitlists = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('offering_products')
      .select(`
        id,
        sku,
        stock_quantity,
        offering:offerings(title)
      `)
      .eq('waitlist_enabled', true)
      .order('stock_quantity', { ascending: true })
      .limit(5)

    if (fetchError) throw fetchError

    // Get waitlist counts for each product
    const productsWithCounts = await Promise.all(
      data.map(async (product) => {
        const { count } = await supabase
          .from('product_waitlist_entries')
          .select('*', { count: 'exact', head: true })
          .eq('offering_product_id', product.id)
          .in('status', ['waiting', 'notified'])

        return {
          ...product,
          waitlist_count: count || 0
        }
      })
    )

    productsWithWaitlists.value = productsWithCounts.filter(p => p.waitlist_count > 0)
  } catch (err) {
    console.error('Error fetching products with waitlists:', err)
  }
}

// Fetch recent activity
const fetchRecentActivity = async () => {
  try {
    // Get recent event waitlist entries
    const { data: eventEntries } = await supabase
      .from('event_waitlist_entries')
      .select(`
        id,
        customer_name,
        customer_email,
        status,
        created_at,
        offering_event:offering_events(
          offering:offerings(title)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent product waitlist entries
    const { data: productEntries } = await supabase
      .from('product_waitlist_entries')
      .select(`
        id,
        customer_name,
        customer_email,
        status,
        created_at,
        offering_product:offering_products(
          offering:offerings(title)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Combine and sort
    const combined = [
      ...(eventEntries || []).map(e => ({ ...e, type: 'event', offering_title: e.offering_event?.offering?.title })),
      ...(productEntries || []).map(p => ({ ...p, type: 'product', offering_title: p.offering_product?.offering?.title }))
    ]

    recentActivity.value = combined
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
  } catch (err) {
    console.error('Error fetching recent activity:', err)
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

const formatRelativeTime = (date) => {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

const getActivityIcon = (status) => {
  switch (status) {
    case 'waiting': return 'clock'
    case 'notified': return 'bell'
    case 'converted': return 'check-circle'
    case 'expired': return 'times-circle'
    case 'cancelled': return 'ban'
    default: return 'question-circle'
  }
}

const getActivityIconClass = (status) => {
  switch (status) {
    case 'waiting': return 'bg-gray-100 text-gray-600'
    case 'notified': return 'bg-warning-100 text-warning-600'
    case 'converted': return 'bg-success-100 text-success-600'
    case 'expired': return 'bg-danger-100 text-danger-600'
    case 'cancelled': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const getActivityDescription = (activity) => {
  const title = activity.offering_title || 'Unknown'

  switch (activity.status) {
    case 'waiting':
      return `Joined waitlist for ${title}`
    case 'notified':
      return `Notified for ${title}`
    case 'converted':
      return `Converted for ${title}`
    case 'expired':
      return `Notification expired for ${title}`
    case 'cancelled':
      return `Cancelled waitlist for ${title}`
    default:
      return `Activity for ${title}`
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      fetchStats(),
      fetchEventsWithWaitlists(),
      fetchProductsWithWaitlists(),
      fetchRecentActivity()
    ])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

