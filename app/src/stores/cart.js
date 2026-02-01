import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const sessionId = ref(null)

  const itemCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((total, item) => total + (item.price * item.quantity), 0))

  function addItem(product, quantity = 1, variantId = null) {
    const existingItem = items.value.find(item => 
      item.productId === product.id && item.variantId === variantId
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        productId: product.id,
        variantId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image_url
      })
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

