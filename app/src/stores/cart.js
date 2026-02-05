import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToastStore } from './toast'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const sessionId = ref(null)
  const toastStore = useToastStore()

  const itemCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((total, item) => total + (item.price * item.quantity), 0))

  function addItem(product, quantity = 1, variantId = null) {
    // Handle both old and new product structures
    const productId = product.id || product.productId
    const productName = product.title || product.name
    const productPrice = product.price || product.price_gbp
    const productImage = product.image || product.image_url || product.featured_image_url
    const productType = product.type || product.productType

    const existingItem = items.value.find(item =>
      (item.id || item.productId) === productId && item.variantId === variantId
    )

    if (existingItem) {
      existingItem.quantity += quantity
      // Show toast for updated quantity
      toastStore.success(`Updated ${productName} quantity to ${existingItem.quantity}`)
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
        eventDate: product.eventDate,
        eventTime: product.eventTime,
        // Optional: subscription configuration for subscription items
        subscriptionConfig: product.subscriptionConfig || null
      })
      // Show toast for new item
      const quantityText = quantity > 1 ? `${quantity} x ` : ''
      toastStore.success(`${quantityText}${productName} added to cart!`)
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
    clearCart
  }
})

