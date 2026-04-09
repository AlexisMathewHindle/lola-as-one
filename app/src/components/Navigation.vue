<template>
  <nav class="bg-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center">
          <span class="text-2xl font-display font-bold text-primary-600">
            {{ siteName }}
          </span>
        </router-link>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <template v-for="item in navigationItems" :key="item.id">
            <router-link
              v-if="item.itemType === 'page'"
              :to="item.href"
              :class="desktopNavClass(item)"
            >
              {{ item.label }}
            </router-link>
            <a
              v-else
              :href="item.href"
              :target="item.openInNewTab ? '_blank' : undefined"
              :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
              :class="desktopNavClass(item)"
            >
              {{ item.label }}
            </a>
          </template>
        </div>
        
        <!-- Right Side Actions -->
        <div class="flex items-center space-x-4">
          <!-- Cart -->
          <router-link
            to="/cart"
            class="relative text-gray-700 hover:text-primary-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span
              v-if="cartStore.itemCount > 0"
              class="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ cartStore.itemCount }}
            </span>
          </router-link>
          
          <!-- Account -->
          <router-link 
            v-if="authStore.isAuthenticated"
            to="/account"
            class="text-gray-700 hover:text-primary-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </router-link>
          
          <router-link 
            v-else
            to="/login"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </router-link>
          
          <!-- Admin Link -->
          <router-link 
            v-if="authStore.isAdmin"
            to="/admin"
            class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Admin
          </router-link>
        </div>
        
        <!-- Mobile Menu Button -->
        <button 
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden text-gray-700"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="md:hidden py-4 space-y-2">
        <template v-for="item in navigationItems" :key="`${item.id}-mobile`">
          <router-link
            v-if="item.itemType === 'page'"
            :to="item.href"
            class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </router-link>
          <a
            v-else
            :href="item.href"
            :target="item.openInNewTab ? '_blank' : undefined"
            :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
            class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </a>
        </template>
        <router-link
          to="/cart"
          class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          @click="mobileMenuOpen = false"
        >
          <div class="flex items-center justify-between">
            <span>Cart</span>
            <span
              v-if="cartStore.itemCount > 0"
              class="bg-primary-600 text-white text-xs rounded-full px-2 py-1"
            >
              {{ cartStore.itemCount }}
            </span>
          </div>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { getMenuByKey, getPublicSettingsMap } from '../lib/cms'

const authStore = useAuthStore()
const cartStore = useCartStore()
const mobileMenuOpen = ref(false)
const siteName = ref('Lola As One')

const fallbackNavigationItems = [
  { id: 'workshops', label: 'Workshops', itemType: 'page', href: '/workshops', pageKey: 'workshops' },
  { id: 'adult-workshops', label: 'Adult Workshops', itemType: 'page', href: '/adult-workshops', pageKey: 'adult-workshops' },
  { id: 'boxes', label: 'Boxes', itemType: 'page', href: '/boxes', pageKey: 'boxes' },
  { id: 'blog', label: 'Blog', itemType: 'page', href: '/blog', pageKey: 'blog' },
  { id: 'about', label: 'About', itemType: 'page', href: '/about', pageKey: 'about' },
  { id: 'contact', label: 'Contact', itemType: 'page', href: '/contact', pageKey: 'contact' }
]

const navigationItems = ref([...fallbackNavigationItems])

const desktopNavClass = (item) => {
  if (item.pageKey === 'adult-workshops') {
    return 'text-gray-700 hover:text-rose-700 transition-colors'
  }

  if (item.pageKey === 'boxes') {
    return 'text-gray-700 hover:text-secondary-600 transition-colors'
  }

  return 'text-gray-700 hover:text-primary-600 transition-colors'
}

const loadNavigation = async () => {
  try {
    const menu = await getMenuByKey('header_primary')
    if (menu?.items?.length) {
      navigationItems.value = menu.items
    }
  } catch (error) {
    console.error('Error loading header navigation:', error)
  }
}

const loadSiteName = async () => {
  try {
    const settings = await getPublicSettingsMap()
    const configuredSiteName = settings.site_name?.value

    if (configuredSiteName) {
      siteName.value = configuredSiteName
    }
  } catch (error) {
    console.error('Error loading site settings:', error)
  }
}

onMounted(() => {
  loadNavigation()
  loadSiteName()
})
</script>
