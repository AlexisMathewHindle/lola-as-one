<template>
  <div class="min-h-screen bg-gray-50 ">
    <!-- flex -->
    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
      @click="mobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      class="w-64 bg-dark-900 border-r border-dark-800 fixed h-full overflow-y-auto z-50 transition-transform duration-300 ease-in-out"
      :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- Sidebar Header - Compact -->
      <div class="px-4 py-3 border-b border-dark-800 flex items-center justify-between">
        <h1 class="text-lg font-display font-bold text-white">
          Lola Admin
        </h1>
        <button
          @click="mobileMenuOpen = false"
          class="lg:hidden text-gray-400 hover:text-white"
        >
          <font-awesome-icon icon="times" class="w-5 h-5" />
        </button>
      </div>

      <nav class="px-3 py-3">
        <div class="space-y-0.5">
          <!-- Dashboard -->
          <router-link
            to="/admin"
            exact
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin', true) ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="home" class="w-5 h-5 mr-3" />
            Dashboard
          </router-link>

          <!-- Offerings -->
          <router-link
            to="/admin/offerings"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/offerings') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="box" class="w-5 h-5 mr-3" />
            Offerings
          </router-link>

          <!-- Blog -->
          <router-link
            to="/admin/blog"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/blog') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="newspaper" class="w-5 h-5 mr-3" />
            Blog Posts
          </router-link>

          <div class="border-t border-dark-800 my-2"></div>

          <!-- Waitlists -->
          <router-link
            to="/admin/waitlists"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/waitlists') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="clock" class="w-5 h-5 mr-3" />
            Waitlists
          </router-link>

          <!-- Booked Workshops -->
          <router-link
            to="/admin/events/bookings"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/events/bookings') || isActive('/admin/bookings') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="calendar-check" class="w-5 h-5 mr-3" />
            Booked Workshops
          </router-link>

          <!-- Event Categories -->
          <router-link
            to="/admin/events/categories"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/events/categories') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="tags" class="w-5 h-5 mr-3" />
            Event Categories
          </router-link>

          <div class="border-t border-dark-800 my-2"></div>

          <!-- Orders -->
          <router-link
            to="/admin/orders"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/orders') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="shopping-cart" class="w-5 h-5 mr-3" />
            Orders
          </router-link>

          <!-- Subscriptions -->
          <router-link
            to="/admin/subscriptions"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/subscriptions') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="calendar" class="w-5 h-5 mr-3" />
            Subscriptions
          </router-link>

          <div class="border-t border-dark-800 my-2"></div>

          <!-- Customers -->
          <router-link
            to="/admin/customers"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/customers') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="users" class="w-5 h-5 mr-3" />
            Customers
          </router-link>

          <!-- Inventory -->
          <router-link
            to="/admin/inventory"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/inventory') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="box" class="w-5 h-5 mr-3" />
            Inventory
          </router-link>

          <!-- Analytics -->
          <router-link
            to="/admin/analytics"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/analytics') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="chart-line" class="w-5 h-5 mr-3" />
            Analytics
          </router-link>

          <!-- Reviews -->
          <router-link
            to="/admin/reviews"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/reviews') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="star" class="w-5 h-5 mr-3" />
            Reviews
          </router-link>

          <div class="border-t border-dark-800 my-2"></div>

          <!-- Settings -->
          <router-link
            to="/admin/settings"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="isActive('/admin/settings') ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-300 hover:bg-dark-800 hover:text-white'"
            @click="mobileMenuOpen = false"
          >
            <font-awesome-icon icon="cog" class="w-5 h-5 mr-3" />
            Settings
          </router-link>
        </div>
      </nav>

      <!-- Bottom padding to ensure last item is visible -->
      <div class="h-6"></div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 lg:ml-64 transition-all duration-300">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div class="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- Mobile Menu Button -->
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
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

      <!-- Page Content -->
      <main class="p-4 sm:p-6 lg:p-8">
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
    '/admin/subscriptions': 'Subscriptions',
    '/admin/customers': 'Customers',
    '/admin/inventory': 'Inventory',
    '/admin/analytics': 'Analytics',
    '/admin/reviews': 'Reviews',
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
</script>

