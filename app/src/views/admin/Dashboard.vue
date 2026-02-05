<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-600">Total Orders</h3>
          <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <font-awesome-icon icon="shopping-cart" class="w-5 h-5 text-primary-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.totalOrders }}</p>
        <p class="text-xs text-gray-500 mt-2">All time</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-600">Active Subscriptions</h3>
          <div class="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
            <font-awesome-icon icon="calendar" class="w-5 h-5 text-success-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.activeSubscriptions }}</p>
        <p class="text-xs text-gray-500 mt-2">Currently active</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-600">Upcoming Workshops</h3>
          <div class="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
            <font-awesome-icon :icon="['far', 'calendar']" class="w-5 h-5 text-warning-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.upcomingWorkshops }}</p>
        <p class="text-xs text-gray-500 mt-2">Next 30 days</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-600">Low Stock Items</h3>
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="stats.lowStockItems > 0 ? 'bg-danger-100' : 'bg-gray-100'">
            <font-awesome-icon icon="box" class="w-5 h-5" :class="stats.lowStockItems > 0 ? 'text-danger-600' : 'text-gray-600'" />
          </div>
        </div>
        <p class="text-3xl font-bold" :class="stats.lowStockItems > 0 ? 'text-danger-600' : 'text-gray-900'">
          {{ stats.lowStockItems }}
        </p>
        <p class="text-xs text-gray-500 mt-2">Need attention</p>
      </div>
    </div>

    <!-- Waitlist Stats (Second Row) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <router-link
        to="/admin/waitlists"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-600 group-hover:text-primary-600 transition-colors">Active Waitlists</h3>
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <font-awesome-icon icon="clock" class="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.activeWaitlists }}</p>
        <p class="text-xs text-gray-500 mt-2">Customers waiting</p>
      </router-link>

      <router-link
        to="/admin/waitlists"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-600 group-hover:text-primary-600 transition-colors">Pending Notifications</h3>
          <div class="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center group-hover:bg-warning-200 transition-colors">
            <font-awesome-icon icon="bell" class="w-5 h-5 text-warning-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.pendingNotifications }}</p>
        <p class="text-xs text-gray-500 mt-2">Need to notify</p>
      </router-link>

      <router-link
        to="/admin/waitlists"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group sm:col-span-2 lg:col-span-1"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-600 group-hover:text-primary-600 transition-colors">Conversion Rate</h3>
          <div class="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center group-hover:bg-success-200 transition-colors">
            <font-awesome-icon icon="chart-line" class="w-5 h-5 text-success-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ stats.waitlistConversionRate }}%</p>
        <p class="text-xs text-gray-500 mt-2">Waitlist to purchase</p>
      </router-link>
    </div>
    
    <!-- Quick Actions -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
        Quick Actions
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <router-link
          to="/admin/offerings/new"
          class="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-center group"
        >
          <div class="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-200">
            <font-awesome-icon icon="plus" class="w-6 h-6 text-primary-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Create Offering
          </h3>
          <p class="text-sm text-gray-600">
            Add a workshop, product, subscription, or digital download
          </p>
        </router-link>

        <router-link
          to="/admin/blog/new"
          class="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-center group"
        >
          <div class="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-200">
            <font-awesome-icon icon="edit" class="w-6 h-6 text-primary-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Write Blog Post
          </h3>
          <p class="text-sm text-gray-600">
            Create a new blog post or article
          </p>
        </router-link>

        <router-link
          to="/admin/orders"
          class="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-center group sm:col-span-2 lg:col-span-1"
        >
          <div class="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-200">
            <font-awesome-icon icon="eye" class="w-6 h-6 text-primary-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            View Orders
          </h3>
          <p class="text-sm text-gray-600">
            Manage and fulfill customer orders
          </p>
        </router-link>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl sm:text-2xl font-semibold text-gray-900">
          Recent Activity
        </h2>
        <font-awesome-icon icon="chart-line" class="w-5 h-5 text-gray-400" />
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="text-gray-500 mt-3">Loading...</p>
      </div>

      <div v-else-if="recentOrders.length === 0" class="text-center py-12">
        <font-awesome-icon icon="shopping-cart" class="w-12 h-12 text-gray-300 mb-3" />
        <p class="text-gray-500">No recent orders</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="order in recentOrders"
          :key="order.id"
          class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        >
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <font-awesome-icon icon="shopping-cart" class="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900">Order #{{ order.order_number }}</p>
              <p class="text-sm text-gray-600">{{ order.customer_email }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-900">£{{ order.total_gbp }}</p>
            <p class="text-xs text-gray-500">{{ formatDate(order.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const stats = ref({
  totalOrders: 0,
  activeSubscriptions: 0,
  upcomingWorkshops: 0,
  lowStockItems: 0,
  activeWaitlists: 0,
  pendingNotifications: 0,
  waitlistConversionRate: 0
})

const recentOrders = ref([])
const loading = ref(true)

const fetchStats = async () => {
  try {
    // Fetch total orders
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    stats.value.totalOrders = ordersCount || 0
    
    // Fetch active subscriptions
    const { count: subsCount } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    stats.value.activeSubscriptions = subsCount || 0
    
    // Fetch upcoming workshops (next 30 days)
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { count: workshopsCount } = await supabase
      .from('offering_events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', today)
      .lte('event_date', thirtyDaysFromNow)
    stats.value.upcomingWorkshops = workshopsCount || 0
    
    // Fetch low stock items
    const { data: lowStock } = await supabase
      .from('offering_products')
      .select('stock_quantity, low_stock_threshold')
      .eq('track_inventory', true)
    
    stats.value.lowStockItems = lowStock?.filter(
      item => item.stock_quantity <= item.low_stock_threshold
    ).length || 0

    // Fetch waitlist stats (Note: These tables will exist after migration is applied)
    try {
      // Active waitlists (status = 'waiting')
      const { count: eventWaitlistCount } = await supabase
        .from('event_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting')

      const { count: productWaitlistCount } = await supabase
        .from('product_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting')

      stats.value.activeWaitlists = (eventWaitlistCount || 0) + (productWaitlistCount || 0)

      // Pending notifications (status = 'notified' and not expired)
      const now = new Date().toISOString()
      const { count: eventNotifiedCount } = await supabase
        .from('event_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'notified')
        .gt('notified_expires_at', now)

      const { count: productNotifiedCount } = await supabase
        .from('product_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'notified')
        .gt('notified_expires_at', now)

      stats.value.pendingNotifications = (eventNotifiedCount || 0) + (productNotifiedCount || 0)

      // Conversion rate (converted / total notified)
      const { count: eventConvertedCount } = await supabase
        .from('event_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted')

      const { count: productConvertedCount } = await supabase
        .from('product_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted')

      const { count: eventTotalNotifiedCount } = await supabase
        .from('event_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .in('status', ['notified', 'converted', 'expired'])

      const { count: productTotalNotifiedCount } = await supabase
        .from('product_waitlist_entries')
        .select('*', { count: 'exact', head: true })
        .in('status', ['notified', 'converted', 'expired'])

      const totalConverted = (eventConvertedCount || 0) + (productConvertedCount || 0)
      const totalNotified = (eventTotalNotifiedCount || 0) + (productTotalNotifiedCount || 0)

      stats.value.waitlistConversionRate = totalNotified > 0
        ? Math.round((totalConverted / totalNotified) * 100)
        : 0
    } catch (waitlistError) {
      // Silently fail if waitlist tables don't exist yet (migration not applied)
      console.log('Waitlist tables not yet available:', waitlistError.message)
      stats.value.activeWaitlists = 0
      stats.value.pendingNotifications = 0
      stats.value.waitlistConversionRate = 0
    }

  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const fetchRecentOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, total_gbp, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) throw error
    recentOrders.value = data || []
  } catch (error) {
    console.error('Error fetching recent orders:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })
}

onMounted(async () => {
  await Promise.all([fetchStats(), fetchRecentOrders()])
})
</script>

