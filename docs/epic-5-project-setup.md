# Epic 5 — Project Setup (Supabase, Vue 3, Tailwind)

**Last Updated:** 2026-02-01
**Status:** ✅ COMPLETE
**Goal:** Initialize project infrastructure and configure development environment.

---

## Overview

This epic covers the initial project setup for the Lola As One unified CMS platform, including:
- Supabase project creation and database setup
- Vue 3 application initialization
- Tailwind CSS configuration
- Development environment setup
- CI/CD pipeline basics

---

## 1. Supabase Project Setup

### 1.1 Create Supabase Project

**Steps:**
1. Go to [supabase.com](https://supabase.com)
2. Create new project:
   - **Organization:** Lola As One
   - **Project Name:** lola-as-one-cms
   - **Database Password:** (secure password - store in password manager)
   - **Region:** Europe West (London) - closest to UK
   - **Pricing Plan:** Pro (for production features)

3. Wait for project provisioning (~2 minutes)

**Project URLs:**
- **Project URL:** `https://[project-ref].supabase.co`
- **API URL:** `https://[project-ref].supabase.co/rest/v1/`
- **Database URL:** `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### 1.2 Run Database Migration

**Execute schema.sql:**

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Create new query
# 3. Paste contents of docs/schema.sql
# 4. Run query

# Option 2: Via psql CLI
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  -f docs/schema.sql
```

**Verify migration:**
- Check Tables view in Supabase Dashboard
- Should see 42 tables created
- Verify RLS policies are enabled
- Check triggers are created

### 1.3 Configure Authentication

**Email/Password Auth:**
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates:
   - Confirmation email
   - Password reset email
   - Magic link email

**Email Settings:**
- **From Email:** noreply@lolaasone.com (configure custom SMTP later)
- **Site URL:** https://lolaasone.com (production) or http://localhost:5173 (development)
- **Redirect URLs:** 
  - http://localhost:5173/** (development)
  - https://lolaasone.com/** (production)

**Admin User:**
```sql
-- Create first admin user (run in SQL Editor after signup)
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@lolaasone.com';
```

### 1.4 Configure Storage

**Create Storage Buckets:**

```sql
-- Product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Blog images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true);

-- Digital downloads (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('digital-downloads', 'digital-downloads', false);

-- Workshop images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workshop-images', 'workshop-images', true);
```

**Storage Policies:**

```sql
-- Public read for public buckets
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('product-images', 'blog-images', 'workshop-images'));

-- Admin upload for all buckets
CREATE POLICY "Admin upload access"
ON storage.objects FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin delete for all buckets
CREATE POLICY "Admin delete access"
ON storage.objects FOR DELETE
USING (auth.jwt() ->> 'role' = 'admin');

-- Authenticated users can download digital products they purchased
CREATE POLICY "Customers can download purchased products"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'digital-downloads' 
  AND auth.uid() IN (
    SELECT customer_id FROM digital_downloads 
    WHERE file_path = name AND expires_at > NOW()
  )
);
```

### 1.5 Environment Variables

**Create `.env.local` file:**

```bash
# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# Stripe (get from Stripe Dashboard)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME="Lola As One"
```

**Get Supabase Keys:**
- Go to Project Settings → API
- Copy `anon` `public` key
- Copy `service_role` `secret` key (for server-side only)

---

## 2. Vue 3 Application Setup

### 2.1 Initialize Vue 3 Project

**Using Vite:**

```bash
# Create Vue 3 project with Vite
npm create vite@latest lola-as-one-cms -- --template vue

cd lola-as-one-cms

# Install dependencies
npm install
```

**Project Structure:**
```
lola-as-one-cms/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── composables/
│   ├── layouts/
│   ├── pages/
│   ├── router/
│   ├── stores/
│   ├── utils/
│   ├── App.vue
│   └── main.js
├── .env.local
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### 2.2 Install Core Dependencies

**Supabase Client:**
```bash
npm install @supabase/supabase-js
```

**Vue Router:**
```bash
npm install vue-router@4
```

**Pinia (State Management):**
```bash
npm install pinia
```

**Stripe:**
```bash
npm install @stripe/stripe-js
```

**Date Handling:**
```bash
npm install date-fns
```

**Form Validation:**
```bash
npm install vee-validate yup
```

**Icons:**
```bash
npm install @heroicons/vue
```

**Rich Text Editor (for CMS):**
```bash
npm install @tiptap/vue-3 @tiptap/starter-kit
```

### 2.3 Configure Supabase Client

**Create `src/lib/supabase.js`:**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2.4 Configure Vue Router

**Create `src/router/index.js`:**

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const routes = [
  // Public routes
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue')
  },
  {
    path: '/workshops',
    name: 'Workshops',
    component: () => import('@/pages/WorkshopsPage.vue')
  },
  {
    path: '/workshops/:slug',
    name: 'WorkshopDetail',
    component: () => import('@/pages/WorkshopDetailPage.vue')
  },
  {
    path: '/boxes',
    name: 'Boxes',
    component: () => import('@/pages/BoxesPage.vue')
  },
  {
    path: '/boxes/:slug',
    name: 'BoxDetail',
    component: () => import('@/pages/BoxDetailPage.vue')
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('@/pages/BlogPage.vue')
  },
  {
    path: '/blog/:slug',
    name: 'BlogPost',
    component: () => import('@/pages/BlogPostPage.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/pages/CartPage.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/pages/CheckoutPage.vue')
  },

  // Admin routes (protected)
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/pages/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/pages/admin/DashboardPage.vue')
      },
      {
        path: 'offerings',
        name: 'AdminOfferings',
        component: () => import('@/pages/admin/OfferingsPage.vue')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/pages/admin/OrdersPage.vue')
      },
      {
        path: 'customers',
        name: 'AdminCustomers',
        component: () => import('@/pages/admin/CustomersPage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

  if (requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    if (requiresAdmin) {
      const { data: { user } } = await supabase.auth.getUser()
      const isAdmin = user?.app_metadata?.role === 'admin'

      if (!isAdmin) {
        next({ name: 'Home' })
        return
      }
    }
  }

  next()
})

export default router
```

### 2.5 Configure Pinia Store

**Create `src/stores/auth.js`:**

```javascript
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true
  }),

  getters: {
    isAuthenticated: (state) => !!state.session,
    isAdmin: (state) => state.user?.app_metadata?.role === 'admin'
  },

  actions: {
    async initialize() {
      const { data: { session } } = await supabase.auth.getSession()
      this.session = session
      this.user = session?.user ?? null
      this.loading = false

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
      })
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  }
})
```

**Create `src/stores/cart.js`:**

```javascript
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    loading: false
  }),

  getters: {
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  },

  actions: {
    async addItem(offering, quantity = 1) {
      // Implementation for adding items to cart
    },

    async removeItem(itemId) {
      // Implementation for removing items
    },

    async updateQuantity(itemId, quantity) {
      // Implementation for updating quantity
    },

    async clearCart() {
      this.items = []
    }
  }
})
```

---

## 3. Tailwind CSS Setup

### 3.1 Install Tailwind

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3.2 Configure Tailwind

**Update `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lola As One brand colors
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

**Install Tailwind Plugins:**

```bash
npm install -D @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio
```

### 3.3 Add Tailwind Directives

**Update `src/style.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  body {
    @apply font-sans text-gray-900 antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display;
  }
}

