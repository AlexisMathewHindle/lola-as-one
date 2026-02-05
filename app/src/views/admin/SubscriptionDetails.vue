<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <font-awesome-icon icon="spinner" class="w-8 h-8 text-primary-600 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Subscription Details -->
    <div v-else-if="subscription">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <router-link to="/admin/subscriptions" class="text-sm text-primary-600 hover:text-primary-800 mb-2 inline-block">
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Back to Subscriptions
          </router-link>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Subscription Details</h1>
          <p class="text-sm text-gray-600 mt-1">
            Created on {{ formatDateTime(subscription.created_at) }}
          </p>
        </div>
        <div class="flex gap-3">
          <button
            v-if="subscription.status === 'active'"
            @click="showPauseModal = true"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            Pause Subscription
          </button>
          <button
            v-if="subscription.status === 'paused'"
            @click="resumeSubscription"
            :disabled="resuming"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50"
          >
            <font-awesome-icon v-if="resuming" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
            Resume Subscription
          </button>
          <button
            v-if="subscription.status === 'active' || subscription.status === 'paused'"
            @click="showCancelModal = true"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            Cancel Subscription
          </button>
          <a
            v-if="subscription.stripe_subscription_id"
            :href="`https://dashboard.stripe.com/subscriptions/${subscription.stripe_subscription_id}`"
            target="_blank"
            class="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <font-awesome-icon icon="external-link-alt" class="w-4 h-4 mr-2" />
            View in Stripe
          </a>
        </div>
      </div>

      <!-- Status Banner -->
      <div
        v-if="subscription.status === 'cancelled' || subscription.status === 'past_due' || subscription.status === 'unpaid'"
        class="rounded-lg p-4 mb-6"
        :class="{
          'bg-red-50 border border-red-200': subscription.status === 'cancelled' || subscription.status === 'unpaid',
          'bg-yellow-50 border border-yellow-200': subscription.status === 'past_due'
        }"
      >
        <div class="flex items-start">
          <font-awesome-icon icon="times-circle" class="w-5 h-5 mt-0.5 mr-3" :class="{
            'text-red-600': subscription.status === 'cancelled' || subscription.status === 'unpaid',
            'text-yellow-600': subscription.status === 'past_due'
          }" />
          <div>
            <h3 class="text-sm font-semibold" :class="{
              'text-red-900': subscription.status === 'cancelled' || subscription.status === 'unpaid',
              'text-yellow-900': subscription.status === 'past_due'
            }">
              Subscription {{ formatStatus(subscription.status) }}
            </h3>
            <p class="text-sm mt-1" :class="{
              'text-red-700': subscription.status === 'cancelled' || subscription.status === 'unpaid',
              'text-yellow-700': subscription.status === 'past_due'
            }">
              <span v-if="subscription.status === 'cancelled'">
                This subscription was cancelled on {{ formatDate(subscription.cancelled_at) }}
                <span v-if="subscription.cancel_reason"> - Reason: {{ subscription.cancel_reason }}</span>
              </span>
              <span v-else-if="subscription.status === 'past_due'">
                Payment is past due. Please contact the customer.
              </span>
              <span v-else-if="subscription.status === 'unpaid'">
                Payment has failed. Subscription may be cancelled soon.
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Paused Banner -->
      <div
        v-if="subscription.status === 'paused'"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
      >
        <div class="flex items-start">
          <font-awesome-icon icon="times-circle" class="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 class="text-sm font-semibold text-yellow-900">Subscription Paused</h3>
            <p class="text-sm text-yellow-700 mt-1">
              This subscription was paused on {{ formatDate(subscription.paused_at) }}
              <span v-if="subscription.pause_reason"> - Reason: {{ subscription.pause_reason }}</span>
              <span v-if="subscription.resume_at"> - Scheduled to resume on {{ formatDate(subscription.resume_at) }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Main Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Subscription Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Subscription Details -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h2>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Status</span>
                <span :class="getStatusClass(subscription.status)">
                  {{ formatStatus(subscription.status) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Product</span>
                <span class="text-sm text-gray-900">{{ subscription.offering?.title || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Billing Interval</span>
                <span class="text-sm text-gray-900">{{ formatBillingInterval(subscription.billing_interval) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Amount</span>
                <span class="text-sm font-medium text-gray-900">£{{ subscription.amount_gbp?.toFixed(2) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Current Period</span>
                <span class="text-sm text-gray-900">
                  {{ formatDate(subscription.current_period_start) }} - {{ formatDate(subscription.current_period_end) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">Next Billing Date</span>
                <span class="text-sm text-gray-900">{{ subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'N/A' }}</span>
              </div>
              <div v-if="subscription.stripe_subscription_id" class="flex justify-between">
                <span class="text-sm text-gray-600">Stripe Subscription ID</span>
                <span class="text-xs text-gray-500 font-mono">{{ subscription.stripe_subscription_id }}</span>
              </div>
            </div>
          </div>

          <!-- Subscription Items -->
          <div v-if="subscriptionItems.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Subscription Items</h2>
            <div class="space-y-4">
              <div
                v-for="item in subscriptionItems"
                :key="item.id"
                class="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0 last:pb-0"
              >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ item.offering?.title || 'N/A' }}</p>
                </div>
                <div class="text-right ml-4">
                  <p class="text-sm text-gray-900">Qty: {{ item.quantity }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment History -->
          <div v-if="invoices.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
            <div class="space-y-3">
              <div
                v-for="invoice in invoices"
                :key="invoice.id"
                class="flex justify-between items-center pb-3 border-b border-gray-200 last:border-0 last:pb-0"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ formatDate(invoice.invoice_date) }}</p>
                  <p class="text-xs text-gray-500">Invoice #{{ invoice.stripe_invoice_id }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">£{{ invoice.amount_gbp?.toFixed(2) }}</p>
                  <span :class="getInvoiceStatusClass(invoice.status)">
                    {{ formatInvoiceStatus(invoice.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscription Events -->
          <div v-if="events.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Subscription History</h2>
            <div class="space-y-4">
              <div
                v-for="event in events"
                :key="event.id"
                class="flex items-start"
              >
                <div class="flex-shrink-0 w-2 h-2 rounded-full mt-2 mr-3" :class="getEventDotClass(event.event_type)"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ formatEventType(event.event_type) }}</p>
                  <p v-if="event.description" class="text-xs text-gray-500 mt-1">{{ event.description }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDateTime(event.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Customer Info -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div class="space-y-3">
              <div>
                <p class="text-xs text-gray-500 mb-1">Name</p>
                <p class="text-sm text-gray-900">
                  {{ subscription.customer?.first_name }} {{ subscription.customer?.last_name }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Email</p>
                <a :href="`mailto:${subscription.customer?.email}`" class="text-sm text-primary-600 hover:text-primary-800">
                  {{ subscription.customer?.email }}
                </a>
              </div>
              <div v-if="subscription.customer?.stripe_customer_id">
                <p class="text-xs text-gray-500 mb-1">Stripe Customer ID</p>
                <p class="text-xs text-gray-500 font-mono">{{ subscription.customer.stripe_customer_id }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pause Subscription Modal -->
    <div
      v-if="showPauseModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showPauseModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Pause Subscription</h3>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to pause this subscription? The customer will not be charged until the subscription is resumed.
        </p>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Pause Reason (Optional)</label>
          <textarea
            v-model="pauseReason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Customer request, payment issue..."
          ></textarea>
        </div>

        <div class="flex gap-3">
          <button
            @click="showPauseModal = false"
            class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            @click="pauseSubscription"
            :disabled="pausing"
            class="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50"
          >
            <font-awesome-icon v-if="pausing" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
            Pause Subscription
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Subscription Modal -->
    <div
      v-if="showCancelModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showCancelModal = false"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Cancel Subscription</h3>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to cancel this subscription? This action cannot be undone.
        </p>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Cancel Reason (Optional)</label>
          <textarea
            v-model="cancelReason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Customer request, payment failure..."
          ></textarea>
        </div>

        <div class="flex gap-3">
          <button
            @click="showCancelModal = false"
            class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            @click="cancelSubscription"
            :disabled="cancelling"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            <font-awesome-icon v-if="cancelling" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '../../stores/toast'

const route = useRoute()
const subscriptionId = route.params.id
const toastStore = useToastStore()

// State
const subscription = ref(null)
const subscriptionItems = ref([])
const invoices = ref([])
const events = ref([])
const loading = ref(true)
const error = ref(null)

// Modal state
const showPauseModal = ref(false)
const showCancelModal = ref(false)
const pauseReason = ref('')
const cancelReason = ref('')
const pausing = ref(false)
const resuming = ref(false)
const cancelling = ref(false)

// Fetch subscription data
const fetchSubscription = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch subscription with customer and offering
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        customer:customers(id, email, first_name, last_name, stripe_customer_id),
        offering:offerings(id, title)
      `)
      .eq('id', subscriptionId)
      .single()

    if (subError) throw subError
    subscription.value = subData

    // Fetch subscription items
    const { data: itemsData, error: itemsError } = await supabase
      .from('subscription_items')
      .select(`
        *,
        offering:offerings(id, title)
      `)
      .eq('subscription_id', subscriptionId)

    if (itemsError) throw itemsError
    subscriptionItems.value = itemsData || []

    // Fetch invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('invoice_date', { ascending: false })

    if (invoicesError) throw invoicesError
    invoices.value = invoicesData || []

    // Fetch events
    const { data: eventsData, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false })

    if (eventsError) throw eventsError
    events.value = eventsData || []

  } catch (err) {
    console.error('Error fetching subscription:', err)
    error.value = 'Failed to load subscription details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Pause subscription
const pauseSubscription = async () => {
  try {
    pausing.value = true
    const now = new Date().toISOString()

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        paused_at: now,
        pause_reason: pauseReason.value || null,
        updated_at: now
      })
      .eq('id', subscriptionId)

    if (updateError) throw updateError

    // Create subscription event
    await supabase.from('subscription_events').insert({
      subscription_id: subscriptionId,
      event_type: 'paused',
      description: pauseReason.value || 'Subscription paused by admin'
    })

    // Refresh data
    await fetchSubscription()
    showPauseModal.value = false
    pauseReason.value = ''
  } catch (err) {
    console.error('Error pausing subscription:', err)
    toastStore.error('Failed to pause subscription. Please try again.')
  } finally {
    pausing.value = false
  }
}

// Resume subscription
const resumeSubscription = async () => {
  try {
    resuming.value = true
    const now = new Date().toISOString()

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paused_at: null,
        pause_reason: null,
        resume_at: null,
        updated_at: now
      })
      .eq('id', subscriptionId)

    if (updateError) throw updateError

    // Create subscription event
    await supabase.from('subscription_events').insert({
      subscription_id: subscriptionId,
      event_type: 'resumed',
      description: 'Subscription resumed by admin'
    })

    // Refresh data
    await fetchSubscription()
  } catch (err) {
    console.error('Error resuming subscription:', err)
    toastStore.error('Failed to resume subscription. Please try again.')
  } finally {
    resuming.value = false
  }
}

// Cancel subscription
const cancelSubscription = async () => {
  try {
    cancelling.value = true
    const now = new Date().toISOString()

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        cancel_reason: cancelReason.value || null,
        updated_at: now
      })
      .eq('id', subscriptionId)

    if (updateError) throw updateError

    // Create subscription event
    await supabase.from('subscription_events').insert({
      subscription_id: subscriptionId,
      event_type: 'cancelled',
      description: cancelReason.value || 'Subscription cancelled by admin'
    })

    // Refresh data
    await fetchSubscription()
    showCancelModal.value = false
    cancelReason.value = ''
  } catch (err) {
    console.error('Error cancelling subscription:', err)
    toastStore.error('Failed to cancel subscription. Please try again.')
  } finally {
    cancelling.value = false
  }
}

// Format status
const formatStatus = (status) => {
  const statusMap = {
    active: 'Active',
    paused: 'Paused',
    cancelled: 'Cancelled',
    past_due: 'Past Due',
    unpaid: 'Unpaid'
  }
  return statusMap[status] || status
}

// Get status badge class
const getStatusClass = (status) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const statusClasses = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800',
    past_due: 'bg-red-100 text-red-800',
    unpaid: 'bg-red-100 text-red-800'
  }
  return `${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`
}

// Format billing interval
const formatBillingInterval = (interval) => {
  return interval === 'month' ? 'Monthly' : interval === 'year' ? 'Yearly' : interval
}

// Format invoice status
const formatInvoiceStatus = (status) => {
  const statusMap = {
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    void: 'Void',
    uncollectible: 'Uncollectible'
  }
  return statusMap[status] || status
}

// Get invoice status class
const getInvoiceStatusClass = (status) => {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
  const statusClasses = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    void: 'bg-gray-100 text-gray-800',
    uncollectible: 'bg-red-100 text-red-800'
  }
  return `${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`
}

// Format event type
const formatEventType = (eventType) => {
  const eventMap = {
    created: 'Subscription Created',
    paused: 'Subscription Paused',
    resumed: 'Subscription Resumed',
    cancelled: 'Subscription Cancelled',
    renewed: 'Subscription Renewed',
    payment_failed: 'Payment Failed',
    payment_succeeded: 'Payment Succeeded'
  }
  return eventMap[eventType] || eventType
}

// Get event dot class
const getEventDotClass = (eventType) => {
  const eventClasses = {
    created: 'bg-blue-500',
    paused: 'bg-yellow-500',
    resumed: 'bg-green-500',
    cancelled: 'bg-red-500',
    renewed: 'bg-green-500',
    payment_failed: 'bg-red-500',
    payment_succeeded: 'bg-green-500'
  }
  return eventClasses[eventType] || 'bg-gray-500'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  fetchSubscription()
})
</script>

