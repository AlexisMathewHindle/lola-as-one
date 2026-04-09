# Epic: Populate Basket "Other People Bought" Recommendations

## Summary

The basket in the new app should show a small set of relevant recommendations under an "Other people bought" section.

The strongest signal available in this repo is real co-purchase data from completed orders. The right implementation is to use that data as the primary ranking source, but expose it to the basket through a server-owned, public-safe path rather than querying raw order tables from the browser.

This epic covers:

1. Defining the recommendation strategy for the basket.
2. Creating a safe backend source for recommendations.
3. Adding fallback logic for low-data and cold-start cases.
4. Rendering recommendations in the basket UI.
5. Verifying that recommendations stay relevant and never surface unavailable items.

## Current Repo State

### Basket page exists but has no recommendation block yet

- `app/src/views/Cart.vue`

The cart currently renders items and the order summary only.

### Existing related-item patterns already exist on detail pages

- `app/src/views/ProductDetail.vue`
- `app/src/views/BoxDetail.vue`
- `app/src/views/WorkshopDetail.vue`

These files already implement lightweight related-item sections based on content similarity or category matching. That logic is useful as a fallback when co-purchase data is missing.

### Real purchase data already exists in Supabase

- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/stripe-webhook/README.md`

Paid checkout flow already creates:

- `orders`
- `order_items`
- `bookings` for events

This is the core dataset needed for "people also bought" style recommendations.

### Order item data is not public-readable from the browser

- `scripts/migration/fix-all-admin-rls-policies.sql`

`order_items` is protected by admin-only RLS rules. That means the basket page should not query co-purchase data directly from Supabase client-side.

### Public catalog data already exists for rendering recommendation cards

- `offerings`
- `offering_products`
- `offering_digital_products`
- `offering_events`
- `event_categories`

The frontend already uses these tables to render product, box, and workshop cards elsewhere in the app.

## Problem Statement

The basket has no recommendation source today, and the most useful data source for this feature, `order_items`, is intentionally not exposed to public clients.

That creates two requirements:

1. Recommendations must be generated from real order history on the backend.
2. The basket must only consume a public-safe result set.

If this is implemented as a direct browser query against raw order data, it will either fail because of RLS or push the project toward unsafe data access patterns.

## Goal

Show 3 to 4 useful recommendations in the basket using real co-purchase behaviour when available, with deterministic fallbacks when there is not enough historical data.

## Non-Goals

- Full per-user personalization in the first release.
- Machine learning or embeddings.
- Complex bundle pricing or discount automation.
- Cross-session recommendation memory.
- Admin tooling for manually curating recommendations in the first release.

## Success Criteria

1. The basket shows a recommendation block when there is at least one eligible suggestion.
2. Recommendations are primarily ranked from paid or fulfilled order history.
3. The basket never queries `orders` or `order_items` directly from the public client.
4. Items already in the basket are excluded.
5. Unpublished, unavailable, out-of-stock, sold-out, or past items are excluded.
6. The feature still returns reasonable results when co-purchase data is sparse.
7. The implementation is easy to evolve later into manual curation or more advanced scoring.

## Recommendation Strategy

### Primary signal: co-purchase data

Use completed orders to answer:

"Given the set of offering IDs currently in the basket, which other offering IDs most often appear in the same completed orders?"

Recommended source filters:

- `orders.status IN ('paid', 'fulfilled')`
- exclude canceled, failed, pending, or abandoned orders

Recommended scoring inputs:

- co-purchase count
- number of distinct orders containing both items
- optional recency weighting
- optional normalization to prevent generic bestsellers from dominating

### Secondary signal: content-based fallback

When co-purchase data is weak or absent, fall back to existing repo patterns:

- workshops: same category, upcoming, published
- digital products: same product type, published
- boxes: same family or adjacent catalog items

### Final fallback: bestsellers

If neither co-purchase nor content-based matching can fill the slot count, use overall top sellers by relevant item type.

## Delivery Plan

## Phase 0: Define Scope and Data Contract

### Step 0.1: Confirm which basket item types should participate

Tasks:

1. List all basket-supported item types in the new app.
2. Decide which types can generate recommendations:
   - `event`
   - `product_physical`
   - `product_digital`
   - `subscription`
3. Decide which types can be recommended back into the basket.

Recommended first-release rule:

- allow `event`, `product_physical`, and `product_digital`
- exclude `subscription` from recommendations unless there is a strong business reason to show it

Acceptance criteria:

- There is a clear matrix of input item type to candidate recommendation type.

### Step 0.2: Define the frontend response shape

Tasks:

1. Define a compact recommendation payload the basket can render directly.
2. Include only public-safe fields.

Recommended response shape:

- `offering_id`
- `offering_type`
- `title`
- `slug`
- `image_url`
- `price_gbp`
- `reason`
- `score`
- event-specific fields when needed:
  - `event_id`
  - `event_date`
  - `event_start_time`
  - `category_name`

Acceptance criteria:

- The response can render recommendation cards without extra round trips where possible.

## Phase 1: Design the Backend Recommendation Source

### Step 1.1: Choose the server-owned access pattern

Options:

1. Edge function that accepts current basket offering IDs and returns recommendations.
2. Precomputed table or materialized table populated by a scheduled job.
3. Hybrid approach:
   - precompute pair scores
   - resolve current basket recommendations via edge function

Recommended first version:

- use a hybrid model
- precompute pair scores into a small recommendations table
- expose a simple edge function for the basket

Reason:

- avoids expensive live aggregation on every basket page load
- keeps raw `order_items` private
- makes the client contract stable

Acceptance criteria:

- The team agrees on one server-owned recommendation access pattern before implementation begins.

### Step 1.2: Define the precomputed schema

Create a table for pairwise recommendation scores, for example:

- `source_offering_id`
- `recommended_offering_id`
- `co_purchase_count`
- `score`
- `last_ordered_at`
- `updated_at`

Optional additions:

- `source_type`
- `recommended_type`
- `rank`
- `reason_code`

Acceptance criteria:

- The schema supports fast lookup by source offering ID and easy future re-ranking.

### Step 1.3: Define availability filtering rules

Tasks:

1. Decide how recommendation rows are filtered before returning to the basket.
2. Ensure the edge function or query layer only returns valid items.

Filtering rules should include:

- offering is published
- product is in stock if physical
- event is not sold out
- event date is today or in the future
- item is not already in cart
- item is not duplicated in the response

Acceptance criteria:

- No invalid recommendation can be displayed from stale pair data alone.

## Phase 2: Build the Co-Purchase Data Pipeline

### Step 2.1: Define the canonical order-history query

Tasks:

1. Use `orders` joined to `order_items`.
2. Limit to paid or fulfilled orders.
3. Treat each order as a set of distinct offering IDs.
4. Generate pair counts for all item pairs inside the same order.

Important:

- multiple quantities of the same item should not artificially inflate pair frequency unless explicitly desired
- start with distinct item presence per order, not quantity-weighted pairs

Acceptance criteria:

- A single order contributes one unit of evidence per item pair.

### Step 2.2: Calculate scores

Tasks:

1. Start with simple co-purchase count.
2. Add a normalization term if generic bestsellers overwhelm the results.

Recommended scoring sequence:

1. V1: `score = co_purchase_count`
2. V2: upgrade to a normalized score such as:
   - lift
   - cosine similarity
   - co-purchase count divided by candidate popularity

Acceptance criteria:

- A candidate that appears with everything does not dominate all recommendation lists forever.

### Step 2.3: Decide update cadence

Options:

1. Recompute on a schedule, for example nightly.
2. Update incrementally after each paid order.
3. Use both:
   - incremental updates for freshness
   - periodic full rebuild for correction

Recommended first version:

- nightly rebuild plus optional later incremental update

Acceptance criteria:

- Recommendation data stays current without adding too much complexity to checkout.

## Phase 3: Add Cold-Start and Sparse-Data Fallbacks

### Step 3.1: Reuse existing related-item logic

Tasks:

1. Document which current detail-page queries can be reused conceptually.
2. Mirror those rules in a shared recommendation helper or edge function.

Suggested fallback rules:

- for events:
  - same category
  - future dates only
  - nearest upcoming events first
- for digital products:
  - same type or adjacent digital catalog items
- for physical products:
  - related boxes or complementary products

Acceptance criteria:

- The basket can still render useful suggestions even when order history is thin.

### Step 3.2: Add bestseller fallback

Tasks:

1. Use overall top sellers by eligible type when co-purchase and related-item fallback do not fill all slots.
2. Keep the same exclusion and availability rules.

Acceptance criteria:

- Empty recommendation sections are rare unless no valid items exist.

## Phase 4: Expose a Public-Safe Read Path

### Step 4.1: Build the edge function contract

Tasks:

1. Create an edge function such as `get-basket-recommendations`.
2. Accept the current basket as input:
   - offering IDs
   - optional item types
3. Return ranked recommendations with public-safe fields only.

Function responsibilities:

- aggregate recommendations across all basket items
- deduplicate candidates
- exclude items already in basket
- apply availability and publish-state filtering
- fill missing slots with fallback sources

Acceptance criteria:

- The client needs only one request to fetch basket recommendations.

### Step 4.2: Add guardrails and observability

Tasks:

1. Log basket size and recommendation count.
2. Log fallback path used:
   - co-purchase
   - related
   - bestseller
3. Handle empty results without throwing frontend-visible errors.

Acceptance criteria:

- Recommendation failures degrade gracefully and are easy to debug.

## Phase 5: Render the Basket Recommendation Block

### Step 5.1: Add the section to the basket page

Primary file:

- `app/src/views/Cart.vue`

Tasks:

1. Add a new section below cart items or below the summary area, depending on layout.
2. Load recommendations only when the basket has items.
3. Keep the section hidden if no recommendations are returned.

Recommended UX:

- title: `Other people bought`
- 3 to 4 cards maximum
- simple CTA:
  - `Add to cart` for products
  - `View workshop` for events if extra event selection is needed

Acceptance criteria:

- The section feels native to the existing cart page and does not crowd checkout actions.

### Step 5.2: Render type-specific recommendation cards

Tasks:

1. Reuse existing catalog card patterns where practical.
2. Display item-type-specific metadata:
   - products: image, title, price
   - events: image, title, date, time
3. Use the same navigation patterns already present in the app.

Acceptance criteria:

- Recommendation cards are visually consistent with the rest of the storefront.

### Step 5.3: Handle add-to-cart behaviour

Tasks:

1. For simple products, allow direct add-to-cart from the recommendation card.
2. For events, decide whether direct add-to-cart is valid or whether the user must go to the detail page first.
3. Prevent duplicate additions where appropriate.

Acceptance criteria:

- Recommended items can be acted on without confusing cart behaviour.

## Phase 6: Testing and Verification

### Step 6.1: Test recommendation quality

Test cases:

1. Basket with a single workshop.
2. Basket with multiple workshops from the same category.
3. Basket with a physical product only.
4. Basket with a digital product only.
5. Basket with mixed item types.
6. Basket containing the most popular item in the catalog.

Verify:

- results are relevant
- already-selected items are excluded
- low-quality generic items do not dominate

### Step 6.2: Test availability rules

Test cases:

1. Candidate product goes out of stock.
2. Candidate event sells out.
3. Candidate event date passes.
4. Offering is unpublished.

Verify:

- unavailable items never appear in the basket recommendation block

### Step 6.3: Test fallback behaviour

Test cases:

1. Fresh environment with no orders.
2. Basket item with very little history.
3. Basket with mixed item types and sparse pair data.

Verify:

- the basket still gets recommendations from fallback logic
- the UI remains stable when the result set is empty

## Phase 7: Post-Launch Iteration

### Step 7.1: Add recommendation analytics

Track:

- recommendation impressions
- clicks
- add-to-cart from recommendation
- conversion to order

Acceptance criteria:

- The team can evaluate whether the block is actually useful.

### Step 7.2: Refine ranking rules

Possible future improvements:

- recency weighting
- seasonal weighting
- category diversity
- manual merchandised overrides
- suppression rules for low-performing candidates

Acceptance criteria:

- Ranking can improve without changing the public client contract.

## Implementation Notes

### Why not query `order_items` directly from the basket?

Because `order_items` is admin-protected under RLS. The basket in the public app should consume only a curated result set from a server-owned path.

### Why not build this entirely from existing related-item logic?

Because "Other people bought" is stronger when it reflects real completed orders. Existing related-item logic is still valuable, but it should be the fallback, not the main ranking source.

### Why a hybrid backend approach is the best fit here

A hybrid approach is the best balance for this repo:

- co-purchase scoring stays server-owned
- raw order data stays private
- basket response stays fast
- fallback logic can be layered in without exposing internals

## Suggested First Release Scope

If this work needs to be sliced tightly, the recommended first release is:

1. Precompute pairwise co-purchase scores from `orders` and `order_items`.
2. Expose a `get-basket-recommendations` edge function.
3. Add basket rendering in `app/src/views/Cart.vue`.
4. Support fallback to:
   - same-category future workshops
   - simple related products
   - bestsellers
5. Exclude subscriptions from the first release.

## File Areas Likely Involved

### Frontend

- `app/src/views/Cart.vue`
- `app/src/stores/cart.js`
- optional shared UI component for recommendation cards

### Backend

- new migration for recommendation storage
- new edge function for basket recommendations
- optional scheduled recompute script or function
- optional shared helper for ranking and filtering

### Reference logic already in repo

- `app/src/views/WorkshopDetail.vue`
- `app/src/views/ProductDetail.vue`
- `app/src/views/BoxDetail.vue`
- `app/src/views/admin/AnalyticsDashboard.vue`
- `supabase/functions/stripe-webhook/index.ts`

## Definition of Done

This epic is complete when:

1. The basket shows relevant recommendations from a public-safe backend path.
2. Recommendations are primarily derived from completed-order co-purchase data.
3. Fallback logic fills gaps when order history is weak.
4. Invalid or unavailable items are never shown.
5. The implementation is documented well enough for future ranking and analytics improvements.
