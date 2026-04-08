# Epic: Stabilise Coupons and Move Coupon Management to Supabase

## Summary

Coupons are not reliable in the current codebase because the legacy admin UI still writes coupons to Firebase, while checkout validation now reads coupons from Supabase.

There is also a second issue: the checkout and Stripe session creation flow do not currently send coupon data or discounted totals to the backend. A coupon can appear applied in the UI but still fail to affect the Stripe charge.

This epic covers:

1. Stabilising the current coupon flow so live coupons actually work.
2. Moving coupon storage and management from Firebase to Supabase.
3. Adding coupon support to the new backend and new admin app.

## Current Repo State

### Legacy admin still writes coupons to Firebase

- `lola-workshops/src/components/CouponComponent.vue`
- `lola-workshops/src/views/CouponsView.vue`
- `lola-workshops/src/router/index.ts`

The admin coupon screen uses Firestore CRUD via `getDocs`, `addDoc`, `updateDoc`, and `deleteDoc`.

### Legacy basket validates coupons from Supabase

- `lola-workshops/src/lib/supabase.ts`
- `lola-workshops/src/views/BasketView.vue`

The basket uses `validateCoupon()` against `supabase.from("coupons")`.

### The Supabase coupons table is not defined in this repo

There is currently no migration for a `coupons` table under `supabase/migrations/`.

### Checkout does not send coupon data to the backend

- `lola-workshops/src/views/CheckoutView.vue`
- `lola-workshops/src/views/PaymentView.vue`
- `supabase/functions/create-checkout-session/index.ts`

The frontend sends raw item prices to the checkout function. The checkout function recalculates totals from those raw prices and does not accept:

- `coupon_code`
- `discount_amount`
- `discount_type`
- `final_total`

### New admin app has no coupon management yet

- `app/src/router/index.js`
- `app/src/layouts/AdminLayout.vue`
- `app/src/views/admin/`

The new Supabase-backed admin app has no coupon route, list view, form view, or coupon service layer.

## Problem Statement

Today’s coupon setup has split ownership:

- Firebase is the write path.
- Supabase is the read path.
- Stripe checkout is effectively a third system with no coupon awareness.

That means coupons can fail in three ways:

1. A coupon exists in Firebase but not in Supabase, so validation fails.
2. A coupon validates in the basket, but the backend still charges full price.
3. The new app cannot manage coupons at all.

## Goal

Make Supabase the single source of truth for coupons and ensure coupon logic is enforced server-side during checkout.

## Non-Goals

- Full loyalty or gift-card support.
- Marketing campaign tooling.
- Complex stacked discounts in the first release.

## Success Criteria

1. An admin can create, edit, disable, and delete coupons from the new admin app.
2. Coupon validation happens against Supabase only.
3. Discount calculation is enforced by the backend, not trusted from the browser.
4. Stripe charges the discounted amount, not the pre-discount amount.
5. Orders record which coupon was used and the discount amount applied.
6. Firebase is no longer required for coupon management.

## Delivery Plan

## Phase 0: Immediate Stabilisation

This phase should be treated as a blocking fix before any broader migration work.

### Step 0.1: Confirm live source-of-truth data

Tasks:

1. Export the current coupon records from Firebase.
2. Inspect the live Supabase project for a `coupons` table and any existing coupon rows.
3. Compare the two datasets and identify mismatches.

Acceptance criteria:

- We have a definitive list of live coupon codes.
- We know whether checkout is currently using an empty, partial, or unmanaged Supabase dataset.

### Step 0.2: Stop creating new split-brain coupon records

Tasks:

1. Freeze coupon creation in the Firebase admin screen, or clearly label it as deprecated until Supabase write support exists.
2. Communicate to the team that Firebase is no longer the long-term coupon source.

Acceptance criteria:

- No new coupon is created in Firebase without a matching Supabase record.

### Step 0.3: Patch checkout so discounts affect payment

Tasks:

1. Update the frontend checkout request to include coupon context.
2. Update `supabase/functions/create-checkout-session/index.ts` to validate the coupon server-side.
3. Recalculate the canonical total in the edge function.
4. Send discounted prices or a Stripe discount mechanism into the Stripe session.
5. Persist coupon metadata on the Stripe session for webhook processing.

Acceptance criteria:

- A valid coupon changes the Stripe charge amount.
- An invalid coupon is rejected by the backend even if the browser tries to submit it.

