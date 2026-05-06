# Epic: Guest Checkout with Post-Purchase Account Claiming

## Summary

Lola As One should remain guest-first for ecommerce and event bookings.

Customers should be able to:

1. Book a workshop or place an order without creating an account.
2. Receive confirmation emails and success pages as they do today.
3. Later create or claim an account using the same email address.
4. See their historical orders, bookings, and subscriptions inside the account area once claimed.

The right model for this repo is not "auth-first checkout." It is:

- `customer` as the commerce identity
- `auth user` as the optional login identity

That model already exists in the project direction and should now be completed into a coherent customer flow.

## Current Repo State

### Checkout already supports guest purchase

- `app/src/views/Checkout.vue`
- `scripts/deploy-checkout-functions.sh`

The current checkout flow does not require authentication. Edge functions are already deployed in a guest-checkout-friendly way.

### Stripe webhook already creates customer records from checkout metadata

- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/stripe-webhook/README.md`

When checkout completes, the webhook:

- looks up a customer by email
- creates one if needed
- creates orders and order items
- creates bookings for event purchases

This means the system already treats checkout identity separately from auth login.

### Customers have already been decoupled from `auth.users`

- `scripts/migration/decouple-customers-from-auth.sql`
- `scripts/migration/BOOKINGS-MIGRATION-README.md`

The repo already introduced:

- `customers.id` as an independent UUID
- `customers.auth_user_id` as an optional link to `auth.users`

That is exactly the schema needed for guest checkout plus later account claiming.

### The public account area is still a placeholder

- `app/src/views/Account.vue`

The current account page is not yet backed by real customer history or claim logic.

### Login is currently password-first

- `app/src/views/Login.vue`

The existing login view supports sign up and sign in, but there is no dedicated "claim your past orders/bookings" flow yet.

## Problem Statement

Right now the data model supports guest customers, but the user journey does not.

This creates a gap:

1. Customers can successfully buy without an account.
2. Orders and bookings can exist for that customer email.
3. But there is no clear, trusted flow to later claim that history in an account area.

If the account area is implemented without solving this flow first, the product risks two bad outcomes:

1. forcing account creation at checkout, which adds friction and hurts conversion
2. launching an account area that only works for newly signed-up users, leaving guest purchasers confused about how to view past orders

## Goal

Implement a guest-first account system where customers can buy first and claim later.

After this epic:

- checkout and event booking still work without login
- customers can create or claim an account after purchase
- claimed accounts show historical orders and bookings for the same email
- future purchases with the same email continue to appear in that account

## Non-Goals

- Forcing account creation before checkout
- Building a full customer-service portal in v1
- Supporting automatic merges across multiple different customer emails
- Replacing current checkout or webhook architecture
- Solving advanced identity reconciliation beyond the primary-email case

## Success Criteria

1. A user can complete checkout or event booking without authentication.
2. A guest customer record is created or reused based on checkout email.
3. After purchase, the customer is clearly offered a way to create or claim an account.
4. If the customer authenticates with the same email address, the matching customer record is linked to that auth user.
5. The account area shows the customer's historical orders, workshop bookings, and subscriptions where applicable.
6. Existing guest purchases remain visible after account claim.
7. A claimed customer does not end up with duplicate visible histories for the same email.

## Product Principles

### Principle 1: Guest-first checkout

Do not add login as a prerequisite for commerce.

Workshops, products, and subscriptions should continue to prioritize conversion over account creation.

### Principle 2: Email is the primary claim key

For the first release, the claim flow should be based on the purchaser email address.

This matches current webhook behavior and keeps the initial identity model simple.

### Principle 3: Customer history belongs to the customer record, not the auth record

Orders and bookings should point to `customers.id`.

Authentication should grant access to the customer record by linking `customers.auth_user_id`, not by rewriting commerce ownership around auth.

### Principle 4: Account creation is an enhancement, not a gate

The account area is there to unlock:

- order history
- booking history
- subscription management
- faster future checkout

It should never block a first-time purchase.

## User Flows

### Flow 1: Guest event booking

1. User selects a workshop.
2. User enters attendee and contact details at checkout.
3. User pays without logging in.
4. Webhook creates or reuses a customer record by email.
5. Order and booking are created under that customer.
6. Success page and email include:
   - view your booking details
   - create an account to see past and future bookings

### Flow 2: Guest physical or digital product order

1. User adds items to cart.
2. User checks out as guest.
3. Order is stored under the customer record found or created by email.
4. Success page and email offer account claim.

### Flow 3: Post-purchase account claim

1. User clicks a CTA from success page, confirmation email, or login page.
2. User authenticates using the same email address used at checkout.
3. System finds the matching `customers` row by email.
4. If `auth_user_id` is empty, it is populated with the new auth user id.
5. The account area loads that customer's orders, bookings, and subscriptions.

### Flow 4: Existing claimed customer purchases again

1. User checks out again with the same email.
2. Webhook finds the existing customer record.
3. New orders/bookings attach to the same customer.
4. Account area automatically shows the new history.

### Flow 5: Customer wants history but has never created a password

Recommended first-release UX:

1. User enters email in a "claim your orders and bookings" flow.
2. User verifies ownership of that email.
3. User is either:
   - signed in directly via magic link, or
   - prompted to finish account creation after verification

Note:
The current app is password-first. This epic should decide whether to:

- add magic-link claim as the preferred path, or
- launch with password signup/signin and a post-verification claim step

Recommendation:
Prefer magic link for claim flows, even if password auth remains available elsewhere.

## Edge Cases

### Purchaser email vs attendee email

Bookings should be claimed by purchaser email, not attendee email.

That avoids confusion where a parent books for a child or for another adult attendee.

### Existing customer row already linked to another auth user

If a customer record already has a different `auth_user_id`, the system should not silently overwrite it.

That should surface a safe error path and likely require support or admin review.

### Multiple customer rows with the same email

If duplicates exist from legacy data, the claim flow must not guess incorrectly.

The project should either:

- prevent duplicates at the schema level if possible, or
- define a deterministic merge/review process before public rollout

### Different emails used across different purchases

This epic should not attempt automatic cross-email merging.

That should remain a later admin-assisted workflow.

## Delivery Plan

### Phase 0: Confirm Data Ownership and Constraints

### Step 0.1: Audit customer uniqueness by email

Tasks:

1. Confirm whether `customers.email` is unique today.
2. Find duplicate customer rows by normalized email.
3. Decide whether uniqueness should be enforced at the database level.

Acceptance criteria:

- The team knows whether email is safe to use as the first-release claim key.

### Step 0.2: Confirm all commerce records attach to `customers.id`

Tasks:

1. Verify orders attach to `customer_id`.
2. Verify event bookings can be resolved back to the customer record.
3. Verify subscriptions can be surfaced through the same customer relationship.

Acceptance criteria:

- Account history can be assembled from the customer record without inventing a second ownership model.

### Phase 1: Define the Claiming Model

### Step 1.1: Choose the primary claim experience

Options:

1. Password signup/signin, then claim by matching email.
2. Magic-link email verification, then claim automatically.
3. Hybrid: magic link preferred, password optional.

Recommended first release:

- Hybrid model
- magic link for claim CTAs
- password auth remains available on the normal login page

Acceptance criteria:

- One clear claiming path is chosen before implementation starts.

### Step 1.2: Define linking rules

Tasks:

1. On auth success, look up customer by normalized email.
2. If exactly one unlinked customer is found, set `auth_user_id`.
3. If no customer is found, allow auth but show an empty account state.
4. If a customer is already linked to the same auth user, do nothing.
5. If the customer is linked to a different auth user, fail safely.

Acceptance criteria:

- Claim behavior is deterministic and safe.

### Phase 2: Build the Account Claim Path

### Step 2.1: Add claim CTA entry points

Tasks:

1. Add a CTA on [app/src/views/OrderSuccess.vue](/Users/alexishindle/repos/projects/lola-as-one/app/src/views/OrderSuccess.vue).
1. Add a CTA on `app/src/views/OrderSuccess.vue`.
2. Add a CTA in confirmation emails.
3. Add a "Claim your bookings and orders" path on `app/src/views/Login.vue`.

Recommended copy:

- "Create an account to view your orders and bookings"
- "Already bought with us? Claim your history"

Acceptance criteria:

- Guest purchasers can discover the flow without hunting for it.

### Step 2.2: Implement post-auth claim logic

Tasks:

1. Add a server-owned linking path after auth.
2. Normalize email before matching.
3. Update `customers.auth_user_id` once verified.
4. Keep linking idempotent.

Acceptance criteria:

- A newly authenticated user can claim their historical customer record with the same email.

### Phase 3: Implement the Real Account Area

### Step 3.1: Replace placeholder account UI

Tasks:

1. Build real sections in [app/src/views/Account.vue](/Users/alexishindle/repos/projects/lola-as-one/app/src/views/Account.vue):
1. Build real sections in `app/src/views/Account.vue`:
   - profile
   - orders
   - workshop bookings
   - subscriptions
   - saved addresses later if available
2. Add loading, empty, and error states.

Acceptance criteria:

- Logged-in users see real account data instead of placeholder copy.

### Step 3.2: Add order history

Tasks:

1. Show past orders in reverse chronological order.
2. Allow drill-down into line items, totals, and statuses.
3. Show digital-download or shipping context where relevant.

Acceptance criteria:

- Customers can review previous purchases from the account area.

### Step 3.3: Add booking history

Tasks:

1. Show upcoming and past workshop bookings.
2. Include event date, time, attendees, and booking status.
3. Distinguish upcoming vs past events.

Acceptance criteria:

- Event purchasers can use the account area as their booking record.

### Step 3.4: Add subscription summary

Tasks:

1. Show active and past subscriptions.
2. Link to existing subscription-management functionality where possible.

Acceptance criteria:

- Subscription customers can see the current state of their plan from the same account area.

### Phase 4: Polish and Trust-Building

### Step 4.1: Improve post-purchase messaging

Tasks:

1. Update success-page messaging to explain that account creation is optional.
2. Clarify that past and future bookings/orders will appear automatically when using the same email.

Acceptance criteria:

- The flow feels helpful rather than coercive.

### Step 4.2: Add account-ready email templates or snippets

Tasks:

1. Update confirmation emails to include claim/account messaging.
2. Avoid overloading operational emails with too many secondary actions.

Acceptance criteria:

- Account claim feels like a natural follow-up, not a marketing interruption.

## Technical Considerations

### Customer matching

Email matching should use a normalized comparison:

- trimmed
- lowercased

If the database does not already enforce this consistently, the epic should add that hardening.

### RLS and privacy

The account area must only expose history for the linked `customers.auth_user_id`.

Public clients must never query arbitrary customer history by email alone.

### Idempotency

Claiming should be safe to retry.

If the same auth user claims the same customer twice, the second operation should be a no-op.

### Backfill risk

If older data is incomplete or duplicated, the claim flow may surface historical inconsistencies that checkout currently hides.

This should be treated as a rollout risk, not ignored.

## Testing Plan

### Scenario 1: Guest event booking then claim

1. Book an event as guest.
2. Confirm customer, order, and booking are created.
3. Create or verify an account with the same email.
4. Confirm booking appears in account area.

### Scenario 2: Guest product order then claim

1. Place a guest order.
2. Claim account with same email.
3. Confirm order history appears.

### Scenario 3: Existing account, repeat purchase

1. Sign up with an email.
2. Make a purchase with the same email.
3. Confirm the purchase appears under the existing account.

### Scenario 4: Mismatched email

1. Purchase with email A.
2. Sign in with email B.
3. Confirm history is not exposed incorrectly.

### Scenario 5: Duplicate/ambiguous customer data

1. Create a duplicate-email edge case in staging.
2. Confirm the system fails safely rather than linking unpredictably.

## Recommended Rollout Order

1. Audit customer email uniqueness and linking constraints.
2. Implement claim logic.
3. Add success-page and email CTAs.
4. Replace the placeholder account page with real history views.
5. Add magic-link claim UX if not included in the first pass.

## Expected Outcome

After this epic, Lola As One will have a customer-friendly account system that improves retention without harming checkout conversion.

Customers will be able to buy first and create an account later, while the business keeps a single commerce history per customer rather than splitting guest and registered flows into separate systems.
