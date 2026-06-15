import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'
import { setPageSeo } from '../lib/seo'

const titleFromSlug = (slug) => String(slug || 'Workshops')
  .split('-')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

const currentSummerHolidayCategorySlug = `summer-holiday-${new Date().getFullYear()}`

const routeSeo = {
  Home: {
    title: 'Lola Creative Space',
    description: 'Book art workshops, creative classes, holiday programmes and events for children, adults and families.'
  },
  Workshops: {
    title: 'Art Workshops',
    description: 'Browse upcoming art workshops, creative classes and bookable sessions at Lola Creative Space.'
  },
  AdultWorkshops: {
    title: 'Adult Art Workshops',
    description: 'Creative art workshops and relaxed making sessions for adults.'
  },
  HalfTerm: {
    title: 'Half Term Art Classes',
    description: 'Find and book half term art workshops for children and families.',
    canonicalPath: '/half-term'
  },
  SummerHoliday: {
    title: 'Summer Holiday Art Workshops',
    description: 'Browse summer holiday art workshops and open studio sessions for children and families.',
    canonicalPath: '/summer-holiday'
  },
  CategoryWorkshops: {
    title: 'Art Workshops',
    description: 'Browse upcoming workshops and book the sessions that work for your family.'
  },
  WorkshopDetail: {
    title: 'Art Workshop',
    description: 'View workshop details, dates, availability and booking options.'
  },
  Blog: {
    title: 'Creative Journal',
    description: 'News, ideas and updates from Lola Creative Space.'
  },
  BlogPost: {
    title: 'Creative Journal',
    description: 'Read the latest news, ideas and updates from Lola Creative Space.',
    type: 'article'
  },
  About: {
    title: 'About',
    description: 'Learn more about Lola Creative Space and its creative workshops.'
  },
  Contact: {
    title: 'Contact',
    description: 'Contact Lola Creative Space about workshops, bookings and creative events.'
  },
  WorkshopFAQs: {
    title: 'Workshop FAQs',
    description: 'Answers to common questions about Lola Creative Space workshops.',
    canonicalPath: '/workshop-faqs'
  },
  PrivacyPolicy: {
    title: 'Privacy Policy',
    description: 'Privacy information for Lola Creative Space.',
    canonicalPath: '/privacy-policy'
  },
  TermsAndConditions: {
    title: 'Terms and Conditions',
    description: 'Booking terms and conditions for Lola Creative Space.',
    canonicalPath: '/terms-and-conditions'
  }
}

const noindexRouteNames = new Set([
  'Account',
  'Login',
  'UserDebug',
  'DesignSystem',
  'Cart',
  'Checkout',
  'OrderSuccess',
  'Boxes',
  'BoxDetail',
  'Shop',
  'ProductDetail',
  'SubscriptionDetail'
])

function seoForRoute(route) {
  const base = routeSeo[route.name] || {}
  const requiresPrivateAccess = route.matched.some(record => record.meta.requiresAuth || record.meta.requiresAdmin)
  const noindex = requiresPrivateAccess || noindexRouteNames.has(route.name) || base.noindex
  const path = base.canonicalPath || route.path

  return {
    ...base,
    path,
    noindex
  }
}

