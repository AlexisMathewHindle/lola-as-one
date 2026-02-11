<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="animate-pulse">
        <div class="h-8 bg-gray-200 rounded w-32 mb-8"></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="aspect-square bg-gray-200 rounded-xl"></div>
          <div class="space-y-4">
            <div class="h-10 bg-gray-200 rounded w-3/4"></div>
            <div class="h-6 bg-gray-200 rounded w-1/2"></div>
            <div class="h-20 bg-gray-200 rounded"></div>
            <div class="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center mb-2">
          <font-awesome-icon icon="exclamation-circle" class="w-5 h-5 text-red-600 mr-2" />
          <h3 class="text-lg font-semibold text-red-900">Error Loading Box</h3>
        </div>
        <p class="text-red-700 mb-4">{{ error }}</p>
        <router-link
          to="/boxes"
          class="inline-flex items-center text-red-700 hover:text-red-900 font-medium"
        >
          <font-awesome-icon icon="arrow-left" class="w-4 h-4 mr-2" />
          Back to Boxes
        </router-link>
      </div>
    </div>

    <!-- Box Detail Content -->
    <div v-else-if="box" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Breadcrumb -->
      <nav class="mb-6 sm:mb-8">
        <router-link
          to="/boxes"
          class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <font-awesome-icon icon="arrow-left" class="w-4 h-4 mr-2" />
          Back to Boxes
        </router-link>
      </nav>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        <!-- Left Column: Product Image -->
        <div class="space-y-4">
          <!-- Main Image -->
          <div class="aspect-square bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <img
              v-if="box.offering.featured_image_url"
              :src="box.offering.featured_image_url"
              :alt="box.offering.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <font-awesome-icon icon="box" class="w-32 h-32 text-primary-400" />
            </div>

            <!-- Subscription Badge -->
            <div v-if="box.available_for_subscription" class="absolute top-4 left-4">
              <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-600 text-white shadow-lg">
                <font-awesome-icon icon="calendar-check" class="w-4 h-4 mr-2" />
                Subscription Available
              </span>
            </div>
          </div>
        </div>

        <!-- Right Column: Product Info & Purchase -->
        <div class="space-y-6">
          <!-- Title & Price -->
          <div>
            <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3">
              {{ box.offering.title }}
            </h1>
            <p class="text-lg text-gray-600 mb-4">
              {{ box.offering.description_short }}
            </p>

            <!-- Stock Status Badge -->
            <div class="mb-4">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :class="stockStatusBadgeClass"
              >
                <font-awesome-icon :icon="stockStatusIcon" class="w-4 h-4 mr-1" />
                {{ stockStatusText }}
              </span>
            </div>

            <!-- Price Display -->
            <div class="mb-6">
              <div v-if="!purchaseMode || purchaseMode === 'one-time'">
                <span class="text-4xl font-bold text-gray-900">
                  £{{ formatPrice(box.price_gbp) }}
                </span>
                <span class="text-lg text-gray-500 ml-2">one-time</span>
              </div>
              <div v-else-if="purchaseMode === 'subscription'">
                <span class="text-4xl font-bold text-gray-900">
                  £{{ formatPrice(box.price_gbp) }}
                </span>
                <span class="text-lg text-gray-500 ml-2">/month</span>
              </div>
            </div>
          </div>

          <!-- Purchase Mode Toggle (if subscription available) -->
          <div v-if="box.available_for_subscription" class="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-3">Purchase Option</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="purchaseMode = 'one-time'"
                class="px-4 py-3 rounded-lg font-medium transition-all"
                :class="purchaseMode === 'one-time'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-300'"
              >
                <div class="text-sm">One-Time</div>
                <div class="text-xs opacity-75">£{{ formatPrice(box.price_gbp) }}</div>
              </button>
              <button
                @click="purchaseMode = 'subscription'"
                class="px-4 py-3 rounded-lg font-medium transition-all"
                :class="purchaseMode === 'subscription'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-300'"
              >
                <div class="text-sm">Subscription</div>
                <div class="text-xs opacity-75">£{{ formatPrice(box.price_gbp) }}/mo</div>
              </button>
            </div>

            <!-- Subscription Benefits -->
            <div v-if="purchaseMode === 'subscription'" class="mt-4 space-y-2">
              <p class="text-sm font-medium text-gray-700">Subscription Benefits:</p>
              <ul class="text-sm text-gray-600 space-y-1">
                <li class="flex items-start">
                  <font-awesome-icon icon="check-circle" class="w-4 h-4 text-success-500 mr-2 mt-0.5" />
                  Monthly delivery of curated art supplies
                </li>
                <li class="flex items-start">
                  <font-awesome-icon icon="check-circle" class="w-4 h-4 text-success-500 mr-2 mt-0.5" />
                  Cancel anytime, no commitment
                </li>
                <li class="flex items-start">
                  <font-awesome-icon icon="check-circle" class="w-4 h-4 text-success-500 mr-2 mt-0.5" />
                  Exclusive subscriber-only projects
                </li>
              </ul>
            </div>
          </div>

          <!-- Quantity Selector (for one-time purchase only) -->
          <div v-if="!isOutOfStock && purchaseMode === 'one-time'" class="bg-white rounded-xl p-4 border border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-3">Quantity</label>
            <div class="flex items-center space-x-4">
              <button
                @click="decrementQuantity"
                :disabled="quantity <= 1"
                class="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <font-awesome-icon icon="chevron-down" class="w-4 h-4 text-gray-600" />
              </button>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                :max="maxQuantity"
                class="w-20 text-center text-lg font-semibold border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                @click="incrementQuantity"
                :disabled="quantity >= maxQuantity"
                class="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <font-awesome-icon icon="chevron-up" class="w-4 h-4 text-gray-600" />
              </button>
              <span class="text-sm text-gray-500">
                ({{ maxQuantity }} available)
              </span>
            </div>
          </div>

          <!-- Total Price (for one-time purchase) -->
          <div v-if="purchaseMode === 'one-time' && !isOutOfStock" class="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div class="flex items-center justify-between">
              <span class="text-lg font-medium text-gray-700">Total:</span>
              <span class="text-2xl font-bold text-gray-900">
                £{{ formatPrice(totalPrice) }}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Includes VAT. Shipping calculated at checkout.
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <!-- Add to Cart / Subscribe Button -->
            <button
              v-if="!isOutOfStock"
              @click="handlePurchase"
              :disabled="addingToCart"
              class="w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
              :class="purchaseMode === 'subscription'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-primary-600 text-white hover:bg-primary-700'"
            >
              <font-awesome-icon
                v-if="addingToCart"
                icon="spinner"
                class="w-5 h-5 mr-2 animate-spin"
              />
              <font-awesome-icon
                v-else
                :icon="purchaseMode === 'subscription' ? 'calendar-check' : 'shopping-cart'"
                class="w-5 h-5 mr-2"
              />
              {{ purchaseMode === 'subscription' ? 'Subscribe Now' : 'Add to Cart' }}
            </button>

            <!-- Join Waitlist Button -->
            <button
              v-else-if="box.waitlist_enabled"
              @click="handleJoinWaitlist"
              class="w-full py-4 px-6 bg-gray-600 text-white rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <font-awesome-icon icon="bell" class="w-5 h-5 mr-2" />
              Join Waitlist
            </button>

            <!-- Out of Stock (no waitlist) -->
            <button
              v-else
              disabled
              class="w-full py-4 px-6 bg-gray-300 text-gray-500 rounded-lg font-semibold text-lg cursor-not-allowed flex items-center justify-center"
            >
              <font-awesome-icon icon="times-circle" class="w-5 h-5 mr-2" />
              Out of Stock
            </button>
          </div>

          <!-- Product Details Grid -->
          <div class="bg-white rounded-xl p-6 border border-gray-200 space-y-3">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">SKU:</span>
                <span class="ml-2 font-medium text-gray-900">{{ box.sku }}</span>
              </div>
              <div>
                <span class="text-gray-500">Stock:</span>
                <span class="ml-2 font-medium text-gray-900">
                  {{ box.track_inventory ? `${actualInventory} units` : 'Unlimited' }}
                </span>
              </div>
              <div v-if="box.weight_grams">
                <span class="text-gray-500">Weight:</span>
                <span class="ml-2 font-medium text-gray-900">{{ formatWeight(box.weight_grams) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Shipping:</span>
                <span class="ml-2 font-medium text-gray-900">
                  {{ box.requires_shipping ? 'Required' : 'Not required' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-12">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">About This Box</h2>
        <div class="prose max-w-none text-gray-700" v-html="formattedDescription"></div>
      </div>

      <!-- Related Products -->
      <div v-if="relatedBoxes.length > 0" class="mb-12">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">You May Also Like</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="relatedBox in relatedBoxes"
            :key="relatedBox.id"
            @click="goToBox(relatedBox.offering.slug)"
            class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <!-- Product Image -->
            <div class="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                v-if="relatedBox.offering.featured_image_url"
                :src="relatedBox.offering.featured_image_url"
                :alt="relatedBox.offering.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                <font-awesome-icon icon="box" class="w-16 h-16 text-primary-400" />
              </div>
            </div>

            <!-- Product Info -->
            <div class="p-4">
              <h3 class="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                {{ relatedBox.offering.title }}
              </h3>
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold text-gray-900">
                  £{{ formatPrice(relatedBox.price_gbp) }}
                </span>
                <span v-if="relatedBox.available_for_subscription" class="text-xs text-gray-500">
                  /month
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Waitlist Modal -->
    <JoinProductWaitlistModal
      v-model="showWaitlistModal"
      :product-id="box?.id"
      :product-title="box?.offering?.title || ''"
      @success="handleWaitlistSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import JoinProductWaitlistModal from '../components/JoinProductWaitlistModal.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toastStore = useToastStore()

// State
const box = ref(null)
const relatedBoxes = ref([])
const loading = ref(true)
const error = ref(null)
const purchaseMode = ref('one-time') // 'one-time' or 'subscription'
const quantity = ref(1)
const addingToCart = ref(false)
const showWaitlistModal = ref(false)

// Fetch box details
const fetchBox = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('offering_products')
      .select(`
        *,
        offering:offerings!inner(*),
        inventory:inventory_items!offering_product_id(quantity_available, quantity_reserved)
      `)
      .eq('offering.slug', route.params.slug)
      .in('offering.type', ['product_physical', 'subscription'])
      .eq('offering.status', 'published')
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Box not found')
      }
      throw fetchError
    }

    box.value = data

    // Set default purchase mode based on subscription availability
    if (data.available_for_subscription) {
      purchaseMode.value = 'subscription'
    }

    await fetchRelatedBoxes()
  } catch (err) {
    console.error('Error fetching box:', err)
    error.value = err.message || 'Failed to load box details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch related boxes
const fetchRelatedBoxes = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('offering_products')
      .select(`
        *,
        offering:offerings!inner(*)
      `)
      .eq('offering.type', 'product_physical')
      .eq('offering.status', 'published')
      .neq('id', box.value.id)
      .order('created_at', { ascending: false })
      .limit(4)

    if (fetchError) throw fetchError

    relatedBoxes.value = data || []
  } catch (err) {
    console.error('Error fetching related boxes:', err)
    // Don't show error for related boxes, just log it
  }
}