## Phase 1: Design the Supabase Coupon Model

### Step 1.1: Define the coupon schema

Create a new migration for a `coupons` table with at least:

- `id`
- `code`
- `discount_type`
- `discount_value`
- `is_active`
- `valid_from`
- `valid_until`
- `usage_limit`
- `usage_count`
- `per_customer_limit`
- `applies_to`
- `metadata`
- `created_at`
- `updated_at`
- `created_by`

Notes:

- `code` should be unique and stored in uppercase.
- `discount_type` should be constrained to `percentage` or `fixed`.
- `applies_to` can start simple, for example `all`, `events`, `products`, `subscriptions`, then expand later if needed.

### Step 1.2: Define redemption tracking

Create either:

- a `coupon_redemptions` table, or
- coupon fields directly on `orders` plus a supporting audit table.

Recommended first version:

- keep coupon summary fields on `orders`
- add `coupon_redemptions` for history and usage counting

Suggested fields:

- `coupon_id`
- `order_id`
- `customer_id`
- `coupon_code`
- `discount_amount`
- `currency`
- `redeemed_at`

### Step 1.3: Add RLS and access rules

Tasks:

1. Admin users can manage coupons.
2. Public clients do not write coupons directly.
3. Validation for checkout happens through an edge function or a controlled RPC path.

Acceptance criteria:

- Coupon writes are admin-only.
- Anonymous clients cannot bypass coupon rules with direct table writes.

## Phase 2: Migrate Existing Coupon Data from Firebase

### Step 2.1: Export Firebase coupons

Tasks:

1. Write a one-off export script for Firebase coupons.
2. Capture all fields currently used in Firestore:
   - `code`
   - `discountType`
   - `discountValue`
   - `expiration`
   - `isActive`

### Step 2.2: Transform into Supabase shape

Tasks:

1. Map `discountType` to `discount_type`.
2. Map `discountValue` to `discount_value`.
3. Map `isActive` to `is_active`.
4. Normalize `code` to uppercase and trim whitespace.
5. Convert date fields into ISO format.
6. Flag any coupon that depends on hardcoded legacy logic.

Important:

`SUMMER25` and `ARTCLASS25` are currently special-cased in `lola-workshops/src/views/BasketView.vue`. Those rules need to move into backend validation rules instead of staying as browser-only exceptions.

### Step 2.3: Import and validate

Tasks:

1. Load transformed coupons into Supabase.
2. Verify row counts match the Firebase export.
3. Manually validate a sample of active, expired, and inactive codes.

Acceptance criteria:

- Every live coupon exists in Supabase with the expected status and amount.

## Phase 3: Build Shared Coupon Validation on the Backend

### Step 3.1: Create a canonical validation path

Implement coupon validation in one server-owned place:

- edge function helper shared by checkout functions, or
- Postgres function invoked by edge functions

Validation rules should include:

- code exists
- active status
- valid date window
- basket eligibility
- usage limit
- per-customer limit
- non-negative final total

### Step 3.2: Move legacy special rules out of the browser

Tasks:

1. Re-implement `SUMMER25` logic server-side.
2. Re-implement `ARTCLASS25` logic server-side.
3. Decide whether those should remain named exceptions or become normal schema-driven rules.

Recommendation:

Keep the first migration simple by supporting a small `metadata` rules object, then replace named hardcoded exceptions later.

### Step 3.3: Return a backend coupon decision object

The backend should return a normalised result such as:

- coupon id
- coupon code
- discount amount
- pre-discount subtotal
- final total
- rejection reason if invalid

Acceptance criteria:

- The browser only displays the decision returned by the backend.
- Final price comes from backend logic, not local math alone.

## Phase 4: Add Coupon Management to the New Admin App

### Step 4.1: Add routes and navigation

Tasks:

1. Add `/admin/coupons` to `app/src/router/index.js`.
2. Add a coupon nav item in `app/src/layouts/AdminLayout.vue`.

### Step 4.2: Build admin views

Recommended files:

- `app/src/views/admin/CouponsList.vue`
- `app/src/views/admin/CouponForm.vue`
- optional shared modal/component under `app/src/components/admin/`

Features:

- list/search coupons
- create coupon
- edit coupon
- activate/deactivate coupon
- delete coupon
- display usage count and validity window

### Step 4.3: Add data access helpers

Tasks:

1. Add a coupon service module in `app/src/lib/` or `app/src/composables/`.
2. Keep write logic out of the views.
3. Reuse admin auth checks already used elsewhere in the app.

