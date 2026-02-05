# Epic 10 — Content Pages (Home, About, Contact, Blog)

**Created:** 2026-02-04
**Status:** ✅ Complete
**Goal:** Build customer-facing content pages including home page, about page, contact page, and blog listing/detail pages

---

## Overview

This epic covers building the customer-facing content pages that provide information about Lola As One and showcase blog content. These pages will:
- Welcome visitors with an engaging home page
- Tell the story of Lola Creative Space and Lots of Lovely Art
- Provide contact information and a contact form
- Display blog posts with filtering and search
- Show individual blog post content with rich text display

---

## 1. Home Page (`/`)

**Component:** `Home.vue`
**Status:** ✅ Complete (507 lines)

### Purpose
Welcome visitors and guide them to key areas of the site

### Features to Build
- **Hero Section:**
  - Large hero image or video background
  - Headline: "Welcome to Lola As One"
  - Subheadline: "Where creativity meets community"
  - Primary CTA: "Explore Workshops" → /workshops
  - Secondary CTA: "Shop Art Boxes" → /boxes

- **Featured Workshops Section:**
  - Title: "Upcoming Workshops"
  - Display 3-4 featured workshops (featured = true)
  - Workshop cards with image, title, date, price
  - "View All Workshops" button → /workshops

- **Featured Boxes Section:**
  - Title: "Our Art Boxes"
  - Display 3-4 featured boxes (featured = true)
  - Box cards with image, title, price, subscription badge
  - "Shop All Boxes" button → /boxes

- **About Preview Section:**
  - Brief introduction to Lola As One
  - 2-3 sentences about mission
  - "Learn More About Us" button → /about

- **Testimonials Section:**
  - 3 customer testimonials (can be hardcoded for v1)
  - Customer name, photo (optional), quote
  - Star ratings

- **Newsletter Signup:**
  - Email input field
  - "Subscribe" button
  - Success/error messaging

- **Instagram Feed (Optional v1):**
  - Display recent Instagram posts
  - Link to Instagram profile

### Design
- Full-width sections with alternating backgrounds (white, gray-50)
- Responsive grid layouts
- Large, engaging imagery
- Clear CTAs throughout

---

## 2. About Page (`/about`)

**Component:** `About.vue`
**Status:** ✅ Complete (291 lines)

### Purpose
Tell the unified story of Lola Creative Space and Lots of Lovely Art

### Features to Build
- **Hero Section:**
  - Hero image (team photo or creative space)
  - Headline: "About Lola As One"
  - Subheadline: Brief tagline

- **Our Story Section:**
  - How Lola Creative Space began
  - Evolution to Lots of Lovely Art
  - The merger/unification story
  - Timeline (optional)

- **Mission & Values Section:**
  - Our mission statement
  - Core values (3-5 values)
  - What makes us different

- **What We Do Section:**
  - Creative Workshops description
  - Art Boxes description
  - Digital Products description

- **Team Section (Optional v1):**
  - Team member cards with photos
  - Names, roles, brief bios

- **CTA Section:**
  - "Ready to Get Creative?"
  - Buttons: "Book a Workshop" → /workshops, "Shop Boxes" → /boxes

### Design
- Clean, readable typography
- Generous whitespace
- Engaging imagery throughout
- Personal, warm tone

---

## 3. Contact Page (`/contact`)

**Component:** `Contact.vue`
**Status:** ✅ Complete (353 lines)

### Purpose
Provide contact information and allow visitors to send messages

### Features to Build
- **Contact Information:**
  - Email address
  - Phone number
  - Physical address (if applicable)
  - Opening hours (if applicable)
  - Social media links

- **Contact Form:**
  - Name (required)
  - Email (required, validated)
  - Subject (optional)
  - Message (required, textarea)
  - Submit button
  - Form validation
  - Success/error messaging
  - **Backend:** Supabase Edge Function to send email or store in database

- **Map (Optional v1):**
  - Embedded Google Map showing location
  - Only if physical location exists

- **FAQ Section (Optional v1):**
  - Common questions with answers
  - Accordion-style display

### Design
- Two-column layout (desktop): Contact info (left), Form (right)
- Single column (mobile): Stacked
- Clear, accessible form design

---

## 4. Blog Listing Page (`/blog`)

**Component:** `Blog.vue`
**Status:** ✅ Complete (397 lines)

### Purpose
Display all published blog posts with filtering and search

### Features to Build
- **Header:**
  - Page title: "Blog"
  - Subtitle: "Creative inspiration, tutorials, and news"

