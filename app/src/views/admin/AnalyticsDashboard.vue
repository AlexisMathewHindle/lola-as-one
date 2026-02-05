<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
        <p class="text-sm text-gray-600 mt-1">
          View sales, inventory, and customer insights
        </p>
      </div>
      <div class="flex gap-3">
        <select
          v-model="dateRange"
          @change="fetchAnalytics"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <font-awesome-icon icon="spinner" class="w-8 h-8 text-primary-600 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Analytics Content -->
    <div v-else>
      <!-- Sales Overview -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Total Revenue</div>
            <div class="text-2xl font-bold text-gray-900">£{{ Number(analytics.totalRevenue || 0).toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">{{ analytics.totalOrders || 0 }} orders</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Average Order Value</div>
            <div class="text-2xl font-bold text-gray-900">£{{ Number(analytics.averageOrderValue || 0).toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">Per order</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Subscription Revenue</div>
            <div class="text-2xl font-bold text-gray-900">£{{ Number(analytics.subscriptionRevenue || 0).toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">{{ analytics.activeSubscriptions || 0 }} active</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Event Revenue</div>
            <div class="text-2xl font-bold text-gray-900">£{{ Number(analytics.eventRevenue || 0).toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">{{ analytics.totalBookings || 0 }} bookings</div>
          </div>
        </div>
      </div>

      <!-- Customer Insights -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Total Customers</div>
            <div class="text-2xl font-bold text-gray-900">{{ analytics.totalCustomers || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">All time</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">New Customers</div>
            <div class="text-2xl font-bold text-gray-900">{{ analytics.newCustomers || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">This period</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Repeat Customers</div>
            <div class="text-2xl font-bold text-gray-900">{{ analytics.repeatCustomers || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">{{ Number(analytics.repeatCustomerRate || 0).toFixed(1) }}% rate</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Avg Customer LTV</div>
            <div class="text-2xl font-bold text-gray-900">£{{ Number(analytics.averageCustomerLTV || 0).toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">Lifetime value</div>
          </div>
        </div>
      </div>

      <!-- Inventory Status -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Total Items</div>
            <div class="text-2xl font-bold text-gray-900">{{ analytics.totalInventoryItems || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">In catalog</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Low Stock Items</div>
            <div class="text-2xl font-bold text-red-600">{{ analytics.lowStockItems || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">Need attention</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Out of Stock</div>
            <div class="text-2xl font-bold text-red-600">{{ analytics.outOfStockItems || 0 }}</div>
            <div class="text-xs text-gray-600 mt-1">Unavailable</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-xs text-gray-500 mb-1">Inventory Value</div>
            <div class="text-2xl font-bold text-gray-900">£{{ Number(analytics.totalInventoryValue || 0).toFixed(2) }}</div>
            <div class="text-xs text-gray-600 mt-1">Total value</div>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="product in analytics.topProducts" :key="product.id">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ product.name || 'N/A' }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ product.sales || 0 }} units
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">£{{ Number(product.revenue || 0).toFixed(2) }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    (product.stock || 0) > 10 ? 'bg-green-100 text-green-800' :
                    (product.stock || 0) > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]">
                    {{ product.stock || 0 }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top Events -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Top Events</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="event in analytics.topEvents" :key="event.id">
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ event.name || 'N/A' }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ event.bookings || 0 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900">£{{ Number(event.revenue || 0).toFixed(2) }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        class="bg-primary-600 h-2 rounded-full"
                        :style="{ width: `${Math.min(((event.bookings || 0) / (event.capacity || 1)) * 100, 100)}%` }"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-600">{{ event.bookings || 0 }}/{{ event.capacity || 0 }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="order in analytics.recentOrders"
                :key="order.id"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <router-link
                    :to="`/admin/orders/${order.id}`"
                    class="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    #{{ order.order_number }}
                  </router-link>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ order.customer_name }}</div>
                  <div class="text-xs text-gray-500">{{ order.customer_email }}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {{ new Date(order.created_at).toLocaleDateString() }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  £{{ Number(order.total_amount || 0).toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-yellow-100 text-yellow-800': order.status === 'pending',
                      'bg-green-100 text-green-800': order.status === 'paid',
                      'bg-blue-100 text-blue-800': order.status === 'fulfilled',
                      'bg-red-100 text-red-800': order.status === 'cancelled',
                      'bg-gray-100 text-gray-800': order.status === 'refunded'
                    }"
                  >
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// State
const loading = ref(false)
const error = ref(null)
const dateRange = ref('30')

const analytics = ref({
  // Sales metrics
  totalRevenue: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  subscriptionRevenue: 0,
  eventRevenue: 0,
  activeSubscriptions: 0,
  totalBookings: 0,

  // Customer metrics
  totalCustomers: 0,
  newCustomers: 0,
  repeatCustomers: 0,
  repeatCustomerRate: 0,
  averageCustomerLTV: 0,

  // Inventory metrics
  totalInventoryItems: 0,
  inStockItems: 0,
  lowStockItems: 0,
  outOfStockItems: 0,

  // Top items
  topProducts: [],
  topEvents: [],
  recentOrders: []
})

// Calculate date range filter
const getDateFilter = () => {
  if (dateRange.value === 'all') return null

  const days = parseInt(dateRange.value)
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// Fetch analytics data
const fetchAnalytics = async () => {
  loading.value = true
  error.value = null

  try {
    const dateFilter = getDateFilter()

    // Fetch orders
    let ordersQuery = supabase
      .from('orders')
      .select('*')

    if (dateFilter) {
      ordersQuery = ordersQuery.gte('created_at', dateFilter)
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) throw ordersError

    // Calculate sales metrics
    const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'fulfilled')
    analytics.value.totalOrders = paidOrders.length
    analytics.value.totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    analytics.value.averageOrderValue = analytics.value.totalOrders > 0
      ? analytics.value.totalRevenue / analytics.value.totalOrders
      : 0

    // Fetch subscriptions
    let subscriptionsQuery = supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery

    if (subscriptionsError) throw subscriptionsError

    analytics.value.activeSubscriptions = subscriptions.length

    // Calculate subscription revenue (from subscription renewal orders)
    const subscriptionOrders = paidOrders.filter(o =>
      o.order_type === 'subscription_initial' || o.order_type === 'subscription_renewal'
    )
    analytics.value.subscriptionRevenue = subscriptionOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)

    // Fetch bookings
    let bookingsQuery = supabase
      .from('bookings')
      .select('*, order:orders(*)')

    if (dateFilter) {
      bookingsQuery = bookingsQuery.gte('created_at', dateFilter)
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery

    if (bookingsError) throw bookingsError

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
    analytics.value.totalBookings = confirmedBookings.length
    analytics.value.eventRevenue = confirmedBookings.reduce((sum, b) => {
      return sum + (b.order ? parseFloat(b.order.total_amount || 0) : 0)
    }, 0)

    // Fetch customers
    const { data: allCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*')

    if (customersError) throw customersError

    analytics.value.totalCustomers = allCustomers.length

    // New customers in period
    if (dateFilter) {
      const newCustomers = allCustomers.filter(c => new Date(c.created_at) >= new Date(dateFilter))
      analytics.value.newCustomers = newCustomers.length
    } else {
      analytics.value.newCustomers = allCustomers.length
    }

    // Calculate repeat customers (customers with more than 1 order)
    const customerOrderCounts = {}
    paidOrders.forEach(order => {
      if (order.customer_id) {
        customerOrderCounts[order.customer_id] = (customerOrderCounts[order.customer_id] || 0) + 1
      }
    })

    analytics.value.repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length
    analytics.value.repeatCustomerRate = analytics.value.totalCustomers > 0
      ? (analytics.value.repeatCustomers / analytics.value.totalCustomers) * 100
      : 0

    // Calculate average customer LTV
    analytics.value.averageCustomerLTV = analytics.value.totalCustomers > 0
      ? analytics.value.totalRevenue / analytics.value.totalCustomers
      : 0

    // Fetch inventory items
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('*')

    if (inventoryError) throw inventoryError

    analytics.value.totalInventoryItems = inventoryItems.length
    analytics.value.inStockItems = inventoryItems.filter(item =>
      item.quantity_available > item.low_stock_threshold
    ).length
    analytics.value.lowStockItems = inventoryItems.filter(item =>
      item.quantity_available > 0 && item.quantity_available <= item.low_stock_threshold
    ).length
    analytics.value.outOfStockItems = inventoryItems.filter(item =>
      item.quantity_available === 0
    ).length

    // Fetch order items for top products
    let orderItemsQuery = supabase
      .from('order_items')
      .select(`
        *,
        order:orders!inner(status, created_at),
        offering:offerings(id, title)
      `)
      .in('order.status', ['paid', 'fulfilled'])

    if (dateFilter) {
      orderItemsQuery = orderItemsQuery.gte('order.created_at', dateFilter)
    }

    const { data: orderItems, error: orderItemsError } = await orderItemsQuery

    if (orderItemsError) throw orderItemsError

    // Calculate top products
    const productStats = {}
    orderItems.forEach(item => {
      if (item.offering_id && item.offering) {
        if (!productStats[item.offering_id]) {
          productStats[item.offering_id] = {
            id: item.offering_id,
            title: item.offering.title,
            quantity: 0,
            revenue: 0
          }
        }
        productStats[item.offering_id].quantity += item.quantity
        productStats[item.offering_id].revenue += parseFloat(item.unit_price) * item.quantity
      }
    })

    analytics.value.topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Fetch bookings for top events
    let eventBookingsQuery = supabase
      .from('bookings')
      .select(`
        *,
        offering_event:offering_events!inner(
          id,
          offering:offerings(id, title)
        ),
        order:orders(status)
      `)
      .eq('status', 'confirmed')
      .in('order.status', ['paid', 'fulfilled'])

    if (dateFilter) {
      eventBookingsQuery = eventBookingsQuery.gte('created_at', dateFilter)
    }

    const { data: eventBookings, error: eventBookingsError } = await eventBookingsQuery

    if (eventBookingsError) throw eventBookingsError

    // Calculate top events
    const eventStats = {}
    eventBookings.forEach(booking => {
      if (booking.offering_event_id && booking.offering_event?.offering) {
        const eventId = booking.offering_event_id
        if (!eventStats[eventId]) {
          eventStats[eventId] = {
            id: eventId,
            title: booking.offering_event.offering.title,
            bookings: 0,
            revenue: 0
          }
        }
        eventStats[eventId].bookings += 1
        if (booking.order) {
          eventStats[eventId].revenue += parseFloat(booking.order.total_amount || 0)
        }
      }
    })

    analytics.value.topEvents = Object.values(eventStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Fetch recent orders
    let recentOrdersQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (dateFilter) {
      recentOrdersQuery = recentOrdersQuery.gte('created_at', dateFilter)
    }

    const { data: recentOrders, error: recentOrdersError } = await recentOrdersQuery

    if (recentOrdersError) throw recentOrdersError

    analytics.value.recentOrders = recentOrders

  } catch (err) {
    console.error('Error fetching analytics:', err)
    error.value = 'Failed to load analytics data. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch analytics on mount
onMounted(() => {
  fetchAnalytics()
})
</script>