/* Custom component styles */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700;
  }

  .btn-secondary {
    @apply bg-secondary-600 text-white hover:bg-secondary-700;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}
```

---

## 4. Development Environment

### 4.1 VS Code Extensions

**Recommended extensions:**
- Vue Language Features (Volar)
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- PostCSS Language Support

### 4.2 ESLint + Prettier

**Install:**
```bash
npm install -D eslint prettier eslint-plugin-vue eslint-config-prettier
```

**Create `.eslintrc.cjs`:**

```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'vue/multi-word-component-names': 'off'
  }
}
```

**Create `.prettierrc`:**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 4.3 Git Setup

**Create `.gitignore`:**

```
# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Build output
dist/
dist-ssr/

# Editor
.vscode/*
!.vscode/extensions.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db
```

**Initialize Git:**

```bash
git init
git add .
git commit -m "Initial commit: Epic 5 project setup"
```

---

## 5. Stripe Integration Setup

### 5.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Create account for "Lola As One"
3. Complete business verification
4. Enable test mode for development

### 5.2 Configure Stripe Products

**Create Products in Stripe Dashboard:**

1. **Monthly Subscription Box:**
   - Product name: "Monthly Art Box Subscription"
   - Pricing: £25/month recurring
   - Copy Product ID and Price ID

2. **One-time Products:**
   - Create products for each box offering
   - Set one-time pricing

### 5.3 Configure Webhooks

**Create webhook endpoint:**

1. Go to Developers → Webhooks
2. Add endpoint: `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret

### 5.4 Create Supabase Edge Function for Webhooks

**Create `supabase/functions/stripe-webhook/index.ts`:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret!)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // Create order in database
        break
      case 'customer.subscription.created':
        // Create subscription record
        break
      // ... other event handlers
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

---

## 6. Deployment Setup

### 6.1 Vercel Deployment (Recommended)

**Install Vercel CLI:**
```bash
npm install -g vercel
```

**Deploy:**
```bash
vercel
```

**Configure environment variables in Vercel:**
- Add all variables from `.env.local`
- Set production Stripe keys
- Set production Supabase URL and keys

### 6.2 Custom Domain

1. Add domain in Vercel: `lolaasone.com`
2. Configure DNS records
3. Enable SSL (automatic with Vercel)

---

## Acceptance Criteria

### Core Requirements (COMPLETE ✅)
- [x] Supabase project created and database migrated (42 tables)
- [x] Vue 3 app initialized with Vite
- [x] Tailwind CSS configured with brand colors
- [x] Vue Router configured with 12 routes and auth guards
- [x] Pinia stores created (auth, cart)
- [x] Supabase client configured
- [x] Environment variables configured (.env.local)
- [x] All 11 placeholder views created
- [x] Navigation component with responsive design
- [x] Sign up/Sign in authentication working
- [x] Development environment running locally (port 5175)
- [x] Storage buckets created with policies (product-images, blog-images, workshop-images)
- [x] Git repository initialized

### Optional/Future Tasks (Can be done later)
- [ ] Stripe account created and configured (when ready for payments)
- [ ] Webhook endpoint created and tested (when Stripe is set up)
- [ ] ESLint and Prettier configured (code quality - optional)
- [ ] Deployment pipeline configured (Vercel - when ready to deploy)

---

## Next Steps

After completing Epic 5, proceed to:
- **Epic 6:** Admin CMS Interface
- **Epic 7:** Public Frontend Pages
- **Epic 8:** Checkout + Payment Flows
- **Epic 9:** Testing + Launch