// Computed: Get actual inventory quantity
const actualInventory = computed(() => {
  if (!box.value) return 0

  // Debug logging
  console.log('📦 actualInventory computed:', {
    hasInventory: !!box.value.inventory,
    inventoryLength: box.value.inventory?.length,
    inventoryData: box.value.inventory,
    stock_quantity: box.value.stock_quantity
  })

  // Use inventory_items quantity if available, otherwise fall back to stock_quantity
  if (box.value.inventory && box.value.inventory.length > 0) {
    const qty = box.value.inventory[0].quantity_available || 0
    console.log('✅ Using inventory.quantity_available:', qty)
    return qty
  }

  console.log('⚠️ Falling back to stock_quantity:', box.value.stock_quantity)
  return box.value.stock_quantity || 0
})

// Computed: Stock status
const isOutOfStock = computed(() => {
  if (!box.value) return false
  if (!box.value.track_inventory) return false
  return actualInventory.value === 0
})

const stockStatus = computed(() => {
  if (!box.value) return 'in-stock'
  if (!box.value.track_inventory) return 'in-stock'

  const qty = actualInventory.value

  console.log('🎯 stockStatus computed:', {
    qty,
    qtyType: typeof qty,
    low_stock_threshold: box.value.low_stock_threshold,
    thresholdType: typeof box.value.low_stock_threshold,
    track_inventory: box.value.track_inventory,
    comparison: qty <= box.value.low_stock_threshold
  })

  if (qty === 0) {
    console.log('❌ Status: out-of-stock')
    return 'out-of-stock'
  } else if (qty <= box.value.low_stock_threshold) {
    console.log('⚠️ Status: low-stock')
    return 'low-stock'
  }
  console.log('✅ Status: in-stock')
  return 'in-stock'
})

