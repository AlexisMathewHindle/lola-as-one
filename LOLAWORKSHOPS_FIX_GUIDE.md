# LoLA Workshops Fix Guide
## Quick Reference for Migrating to Supabase

---

## 🎯 Goal

Make `lola-workshops` fully compatible with `lola-as-one` offering-events by migrating all Firebase operations to Supabase.

---

## 📝 Files That Need Changes

### Priority 1: Critical (Booking Flow)

#### 1. `lola-workshops/src/views/PaymentView.vue`
**Current:** Creates bookings in Firebase  
**Needed:** Create bookings in Supabase

**Changes Required:**
- Replace `saveBooking()` to use Supabase
- Replace `updateThemeQuantities()` to update Supabase `offering_events.current_bookings`
- Use Supabase Edge Function for payment processing (like lola-as-one)

**Reference:** See `app/src/views/Checkout.vue` for Supabase implementation

---

#### 2. `lola-workshops/src/views/BasketView.vue`
**Current:** Fetches events/themes from Firebase  
**Needed:** Fetch from Supabase

**Changes Required:**
- Replace `getEventsFromFirestore()` with Supabase query
- Replace `getThemesFromFirestore()` with Supabase query
- Update coupon validation to use Supabase (or create coupons table)

**Lines to Change:**
- Line 363-370: `getEventsFromFirestore()`
- Line 373-379: `getThemesFromFirestore()`
- Line 211-213: Coupon validation

---

#### 3. `lola-workshops/src/views/RegistrationView.vue`
**Current:** Fetches and updates events/themes in Firebase  
**Needed:** Use Supabase

**Changes Required:**
- Replace `fetchEventSpaces()` with Supabase query
- Replace `fetchThemesFromFirestore()` with Supabase query
- Replace `updateFirestoreEvent()` with Supabase update
- Replace `updateFirestoreTheme()` with Supabase update

**Lines to Change:**
- Line 467-473: `fetchEventSpaces()`
- Line 476-488: `fetchThemesFromFirestore()`
- Line 491-494: `updateFirestoreEvent()`
- Line 498-501: `updateFirestoreTheme()`

---

### Priority 2: Medium (Admin)

#### 4. `lola-workshops/src/views/EventsView.vue`
**Current:** Lists events from Firebase  
**Needed:** List from Supabase

**Changes Required:**
- Replace `fetchEvents()` to query Supabase `offering_events`
- Update event editing to work with Supabase

**Lines to Change:**
- Line 89-95: `fetchEvents()`

---

### Priority 3: Low (Features)

#### 5. Create Coupons Table in Supabase
**Needed:** Migrate coupons from Firebase to Supabase

**SQL to Create:**
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expiration TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 Helper Functions Needed

Add these to `lola-workshops/src/lib/supabase.ts`:

### 1. Fetch Events with Capacity
```typescript
export async function fetchEventsWithCapacity(): Promise<SupabaseEvent[]> {
  const { data, error } = await supabase
    .from("offering_events")
    .select(`
      *,
      offering:offerings!inner(*),
      capacity:event_capacity(*)
    `)
    .eq("offering.status", "published")
    .order("event_date", { ascending: true });
  
  if (error) throw error;
  return data || [];
}
```

### 2. Update Event Capacity
```typescript
export async function decrementEventCapacity(
  eventId: string, 
  quantity: number
): Promise<void> {
  const { error } = await supabase.rpc('decrement_event_capacity', {
    p_offering_event_id: eventId,
    p_attendees: quantity
  });
  
  if (error) throw error;
}
```

### 3. Create Booking
```typescript
export async function createBooking(bookingData: any): Promise<string> {
  const { data, error } = await supabase
    .from("bookings")
    .insert(bookingData)
    .select()
    .single();
  
  if (error) throw error;
  return data.id;
}
```

### 4. Validate Coupon
```typescript
export async function validateCoupon(code: string): Promise<any> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .gt("expiration", new Date().toISOString())
    .single();
  
  if (error) throw error;
  return data;
}
```

---

## 🧪 Testing Checklist

After making changes, test:

- [ ] Browse events on calendar (should show Supabase events)
- [ ] View event details (should show correct info)
- [ ] Add event to basket
- [ ] View basket (should show correct stock)
- [ ] Fill registration form
- [ ] Complete payment
- [ ] Verify booking created in Supabase
- [ ] Verify capacity decremented in Supabase
- [ ] Verify email sent (if configured)
- [ ] Test with sold-out event (should prevent booking)
- [ ] Test coupon code (if implemented)

---

## 📚 Reference Files

- `app/src/views/Checkout.vue` - Supabase checkout implementation
- `app/src/views/Workshops.vue` - Supabase event fetching
- `lola-workshops/src/lib/supabase.ts` - Existing helper functions
- `supabase/functions/stripe-webhook/index.ts` - Booking creation webhook

---

## ⚠️ Important Notes

1. **Don't delete Firebase code yet** - Keep it commented out until fully tested
2. **Test in development first** - Use local Supabase instance
3. **Backup Firebase data** - Export bookings before migration
4. **Update environment variables** - Ensure production has correct Supabase URL
5. **Monitor after deployment** - Check for errors in Supabase logs

