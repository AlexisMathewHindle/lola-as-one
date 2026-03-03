# LoLA Workshops Integration Audit
## Ensuring lolaworkshops Works with lola-as-one offering-events

**Date:** 2026-02-16  
**Status:** In Progress

---

## Executive Summary

The `lola-workshops` legacy website is partially migrated to use Supabase `offering_events` from the `lola-as-one` database. However, **critical components still use Firebase**, which will cause the system to fail when Firebase is deprecated.

### Current State
- ✅ Supabase client configured and installed
- ✅ Environment variables set correctly
- ✅ Some components migrated (CalendarComponent, EventDetailsView, SingleListComponentSupabase)
- ❌ **Critical checkout flow still uses Firebase**
- ❌ **Admin event management still uses Firebase**
- ❌ **Basket/Registration flow uses Firebase for events and themes**

---

## Components Status

### ✅ MIGRATED TO SUPABASE
1. **CalendarComponent.vue** - Fetches events from Supabase
2. **EventDetailsView.vue** - Fetches event details from Supabase
3. **SingleListComponentSupabase.vue** - Fetches and displays events from Supabase

### ❌ STILL USING FIREBASE (CRITICAL)
1. **BasketView.vue** - Uses Firebase for:
   - Fetching events: `collection(db, "events")`
   - Fetching themes: `collection(db, "themes")`
   - Coupon validation: `collection(db, "coupons")`

2. **RegistrationView.vue** - Uses Firebase for:
   - Fetching event spaces: `collection(db, "events")`
   - Fetching themes: `collection(db, "themes")`
   - Updating event quantities: `updateDoc(eventDoc, event)`
   - Updating theme quantities: `updateDoc(themeDoc, theme)`

3. **EventsView.vue** (Admin) - Uses Firebase for:
   - Listing all events: `collection(db, "events")`
   - Event management

4. **PaymentView.vue** - Needs verification for booking creation

---

## Data Model Mapping

### Firebase → Supabase Schema

| Firebase Collection | Supabase Table | Notes |
|---------------------|----------------|-------|
| `events` | `offering_events` + `offerings` | Relational join required |
| `themes` | `offerings` (metadata) | Themes stored in offering metadata |
| `coupons` | `coupons` (needs creation) | Not yet migrated |
| `bookings` | `bookings` | Exists in Supabase |

---

## Critical Issues Identified

### 1. **Checkout Flow Broken**
The registration/checkout flow (`RegistrationView.vue` → `PaymentView.vue`) still:
- Fetches events from Firebase
- Updates Firebase event quantities
- May create bookings in Firebase instead of Supabase

**Impact:** Users cannot complete bookings if Firebase is unavailable.

### 2. **Basket Validation Broken**
`BasketView.vue` validates stock/capacity against Firebase events, not Supabase.

**Impact:** Users may book events that are actually full.

### 3. **Admin Event Management**
`EventsView.vue` lists events from Firebase only.

**Impact:** Admins cannot see or manage Supabase events.

### 4. **Themes/Term Bookings**
The concept of "themes" (term-based bookings) exists in Firebase but needs mapping to Supabase.

**Impact:** Term bookings may not work.

---

## Integration Requirements

### Data Structure Alignment
The Supabase `offering_events` table structure:
```sql
offering_events (
  id UUID,
  offering_id UUID → offerings(id),
  event_date DATE,
  event_start_time TIME,
  event_end_time TIME,
  max_capacity INTEGER,
  current_bookings INTEGER,
  price_gbp DECIMAL,
  ...
)
```

### Required Transformations
The `transformSupabaseEventToLegacy()` function exists but may need updates for:
- Theme/term event handling
- Stock calculation (max_capacity - current_bookings)
- Category mapping
- Image handling

---

## Critical Findings

### 🚨 BOOKING CREATION USES FIREBASE
**File:** `lola-workshops/src/views/PaymentView.vue` (Line 201-226)

The `saveBooking()` function writes to Firebase:
```javascript
const saveBooking = async () => {
  const db = getFirestore();
  const docRef = await addDoc(
    collection(db, "bookings"),
    store.state.booking
  );
  // ...
}
```

**This means:**
- All bookings are created in Firebase, NOT Supabase
- The lola-as-one system won't see these bookings
- Event capacity won't be updated in Supabase
- Email notifications won't be triggered (they rely on Supabase)

### 🚨 CAPACITY UPDATES USE FIREBASE
**File:** `lola-workshops/src/views/PaymentView.vue` (Line 228-280)

The `updateThemeQuantities()` function updates Firebase:
```javascript
const updateFirestoreTheme = async (theme) => {
  const db = getFirestore();
  const themeDoc = doc(db, "themes", theme.id);
  await updateDoc(themeDoc, theme);
};
```

**This means:**
- Event capacity is decremented in Firebase only
- Supabase `offering_events.current_bookings` is never updated
- Users could overbook events

---

## Comparison: Legacy vs New System

| Feature | lola-workshops (Legacy) | lola-as-one (New) |
|---------|------------------------|-------------------|
| **Event Display** | ✅ Supabase (CalendarComponent) | ✅ Supabase |
| **Event Details** | ✅ Supabase (EventDetailsView) | ✅ Supabase |
| **Basket Validation** | ❌ Firebase | ✅ Supabase |
| **Checkout** | ❌ Firebase Functions | ✅ Supabase Edge Functions |
| **Booking Creation** | ❌ Firebase Firestore | ✅ Supabase (via webhook) |
| **Capacity Updates** | ❌ Firebase | ✅ Supabase (via webhook) |
| **Email Notifications** | ❌ Firebase Functions | ✅ Supabase Edge Functions |
| **Payment Processing** | Stripe (direct) | Stripe Checkout |

---

## Migration Strategy

### Option 1: Complete Migration (Recommended)
Migrate all remaining components to use Supabase and Stripe Checkout like lola-as-one.

**Pros:**
- Single source of truth
- Unified booking system
- Email notifications work
- Proper capacity management

**Cons:**
- More work upfront
- Need to test thoroughly

### Option 2: Hybrid Approach (Not Recommended)
Keep Firebase for bookings but sync to Supabase.

**Pros:**
- Less immediate work

**Cons:**
- Data inconsistency risk
- Complex sync logic
- Two systems to maintain

---

## Recommended Action Plan

1. **Immediate:** Update PaymentView to create bookings in Supabase
2. **Immediate:** Update capacity management to use Supabase
3. **High Priority:** Migrate BasketView to validate against Supabase
4. **High Priority:** Migrate RegistrationView to use Supabase
5. **Medium Priority:** Migrate admin EventsView
6. **Low Priority:** Create coupons table in Supabase

---

## Next Steps (Detailed Task Breakdown)

See task list for detailed breakdown of required work.