const stockStatusText = computed(() => {
  if (!box.value) return ''

  const status = stockStatus.value
  const qty = actualInventory.value

  if (status === 'out-of-stock') {
    return 'Out of Stock'
  } else if (status === 'low-stock') {
    return `Only ${qty} left in stock`
  }
  return 'In Stock'
})

const stockStatusBadgeClass = computed(() => {
  const status = stockStatus.value

  if (status === 'out-of-stock') {
    return 'bg-red-500 text-white'
  } else if (status === 'low-stock') {
    return 'bg-warning-500 text-white'
  }
  return 'bg-success-500 text-white'
})

const stockStatusIcon = computed(() => {
  const status = stockStatus.value

  if (status === 'out-of-stock') {
    return 'times-circle'
  } else if (status === 'low-stock') {
    return 'exclamation-circle'
  }
  return 'check-circle'
})

// Computed: Max quantity
const maxQuantity = computed(() => {
  if (!box.value || !box.value.track_inventory) return 10
  return Math.min(10, actualInventory.value)
})

// Computed: Total price
const totalPrice = computed(() => {
  if (!box.value) return 0
  return box.value.price_gbp * quantity.value
})

// Computed: Formatted description
const formattedDescription = computed(() => {
  if (!box.value || !box.value.offering.description_long) {
    return '<p>No description available.</p>'
  }

  // Convert line breaks to paragraphs
  const paragraphs = box.value.offering.description_long
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('')

  return paragraphs || '<p>No description available.</p>'
})

