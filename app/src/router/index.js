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
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
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