const routes = [
  {
    path: '/adult-art-workshops',
    redirect: '/adult-workshops'
  },
  {
    path: '/summer-workshops',
    redirect: '/summer-holiday'
  },
  {
    path: '/holiday-workshops',
    redirect: '/half-term'
  },
  {
    path: '/behaviour-policy',
    redirect: '/terms-and-conditions'
  },
  {
    path: '/basket',
    redirect: '/cart'
  },
  {
    path: '/registration',
    redirect: '/workshops'
  },
  {
    path: '/private-parties',
    name: 'LegacyPrivatePartiesRedirect',
    component: () => import('../views/LegacyWorkshopRedirect.vue'),
    props: {
      mode: 'category',
      categorySlug: 'private-party',
      fallbackPath: '/workshops'
    }
  },
  {
    path: '/category/adult-art-workshops',
    redirect: '/adult-workshops'
  },
  {
    path: '/category/adult-workshop',
    redirect: '/adult-workshops'
  },
  {
    path: '/category/adult-workshops',
    redirect: '/adult-workshops'
  },
  {
    path: '/category/half-term',
    redirect: '/half-term'
  },
  {
    path: '/category/holiday-workshops',
    redirect: '/half-term'
  },
  {
    path: '/category/summer',
    redirect: '/summer-holiday'
  },
  {
    path: '/category/summer-holiday',
    redirect: '/summer-holiday'
  },
  {
    path: '/category/summer-workshops',
    redirect: '/summer-holiday'
  },
  {
    path: '/category/:categorySlug',
    name: 'CategoryWorkshops',
    component: () => import('../views/HolidayProgramPage.vue'),
    props: (route) => ({
      categorySlug: route.params.categorySlug,
      fallbackTitle: titleFromSlug(route.params.categorySlug),
      fallbackDescription: 'Browse upcoming workshops and book the term or sessions that work for your family.'
    })
  },
  {
    path: '/event-details/:id',
    name: 'LegacyEventDetailsRedirect',
    component: () => import('../views/LegacyWorkshopRedirect.vue'),
    props: {
      mode: 'event',
      fallbackPath: '/workshops'
    }
  },
  {
    path: '/booking/:id',
    name: 'LegacyBookingRedirect',
    component: () => import('../views/LegacyWorkshopRedirect.vue'),
    props: {
      mode: 'event',
      fallbackPath: '/workshops'
    }
  },
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
    path: '/adult-workshops',
    name: 'AdultWorkshops',
    component: () => import('../views/AdultWorkshops.vue')
  },
  {
    path: '/half-term',
    alias: ['/holiday-programs/half-term'],
    name: 'HalfTerm',
    component: () => import('../views/HolidayProgramPage.vue'),
    props: {
      categorySlug: 'half-term',
      fallbackTitle: 'Half Term',
      fallbackDescription: 'Find upcoming half term art classes and book the sessions that work for your family.'
    }
  },
  {
    path: '/summer-holiday',
    alias: ['/holiday-programs/summer-holiday'],
    name: 'SummerHoliday',
    component: () => import('../views/HolidayProgramPage.vue'),
    props: {
      categorySlug: currentSummerHolidayCategorySlug,
      categorySlugAliases: ['summer-holiday'],
      fallbackTitle: 'Summer Holiday',
      fallbackDescription: 'Browse summer holiday art workshops and open studio sessions for children and families.'
    }
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
    path: '/workshop-faqs',
    alias: ['/faqs', '/faq'],
    name: 'WorkshopFAQs',
    component: () => import('../views/CmsInfoPage.vue'),
    props: { pageKey: 'workshop-faqs' }
  },
  {
    path: '/privacy-policy',
    alias: ['/privacy'],
    name: 'PrivacyPolicy',
    component: () => import('../views/CmsInfoPage.vue'),
    props: { pageKey: 'privacy-policy' }
  },
  {
    path: '/terms-and-conditions',
    alias: ['/terms'],
    name: 'TermsAndConditions',
    component: () => import('../views/CmsInfoPage.vue'),
    props: { pageKey: 'terms-and-conditions' }
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
        path: 'coupons',
        name: 'AdminCoupons',
        component: () => import('../views/admin/CouponsList.vue')
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
        path: 'homepage',
        name: 'AdminHomepageContent',
        component: () => import('../views/admin/HomepageContent.vue')
      },
      {
        path: 'navigation',
        name: 'AdminNavigation',
        component: () => import('../views/admin/Navigation.vue')
      },
      {
        path: 'pages',
        name: 'AdminInformationPages',
        component: () => import('../views/admin/InformationPages.vue')
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

router.afterEach((to) => {
  setPageSeo(seoForRoute(to))
})

export default router
