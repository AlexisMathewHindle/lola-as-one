# Testing the Complete Checkout Flow

## ✅ What's Been Fixed

1. ✅ Deployment issues resolved
2. ✅ Localhost redirect fixed (now redirects to production URL)
3. ✅ 401 webhook errors fixed (no-verify-jwt added)
4. ✅ Negative bookings data corruption fixed
5. ✅ Database constraints added to prevent future issues
6. ✅ Capacity validation at multiple layers
7. ✅ Clear error messaging for users
8. ✅ Order success page created

## 🧪 Test Scenarios

### Test 1: Successful Booking

**Steps:**
1. Go to https://lola-workshops.netlify.app
2. Browse workshops and find one with available spaces
3. Click "+" to add to cart
4. Go to checkout
5. Fill in all required fields
6. Accept terms and conditions
7. Click "Proceed to Payment"
8. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/26)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
9. Complete payment

**Expected Results:**
- ✅ Redirected to `/order/success` (NOT localhost)
- ✅ Success message displayed
- ✅ Cart is cleared
- ✅ Confirmation email received (check inbox and spam)
- ✅ Admin notification email received
- ✅ Event booking confirmation email received
- ✅ Database updated:
  - Order created in `orders` table
  - Booking created in `bookings` table
  - `current_bookings` incremented in `offering_events`
  - `spaces_booked` incremented in `event_capacity`

### Test 2: Sold Out Event

**Setup:**
```sql
-- Make an event sold out for testing
UPDATE event_capacity 
SET spaces_booked = total_capacity
WHERE offering_event_id = 'YOUR_EVENT_ID';
```

**Steps:**
1. Try to add the sold-out event to cart
2. Click "+" button

**Expected Results:**
- ✅ Alert: "Sorry, this workshop is sold out."
- ✅ Quantity does NOT increment
- ✅ Event NOT added to cart

**Cleanup:**
```sql
-- Reset the event
UPDATE event_capacity 
SET spaces_booked = 0
WHERE offering_event_id = 'YOUR_EVENT_ID';
```

### Test 3: Insufficient Capacity

**Setup:**
```sql
-- Set event to have only 1 space available
UPDATE event_capacity 
SET spaces_booked = total_capacity - 1
WHERE offering_event_id = 'YOUR_EVENT_ID';
```

**Steps:**
1. Add event to cart (quantity 1) - should work
2. Try to increment to quantity 2
3. Click "+" button again

**Expected Results:**
- ✅ Alert: "Sorry, only 1 spots available for this workshop."
- ✅ Quantity stays at 1
- ✅ Cannot exceed available capacity

**Alternative: Try at Checkout**
1. Manually edit cart quantity to 2 (via browser console)
2. Proceed to checkout
3. Click "Proceed to Payment"

**Expected Results:**
- ✅ Error message: "Sorry, [Event Name] only has 1 space available. You're trying to book 2."
- ✅ Checkout does NOT proceed
- ✅ User can reduce quantity or remove item

### Test 4: Race Condition (Two Users, Last Spot)

**Setup:**
```sql
-- Set event to have only 1 space available
UPDATE event_capacity 
SET spaces_booked = total_capacity - 1
WHERE offering_event_id = 'YOUR_EVENT_ID';
```

**Steps:**
1. Open two browser windows (or use incognito)
2. In both windows, add the same event to cart
3. In Window 1: Complete checkout and payment
4. In Window 2: Try to complete checkout

**Expected Results:**
- ✅ Window 1: Checkout succeeds
- ✅ Window 2: Gets error "Sorry, [Event Name] is now sold out"
- ✅ Only ONE booking is created
- ✅ Event capacity is correct (fully booked)

### Test 5: Email Delivery

**Steps:**
1. Complete a successful booking (Test 1)
2. Check email inbox (use your real email)

**Expected Emails:**

**1. Order Confirmation (to customer):**
- Subject: "Order Confirmation - LOLA Workshops"
- Contains: Order number, items, total, event details

