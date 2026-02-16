# Cart Migration Recommendation

## ✅ MIGRATION COMPLETED

**Date**: 2026-02-14

### What Was Implemented

1. ✅ **Installed Pinia** (v3.0.4) - Modern state management for Vue 3
2. ✅ **Created cart store** (`lola-workshops/src/stores/cart.ts`)
   - TypeScript interfaces for type safety
   - Supports both single and term events (legacy compatibility)
   - Automatic localStorage persistence
   - Handles nested items for term events
3. ✅ **Initialized Pinia** in `main.ts`
4. ✅ **Updated BasketView.vue** to use cart store instead of Vuex
5. ✅ **Updated add-to-cart components**:
   - TermListComponent.vue
   - SingleListComponent.vue
   - ExtraPurchaseComponent.vue
6. ✅ **Fixed TypeScript errors** - Added proper `CartItem` interface
7. ✅ **Build successful** - No compilation errors

### Cart Store Features

- **TypeScript support** with proper interfaces
- **Flat structure** for single events
- **Nested structure support** for term events (legacy)
- **Automatic quantity management**
- **localStorage persistence** (uses 'basket' key for compatibility)
- **Computed properties**: `itemCount`, `subtotal`
- **Methods**: `addItem()`, `removeItem()`, `clearCart()`

### Testing Checklist

To test the cart functionality:
- [ ] Navigate to the legacy website
- [ ] Add a single event to cart
- [ ] Add a term event to cart (if available)
- [ ] View basket - verify items display correctly
- [ ] Remove items from basket
- [ ] Refresh page - verify cart persists
- [ ] Clear basket - verify all items removed
- [ ] Check browser console for any runtime errors
- [ ] Verify localStorage 'basket' key contains correct data

---

## 🔍 Key Finding: Term Events Don't Exist in Supabase

After analyzing the Supabase schema, **there is NO concept of "term events" or multi-week courses** in the new system.

### Supabase Event Structure
```sql
-- Each event is a SINGLE occurrence
CREATE TABLE offering_events (
  id UUID,
  offering_id UUID,           -- Links to offering (e.g., "Pottery Workshop")
  event_date DATE,            -- Single date
  event_start_time TIME,
  event_end_time TIME,
  max_capacity INTEGER,
  price_gbp DECIMAL(10,2),
  ...
)
```

**Key Points**:
- ✅ One `offering_events` row = One event occurrence
- ✅ Multiple dates = Multiple `offering_events` rows with same `offering_id`
- ✅ Categories stored in `offerings.metadata` as JSONB (e.g., `{"category": "Adult"}`)
- ❌ NO nested "items" array
- ❌ NO "term" vs "single" distinction at database level

NOTE: NOT SURE IF WE NEED DISTINCTION BETWEEN TERM AND SINGLE ANYMORE

---

## 🎯 Recommendation: Simplify to Flat Cart Structure

Since Supabase doesn't support term events, we should **migrate to the new cart store** and handle legacy data transformation.

### Migration Strategy

#### Phase 1: Use New Cart Store (Recommended)
**Copy `app/src/stores/cart.js` to `lola-workshops/src/stores/cart.ts`**

**Pros**:
- ✅ Clean, modern Pinia store
- ✅ Already compatible with Supabase structure
- ✅ Automatic localStorage persistence
- ✅ DRY - reuses working code
- ✅ Future-proof for Supabase migration

**Cons**:
- ⚠️ Need to handle legacy term events during transition
- ⚠️ Requires Pinia installation

---

#### Phase 2: Transform Legacy Term Events

**Option A: Flatten Term Events on Add**
When adding a term event to cart, split it into individual events:

```javascript
// Legacy: 1 term event with 6 nested items
{
  category: "term",
  event_id: "spring-2024",
  items: [
    { date: "2024-03-01", theme_title: "Week 1" },
    { date: "2024-03-08", theme_title: "Week 2" },
    // ... 4 more weeks
  ]
}

// New: 6 separate cart items
[
  { id: "event-1", title: "Pottery - Week 1", eventDate: "2024-03-01", quantity: 1 },
  { id: "event-2", title: "Pottery - Week 2", eventDate: "2024-03-08", quantity: 1 },
  // ... 4 more
]
```

