<template>
  <div class="min-h-screen bg-gray-50">
    <!-- flex -->
    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
      @click="mobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 h-full w-64 overflow-y-auto border-r border-white/5 bg-stone-950 shadow-2xl transition-transform duration-300 ease-in-out xl:w-[17rem]"
      :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="sticky top-0 z-10 border-b border-white/5 bg-stone-950 px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Lola
            </p>
            <h1 class="mt-1 text-lg font-semibold text-stone-100">
              Admin
            </h1>
          </div>
          <div class="flex items-center gap-3">
            <span class="hidden h-2.5 w-2.5 rounded-full bg-primary-400 shadow-[0_0_18px_rgba(255,149,107,0.55)] lg:block"></span>
            <button
              @click="mobileMenuOpen = false"
              class="rounded-lg p-1 text-stone-500 transition-colors hover:text-white lg:hidden"
            >
              <font-awesome-icon icon="times" class="h-5 w-5" />
            </button>
          </div>
        </div>
        <p class="mt-3 text-xs leading-5 text-stone-400">
          Content, orders, customers, and site settings in one place.
        </p>
      </div>

      <nav class="px-3 py-2">
        <div
          v-for="section in navSections"
          :key="section.title"
          class="mt-1 first:mt-0"
        >
          <p class="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            {{ section.title }}
          </p>

          <div class="space-y-1">
            <router-link
              v-for="item in section.items"
              :key="item.path"
              :to="item.path"
              class="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200"
              :class="isNavItemActive(item)
                ? 'bg-primary-500/20 text-white ring-1 ring-primary-400/25'
                : 'text-stone-300 hover:bg-white/5 hover:text-white'"
              @click="mobileMenuOpen = false"
            >
              <font-awesome-icon
                :icon="item.icon"
                class="h-4 w-4 shrink-0 transition-colors duration-200"
                :class="isNavItemActive(item) ? 'text-primary-200' : 'text-stone-500 group-hover:text-stone-300'"
              />
              <span class="truncate">{{ item.label }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <div class="px-4 pb-5 pt-2">
        <div class="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            Admin Area
          </p>
          <p class="mt-2 text-xs leading-5 text-stone-400">
            The menu scrolls if more sections are added, so the layout stays stable.
          </p>
        </div>
      </div>
    </aside>

    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between px-4 py-4 sm:px-6 lg:pl-[18rem] lg:pr-8 xl:pl-[20rem]">
        <div class="flex items-center space-x-4">
          <!-- Mobile Menu Button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="rounded-lg p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
          >
            <font-awesome-icon icon="bars" class="w-5 h-5" />
          </button>
          <h2 class="text-xl sm:text-2xl font-semibold text-gray-900">{{ pageTitle }}</h2>
        </div>
        <div class="flex items-center space-x-3 sm:space-x-4">
          <a
            href="/"
            target="_blank"
            class="hidden sm:flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <span>View Site</span>
            <font-awesome-icon icon="external-link-alt" class="w-3 h-3 ml-1" />
          </a>
          <div class="hidden sm:block border-l border-gray-300 h-6"></div>
          <div class="flex items-center space-x-2">
            <font-awesome-icon icon="user-circle" class="w-5 h-5 text-gray-500" />
            <span class="hidden sm:inline text-sm text-gray-700">{{ authStore.user?.email }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1">
      <main class="p-4 sm:p-6 lg:ml-64 lg:p-8 xl:ml-[17rem]">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: 'home', exact: true }
    ]
  },
  {
    title: 'Content',
    items: [
      { label: 'Offerings', path: '/admin/offerings', icon: 'box' },
      { label: 'Blog Posts', path: '/admin/blog', icon: 'newspaper' },
      { label: 'Homepage Content', path: '/admin/homepage', icon: 'image' },
      { label: 'Information Pages', path: '/admin/pages', icon: 'file-alt' },
      { label: 'Navigation', path: '/admin/navigation', icon: 'list' }
    ]
  },
  {
    title: 'Events',
    items: [
      { label: 'Waitlists', path: '/admin/waitlists', icon: 'clock' },
      {
        label: 'Booked Workshops',
        path: '/admin/events/bookings',
        icon: 'calendar-check',
        matchPaths: ['/admin/events/bookings', '/admin/bookings']
      },
      { label: 'Event Categories', path: '/admin/events/categories', icon: 'tags' }
    ]
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Orders', path: '/admin/orders', icon: 'shopping-cart' },
      { label: 'Coupons', path: '/admin/coupons', icon: 'tags' },
      { label: 'Subscriptions', path: '/admin/subscriptions', icon: 'calendar' },
      { label: 'Inventory', path: '/admin/inventory', icon: 'box' }
    ]
  },
  {
    title: 'People',
    items: [
      { label: 'Customers', path: '/admin/customers', icon: 'users' },
      { label: 'Reviews', path: '/admin/reviews', icon: 'star' }
    ]
  },
  {
    title: 'System',
    items: [
      { label: 'Analytics', path: '/admin/analytics', icon: 'chart-line' },
      { label: 'Settings', path: '/admin/settings', icon: 'cog' }
    ]
  }
]

const pageTitle = computed(() => {
  const titles = {
    '/admin': 'Dashboard',
    '/admin/offerings': 'Offerings',
    '/admin/blog': 'Blog Posts',
    '/admin/waitlists': 'Waitlists',
    '/admin/events/bookings': 'Booked Workshops',
    '/admin/events/categories': 'Event Categories',
    '/admin/events': 'Event Details',
    '/admin/bookings': 'Booking Details',
    '/admin/orders': 'Orders',
    '/admin/coupons': 'Coupons',
    '/admin/subscriptions': 'Subscriptions',
    '/admin/customers': 'Customers',
    '/admin/inventory': 'Inventory',
    '/admin/analytics': 'Analytics',
    '/admin/reviews': 'Reviews',
    '/admin/homepage': 'Homepage Content',
    '/admin/pages': 'Information Pages',
    '/admin/navigation': 'Navigation',
    '/admin/settings': 'Settings'
  }

  // Check for exact match first
  if (titles[route.path]) return titles[route.path]

  // Check for partial match (e.g., /admin/offerings/new)
  for (const [path, title] of Object.entries(titles)) {
    if (route.path.startsWith(path) && path !== '/admin') {
      return title
    }
  }

  return 'Admin'
})

const isActive = (path, exact = false) => {
  if (exact) {
    return route.path === path
  }
  return route.path.startsWith(path)
}

const isNavItemActive = (item) => {
  if (item.matchPaths?.length) {
    return item.matchPaths.some(path => route.path.startsWith(path))
  }

  return isActive(item.path, item.exact)
}
</script>
