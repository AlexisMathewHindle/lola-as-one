<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2">
          Shopping Cart
        </h1>
        <p class="text-base sm:text-lg text-gray-600">
          {{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? 'item' : 'items' }} in your cart
        </p>
      </div>

      <!-- Empty Cart State -->
      <div v-if="cartStore.items.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
        <div class="max-w-md mx-auto">
          <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <font-awesome-icon icon="shopping-cart" class="w-12 h-12 text-gray-400" />
          </div>
          <h2 class="text-2xl font-display font-bold text-gray-900 mb-3">
            Your cart is empty
          </h2>
          <p class="text-gray-600 mb-6">
            Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <router-link
              to="/workshops"
              class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <font-awesome-icon icon="calendar" class="w-4 h-4 mr-2" />
              Browse Workshops
            </router-link>
            <router-link
              to="/shop"
              class="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <font-awesome-icon icon="shopping-bag" class="w-4 h-4 mr-2" />
              Browse Products
            </router-link>
          </div>
        </div>
      </div>

      <!-- Cart Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Cart Items (Left Column - 2/3 width) -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Cart Item Card -->
          <div
            v-for="item in cartStore.items"
            :key="getItemKey(item)"
            class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
          >
            <div class="flex gap-4">
              <!-- Product Image -->
              <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.title || item.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                  <font-awesome-icon :icon="getItemIcon(item)" class="w-8 h-8 sm:w-12 sm:h-12 text-primary-400" />
                </div>
              </div>

              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex-1 min-w-0 pr-4">
                    <h3 class="text-lg font-semibold text-gray-900 truncate">
                      {{ item.title || item.name }}
                    </h3>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        :class="getItemTypeBadgeClass(item)"
                      >
                        {{ getItemTypeLabel(item) }}
                      </span>
                    </div>
                    <!-- Subscription details -->
                    <div
                      v-if="item.type === 'subscription' && item.subscriptionConfig"
                      class="mt-2 text-xs text-gray-600 space-y-0.5"
                    >
                      <div v-if="item.subscriptionConfig.plan_label">
                        Plan:
                        <span class="font-medium">
                          {{ item.subscriptionConfig.plan_label }}
                        </span>
                      </div>
                      <div>
                        Boxes selected:
                        <span class="font-medium">
                          {{ (item.subscriptionConfig.selected_box_product_ids || []).length }}
                        </span>
                        <span v-if="item.subscriptionConfig.max_boxes">
                          of {{ item.subscriptionConfig.max_boxes }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    @click="removeItem(item)"
                    class="text-gray-400 hover:text-red-600 transition-colors p-2"
                    title="Remove item"
                  >
                    <font-awesome-icon icon="trash" class="w-4 h-4" />
                  </button>
                </div>

                <!-- Event Details (if event) -->
                <div v-if="item.type === 'event' && item.eventDate" class="text-sm text-gray-600 mb-3">
                  <div class="flex items-center gap-4">
                    <span class="flex items-center">
                      <font-awesome-icon icon="calendar" class="w-4 h-4 mr-1" />
                      {{ formatDate(item.eventDate) }}
                    </span>
                    <span v-if="item.eventTime" class="flex items-center">
                      <font-awesome-icon icon="clock" class="w-4 h-4 mr-1" />
                      {{ item.eventTime }}
                    </span>
                  </div>
                </div>

                <!-- Price and Quantity -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <!-- Quantity Selector (not for events) -->
                    <div v-if="item.type !== 'event'" class="flex items-center border border-gray-300 rounded-lg">
                      <button
                        @click="decrementQuantity(item)"
                        class="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                        :disabled="item.quantity <= 1"
                      >
                        <font-awesome-icon icon="minus" class="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        :value="item.quantity"
                        @input="updateItemQuantity(item, $event)"
                        min="1"
                        class="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                      />
                      <button
                        @click="incrementQuantity(item)"
                        class="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <font-awesome-icon icon="plus" class="w-3 h-3" />
                      </button>
                    </div>
                    <div v-else class="text-sm text-gray-600">
                      Quantity: {{ item.quantity }}
                    </div>
                  </div>

                  <!-- Line Total -->
                  <div class="text-right">
                    <div class="text-lg font-bold text-gray-900">
                      £{{ lineTotal(item).toFixed(2) }}
                    </div>
                    <div v-if="item.quantity > 1" class="text-xs text-gray-500">
                      £{{ item.price.toFixed(2) }} each
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Summary (Right Column - 1/3 width) -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
              Order Summary
            </h2>

            <!-- Subtotal -->
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-600">Subtotal</span>
              <span class="text-gray-900 font-semibold">£{{ cartStore.subtotal.toFixed(2) }}</span>
            </div>

            <!-- Shipping -->
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-600">Shipping</span>
              <span class="text-gray-900 font-semibold">
                {{ shipping === 0 ? 'FREE' : `£${shipping.toFixed(2)}` }}
              </span>
            </div>

            <!-- VAT Notice -->
            <div class="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
              VAT (20%) is included in all prices
            </div>

            <!-- Total -->
            <div class="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
              <span class="text-lg font-bold text-gray-900">Total</span>
              <span class="text-2xl font-bold text-primary-600">£{{ total.toFixed(2) }}</span>
            </div>

            <!-- Checkout Button -->
            <button
              @click="goToCheckout"
              class="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-3 flex items-center justify-center"
            >
              <font-awesome-icon icon="lock" class="w-4 h-4 mr-2" />
              Proceed to Checkout
            </button>

            <!-- Continue Shopping -->
            <router-link
              to="/shop"
              class="block w-full text-center py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Continue Shopping
            </router-link>

            <!-- Security Badge -->
            <div class="mt-6 pt-6 border-t border-gray-200">
              <div class="flex items-center justify-center text-xs text-gray-500">
                <font-awesome-icon icon="shield-alt" class="w-4 h-4 mr-2 text-green-600" />
                Secure checkout powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'

const router = useRouter()
const cartStore = useCartStore()
const toastStore = useToastStore()

// Helper function to get unique key for each cart item
const getItemKey = (item) => {
  // Handle both old (productId) and new (id) structure
  const id = item.id || item.productId
  return `${id}-${item.variantId || 'default'}`
}

// Get icon based on item type
const getItemIcon = (item) => {
  if (item.type === 'event') return 'calendar'
  if (item.type === 'product_digital') return 'download'
  if (item.type === 'subscription') return 'sync'
  return 'box'
}

// Get badge class based on item type
const getItemTypeBadgeClass = (item) => {
  if (item.type === 'event') {
    return 'bg-purple-100 text-purple-800'
  }
  if (item.type === 'product_digital') {
    return 'bg-blue-100 text-blue-800'
  }
  if (item.type === 'subscription') {
    return 'bg-green-100 text-green-800'
  }
  return 'bg-primary-100 text-primary-800'
}

// Get human-readable label for item type
const getItemTypeLabel = (item) => {
  if (item.type === 'event') return 'Workshop'
  if (item.type === 'product_digital') return 'Digital Product'
  if (item.type === 'subscription') return 'Subscription'
  if (item.type === 'product_physical') return 'Physical Product'
  return 'Product'
}

// Calculate line total for an item
const lineTotal = (item) => {
  return item.price * item.quantity
}

// Quantity management functions
const incrementQuantity = (item) => {
  const id = item.id || item.productId
  cartStore.updateQuantity(id, item.quantity + 1, item.variantId)
}

const decrementQuantity = (item) => {
  const id = item.id || item.productId
  if (item.quantity > 1) {
    cartStore.updateQuantity(id, item.quantity - 1, item.variantId)
  }
}

const updateItemQuantity = (item, event) => {
  const newQuantity = parseInt(event.target.value) || 1
  const id = item.id || item.productId
  cartStore.updateQuantity(id, newQuantity, item.variantId)
}

const removeItem = (item) => {
  const id = item.id || item.productId
  const itemName = item.title || item.name
  cartStore.removeItem(id, item.variantId)
  toastStore.success(`${itemName} removed from cart`)
}

// Cart calculations
const hasPhysicalItems = computed(() => {
  return cartStore.items.some(item =>
    item.type === 'product_physical' ||
    item.type === 'subscription' ||
    !item.type // Legacy items without type are assumed physical
  )
})

const shipping = computed(() => {
  // £5 flat rate for physical items, free for digital/events
  return hasPhysicalItems.value ? 5.00 : 0
})

const total = computed(() => {
  return cartStore.subtotal + shipping.value
})

// Navigation
const goToCheckout = () => {
  router.push('/checkout')
}

// Date formatting for events
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
/* Remove number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