**Pros**: Simple, works with new cart
**Cons**: Loses "term" grouping concept

---

**Option B: Keep Term Events as Single Cart Item (Temporary)**
Store term event metadata in cart item:

```javascript
{
  id: "spring-2024",
  title: "Pottery Term Course",
  type: "event",
  price: 120, // Total for all weeks
  quantity: 1,
  metadata: {
    isTermEvent: true,
    weeks: [
      { date: "2024-03-01", title: "Week 1" },
      { date: "2024-03-08", title: "Week 2" },
      // ...
    ]
  }
}
```

**Pros**: Preserves term concept temporarily
**Cons**: Requires custom handling in checkout

---

## ✅ Final Recommendation

### **Start with New Cart Store + Legacy Compatibility Layer**

1. **Install Pinia and copy new cart store**
   ```bash
   cd lola-workshops
   npm install pinia
   cp ../app/src/stores/cart.js src/stores/cart.ts
   ```

2. **Add legacy term event support** (temporary)
   - Detect if event has `category: "term"` and `items` array
   - Store as single cart item with metadata
   - Display grouped in BasketView
   - Transform to individual events at checkout

3. **Update components to use cart store**
   - `BasketView.vue` → `useCartStore()`
   - `TermListComponent.vue` → `cartStore.addItem()`
   - `SingleListComponent.vue` → `cartStore.addItem()`

4. **Gradual migration**
   - Keep Vuex for other state (booking, discount, etc.)
   - Only migrate basket to Pinia cart store
   - Remove Vuex basket state

---

## 📋 Implementation Checklist

### Step 1: Setup (30 mins)
- [ ] Install Pinia: `npm install pinia`
- [ ] Copy `app/src/stores/cart.js` to `lola-workshops/src/stores/cart.ts`
- [ ] Initialize Pinia in `main.ts`

### Step 2: Adapt Cart Store (1 hour)
- [ ] Add TypeScript types for legacy events
- [ ] Add `isTermEvent` detection in `addItem()`
- [ ] Handle term event metadata storage
- [ ] Test add/remove with single events

### Step 3: Update BasketView (2-3 hours)
- [ ] Replace `store.state.basket` with `cartStore.items`
- [ ] Update `groupedItems` computed for new structure
- [ ] Update `removeFromBasket()` to use `cartStore.removeItem()`
- [ ] Update total calculation
- [ ] Test display with mixed items

### Step 4: Update Add to Cart Components (1-2 hours)
- [ ] Update `TermListComponent.vue` to use `cartStore.addItem()`
- [ ] Update `SingleListComponent.vue` to use `cartStore.addItem()`
- [ ] Update `ExtraPurchaseComponent.vue` to use `cartStore.addItem()`
- [ ] Test adding items from different components

### Step 5: Testing (1-2 hours)
- [ ] Add single event → verify in cart
- [ ] Add term event → verify grouped display
- [ ] Remove items → verify updates
- [ ] Refresh page → verify persistence
- [ ] Clear cart → verify localStorage cleared

---

## 🚨 Important Notes

### Term Events in Legacy Website
**Question**: Are term events still being created in the legacy website?

If **YES** → Need full term event support in cart
If **NO** → Can simplify to flat structure immediately

### Supabase Migration Impact
When migrating to Supabase checkout:
- Term events will need to be split into individual `offering_events`
- Each week becomes a separate booking
- Pricing may need adjustment (per-week vs. term total)

---

## 🎯 Next Steps

**I recommend we:**

1. **Confirm**: Are term events still actively used?
2. **Implement**: New cart store with basic compatibility
3. **Test**: With real legacy data
4. **Decide**: Keep term support or migrate to individual events

**Should I proceed with implementing the new cart store?**