Acceptance criteria:

- Admin can manage coupons in the Supabase app without Firebase.

## Phase 5: Integrate Coupons into New Checkout and Order Flow

### Step 5.1: Add coupon UX to the new storefront

Potential touchpoints:

- `app/src/views/Cart.vue`
- `app/src/views/Checkout.vue`

Tasks:

1. Add coupon entry UI.
2. Show validation status and discount summary.
3. Prevent stacking if the business rules only allow one coupon.

### Step 5.2: Send coupon code, not trusted totals

Tasks:

1. Frontend sends `coupon_code` with the basket payload.
2. Backend validates the basket and coupon together.
3. Backend computes final totals.
4. Browser renders backend-confirmed totals.

### Step 5.3: Persist coupon info through Stripe and webhook processing

Tasks:

1. Include coupon metadata in the Stripe session.
2. Update `supabase/functions/stripe-webhook/index.ts` to store:
   - coupon id
   - coupon code
   - discount amount
   - original subtotal
   - final charged total
3. Update order admin views if needed to show applied coupons.

Acceptance criteria:

- Coupon usage is visible on the resulting order record.
- Finance and support can trace how an order total was reduced.

## Phase 6: Decommission Firebase Coupon Management

### Step 6.1: Remove legacy coupon admin route

Tasks:

1. Remove or disable `lola-workshops/src/views/CouponsView.vue`.
2. Remove the legacy route from `lola-workshops/src/router/index.ts`.
3. Remove legacy Firebase coupon CRUD code once the new admin is live.

### Step 6.2: Remove dead assumptions

Tasks:

1. Delete any coupon logic that still assumes Firebase as a source.
2. Update internal docs to point to Supabase and the new admin app only.

Acceptance criteria:

- There is exactly one coupon source of truth: Supabase.

## QA Plan

### Functional tests

1. Active percentage coupon applies correctly.
2. Active fixed coupon applies correctly.
3. Expired coupon is rejected.
4. Inactive coupon is rejected.
5. Unknown coupon is rejected.
6. Coupon cannot reduce total below zero.
7. Special legacy coupon rules behave correctly.
8. Coupon is reflected in Stripe charge amount.
9. Coupon is persisted on the resulting order.
10. Usage limit blocks further redemptions when exhausted.

### Regression tests

1. Event checkout still works without a coupon.
2. Product checkout still works without a coupon.
3. Subscription checkout behavior is explicitly tested, whether supported or blocked.
4. Inventory and capacity checks still run before checkout creation.

### Admin tests

1. Admin can create a coupon.
2. Admin can edit a coupon.
3. Admin can disable a coupon and it immediately stops validating.
4. Admin can see coupon usage data.

## Rollout Plan

1. Audit and patch the existing live flow.
2. Ship the Supabase schema and migration scripts.
3. Import live coupons from Firebase.
4. Enable backend coupon validation in checkout.
5. Release the new admin coupon UI.
6. Freeze Firebase coupon management.
7. Remove Firebase coupon management after verification.

## Suggested Stories / Tickets

1. Audit current live coupon data across Firebase and Supabase.
2. Patch checkout so coupon discounts affect Stripe totals.
3. Create Supabase coupons and coupon_redemptions schema.
4. Add RLS policies for coupon management.
5. Build Firebase-to-Supabase coupon migration script.
6. Move legacy special coupon rules into backend validation.
7. Add coupon admin screens to the new `app/`.
8. Add coupon support to the new storefront checkout flow.
9. Persist coupon data in orders and webhook processing.
10. Remove legacy Firebase coupon admin screens.

## Open Questions

1. Should coupons apply to events only, or also products and subscriptions?
2. Should shipping be discountable?
3. Is one coupon per order enough for v1?
4. Do we need per-customer limits immediately, or can that wait for phase 2?
5. Should legacy named coupons be preserved as-is, or rewritten into a generic rules model?

## Recommended Execution Order

1. Fix the live charging gap first.
2. Create the Supabase schema second.
3. Migrate Firebase data third.
4. Move admin management into the new app fourth.
5. Remove Firebase last.

## Definition of Done

This epic is done when:

1. Coupons are created and managed only in Supabase.
2. All live coupon validation happens server-side.
3. Stripe charges reflect the discounted total.
4. Orders record the coupon and discount used.
5. Firebase is no longer required for coupon operations.
