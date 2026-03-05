import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// TypeScript interfaces for cart items
interface CartItem {
  id: string
  theme_id?: string
  event_id?: string
  category: 'single' | 'term'
  title: string
  theme_title?: string
  event_title?: string
  price: number
  quantity: number
  date?: string
  start_time?: string
  end_time?: string
  type: string
  stock?: number
  term?: string
  passed?: boolean
  items?: any[] // For term events with nested weeks
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  // Computed properties
  const itemCount = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )
  
  const subtotal = computed(() => 
    items.value.reduce((total, item) => {
      // Handle term events with nested items (legacy)
      if (item.category === 'term' && item.items && item.items.length > 0) {
        return total + (item.price * item.items.length * item.quantity)
      }
      // Handle regular items
      return total + (item.price * item.quantity)
    }, 0)
  )

  /**
   * Add item to cart - supports both single and term events (legacy)
   * @param event - Event object (can be single or term event)
   * @param quantity - Quantity to add (default: 1)
   */
  function addItem(event: any, quantity = 1) {
    const eventId = event.id || event.event_id || event.theme_id
    
    // Check if this is a term event (legacy)
    if (event.category === 'term') {
      // Term events: check by event_id
      const existingItem = items.value.find(item => 
        item.event_id === event.event_id && item.category === 'term'
      )
      
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        items.value.push({
          id: eventId,
          theme_id: event.theme_id,
          event_id: event.event_id,
          category: 'term',
          title: event.event_title || event.title,
          theme_title: event.theme_title,
          event_title: event.event_title,
          price: event.price,
          quantity: 1,
          items: event.items || [], // Nested weeks
          type: 'event',
          stock: event.stock,
          term: event.term
        })
      }
    } else {
      // Single events: check by theme_id or event_id
      const existingItem = items.value.find(item =>
        (item.theme_id === eventId || item.event_id === event.event_id) && item.category === 'single'
      )

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        // Preserve all fields from the event object, with fallbacks
        items.value.push({
          ...event, // Spread all event properties first
          id: event.id || eventId, // Preserve the offering_id
          theme_id: event.theme_id || eventId,
          event_id: event.event_id, // Preserve event_id
          offering_id: event.offering_id || event.id, // Preserve offering_id
          category: event.category || 'single',
          title: event.theme_title || event.title,
          theme_title: event.theme_title,
          price: event.price,
          quantity: quantity,
          date: event.date,
          start_time: event.start_time,
          end_time: event.end_time,
          type: event.type || 'event',
          stock: event.stock,
          passed: event.passed
        })
      }
    }

    saveToLocalStorage()
  }

  /**
   * Remove item from cart - handles term vs single events
   * @param item - Item to remove
   */
  function removeItem(item: any) {
    if (item.category === 'term') {
      // Remove entire term event
      items.value = items.value.filter(i => 
        !(i.event_id === item.event_id && i.category === 'term')
      )
    } else {
      // Decrement single event quantity
      const existingItem = items.value.find(i => i.theme_id === item.theme_id)
      if (existingItem) {
        existingItem.quantity -= 1
        if (existingItem.quantity <= 0) {
          items.value = items.value.filter(i => i.theme_id !== item.theme_id)
        }
      }
    }
    saveToLocalStorage()
  }

  /**
   * Clear entire cart
   */
  function clearCart() {
    items.value = []
    saveToLocalStorage()
  }

  /**
   * Save cart to localStorage
   */
  function saveToLocalStorage() {
    localStorage.setItem('basket', JSON.stringify(items.value))
  }

  /**
   * Load cart from localStorage
   */
  function loadFromLocalStorage() {
    const saved = localStorage.getItem('basket')
    if (saved) {
      try {
        items.value = JSON.parse(saved)
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        items.value = []
      }
    }
  }

  // Initialize cart from localStorage on store creation
  loadFromLocalStorage()

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    clearCart
  }
})

