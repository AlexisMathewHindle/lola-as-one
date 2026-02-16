# Cart Compatibility Analysis: Legacy vs New

## 🔍 Current State Comparison

### Legacy Cart (Vuex - lola-workshops)
```typescript
interface LegacyBasketItem {
  theme_id: string          // Unique identifier
  event_id?: string         // For term events
  quantity: number
  category: "single" | "term"
  theme_title: string
  event_title?: string
  price: number
  date?: string
  start_time?: string
  end_time?: string
  items?: Array<any>        // For term events (nested themes)
  passed?: boolean          // Filter out past events
}
```

**Storage**: Vuex state + localStorage (manual)
**Key Features**:
- Groups term events by `event_id`
- Nested `items` array for multi-week term bookings
- Uses `theme_id` as primary identifier
- Category-based logic ("single" vs "term")

---

### New Cart (Pinia - lola-as-one/app)
```typescript
interface NewCartItem {
  id: string                // Product/Event ID
  productId: string         // Backward compatibility
  variantId?: string        // For product variants
  title: string
  name: string              // Backward compatibility
  price: number
  quantity: number
  image?: string
  type: "event" | "product_physical" | "product_digital" | "subscription"
  slug?: string
  eventDate?: string        // For events
  eventTime?: string        // For events
}
```

**Storage**: Pinia store + localStorage (automatic)
**Key Features**:
- Flat structure (no nesting)
- Type-based logic (event, product, etc.)
- Uses `id` as primary identifier
- Supports product variants

---

## ⚠️ Key Incompatibilities

| Feature | Legacy | New | Issue |
|---------|--------|-----|-------|
| **Identifier** | `theme_id` | `id` / `productId` | Different field names |
| **Structure** | Nested (term events) | Flat | Term events have `items` array |
| **Category** | `"single"` / `"term"` | `type: "event"` | Different categorization |
| **Event Grouping** | Groups by `event_id` | No grouping | Term bookings need special handling |
| **Title Field** | `theme_title` / `event_title` | `title` / `name` | Different field names |

---

## 🚨 Critical Issues

### 1. **Term Events (Multi-Week Bookings)**
**Legacy Behavior**:
```javascript
// Term event with 6 weeks
{
  theme_id: "abc123",
  event_id: "term-spring-2024",
  category: "term",
  quantity: 1,
  items: [
    { theme_title: "Week 1: Painting", date: "2024-03-01", ... },
    { theme_title: "Week 2: Drawing", date: "2024-03-08", ... },
    // ... 4 more weeks
  ]
}
```

**New Cart**: Doesn't support nested items - would need to be flattened or handled differently.

**Impact**: 🔴 **BREAKING** - Term bookings won't work without modification

---

### 2. **Basket Display Logic**
**Legacy**: Uses `groupedItems` computed property to group term events
```javascript
// Groups items by event_id for display
const groupedItems = computed(() => {
  // Complex grouping logic for term vs single
})
```

**New Cart**: No grouping logic - assumes flat list

**Impact**: 🟡 **MEDIUM** - Display will need custom logic

---

### 3. **Remove from Basket**
**Legacy**: Different logic for single vs term
```javascript
if (theme.category === "single") {
  // Decrement quantity
} else {
  // Remove entire term event by event_id
}
```

**New Cart**: Simple remove by ID
```javascript
removeItem(productId, variantId)
```

**Impact**: 🟡 **MEDIUM** - Need to preserve term event removal logic

---

## ✅ Recommended Solution: Hybrid Approach

### Option 1: Adapt New Cart for Legacy (Recommended)
Create a **legacy-compatible cart store** that extends the new cart with term event support.

**Pros**:
- Keeps new cart's clean architecture
- Adds legacy-specific features as needed
- Easier migration path

**Cons**:
- Some custom code needed
- Two slightly different cart implementations

---

### Option 2: Transform Data at Boundaries
Keep new cart as-is, transform data when adding/displaying.

**Pros**:
- New cart stays clean
- Legacy code adapts to new structure

**Cons**:
- More transformation logic
- Potential data loss (nested items)

---

### Option 3: Keep Vuex Basket, Enhance It
Don't migrate to new cart - just improve existing Vuex basket.

**Pros**:
- No breaking changes
- Works with existing code

**Cons**:
- Misses DRY opportunity
- Still using Vuex (older pattern)

---

## 🎯 Recommended Implementation: Option 1

### Create `lola-workshops/src/stores/cart.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  // Computed properties
  const itemCount = computed(() => 
    items.value.reduce((total, item) => total + item.quantity, 0)
  )
  
  const subtotal = computed(() => 
    items.value.reduce((total, item) => {
      // Handle term events with nested items
      if (item.category === 'term' && item.items) {
        return total + (item.price * item.items.length)
      }
      return total + (item.price * item.quantity)
    }, 0)
  )

  // Add item - supports both single and term events
  function addItem(event, quantity = 1) {
    const eventId = event.id || event.event_id || event.theme_id
    
    // Check if term event
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
          price: event.price,
          quantity: 1,
          items: event.items || [], // Nested weeks
          type: 'event'
        })
      }
    } else {
      // Single events: check by theme_id
      const existingItem = items.value.find(item => 
        item.theme_id === eventId && item.category === 'single'
      )
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        items.value.push({
          id: eventId,
          theme_id: eventId,
          category: 'single',
          title: event.theme_title || event.title,
          theme_title: event.theme_title,
          price: event.price,
          quantity: quantity,
          date: event.date,
          start_time: event.start_time,
          end_time: event.end_time,
          type: 'event'
        })
      }
    }

    saveToLocalStorage()
  }

  // Remove item - handles term vs single
  function removeItem(item) {
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

  function clearCart() {
    items.value = []
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    localStorage.setItem('basket', JSON.stringify(items.value))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('basket')
    if (saved) {
      items.value = JSON.parse(saved)
    }
  }

  // Initialize
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
```

---

## 📝 Migration Checklist

- [ ] Create `lola-workshops/src/stores/cart.ts` with hybrid implementation
- [ ] Install Pinia: `npm install pinia`
- [ ] Initialize Pinia in `main.ts`
- [ ] Update `BasketView.vue` to use `useCartStore()` instead of Vuex
- [ ] Update `TermListComponent.vue` to use cart store
- [ ] Update `SingleListComponent.vue` to use cart store
- [ ] Test single event add/remove
- [ ] Test term event add/remove
- [ ] Test localStorage persistence
- [ ] Test coupon logic with new cart
- [ ] Update `RegistrationView.vue` to read from cart store

---

## 🧪 Testing Scenarios

1. **Single Event**
   - Add single event to cart
   - Verify quantity increments
   - Remove from cart
   - Verify localStorage

2. **Term Event**
   - Add term event (6 weeks)
   - Verify nested items preserved
   - Verify price calculation (price × weeks)
   - Remove entire term event

3. **Mixed Cart**
   - Add 2 single events + 1 term event
   - Verify total calculation
   - Verify display grouping
   - Clear cart

4. **Persistence**
   - Add items
   - Refresh page
   - Verify items restored

---

## 🎯 Next Steps

**Before implementing**, we need to decide:

1. **Do we need to support term events going forward?**
   - If YES → Use hybrid cart (Option 1)
   - If NO → Can simplify to flat structure

2. **Are term events in Supabase?**
   - Check if `offering_events` table has term event data
   - Verify how multi-week courses are structured

3. **What's the priority?**
   - Quick migration → Keep Vuex, enhance it (Option 3)
   - Long-term maintainability → Hybrid cart (Option 1)

**What do you think? Should I check how term events are structured in Supabase first?**

