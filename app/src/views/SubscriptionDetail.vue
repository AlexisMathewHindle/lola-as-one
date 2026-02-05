<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div v-if="loading" class="text-center py-16">
        <p class="text-gray-600">Loading subscription...</p>
      </div>

      <div
        v-else-if="error"
        class="max-w-xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
      >
        <p class="font-semibold mb-1">Unable to load subscription</p>
        <p class="text-sm">{{ error }}</p>
      </div>

      <div v-else-if="!subscriptionOffering" class="text-center py-16">
        <p class="text-gray-600">Subscription not found.</p>
      </div>

      <div v-else class="space-y-8">
        <!-- Plan header -->
        <div class="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-6">
          <div class="md:w-1/3">
            <img
              v-if="subscriptionOffering.featured_image_url"
              :src="subscriptionOffering.featured_image_url"
              :alt="subscriptionOffering.title"
              class="w-full rounded-lg object-cover"
            />
            <div
              v-else
              class="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm"
            >
              No image
            </div>
          </div>

          <div class="md:w-2/3 space-y-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ subscriptionOffering.title }}</h1>
              <p v-if="subscriptionOffering.description_short" class="mt-2 text-gray-700">
                {{ subscriptionOffering.description_short }}
              </p>
            </div>

            <div v-if="subscriptionProduct" class="text-lg font-semibold text-gray-900">
              £{{ priceDisplay }}
              <span class="text-sm font-normal text-gray-500">per {{ billingInterval }}</span>
            </div>

            <div class="text-sm text-gray-600">
              Select up to
              <span class="font-semibold">{{ maxBoxes }}</span>
              boxes from the curated list below.
            </div>
          </div>
        </div>

        <!-- Box selection -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">Choose your boxes</h2>

          <div
            v-if="curatedBoxes.length === 0"
            class="bg-white rounded-lg shadow p-6 text-gray-600"
          >
            No boxes are currently configured for this subscription.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              v-for="box in curatedBoxes"
              :key="box.id"
              type="button"
              class="relative text-left bg-white rounded-lg shadow hover:shadow-md transition p-4 border"
              :class="{
                'border-primary-500 ring-2 ring-primary-200': isBoxSelected(box.offering_product.id)
              }"
              @click="toggleBoxSelection(box.offering_product.id)"
            >
              <div class="aspect-video mb-3">
                <img
                  v-if="box.offering_product.offering?.featured_image_url"
                  :src="box.offering_product.offering.featured_image_url"
                  :alt="box.offering_product.offering?.title"
                  class="w-full h-full object-cover rounded-md"
                />
                <div
                  v-else
                  class="w-full h-full bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs"
                >
                  No image
                </div>
              </div>

              <div class="space-y-1">
                <h3 class="text-sm font-semibold text-gray-900 truncate">
                  {{ box.offering_product.offering?.title || 'Box' }}
                </h3>
                <p class="text-sm text-gray-600">
                  £{{ formatPrice(box.offering_product.price_gbp) }}
                </p>
              </div>

              <div class="absolute top-2 right-2">
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full border"
                  :class="
                    isBoxSelected(box.offering_product.id)
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  "
                >
                  ✓
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-lg shadow p-6 space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">Selected boxes</span>
            <span class="font-semibold">{{ selectedCount }} / {{ maxBoxes }}</span>
          </div>

          <p v-if="selectionError" class="text-sm text-red-600">
            {{ selectionError }}
          </p>

          <!-- Suggestions when some selections are unavailable -->
          <div
            v-if="selectionError && suggestions.length > 0"
            class="mt-2 border-t border-gray-200 pt-3"
          >
            <p class="text-sm text-gray-700 mb-2 font-medium">
              Try one of these boxes instead:
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in suggestions"
                :key="s.offering_product_id"
                type="button"
                class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 hover:bg-primary-50 text-gray-800 border border-gray-200 hover:border-primary-200 transition"
                @click="handleSuggestionClick(s.offering_product_id)"
              >
                <span class="truncate max-w-[10rem]">
                  {{ s.title || 'Suggested box' }}
                </span>
              </button>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex items-center px-6 py-3 rounded-md text-white font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="!canSubscribe"
              @click="handleSubscribe"
            >
              {{ subscribing ? 'Adding...' : 'Subscribe' }}
            </button>
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

