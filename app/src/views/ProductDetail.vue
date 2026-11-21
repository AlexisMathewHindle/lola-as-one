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
          <h3 class="text-lg font-semibold text-red-900">Error Loading Product</h3>
        </div>
        <p class="text-red-700 mb-4">{{ error }}</p>
        <router-link
          to="/shop"
          class="inline-flex items-center text-red-700 hover:text-red-900 font-medium"
        >
          <font-awesome-icon icon="arrow-left" class="w-4 h-4 mr-2" />
          Back to Shop
        </router-link>
      </div>
    </div>

    <!-- Product Detail Content -->
    <div v-else-if="product" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Breadcrumb -->
      <nav class="mb-6 sm:mb-8">
        <router-link
          to="/shop"
          class="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <font-awesome-icon icon="arrow-left" class="w-4 h-4 mr-2" />
          Back to Shop
        </router-link>
      </nav>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        <!-- Left Column: Product Image -->
        <div class="space-y-4">
          <!-- Main Image -->
          <div class="aspect-square bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <img
              v-if="product.offering.featured_image_url"
              :src="product.offering.featured_image_url"
              :alt="product.offering.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
              <font-awesome-icon :icon="productTypeIcon" class="w-32 h-32 text-purple-400" />
            </div>

            <!-- Product Type Badge -->
            <div class="absolute top-4 left-4">
              <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-600 text-white shadow-lg">
                <font-awesome-icon :icon="productTypeIcon" class="w-4 h-4 mr-2" />
                {{ productTypeBadgeText }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right Column: Product Info & Purchase -->
        <div class="space-y-6">
          <!-- Title & Price -->
          <div>
            <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3">
              {{ product.offering.title }}
            </h1>
            <p class="text-lg text-gray-600 mb-4">
              {{ product.offering.description_short }}
            </p>

            <!-- Price Display -->
            <div class="mb-6">
              <div class="flex items-baseline gap-2">
                <span class="text-4xl font-bold text-gray-900">
                  £{{ displayPrice.toFixed(2) }}
                </span>
                <span class="text-sm text-gray-500">(inc. VAT)</span>
              </div>
            </div>
          </div>

          <!-- File Information (for downloads) -->
          <div v-if="product.product_type === 'download' && product.file_url" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-purple-900 mb-3 flex items-center">
              <font-awesome-icon icon="download" class="w-4 h-4 mr-2" />
              Download Information
            </h3>
            <div class="space-y-2 text-sm text-purple-800">
              <div v-if="product.file_type" class="flex items-center">
                <span class="font-medium w-24">File Type:</span>
                <span class="uppercase">{{ product.file_type }}</span>
              </div>
              <div v-if="product.file_size_bytes" class="flex items-center">
                <span class="font-medium w-24">File Size:</span>
                <span>{{ formatFileSize(product.file_size_bytes) }}</span>
              </div>
              <div v-if="product.download_limit" class="flex items-center">
                <span class="font-medium w-24">Downloads:</span>
                <span>{{ product.download_limit }} download{{ product.download_limit > 1 ? 's' : '' }} allowed</span>
              </div>
              <div v-if="product.download_expiry_days" class="flex items-center">
                <span class="font-medium w-24">Access:</span>
                <span>{{ product.download_expiry_days }} days after purchase</span>
              </div>
              <div v-else class="flex items-center">
                <span class="font-medium w-24">Access:</span>
                <span>Lifetime access</span>
              </div>
            </div>
          </div>

          <!-- Gift Card Information -->
          <div v-if="product.product_type === 'gift_card'" class="bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-5">
            <div>
              <h3 class="text-sm font-semibold text-primary-900 mb-2 flex items-center">
                <font-awesome-icon icon="heart" class="w-4 h-4 mr-2" />
                Gift Card Details
              </h3>
              <p class="text-sm text-primary-800">
                This gift card can be used for any workshop, box, or product on our site. The recipient will receive a unique code by email.
              </p>
            </div>

            <!-- Choose amount -->
            <div v-if="denominations.length > 0">
              <label class="block text-sm font-semibold text-primary-900 mb-2">Choose an amount</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="denom in denominations"
                  :key="denom.id"
                  type="button"
                  @click="selectedDenominationId = denom.id"
                  :class="[
                    'px-4 py-2 rounded-lg border text-sm font-semibold transition-colors',
                    selectedDenominationId === denom.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-primary-800 border-primary-300 hover:border-primary-500'
                  ]"
                >
                  £{{ denom.amount_gbp.toFixed(2) }}
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-primary-800 italic">
              Gift cards are not available to buy just now. Please check back soon.
            </p>

            <!-- Recipient details (optional) -->
            <div v-if="denominations.length > 0" class="space-y-3">
              <div>
                <label for="gift-recipient-name" class="block text-sm font-medium text-primary-900 mb-1">
                  Recipient's name <span class="text-primary-500 font-normal">(optional)</span>
                </label>
                <input
                  id="gift-recipient-name"
                  v-model="giftRecipientName"
                  type="text"
                  maxlength="120"
                  placeholder="e.g. Sam"
                  class="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
              </div>
              <div>
                <label for="gift-recipient-email" class="block text-sm font-medium text-primary-900 mb-1">
                  Send the card to their email <span class="text-primary-500 font-normal">(optional)</span>
                </label>
                <input
                  id="gift-recipient-email"
                  v-model="giftRecipientEmail"
                  type="email"
                  maxlength="200"
                  placeholder="their@email.com"
                  class="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                <p class="text-xs text-primary-700 mt-1">
                  Leave blank to have the card sent to you, so you can pass it on yourself.
                </p>
              </div>
              <div>
                <label for="gift-message" class="block text-sm font-medium text-primary-900 mb-1">
                  Personal message <span class="text-primary-500 font-normal">(optional)</span>
                </label>
                <textarea
                  id="gift-message"
                  v-model="giftMessage"
                  rows="3"
                  maxlength="500"
                  placeholder="Add a message to show in the gift email"
                  class="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
            </div>

            <p v-if="giftError" class="text-sm text-red-600">{{ giftError }}</p>
          </div>

          <!-- Instant Delivery Notice -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start">
              <font-awesome-icon icon="check-circle" class="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <h3 class="text-sm font-semibold text-green-900 mb-1">Instant Digital Delivery</h3>
                <p class="text-sm text-green-800">
                  {{ product.product_type === 'gift_card'
                    ? 'Gift card code will be sent to your email immediately after purchase.'
                    : 'Download link will be sent to your email immediately after purchase.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Add to Cart Button -->
          <div class="space-y-3">
            <button
              @click="addToCart"
              :disabled="isGiftCard && denominations.length === 0"
              class="w-full bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <font-awesome-icon icon="shopping-cart" class="w-5 h-5 mr-2" />
              Add to Cart - £{{ displayPrice.toFixed(2) }}
            </button>
            <p class="text-xs text-center text-gray-500">
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </div>

      <!-- Product Details Section -->
      <div class="mb-12">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">Product Details</h2>

          <!-- Description -->
          <div v-if="product.offering.description_long" class="prose prose-lg max-w-none mb-8">
            <div v-html="formatDescription(product.offering.description_long)"></div>
          </div>

          <!-- Product Info Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div class="flex items-start">
              <font-awesome-icon icon="tag" class="w-5 h-5 text-gray-400 mr-3 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-500">Product Type</div>
                <div class="text-base text-gray-900">{{ productTypeBadgeText }}</div>
              </div>
            </div>

            <div class="flex items-start">
              <font-awesome-icon icon="pound-sign" class="w-5 h-5 text-gray-400 mr-3 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-500">Price</div>
                <div class="text-base text-gray-900">£{{ displayPrice.toFixed(2) }} (inc. VAT)</div>
              </div>
            </div>

            <div v-if="product.product_type === 'download'" class="flex items-start">
              <font-awesome-icon icon="download" class="w-5 h-5 text-gray-400 mr-3 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-500">Delivery</div>
                <div class="text-base text-gray-900">Instant Download</div>
              </div>
            </div>

            <div v-if="product.product_type === 'gift_card'" class="flex items-start">
              <font-awesome-icon icon="envelope" class="w-5 h-5 text-gray-400 mr-3 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-500">Delivery</div>
                <div class="text-base text-gray-900">Email Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products Section -->
      <div v-if="relatedProducts.length > 0" class="mb-12">
        <h2 class="text-2xl font-display font-bold text-gray-900 mb-6">You May Also Like</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="related in relatedProducts"
            :key="related.id"
            @click="goToProduct(related)"
            class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <!-- Product Image -->
            <div class="aspect-square bg-gray-100 relative">
              <img
                v-if="related.offering.featured_image_url"
                :src="related.offering.featured_image_url"
                :alt="related.offering.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                <font-awesome-icon :icon="getProductTypeIcon(related.product_type)" class="w-16 h-16 text-purple-400" />
              </div>

              <!-- Type Badge -->
              <div class="absolute top-2 left-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {{ getProductTypeBadgeText(related.product_type) }}
                </span>
              </div>
            </div>

            <!-- Product Info -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">
                {{ related.offering.title }}
              </h3>
              <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                {{ related.offering.description_short }}
              </p>
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold text-gray-900">
                  £{{ related.price_gbp.toFixed(2) }}
                </span>
                <span class="text-xs text-gray-500">
                  <font-awesome-icon :icon="getProductTypeIcon(related.product_type)" class="w-3 h-3 mr-1" />
                  {{ getProductTypeBadgeText(related.product_type) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

// State
const product = ref(null)
const relatedProducts = ref([])
const loading = ref(true)
const error = ref(null)

// Gift card state
const denominations = ref([])
const selectedDenominationId = ref(null)
const giftRecipientName = ref('')
const giftRecipientEmail = ref('')
const giftMessage = ref('')
const giftError = ref('')

const isGiftCard = computed(() => product.value?.product_type === 'gift_card')

const selectedDenomination = computed(() =>
  denominations.value.find((denom) => denom.id === selectedDenominationId.value) || null
)

// Price shown and charged: a gift card uses the chosen amount; everything else
// uses the product's own price.
const displayPrice = computed(() => {
  if (!product.value) return 0
  if (isGiftCard.value) return selectedDenomination.value ? Number(selectedDenomination.value.amount_gbp) : 0
  return Number(product.value.price_gbp) || 0
})

// Computed: Product type icon
const productTypeIcon = computed(() => {
  if (!product.value) return 'download'
  return product.value.product_type === 'gift_card' ? 'heart' : 'download'
})

// Computed: Product type badge text
const productTypeBadgeText = computed(() => {
  if (!product.value) return 'Digital Product'
  return product.value.product_type === 'gift_card' ? 'Gift Card' : 'Digital Download'
})

// Helper: Get product type icon
const getProductTypeIcon = (productType) => {
  return productType === 'gift_card' ? 'heart' : 'download'
}

// Helper: Get product type badge text
const getProductTypeBadgeText = (productType) => {
  return productType === 'gift_card' ? 'Gift Card' : 'Digital Download'
}

// Helper: Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  const mb = bytes / (1024 * 1024)
  if (mb < 1) {
    const kb = bytes / 1024
    return `${kb.toFixed(1)} KB`
  }
  return `${mb.toFixed(1)} MB`
}

// Helper: Format description (convert line breaks to paragraphs)
const formatDescription = (text) => {
  if (!text) return ''
  return text.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
}

// Fetch product details
const fetchProduct = async () => {
  try {
    loading.value = true
    error.value = null

    const slug = route.params.slug

    // Fetch digital product with offering data
    const { data, error: fetchError } = await supabase
      .from('offering_digital_products')
      .select(`
        *,
        offering:offerings!inner(*)
      `)
      .eq('offering.slug', slug)
      .eq('offering.type', 'product_digital')
      .eq('offering.status', 'published')
      .single()

    if (fetchError) throw fetchError
    if (!data) throw new Error('Product not found')

    product.value = data

    // For a gift card, load the amounts a customer can choose from
    if (data.product_type === 'gift_card') {
      const { data: denoms, error: denomError } = await supabase
        .from('gift_card_denominations')
        .select('id, amount_gbp, sort_order')
        .eq('offering_id', data.offering.id)
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('amount_gbp', { ascending: true })

      if (denomError) throw denomError

      denominations.value = (denoms || []).map((denom) => ({
        id: denom.id,
        amount_gbp: parseFloat(denom.amount_gbp)
      }))

      if (denominations.value.length > 0) {
        selectedDenominationId.value = denominations.value[0].id
      }
    }

    // Fetch related digital products (same type, exclude current)
    fetchRelatedProducts()
  } catch (err) {
    console.error('Error fetching product:', err)
    error.value = err.message === 'Product not found'
      ? 'Product not found. It may have been removed or is no longer available.'
      : 'Failed to load product. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch related products
const fetchRelatedProducts = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('offering_digital_products')
      .select(`
        *,
        offering:offerings!inner(*)
      `)
      .eq('offering.type', 'product_digital')
      .eq('offering.status', 'published')
      .neq('id', product.value.id)
      .limit(4)

    if (fetchError) throw fetchError

    relatedProducts.value = data || []
  } catch (err) {
    console.error('Error fetching related products:', err)
    // Don't show error for related products, just leave empty
  }
}

// Add to cart
const addToCart = () => {
  if (!product.value) return

  if (isGiftCard.value) {
    addGiftCardToCart()
    return
  }

  cartStore.addItem({
    id: product.value.offering.id,
    type: 'product_digital',
    title: product.value.offering.title,
    price: product.value.price_gbp,
    image: product.value.offering.featured_image_url,
    productType: product.value.product_type,
    slug: product.value.offering.slug
  }, 1)
}

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const addGiftCardToCart = () => {
  giftError.value = ''

  if (!selectedDenomination.value) {
    giftError.value = 'Please choose an amount.'
    return
  }

  const recipientEmail = giftRecipientEmail.value.trim()
  if (recipientEmail && !isValidEmail(recipientEmail)) {
    giftError.value = 'Please enter a valid recipient email, or leave it blank to receive the card yourself.'
    return
  }

  const amount = Number(selectedDenomination.value.amount_gbp)

  cartStore.addItem({
    id: product.value.offering.id,
    type: 'product_digital',
    title: `${product.value.offering.title} (£${amount.toFixed(2)})`,
    price: amount,
    image: product.value.offering.featured_image_url,
    productType: 'gift_card',
    slug: product.value.offering.slug,
    giftCard: {
      denominationId: selectedDenomination.value.id,
      amount,
      recipientName: giftRecipientName.value.trim() || null,
      recipientEmail: recipientEmail || null,
      personalMessage: giftMessage.value.trim() || null
    }
  }, 1, `gift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

  // Reset the gift inputs so a second card starts clean
  giftRecipientName.value = ''
  giftRecipientEmail.value = ''
  giftMessage.value = ''
}

// Navigate to product
const goToProduct = (relatedProduct) => {
  router.push(`/products/${relatedProduct.offering.slug}`)
  // Scroll to top and refetch
  window.scrollTo(0, 0)
  fetchProduct()
}

// Initialize
onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prose {
  color: #374151;
  line-height: 1.75;
}

.prose p {
  margin-bottom: 1.25em;
}

.prose p:last-child {
  margin-bottom: 0;
}
</style>

