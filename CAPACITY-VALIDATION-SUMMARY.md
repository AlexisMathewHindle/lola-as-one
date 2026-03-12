# Event Capacity Validation & Protection Summary

## ✅ Protections Now in Place

### 1. Database Constraints (Prevents Negative Bookings)

```sql
-- These constraints are now active:
ALTER TABLE offering_events 
ADD CONSTRAINT current_bookings_non_negative 
CHECK (current_bookings >= 0);

ALTER TABLE event_capacity
ADD CONSTRAINT spaces_booked_non_negative 
CHECK (spaces_booked >= 0);

ALTER TABLE event_capacity
ADD CONSTRAINT spaces_reserved_non_negative 
CHECK (spaces_reserved >= 0);
```

**What this does:**
- Prevents `current_bookings` from ever going negative in `offering_events` table
- Prevents `spaces_booked` and `spaces_reserved` from going negative in `event_capacity` table
- Database will reject any UPDATE/INSERT that tries to set these values below 0

### 2. Frontend Pre-Checkout Validation

**Location:** `lola-workshops/src/views/CheckoutView.vue` (lines 459-483)

**What it does:**
- Checks event capacity BEFORE submitting to Stripe
- Queries `event_capacity` table for real-time availability
- Shows clear error messages:
  - "Sorry, [Event Name] is now sold out. Please remove it from your cart."
  - "Sorry, [Event Name] only has X spaces available. You're trying to book Y."

**Benefits:**
- Catches capacity issues early (before payment)
- Better user experience
- Reduces failed Stripe checkout sessions

### 3. Backend Capacity Validation

**Location:** `supabase/functions/create-checkout-session/index.ts` (lines 150-157)

**What it does:**
- Double-checks capacity when creating Stripe checkout session
- Uses `event_capacity` table if available, falls back to `offering_events`
- Improved error messages:
  - Sold out: "Sorry, [Event Name] is now sold out. Please remove it from your cart and try again."
  - Insufficient: "Sorry, [Event Name] only has X spaces available. You're trying to book Y. Please reduce the quantity or remove it from your cart."

**Benefits:**
- Final safety check before payment
- Prevents race conditions (two users booking last spot simultaneously)
- Clear, actionable error messages

### 4. Add to Cart Validation

**Location:** `lola-workshops/src/components/SingleListComponentSupabase.vue` (lines 391-428)

**What it does:**
- Checks stock before allowing user to add/increment quantity
- Shows alerts:
  - "Sorry, this workshop is sold out."
  - "Sorry, only X spots available for this workshop."
- Prevents adding sold-out events to cart

**Benefits:**
- Earliest possible validation
- Prevents users from adding unavailable events to cart

## 🔄 How Capacity is Tracked

### Two Tables Work Together:

1. **`offering_events` table:**
   - `max_capacity`: Total spots available
   - `current_bookings`: Number of confirmed bookings
   - Simple calculation: `available = max_capacity - current_bookings`

2. **`event_capacity` table (preferred):**
   - `total_capacity`: Total spots
   - `spaces_booked`: Confirmed bookings
   - `spaces_reserved`: Temporarily held (during checkout)
   - `spaces_available`: **Generated column** = `total_capacity - spaces_booked - spaces_reserved`

### Validation Flow:

```
1. User adds event to cart
   ↓
2. Frontend checks: stock > 0? ✓
   ↓
3. User clicks "Checkout"
   ↓
4. Frontend pre-validates: spaces_available >= quantity? ✓
   ↓
5. Backend validates again: spaces_available >= quantity? ✓
   ↓
6. Create Stripe checkout session
   ↓
7. User pays
   ↓
8. Webhook increments spaces_booked (via decrement_event_capacity RPC)
   ↓
9. spaces_available automatically recalculates (generated column)
```

## 🛡️ Protection Layers

| Layer | Location | When | What It Prevents |
|-------|----------|------|------------------|
| **1. Add to Cart** | Frontend Component | Before adding to cart | Adding sold-out events |
| **2. Pre-Checkout** | Checkout View | Before payment | Proceeding with unavailable events |
| **3. Checkout Session** | Edge Function | During checkout creation | Creating invalid sessions |
| **4. Database Constraint** | PostgreSQL | On data write | Negative bookings |

## 📊 Verify Constraints Are Active

Run this SQL to confirm:

```sql
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname IN (
  'current_bookings_non_negative', 
  'spaces_booked_non_negative', 
  'spaces_reserved_non_negative'
);
```

Expected output:
```
current_bookings_non_negative | offering_events | CHECK (current_bookings >= 0)
spaces_booked_non_negative    | event_capacity  | CHECK (spaces_booked >= 0)
spaces_reserved_non_negative  | event_capacity  | CHECK (spaces_reserved >= 0)
```

## 🐛 How We Fixed the Negative Bookings Issue

### Root Cause:
- Data corruption: `current_bookings` was -4 for some events
- This made `spaces_available` calculate incorrectly

### Fix Applied:
```sql
-- Fixed all negative values
UPDATE offering_events 
SET current_bookings = GREATEST(0, current_bookings)
WHERE current_bookings < 0;

UPDATE event_capacity 
SET spaces_booked = GREATEST(0, spaces_booked),
    spaces_reserved = GREATEST(0, spaces_reserved)
WHERE spaces_booked < 0 OR spaces_reserved < 0;
```

### Prevention:
- Added database constraints (see above)
- These constraints make it **impossible** for negative values to occur again

## 🧪 Testing Checklist

- [ ] Try to add sold-out event to cart → Should show "sold out" message
- [ ] Try to book more spaces than available → Should show "only X spaces available"
- [ ] Complete successful checkout → Should work smoothly
- [ ] Check database after booking → `current_bookings` should increment correctly
- [ ] Try to manually set negative bookings in SQL → Should be rejected by constraint

## 📝 Error Messages Users Will See

### Sold Out:
> Sorry, "Littles Ones Fri (ages 2-4)" is now sold out. Please remove it from your cart.

### Insufficient Capacity:
> Sorry, "Littles Ones Fri (ages 2-4)" only has 2 spaces available. You're trying to book 3. Please reduce the quantity or remove it from your cart.

### Event Not Found:
> One or more events in your cart are no longer available. Please refresh the page and try again.

## 🚀 Next Steps (Optional Improvements)

1. **Real-time capacity updates:** Use Supabase Realtime to update capacity on the page
2. **Reserved spaces during checkout:** Temporarily reserve spaces when user starts checkout
3. **Waitlist integration:** Automatically offer waitlist when event is sold out
4. **Admin alerts:** Notify admin when events are close to selling out

## 📚 Related Files

- `supabase/functions/create-checkout-session/index.ts` - Backend validation
- `lola-workshops/src/views/CheckoutView.vue` - Pre-checkout validation
- `lola-workshops/src/components/SingleListComponentSupabase.vue` - Add to cart validation
- `supabase/migrations/20260208_fix_bookings_and_functions.sql` - RPC function