// Helper: Format price
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

// Helper: Format weight
const formatWeight = (grams) => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`
  }
  return `${grams} g`
}

// Quantity controls
const incrementQuantity = () => {
  if (quantity.value < maxQuantity.value) {
    quantity.value++
  }
}

const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// Navigate to box detail page
const goToBox = (boxSlug) => {
  router.push(`/boxes/${boxSlug}`)
}

  // Handle purchase (add to cart or subscribe)
  const handlePurchase = async () => {
    if (!box.value) return

    if (purchaseMode.value === 'subscription') {
      // Start subscription checkout via Supabase Edge Function
      const emailInput = window.prompt('Please enter your email address to start your subscription:')

      const email = emailInput ? emailInput.trim() : ''
      if (!email) {
        // User cancelled or left blank
        return
      }

      // Basic email validation (same pattern as Checkout.vue)
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(email)) {
        toastStore.error('Please enter a valid email address.')
        return
      }

      try {
        addingToCart.value = true

        const { data, error } = await supabase.functions.invoke('create-subscription-checkout-session', {
          body: {
            offeringSlug: box.value.offering.slug,
            customer: {
              email
            }
          }
        })

        if (error) {
          console.error('Error creating subscription checkout session:', error)
          throw error
        }

        if (!data || !data.url) {
          throw new Error('No checkout URL returned from subscription checkout function')
        }

        // Redirect to Stripe Checkout for subscription
        window.location.href = data.url
      } catch (err) {
        console.error('Subscription checkout error:', err)
        toastStore.error('Failed to start subscription checkout. Please try again.')
      } finally {
        addingToCart.value = false
      }
    } else {
      // Add to cart (one-time purchase)
      try {
        addingToCart.value = true

        // Add to cart store
        cartStore.addItem({
          id: box.value.offering.id,
          type: box.value.offering.type === 'subscription' ? 'subscription' : 'product_physical',
          title: box.value.offering.title,
          price: box.value.price_gbp,
          quantity: quantity.value,
          image: box.value.offering.featured_image_url,
          slug: box.value.offering.slug
        }, quantity.value)

        // Reset quantity
        quantity.value = 1
      } catch (err) {
        console.error('Error adding to cart:', err)
        toastStore.error('Failed to add to cart. Please try again.')
      } finally {
        addingToCart.value = false
      }
    }
  }

// Handle join waitlist
const handleJoinWaitlist = () => {
  showWaitlistModal.value = true
}

// Handle waitlist success
const handleWaitlistSuccess = async (data) => {
  console.log('Successfully joined product waitlist:', data)
  // Could refresh product data here if needed
}

// Watch for route changes to refetch box data
watch(() => route.params.slug, () => {
  fetchBox()
})

// Lifecycle
onMounted(() => {
  fetchBox()
})
</script>

