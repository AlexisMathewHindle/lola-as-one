import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/workshops',
    name: 'Workshops',
    component: () => import('../views/Workshops.vue')
  },
  {
    path: '/workshops/:slug',
    name: 'WorkshopDetail',
    component: () => import('../views/WorkshopDetail.vue')
  },
  {
    path: '/boxes',
    name: 'Boxes',
    component: () => import('../views/Boxes.vue')
  },
  {
    path: '/boxes/:slug',
    name: 'BoxDetail',
    component: () => import('../views/BoxDetail.vue')
  },
  {
    path: '/subscriptions/:slug',
    name: 'SubscriptionDetail',
    component: () => import('../views/SubscriptionDetail.vue')
  },
  {
    path: '/shop',
    name: 'Shop',
    component: () => import('../views/Shop.vue')
  },
  {
    path: '/products/:slug',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout.vue')
  },
  {
    path: '/order/success',
    name: 'OrderSuccess',
    component: () => import('../views/OrderSuccess.vue')
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('../views/Blog.vue')
  },
  {
    path: '/blog/:slug',
    name: 'BlogPost',
    component: () => import('../views/BlogPost.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue')
  },
  {
    path: '/design-system',
    name: 'DesignSystem',
    component: () => import('../views/DesignSystem.vue')
  },
  {
    path: '/account',
    name: 'Account',
    component: () => import('../views/Account.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/debug',
    name: 'UserDebug',
    component: () => import('../views/UserDebug.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'offerings',
        name: 'AdminOfferings',
        component: () => import('../views/admin/OfferingsList.vue')
      },
      {
        path: 'offerings/new',
        name: 'AdminOfferingsNew',
        component: () => import('../views/admin/OfferingsForm.vue')
      },
      {
        path: 'offerings/:id/edit',
        name: 'AdminOfferingsEdit',
        component: () => import('../views/admin/OfferingsForm.vue')
      },
      {
        path: 'blog',
        name: 'AdminBlog',
        component: () => import('../views/admin/BlogList.vue')
      },
      {
        path: 'blog/new',
        name: 'AdminBlogNew',
        component: () => import('../views/admin/BlogForm.vue')
      },
      {
        path: 'blog/:id/edit',
        name: 'AdminBlogEdit',
        component: () => import('../views/admin/BlogForm.vue')
      },
      {
        path: 'waitlists',
        name: 'AdminWaitlists',
        component: () => import('../views/admin/WaitlistDashboard.vue')
      },
      {
        path: 'waitlists/events',
        name: 'AdminEventWaitlists',
        component: () => import('../views/admin/EventWaitlistList.vue')
      },
      {
        path: 'waitlists/products',
        name: 'AdminProductWaitlists',
        component: () => import('../views/admin/ProductWaitlistList.vue')
      },
      {
        path: 'waitlists/:type/:id',
        name: 'AdminWaitlistEntryDetails',
        component: () => import('../views/admin/WaitlistEntryDetails.vue')
      },
      {
        path: 'events/categories',
        name: 'EventCategoriesList',
        component: () => import('../views/admin/EventCategoriesList.vue')
      },
      {
        path: 'events/bookings',
        name: 'EventBookingsList',
        component: () => import('../views/admin/EventBookingsList.vue')
      },
      {
        path: 'events/:id',
        name: 'EventDetails',
        component: () => import('../views/admin/EventDetails.vue')
      },
      {
        path: 'events/:id/checkin',
        name: 'AttendeeCheckIn',
        component: () => import('../views/admin/AttendeeCheckIn.vue')
      },
      {
        path: 'bookings/:id',
        name: 'BookingDetails',
        component: () => import('../views/admin/BookingDetails.vue')
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../views/admin/OrdersList.vue')
      },
      {
        path: 'orders/:id',
        name: 'AdminOrderDetails',
        component: () => import('../views/admin/OrderDetails.vue')
      },
      {
        path: 'subscriptions',
        name: 'AdminSubscriptions',
        component: () => import('../views/admin/SubscriptionsList.vue')
      },
      {
        path: 'subscriptions/:id',
        name: 'AdminSubscriptionDetails',
        component: () => import('../views/admin/SubscriptionDetails.vue')
      },
      {
        path: 'customers',
        name: 'AdminCustomers',
        component: () => import('../views/admin/CustomersList.vue')
      },
      {
        path: 'customers/:id',
        name: 'AdminCustomerDetails',
        component: () => import('../views/admin/CustomerDetails.vue')
      },
      {
        path: 'inventory',
        name: 'AdminInventory',
        component: () => import('../views/admin/InventoryList.vue')
      },
      {
        path: 'inventory/:id',
        name: 'AdminInventoryDetails',
        component: () => import('../views/admin/InventoryDetails.vue')
      },
      {
        path: 'analytics',
        name: 'AdminAnalytics',
        component: () => import('../views/admin/AnalyticsDashboard.vue')
      },
      {
        path: 'reviews',
        name: 'AdminReviews',
        component: () => import('../views/admin/ReviewsList.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
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