const loading = ref(true)
const error = ref(null)
const subscriptionOffering = ref(null)
const subscriptionProduct = ref(null)
const curatedBoxes = ref([])
const selectedBoxProductIds = ref([])
const selectionError = ref(null)
const subscribing = ref(false)
const suggestions = ref([])
const lastUnavailableIds = ref([])

const maxBoxes = computed(() => {
  const metadata = subscriptionOffering.value?.metadata || {}
  if (typeof metadata.max_boxes === 'number' && metadata.max_boxes > 0) return metadata.max_boxes
  const title = (subscriptionOffering.value?.title || '').toLowerCase()
  const slug = (subscriptionOffering.value?.slug || '').toLowerCase()
  const source = `${title} ${slug}`
  if (source.includes('3-month') || source.includes('3 month')) return 3
  if (source.includes('6-month') || source.includes('6 month')) return 6
  if (source.includes('every-other-month') || source.includes('every other month')) return 6
  return 3
})

const billingInterval = computed(() => {
  const metadata = subscriptionOffering.value?.metadata || {}
  return metadata.billing_interval || 'month'
})

const selectedCount = computed(() => selectedBoxProductIds.value.length)

const canSubscribe = computed(
  () =>
    !loading.value &&
    !subscribing.value &&
    selectedCount.value > 0 &&
    selectedCount.value <= maxBoxes.value &&
    !!subscriptionProduct.value
)

const priceDisplay = computed(() => {
  if (!subscriptionProduct.value) return '0.00'
  const price = parseFloat(subscriptionProduct.value.price_gbp || 0)
  return price.toFixed(2)
})

const derivePlanLabel = () => {
  const metadata = subscriptionOffering.value?.metadata || {}
  if (metadata.plan_label) return metadata.plan_label
  const title = (subscriptionOffering.value?.title || '').toLowerCase()
  const slug = (subscriptionOffering.value?.slug || '').toLowerCase()
  const source = `${title} ${slug}`
  if (source.includes('3-month') || source.includes('3 month')) return '3-month'
  if (source.includes('6-month') || source.includes('6 month')) return '6-month'
  if (source.includes('every-other-month') || source.includes('every other month')) return 'every-other-month'
  return 'subscription'
}

const isBoxSelected = (productId) => selectedBoxProductIds.value.includes(productId)

const toggleBoxSelection = (productId) => {
  selectionError.value = null
  suggestions.value = []
  if (isBoxSelected(productId)) {
    selectedBoxProductIds.value = selectedBoxProductIds.value.filter((id) => id !== productId)
    return
  }
  if (selectedCount.value >= maxBoxes.value) {
    selectionError.value = `You can select up to ${maxBoxes.value} boxes for this plan.`
    return
  }
  selectedBoxProductIds.value = [...selectedBoxProductIds.value, productId]
}

const formatPrice = (value) => {
  const num = parseFloat(value || 0)
  return num.toFixed(2)
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = null
    const slug = route.params.slug

    const { data: offering, error: offeringError } = await supabase
      .from('offerings')
      .select('*')
      .eq('slug', slug)
      .eq('type', 'subscription')
      .eq('status', 'published')
      .single()

    if (offeringError) throw offeringError
    if (!offering) throw new Error('Subscription not found')

    subscriptionOffering.value = offering

    const { data: product, error: productError } = await supabase
      .from('offering_products')
      .select('*')
      .eq('offering_id', offering.id)
      .single()

    if (productError && productError.code !== 'PGRST116') throw productError
    subscriptionProduct.value = product || null

    const { data: planBoxes, error: boxesError } = await supabase
      .from('subscription_plan_boxes')
      .select(
        `
        id,
        offering_product:offering_products(
          id,
          sku,
          price_gbp,
          track_inventory,
          stock_quantity,
          available_for_subscription,
          offering:offerings(
            id,
            slug,
            title,
            description_short,
            featured_image_url,
            status
          )
        )
      `
      )
      .eq('subscription_offering_id', offering.id)

    if (boxesError) throw boxesError
    curatedBoxes.value = (planBoxes || []).filter(
      (pb) => pb.offering_product?.offering?.status === 'published'
    )
  } catch (err) {
    console.error('Error loading subscription detail:', err)
    error.value = err.message || 'Failed to load subscription'
  } finally {
    loading.value = false
  }
}

