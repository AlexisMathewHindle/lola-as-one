# Legacy Website Migration - Quick Start Guide

## 🎯 Overview
This guide provides a quick reference for migrating the legacy Lola Workshops website from Firebase to Supabase.

**Full Details**: See `LEGACY_WEBSITE_MIGRATION_EPIC.md` for comprehensive documentation.

---

## ✅ What's Already Done

- **Event Display**: ✅ Events are fetched from Supabase
- **Supabase Infrastructure**: ✅ All tables, Edge Functions, and webhooks exist
- **Reference Implementation**: ✅ New website (`app/`) has working booking flow

---

## 🚀 Quick Implementation Order

### 1️⃣ Cart Store (1-2 days)
**Goal**: Replace Vuex basket with persistent cart store

```bash
# Copy cart store from new website
cp app/src/stores/cart.ts lola-workshops/src/stores/cart.ts
```

**Files to Update**:
- `lola-workshops/src/views/BasketView.vue`
- Replace `store.state.basket` with `cartStore.items`

**Test**: Add items to cart, refresh page, verify persistence

---

### 2️⃣ Customer Registration (2-3 days)
**Goal**: Save customer data to Supabase

**Add to `lola-workshops/src/lib/supabase.ts`**:
```typescript
export async function createOrUpdateCustomer(email: string, firstName: string, lastName: string, phone?: string) {
  const { data, error } = await supabase
    .from('customers')
    .upsert({
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' })
    .select()
    .single()
  
  return { data, error }
}
```

**Update `RegistrationView.vue`**:
- Call `createOrUpdateCustomer()` on form submit
- Store customer ID in Vuex for checkout

**Test**: Submit registration, verify customer in Supabase

---

### 3️⃣ Payment Integration (3-4 days)
**Goal**: Use Stripe Checkout instead of inline payment

**Update `PaymentView.vue`**:
```typescript
const handleCheckout = async () => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      items: cartStore.items,
      customer: {
        email: store.state.booking.email,
        firstName: store.state.booking.firstName,
        lastName: store.state.booking.lastName,
        phone: store.state.booking.phone
      },
      metadata: {
        attendees: JSON.stringify(store.state.booking.attendees)
      }
    }
  })
  
  if (data?.url) {
    window.location.href = data.url
  }
}
```

**Create Success Page**: `lola-workshops/src/views/BookingSuccessView.vue`

**Test**: Complete checkout, verify redirect to Stripe, verify success page

---

### 4️⃣ Webhook Enhancement (2-3 days)
**Goal**: Store attendee details in bookings

**Update `supabase/functions/stripe-webhook/index.ts`**:
```typescript
// After creating booking
const attendees = JSON.parse(metadata.attendees || '[]')
for (const attendee of attendees) {
  await supabase.from('booking_attendees').insert({
    booking_id: booking.id,
    first_name: attendee.firstName,
    last_name: attendee.lastName,
    email: attendee.email,
    phone: attendee.phone,
    notes: attendee.notes
  })
}
```

**Test**: Complete booking, verify attendees in `booking_attendees` table

---

### 5️⃣ Email Templates (2-3 days)
**Goal**: Send booking confirmation emails

**Create Template**: `supabase/functions/send-email/templates/booking-confirmation.html`

**Update Webhook** to call send-email:
```typescript
await supabase.functions.invoke('send-email', {
  body: {
    template: 'event-booking-confirmation',
    to: metadata.customer_email,
    data: {
      customerName: metadata.customer_first_name,
      eventTitle: event.offering.title,
      eventDate: event.event_date,
      eventTime: event.event_start_time,
      bookingNumber: order.order_number,
      attendees: attendees
    }
  }
})
```

**Test**: Complete booking, verify email received

---

### 6️⃣ Capacity & Booking Views (1-2 days)
**Goal**: Display capacity and booking details

**Add to `EventDetailsView.vue`**:
```typescript
const capacity = computed(() => {
  if (!supabaseEvent.value) return null
  const available = supabaseEvent.value.max_capacity - supabaseEvent.value.current_bookings
  return { available, total: supabaseEvent.value.max_capacity }
})
```

**Update `BookingView.vue`** to fetch from Supabase

**Test**: View event capacity, view booking details

---

## 🧪 Testing Checklist

- [ ] Events display correctly
- [ ] Cart persists across page refresh
- [ ] Customer registration saves to Supabase
- [ ] Stripe Checkout redirects correctly
- [ ] Payment success creates booking
- [ ] Attendees stored in database
- [ ] Email confirmation received
- [ ] Event capacity decrements
- [ ] Booking details viewable
- [ ] Admin can see bookings

---

## 🔧 Environment Setup

**Add to `lola-workshops/.env.local`**:
```env
VUE_APP_SUPABASE_URL=http://127.0.0.1:54321
VUE_APP_SUPABASE_ANON_KEY=your-anon-key
VUE_APP_DATA_SOURCE=supabase
```

**Start Supabase locally**:
```bash
cd /path/to/lola-as-one
supabase start
```

---

## 📊 Progress Tracking

| Task | Status | Priority |
|------|--------|----------|
| Event Display | ✅ Done | - |
| Cart Store | ⏳ Todo | High |
| Customer Registration | ⏳ Todo | High |
| Payment Integration | ⏳ Todo | Critical |
| Booking Creation | ⏳ Todo | Critical |
| Email Notifications | ⏳ Todo | High |
| Capacity Management | ⏳ Todo | High |
| Booking Views | ⏳ Todo | Medium |
| Newsletter | ⏳ Todo | Low |
| Testing | ⏳ Todo | Critical |

---

## 🆘 Common Issues

**Issue**: Supabase client not initialized
**Fix**: Check `.env.local` has correct URL and key

**Issue**: Webhook not receiving events
**Fix**: Configure Stripe webhook endpoint in Stripe Dashboard

**Issue**: Email not sending
**Fix**: Check Resend API key in Supabase secrets

**Issue**: Capacity not decrementing
**Fix**: Ensure `event_capacity` records exist for all events

---

## 📚 Key Resources

- **Full Epic**: `LEGACY_WEBSITE_MIGRATION_EPIC.md`
- **Schema**: `docs/schema.sql`
- **Edge Functions**: `supabase/functions/`
- **Reference Implementation**: `app/src/views/Checkout.vue`
- **Supabase Docs**: https://supabase.com/docs

---

## 🎯 Next Steps

1. Review full epic document
2. Set up local Supabase environment
3. Start with Task 1 (Cart Store)
4. Test each task before moving to next
5. Keep Firebase running as fallback

**Questions?** Review the full epic or ask for clarification on specific tasks.