- **Filters & Search:**
  - Search input (searches title, excerpt, body)
  - Category filter dropdown (fetches from categories table)
  - Tag filter (multi-select or pills)
  - Sort by: Newest, Oldest, Most Popular (optional)

- **Blog Post Grid:**
  - 3-column grid (desktop), 2-column (tablet), 1-column (mobile)
  - Post cards with:
    - Featured image (placeholder if none)
    - Title
    - Excerpt (first 150 characters)
    - Author name
    - Published date
    - Read time estimate (optional)
    - Category badge
    - Tags (first 2-3)
  - Click card → navigate to /blog/:slug

- **Pagination:**
  - Display 12 posts per page
  - Previous/Next buttons
  - Page numbers

- **Empty State:**
  - "No blog posts found" message
  - "Clear filters" button

### Data Fetching
- Fetch from `blog_posts` table
- Filter by `status = 'published'`
- Order by `published_at DESC`
- Join with `blog_post_categories` and `blog_post_tags` for filters

---

## 5. Blog Post Detail Page (`/blog/:slug`)

**Component:** `BlogPost.vue`
**Status:** ✅ Complete (473 lines)

### Purpose
Display individual blog post with full content

### Features to Build
- **Hero Section:**
  - Featured image (full-width or contained)
  - Post title
  - Author info (name, photo, bio)
  - Published date
  - Read time estimate
  - Category and tags

- **Post Content:**
  - Render JSONB body field as HTML
  - Rich text formatting (headings, paragraphs, lists, images, links)
  - Responsive images
  - Code blocks (if applicable)

- **Author Bio Section:**
  - Author photo
  - Author name
  - Author bio
  - Social links (optional)

- **Related Posts Section:**
  - "You Might Also Like"
  - Display 3 related posts (same category or tags)
  - Post cards with image, title, excerpt

- **Social Sharing (Optional v1):**
  - Share buttons: Facebook, Twitter, Pinterest, Email
  - Copy link button

- **Navigation:**
  - "← Back to Blog" link
  - Previous/Next post links (optional)

### Data Fetching
- Fetch from `blog_posts` table by slug
- Filter by `status = 'published'`
- Join with categories and tags
- Fetch related posts (same category, limit 3)

---

## Implementation Plan

### Step 1: Build Home Page ✅
- [x] Create hero section with CTAs
- [x] Fetch and display featured workshops
- [x] Fetch and display featured boxes
- [x] Add about preview section
- [x] Add testimonials section (hardcoded for v1)
- [x] Add newsletter signup form
- [x] Test responsive design

### Step 2: Build About Page ✅
- [x] Create hero section
- [x] Add our story content
- [x] Add mission & values section
- [x] Add what we do section
- [x] Add CTA section
- [x] Test responsive design

### Step 3: Build Contact Page ✅
- [x] Update contact information
- [x] Build functional contact form
- [x] Add form validation
- [x] Store submissions in contact_submissions table (v1)
- [x] Add success/error messaging
- [x] Test form submission

### Step 4: Build Blog Listing Page ✅
- [x] Create header section
- [x] Build search and filter UI
- [x] Fetch blog posts from database
- [x] Implement filtering logic
- [x] Build blog post grid
- [x] Add pagination
- [x] Add empty state
- [x] Test responsive design

### Step 5: Build Blog Post Detail Page ✅
- [x] Create hero section with post metadata
- [x] Render JSONB body content as HTML (Tiptap JSON parser)
- [x] Add author bio section
- [x] Fetch and display related posts
- [x] Add back to blog navigation
- [x] Test responsive design

### Step 6: Update Routes
- [ ] Verify all routes exist in router
- [ ] Test navigation between pages

### Step 7: Documentation
- [ ] Update docs/TODO.md
- [ ] Update docs/README.md
- [ ] Mark Epic 10 as complete

---

## Technical Notes

### Blog Content Rendering
The `body` field in `blog_posts` is JSONB. We'll need to:
1. Parse the JSONB content
2. Render it as HTML (similar to admin BlogForm.vue)
3. Use a rich text renderer or custom component

### Newsletter Signup
For v1, we can:
- Store emails in a simple `newsletter_subscribers` table
- Or use a third-party service (Mailchimp, ConvertKit)
- Or create a Supabase Edge Function to handle subscriptions

### Contact Form
Create a Supabase Edge Function to:
- Validate form data
- Send email via SendGrid/Resend
- Or store in `contact_submissions` table for admin review

---

## Next Steps

After completing Epic 10, proceed to:
- **Epic 11:** Customer accounts and authentication
- **Epic 12:** Email notifications and automation
- **Epic 13:** Testing and launch preparation