const handleSubscribe = async () => {
  if (!subscriptionOffering.value || !subscriptionProduct.value) return
  if (selectedCount.value === 0) {
    selectionError.value = 'Please select at least one box.'
    return
  }
  if (selectedCount.value > maxBoxes.value) {
    selectionError.value = `You can select up to ${maxBoxes.value} boxes for this plan.`
    return
  }

  try {
    subscribing.value = true
    selectionError.value = null
    suggestions.value = []
    lastUnavailableIds.value = []

    // Server-side availability check for selected boxes
    const { data, error: validateError } = await supabase.functions.invoke(
      'validate-subscription-boxes',
      {
        body: {
          subscription_offering_id: subscriptionOffering.value.id,
          selected_box_product_ids: [...selectedBoxProductIds.value],
        },
      },
    )

    if (validateError) {
      console.error('Error validating subscription selection:', validateError)
      selectionError.value =
        validateError.message ||
        'Could not validate your selection. Please try again.'
      return
    }

    if (!data?.allAvailable) {
      const unavailable = data?.unavailable || []
      const names = unavailable
        .map((u) => u.title)
        .filter((name) => !!name)

      suggestions.value = data?.suggestions || []
      lastUnavailableIds.value = unavailable
        .map((u) => u.offering_product_id)
        .filter((id) => !!id)

      if (names.length > 0) {
        selectionError.value =
          `Some selected boxes are no longer available: ${names.join(', ')}. ` +
          'Please adjust your selection.'
      } else {
        selectionError.value =
          'Some selected boxes are no longer available. Please adjust your selection.'
      }
      return
    }

    const product = {
      id: subscriptionProduct.value.id,
      productId: subscriptionProduct.value.id,
      title: subscriptionOffering.value.title,
      name: subscriptionOffering.value.title,
      price: parseFloat(subscriptionProduct.value.price_gbp || 0),
      image: subscriptionOffering.value.featured_image_url || null,
      type: 'subscription',
      slug: subscriptionOffering.value.slug,
      subscriptionConfig: {
        subscription_offering_id: subscriptionOffering.value.id,
        plan_label: derivePlanLabel(),
        max_boxes: maxBoxes.value,
        selected_box_product_ids: [...selectedBoxProductIds.value]
      }
    }

    cartStore.addItem(product, 1, null)
    router.push('/cart')
  } catch (err) {
    console.error('Error adding subscription to cart:', err)
    selectionError.value =
      err.message || 'Could not add subscription to cart. Please try again.'
  } finally {
    subscribing.value = false
  }
}

const handleSuggestionClick = (productId) => {
  // If the suggestion is already selected, do nothing
  if (isBoxSelected(productId)) return

  // If we're already at max, try swapping out an unavailable selection
  if (selectedCount.value >= maxBoxes.value) {
    const toRemove = lastUnavailableIds.value.find((id) =>
      selectedBoxProductIds.value.includes(id)
    )

    if (toRemove) {
      const next = selectedBoxProductIds.value.filter((id) => id !== toRemove)
      next.push(productId)
      selectedBoxProductIds.value = next
      // Successful swap: clear the existing error message
      selectionError.value = null
      return
    }

    // No unavailable selection left to swap; enforce max rule
    selectionError.value = `You can select up to ${maxBoxes.value} boxes for this plan.`
    return
  }

  // Below max: just add the suggested box
  selectedBoxProductIds.value = [...selectedBoxProductIds.value, productId]
}

onMounted(loadData)
</script>
