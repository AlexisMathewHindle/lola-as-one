# CMS Feature Checklist: v1 vs v2

**Last Updated:** 2026-01-31

## Legend
- ✅ **v1** — Must have for initial launch
- 🔄 **v2** — Deferred to future iteration
- ❌ **Out of Scope** — Not planned
- ⚠️ **Decide** — Decision needed before build starts

## Related Documents
- [Commerce Scope Guardrails](./commerce-scope-guardrails.md) — Don't rebuild Shopify
- [Platform Decisions](./epic-0-cms-principles.md#platform-decisions-locked) — Stripe, shipping, tax

---

## Content Management

### Offering Types
| Feature | Status | Notes |
|---------|--------|-------|
| Events | ✅ v1 | Time-based offerings with date/time/location |
| Products (Physical - Boxes) | ✅ v1 | One-time purchase |
| Subscriptions (Recurring Boxes) | ✅ v1 | **CRITICAL: Existing feature, must migrate** |
| Products (Digital - Gift Cards) | ✅ v1 | Stripe supports natively |
| Products (Digital - Downloads) | ✅ v1 | PDFs, videos via Supabase Storage |
| Services | 🔄 v2 | Bookable services (e.g., consultations) |
| Memberships | ❌ Out of Scope | Different from subscriptions |
| Courses | ❌ Out of Scope | Complex learning management |

### Content Fields (Events)
| Field | Status | Notes |
|-------|--------|-------|
| Title | ✅ v1 | Required |
| Slug | ✅ v1 | Auto-generated from title, editable |
| Description (rich text) | ✅ v1 | Basic formatting (bold, italic, links, lists) |
| Featured image | ✅ v1 | Single image upload |
| Date & time | ✅ v1 | Start/end datetime |
| Location | ✅ v1 | Text field (address or "online") |
| Price | ✅ v1 | Single price point |
| Capacity | ✅ v1 | Max attendees (optional) |
| Categories | ✅ v1 | Multi-select from predefined list |
| Tags | ✅ v1 | Free-form, comma-separated |
| Status | ✅ v1 | draft/scheduled/published/archived |
| Image gallery | 🔄 v2 | Multiple images |
| Recurring events | 🔄 v2 | Series/repeat patterns |
| Tiered pricing | 🔄 v2 | Early bird, member rates, etc. |
| Custom fields | 🔄 v2 | User-defined metadata |

### Content Fields (Products - Physical)
| Field | Status | Notes |
|-------|--------|-------|
| Title | ✅ v1 | Required |
| Slug | ✅ v1 | Auto-generated from title, editable |
| Description (rich text) | ✅ v1 | Basic formatting |
| Featured image | ✅ v1 | Single image upload |
| Price | ✅ v1 | Single price point |
| Stock/inventory | ✅ v1 | Simple count (optional) |
| Categories | ✅ v1 | Multi-select from predefined list |
| Tags | ✅ v1 | Free-form, comma-separated |
| Status | ✅ v1 | draft/scheduled/published/archived |
| Variants (size, color) | 🔄 v2 | Product options |
| Image gallery | 🔄 v2 | Multiple images |
| Related products | 🔄 v2 | Cross-selling |

### Content Fields (Products - Digital)
| Field | Status | Notes |
|-------|--------|-------|
| Title | ✅ v1 | Required |
| Slug | ✅ v1 | Auto-generated from title, editable |
| Description (rich text) | ✅ v1 | Basic formatting |
| Product type | ✅ v1 | Gift card or downloadable file |
| Price | ✅ v1 | Single price point (or gift card amount) |
| File upload | ✅ v1 | For downloads (PDF, video, etc.) |
| File size | ✅ v1 | Display to customer |
| Featured image | ✅ v1 | Single image upload |
| Categories | ✅ v1 | Multi-select from predefined list |
| Tags | ✅ v1 | Free-form, comma-separated |
| Status | ✅ v1 | draft/scheduled/published/archived |
| Download limit | 🔄 v2 | Max downloads per purchase |
| Download expiry | 🔄 v2 | Link expires after X days |
| DRM protection | 🔄 v2 | Watermarking, encryption |

---

## Publishing & Workflow

| Feature | Status | Notes |
|---------|--------|-------|
| Draft mode | ✅ v1 | Save without publishing |
| Scheduled publishing | ✅ v1 | Auto-publish at future date/time |
| Manual publish | ✅ v1 | Immediate go-live |
| Archive | ✅ v1 | Hide from public, keep in system |
| Approval workflow | 🔄 v2 | Editor submits → Admin approves |
| Revision history | 🔄 v2 | Track changes over time |
| Content versioning | 🔄 v2 | Rollback to previous versions |
| Bulk actions | 🔄 v2 | Publish/archive multiple items |

---

## Frontend Control

| Feature | Status | Notes |
|---------|--------|-------|
| Homepage blocks | ✅ v1 | Admin defines sections (hero, featured, etc.) |
| Navigation menus | ✅ v1 | Admin controls menu structure |
| Featured content | ✅ v1 | Pin specific offerings to homepage |
| Category pages | ✅ v1 | Auto-generated from categories |
| Search | 🔄 v2 | Full-text search across offerings |
| Filters | 🔄 v2 | Filter by category, price, date, etc. |
| SEO metadata | 🔄 v2 | Custom title, description, OG tags |

---

## Media Management

| Feature | Status | Notes |
|---------|--------|-------|
| Image upload | ✅ v1 | Single image per offering |
| Image preview | ✅ v1 | Show thumbnail in CMS |
| Image optimization | 🔄 v2 | Auto-resize, compression |
| Media library | 🔄 v2 | Reusable asset management |
| Video embeds | 🔄 v2 | YouTube/Vimeo links |
| File attachments | 🔄 v2 | PDFs, documents |

---

## User Management

| Feature | Status | Notes |
|---------|--------|-------|
| Admin role | ✅ v1 | Full access |
| Editor role | ✅ v1 | Create/edit content |
| Viewer role (optional) | ✅ v1 | Read-only access |
| Custom roles | 🔄 v2 | Granular permissions |
| Activity log | 🔄 v2 | Audit trail of changes |

---

## Analytics & Insights

| Feature | Status | Notes |
|---------|--------|-------|
| Basic analytics | 🔄 v2 | Page views, popular content |
| Event registrations | 🔄 v2 | Track signups |
| Product sales | 🔄 v2 | Revenue tracking |

---

## Commerce & Payments

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe Checkout integration | ✅ v1 | Hosted payment pages |
| Stripe webhooks | ✅ v1 | Order creation on payment success |
| Order management (view, fulfill) | ✅ v1 | Admin can see and mark orders fulfilled |
| Guest checkout | ✅ v1 | For one-time purchases only |
| Flat rate shipping (UK only) | ✅ v1 | Single shipping cost |
| VAT-inclusive pricing | ✅ v1 | Prices include 20% VAT |
| Custom shopping cart | ✅ v1 | Session-based, mixed products + events |
| Auto-decrement inventory | ✅ v1 | Stock and capacity updated on purchase |
| Event capacity tracking | ✅ v1 | Max attendees per event |
| Checkout validation | ✅ v1 | Prevent overselling |
| Discount codes | 🔄 v2 | Stripe Coupons integration |
| Refund processing | 🔄 v2 | Admin-initiated refunds |
| Weight-based shipping | 🔄 v2 | Carrier rate calculation |
| International shipping | 🔄 v2 | Multi-region, customs |
| Shipping label generation | 🔄 v2 | Automated labels (nice-to-have) |
| Inventory reservations | 🔄 v2 | Hold stock during checkout |
| Low stock alerts | 🔄 v2 | Email notifications |
| Stripe Tax | 🔄 v2 | Automated VAT calculation |
| Product variants | ❌ Out of Scope | Size, color options |
| Abandoned cart recovery | ❌ Out of Scope | Email reminders |
| Multi-currency | ❌ Out of Scope | Use Shopify if needed |

---

## Subscriptions

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe Subscriptions integration | ✅ v1 | Monthly recurring billing |
| Subscribe to monthly boxes | ✅ v1 | Existing feature, must migrate |
| Customer accounts | ✅ v1 | Required for subscription management |
| Subscription dashboard | ✅ v1 | View status, next billing date |
| Pause subscription | ✅ v1 | Temporarily stop deliveries |
| Resume subscription | ✅ v1 | Restart deliveries |
| Cancel subscription | ✅ v1 | End recurring billing |
| Update payment method | ✅ v1 | Change credit card |
| View billing history | ✅ v1 | Past invoices and payments |
| Subscription webhooks | ✅ v1 | Handle billing events |
| Admin subscription management | ✅ v1 | View all active subscriptions |
| Separate checkout flows | ✅ v1 | Subscription vs one-time |
| Subscribers can buy one-time | ✅ v1 | Separate transactions |
| Skip individual deliveries | 🔄 v2 | Pause for one month |
| Swap box types | 🔄 v2 | Change subscription product |
| Gift subscriptions | 🔄 v2 | Purchase for someone else |
| Subscription tiers | 🔄 v2 | Multiple subscription options |
| Combined checkout | 🔄 v2 | Subscription + one-time in same cart |
| Subscription analytics | 🔄 v2 | MRR, churn, cohort analysis |
| Trial periods | ❌ Out of Scope | Free trial before billing |
| Annual/quarterly billing | ❌ Out of Scope | Only monthly in v1 |

---

## Customer Accounts

| Feature | Status | Notes |
|---------|--------|-------|
| Email/password registration | ✅ v1 | Required for subscriptions |
| Login/logout | ✅ v1 | Standard authentication |
| Password reset | ✅ v1 | Email-based recovery |
| View order history | ✅ v1 | All orders (subscription + one-time) |
| Manage subscription | ✅ v1 | Pause/resume/cancel |
| Update payment method | ✅ v1 | Change credit card |
| View billing history | ✅ v1 | Past invoices |
| Account settings | ✅ v1 | Update email, password |
| Saved addresses | 🔄 v2 | Faster checkout |
| Wishlist | 🔄 v2 | Save items for later |
| Reorder | 🔄 v2 | Repeat previous purchase |
| Social login | 🔄 v2 | Google, Facebook |
| Two-factor authentication | 🔄 v2 | Enhanced security |

---

## Technical

| Feature | Status | Notes |
|---------|--------|-------|
| REST API | ✅ v1 | CRUD operations for offerings |
| Stripe webhook handlers | ✅ v1 | Process payment events |
| Email notifications | ✅ v1 | Order confirmations, booking confirmations |
| Cart validation API | ✅ v1 | Check inventory before checkout |
| GraphQL API | 🔄 v2 | Flexible querying |
| Webhooks (outbound) | 🔄 v2 | Notify external systems on publish |
| Import/Export | 🔄 v2 | Bulk data migration |
| Multi-language | ❌ Out of Scope | i18n support |

---

## Summary

**v1 Focus:** Simple, functional CMS for events and products with custom cart, Stripe-powered payments, and automatic inventory management.

**v2 Enhancements:** Customer accounts (nice-to-have), shipping labels (nice-to-have), advanced workflows, and analytics.

**Key Principle:** Let Stripe handle payments, fraud, and compliance. Build minimal cart logic. Don't rebuild Shopify.

