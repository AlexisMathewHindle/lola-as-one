# Subscription Customer Flow (Curated Plans)

## 1. Overview

Admin configuration for curated subscription plans (3‑month, 6‑month, every‑other‑month) is in place, including `subscription_plan_boxes`. The remaining gap is the **customer‑facing flow** for buying these subscriptions.

Required UX (from product):

> `/shop` → select 3‑month → view where you can select permitted boxes → user selects boxes → click **Subscribe** → check available boxes → go to basket if available → else suggest other boxes.

This document is the source of truth for that flow and its integration with cart + checkout.

## 2. Goals and Non‑Goals

### 2.1 Goals

- **G1:** From `/shop`, selecting a subscription plan (e.g. "3‑month subscription") routes to a subscription detail screen.
- **G2:** The detail screen shows **only curated eligible boxes** for that plan (from `subscription_plan_boxes`).
- **G3:** User can select up to the plan’s allowed number of boxes and click **Subscribe**.
- **G4:** System checks availability of the chosen boxes.
- **G5:** If all are available, a configured subscription is added to the **same cart** as one‑time products and the user is taken to `/cart`.
- **G6:** If some boxes are unavailable, the user is told which ones and offered alternatives from the same plan.

### 2.2 Non‑Goals

- N1: Admin UI and data model for configuring plans and `subscription_plan_boxes` (already implemented).
- N2: Long‑term subscription management UI (pause, swap boxes mid‑plan, etc.).
- N3: Email or marketing flows around subscriptions.

## 3. User Journeys

### 3.1 Happy path – subscription only

1. User visits `/shop`.
2. User clicks a subscription offering (e.g. "3‑month subscription").
3. App routes to subscription detail page for that slug.
4. Page loads curated eligible boxes via `subscription_plan_boxes` and displays them as selectable cards.
5. User selects up to the allowed number of boxes for that plan.
6. User clicks **Subscribe**.
7. App checks availability for the selected boxes.
8. All boxes are available → app constructs a subscription cart item and adds it to the Pinia cart.
9. App navigates to `/cart` for review and then `/checkout`.

### 3.2 Mixed cart – one‑time + new subscription

1. Cart may already contain one‑time items.
2. User follows steps 1–7 as above.
3. On success, the new subscription item is **added alongside** existing cart items.
4. User reviews a mixed basket (one‑time + subscription) on `/cart` and proceeds to `/checkout`.

### 3.3 Error path – some boxes unavailable

1. User follows steps 1–6 from 3.1.
2. Availability check finds one or more selected boxes unavailable (out of stock or unpublished).
3. App clearly indicates which selections are unavailable.
4. App shows other curated boxes from the same plan that are still available.
5. User adjusts selections and retries.

## 4. Data Model & Queries

### 4.1 Tables involved

- **offerings**
  - `id`, `slug`, `title`, `type`, `status`, `metadata`.
  - Subscription plans use `type = 'subscription'` and `metadata` for Stripe and plan details.
- **offering_products**
  - For physical boxes **and** subscriptions.
  - Key fields: `id`, `offering_id`, `price_gbp`, `track_inventory`, `stock_quantity`, `available_for_subscription`.
- **subscription_plan_boxes**
  - `subscription_offering_id` → `offerings.id` (subscription plan).
  - `offering_product_id` → `offering_products.id` (eligible physical box product).
- **inventory_items** (optional later)
  - For deeper inventory checks beyond simple `stock_quantity`.

### 4.2 Frontend queries

- **From `/shop`:**
  - Load products from `offering_products` joined to `offerings`.
  - Subscription plans are `offerings.type = 'subscription'` and `status = 'published'`.
- **On subscription detail page:**
  1. Load the subscription offering by slug from `offerings` (`type = 'subscription'`, `status = 'published'`).
  2. Load curated boxes for that plan from `subscription_plan_boxes` filtered by `subscription_offering_id = offering.id`, joined to `offering_products` and their `offerings` rows for display + stock info.

## 5. Cart Representation

A configured subscription must be representable as a **single cart item** with extra configuration.

**Proposed minimal structure for a subscription cart item:**

```json
{
  "id": "<subscription_offering_id>",
  "type": "subscription",
  "title": "3-Month Subscription",
  "price": 29.99,
  "quantity": 1,
  "image": "<featured_image_url>",
  "slug": "3-month-subscription",
  "subscriptionConfig": {
    "subscription_offering_id": "<uuid>",
    "plan_label": "3-month",
    "max_boxes": 3,
    "selected_box_product_ids": ["<product_uuid_1>", "<product_uuid_2>"]
  }
}
```

- `type = "subscription"` is already supported by the existing cart/checkout code.
- `subscriptionConfig` is new and will be used by availability checks and Stripe metadata in later phases.

## 6. Validation Rules

- **Plan type & max boxes**
  - For this epic, plan type can be inferred from subscription offering slug/title (e.g. `3-month`, `6-month`, `every-other-month`).
  - Long‑term we may store explicit `plan_type` / `max_boxes` in `offerings.metadata`.
- **Max boxes per plan (enforced in app logic, see `docs/subscription-model.md`):**
  - 3‑month → up to 3 boxes.
  - 6‑month → up to 6 boxes.
  - Every‑other‑month → up to 6 boxes.
- **Eligibility rules:**
  - Only boxes present in `subscription_plan_boxes` for that subscription offering.
  - Only `offerings` with `status = 'published'`.
  - If `track_inventory = true`, then `stock_quantity > 0`.

## 7. Phasing & Next Steps

 - **Phase 1 – Design (this document)** – **Complete**
   - Lock down UX, data shape, and validation rules (this file).
- **Phase 2 – Frontend plan page + selection UI** – **Complete (implemented 2026-02-04)**
  - Update `/shop` click behaviour for subscription offerings.
  - Implement subscription detail page with curated boxes, selection, and max‑box validation.
  - Store the configured subscription item in the cart and navigate to `/cart`.
- **Phase 3 – Availability check + suggestions** – **Partially complete**
  - Add a small Supabase function or query to validate availability before adding to cart.
  - Show unavailable selections and suggest alternatives from the same plan.
- **Phase 4 – Stripe integration** – **Planned**
  - Extend checkout function(s) to support subscription items and carry `subscriptionConfig` in metadata.
  - Update webhooks to create appropriate `subscriptions` and `orders` from mixed carts.

## 8. Implementation Snapshot (2026-02-04)

- **Entry flow**
  - `/shop` shows subscription offerings; clicking one routes to `/subscriptions/:slug`, where the plan is configured.
- **Curated boxes**
  - Loaded from `subscription_plan_boxes` joined to `offering_products` and `offerings`, filtered to `status = 'published'` on the frontend.
- **Validation**
  - Supabase Edge Function `validate-subscription-boxes` receives `subscription_offering_id` and `selected_box_product_ids` and returns:
    - `allAvailable: boolean`
    - `unavailable[]` (per-product reasons such as `not_in_plan`, `unpublished`, `not_available_for_subscription`, `out_of_stock`)
    - `suggestions[]` with alternative curated boxes that are currently available.
- **Frontend behaviour on validation failure**
  - `SubscriptionDetail.vue` shows a clear error message listing unavailable selections (by title when possible), renders a "Try one of these boxes instead" suggestion list, and supports clicking a suggestion to **swap** an unavailable selection for a suggested one when already at `max_boxes`.
- **Cart representation**
  - On success, a single subscription cart item with `type = "subscription"` and `subscriptionConfig` (as defined in §5) is added to the Pinia cart; `Cart.vue` displays the plan label and "X of Y boxes selected" for these items.