**2. Event Booking Confirmation (to customer):**
- Subject: "Workshop Booking Confirmed - [Event Name]"
- Contains: Event date, time, location, what to bring

**3. Admin Notification (to admin):**
- Subject: "New Order - [Order Number]"
- Contains: Customer details, order items, total

**Check:**
- ✅ All 3 emails received
- ✅ Correct information in each email
- ✅ Links work (if any)
- ✅ Formatting looks good

### Test 6: Database Constraints

**Test Negative Bookings Prevention:**
```sql
-- Try to set negative bookings (should FAIL)
UPDATE offering_events 
SET current_bookings = -1
WHERE id = 'ANY_EVENT_ID';
```

**Expected Result:**
```
ERROR: check constraint "current_bookings_non_negative" of relation "offering_events" is violated
```

**Test Negative Spaces Prevention:**
```sql
-- Try to set negative spaces_booked (should FAIL)
UPDATE event_capacity 
SET spaces_booked = -1
WHERE offering_event_id = 'ANY_EVENT_ID';
```

**Expected Result:**
```
ERROR: check constraint "spaces_booked_non_negative" of relation "event_capacity" is violated
```

## 🔍 Monitoring & Logs

### Check Supabase Function Logs

**Checkout Function:**
https://supabase.com/dashboard/project/hubbjhtjyubzczxengyo/functions/create-checkout-session/logs

Look for:
- `🛒 Create checkout session request received`
- `📦 Request data:`
- `🔍 Looking up event by event_id:`
- `Event capacity check for [Event Name]:`
- ✅ No errors

**Webhook Function:**
https://supabase.com/dashboard/project/hubbjhtjyubzczxengyo/functions/stripe-webhook/logs

Look for:
- `🔔 Webhook request received`
- `✅ Webhook signature verified`
- `💰 Processing checkout.session.completed`
- `✅ Order created`
- `✅ Booking created`
- `✅ Decremented capacity for event`
- `📧 Sending order confirmation/receipt email`
- ✅ No errors

**Email Function:**
https://supabase.com/dashboard/project/hubbjhtjyubzczxengyo/functions/send-email/logs

Look for:
- `📧 Send email function called`
- `📧 Sending email via Resend to: [email]`
- `✅ Email sent successfully`

### Check Resend Dashboard

https://resend.com/emails

- ✅ Emails appear in dashboard
- ✅ Status: "Delivered"
- ✅ No bounces or errors

## 🐛 Troubleshooting

### Issue: Still redirecting to localhost

**Solution:**
```bash
# Verify APP_URL is set
supabase secrets list --project-ref hubbjhtjyubzczxengyo | grep APP_URL

# If not set or wrong:
supabase secrets set APP_URL=https://lola-workshops.netlify.app --project-ref hubbjhtjyubzczxengyo

# Redeploy
supabase functions deploy create-checkout-session --no-verify-jwt --project-ref hubbjhtjyubzczxengyo
```

### Issue: No emails received

**Check:**
1. Supabase send-email function logs for errors
2. Resend dashboard for delivery status
3. Spam folder
4. RESEND_API_KEY is set correctly

### Issue: Webhook 401 errors

**Solution:**
```bash
# Redeploy with --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt --project-ref hubbjhtjyubzczxengyo
```

### Issue: Capacity not updating

**Check:**
1. `decrement_event_capacity` RPC function exists
2. Webhook is calling the RPC function
3. Database constraints are not blocking updates

## ✅ Success Criteria

All of these should be true:

- [ ] User can successfully complete checkout
- [ ] User is redirected to production success page (not localhost)
- [ ] User receives 3 emails (order confirmation, booking confirmation, admin notification)
- [ ] Cart is cleared after successful checkout
- [ ] Event capacity is correctly decremented
- [ ] Cannot book sold-out events
- [ ] Cannot book more spaces than available
- [ ] Clear error messages shown to users
- [ ] Database constraints prevent negative bookings
- [ ] No errors in Supabase function logs

