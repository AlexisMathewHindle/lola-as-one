import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToastStore } from './toast'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const sessionId = ref(null)
  const toastStore = useToastStore()

  const itemCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0))

  function addItem(product, quantity = 1, variantId = null, attendees = null, options = {}) {
    // Handle both old and new product structures
    const productType = product.type || product.productType
    const eventId = product.event_id || null
    const offeringId = product.offering_id || product.id || product.productId || null
    const productId = productType === 'event' && eventId ? eventId : (product.id || product.productId)
    const productName = product.title || product.name
    const productPrice = product.price || product.price_gbp
    const productImage = product.image || product.image_url || product.featured_image_url
    const categoryLayout = product.categoryLayout || product.category_layout || product.layout_key || product.category?.layout_key || null
    const categorySlug = product.categorySlug || product.category_slug || product.category?.slug || null
    const categoryName = product.categoryName || product.category_name || product.category?.name || null
    const showToast = options.showToast !== false

    const existingItem = items.value.find(item =>
      (item.id || item.productId) === productId && item.variantId === variantId
    )

    if (existingItem) {
      existingItem.quantity += quantity
      if (Array.isArray(product.items)) {
        existingItem.items = product.items
      }
      existingItem.categoryLayout = categoryLayout || existingItem.categoryLayout || null
      existingItem.categorySlug = categorySlug || existingItem.categorySlug || null
      existingItem.categoryName = categoryName || existingItem.categoryName || null
      // If attendees are provided, update them
      if (attendees && productType === 'event') {
        existingItem.attendees = attendees
      }
      // Show toast for updated quantity
      if (showToast) {
        toastStore.success(`Updated ${productName} quantity to ${existingItem.quantity}`)
      }
    } else {
      items.value.push({
        id: productId,
        productId: productId, // Keep for backward compatibility
        variantId,
        title: productName,
        name: productName, // Keep for backward compatibility
        price: productPrice,
        quantity,
        image: productImage,
        type: productType,
        slug: product.slug,
        offering_id: offeringId,
        event_id: eventId,
        eventDate: product.eventDate,
        eventTime: product.eventTime,
        termLabel: product.termLabel || null,
        term_group_key: product.term_group_key || product.termGroupKey || null,
        termGroupKey: product.termGroupKey || product.term_group_key || null,
        isTermBundle: Boolean(product.isTermBundle),
        items: Array.isArray(product.items) ? product.items : null,
        categoryLayout,
        categorySlug,
        categoryName,
        // Optional: subscription configuration for subscription items
        subscriptionConfig: product.subscriptionConfig || null,
        // Store attendee details for events
        attendees: attendees || null
      })
      // Show toast for new item
      if (showToast) {
        const quantityText = quantity > 1 ? `${quantity} x ` : ''
        toastStore.success(`${quantityText}${productName} added to cart!`)
      }
    }

    saveToLocalStorage()
  }

  function removeItem(productId, variantId = null) {
    items.value = items.value.filter(item => 
      !(item.productId === productId && item.variantId === variantId)
    )
    saveToLocalStorage()
  }

  function updateQuantity(productId, quantity, variantId = null) {
    const item = items.value.find(item => 
      item.productId === productId && item.variantId === variantId
    )
    if (item) {
      item.quantity = quantity
      if (item.quantity <= 0) {
        removeItem(productId, variantId)
      } else {
        saveToLocalStorage()
      }
    }
  }

  function updateItemAttendees(productId, attendees, variantId = null) {
    const item = items.value.find(item =>
      item.productId === productId && item.variantId === variantId
    )

    if (!item) {
      return
    }

    item.attendees = attendees
    saveToLocalStorage()
  }

  function clearCart() {
    items.value = []
    sessionId.value = null
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify({
      items: items.value,
      sessionId: sessionId.value
    }))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('cart')
    if (saved) {
      const data = JSON.parse(saved)
      items.value = data.items || []
      sessionId.value = data.sessionId || null
    }
  }

  // Initialize cart from localStorage
  loadFromLocalStorage()

  return {
    items,
    sessionId,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    updateItemAttendees,
    clearCart
  }
})
