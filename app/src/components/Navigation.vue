<template>
  <header class="border-b border-dark-200 bg-dark-50 text-dark-800">
    <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
      <div class="flex min-h-[5.25rem] items-center justify-between gap-6 py-4">
        <router-link to="/" class="min-w-0 flex-1 md:flex-none" @click="closeMobileMenu">
          <div class="flex flex-col">
            <span class="text-[10px] font-semibold uppercase tracking-[0.32em] text-dark-500">
              Creative Studio
            </span>
            <span class="mt-1 truncate text-[1.65rem] font-light leading-none text-dark-800 sm:text-[1.9rem]">
              {{ siteName }}
            </span>
          </div>
        </router-link>

        <div class="hidden lg:flex min-w-0 flex-1 items-center justify-center">
          <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
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
        </div>

        <div class="hidden lg:flex items-center gap-3 lg:flex-none">
          <router-link
            to="/cart"
            class="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-dark-300 bg-white text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-500"
            aria-label="View cart"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span
              v-if="cartStore.itemCount > 0"
              class="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary-500 px-1 text-[10px] font-semibold text-white"
            >
              {{ cartStore.itemCount }}
            </span>
          </router-link>

          <router-link
            v-if="authStore.isAuthenticated"
            to="/account"
            class="inline-flex items-center rounded-full border border-dark-300 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-500"
          >
            Account
          </router-link>

          <router-link
            v-else
            to="/login"
            class="inline-flex items-center rounded-full border border-dark-300 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-500"
          >
            Sign In
          </router-link>

          <router-link
            v-if="authStore.isAdmin"
            to="/admin"
            class="inline-flex items-center rounded-full border border-dark-400 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-800 transition-colors hover:border-dark-700 hover:text-dark-900"
          >
            Admin
          </router-link>
        </div>

        <div class="flex items-center gap-3 lg:hidden">
          <router-link
            to="/cart"
            class="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-dark-300 bg-white text-dark-700"
            aria-label="View cart"
            @click="closeMobileMenu"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span
              v-if="cartStore.itemCount > 0"
              class="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary-500 px-1 text-[10px] font-semibold text-white"
            >
              {{ cartStore.itemCount }}
            </span>
          </router-link>

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-dark-300 bg-white text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-500"
            :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
            aria-label="Toggle menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg v-if="!mobileMenuOpen" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <div v-if="mobileMenuOpen" class="border-t border-dark-200 bg-white lg:hidden">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div class="space-y-1">
          <template v-for="item in navigationItems" :key="`${item.id}-mobile`">
            <router-link
              v-if="item.itemType === 'page'"
              :to="item.href"
              :class="mobileNavClass(item)"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </router-link>
            <a
              v-else
              :href="item.href"
              :target="item.openInNewTab ? '_blank' : undefined"
              :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
              :class="mobileNavClass(item)"
              @click="closeMobileMenu"
            >
              {{ item.label }}
            </a>
          </template>
        </div>

        <div class="mt-5 flex flex-wrap gap-3 border-t border-dark-200 pt-5">
          <router-link
            v-if="authStore.isAuthenticated"
            to="/account"
            class="inline-flex items-center rounded-full border border-dark-300 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-700"
            @click="closeMobileMenu"
          >
            Account
          </router-link>

          <router-link
            v-else
            to="/login"
            class="inline-flex items-center rounded-full border border-dark-300 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-700"
            @click="closeMobileMenu"
          >
            Sign In
          </router-link>

          <router-link
            v-if="authStore.isAdmin"
            to="/admin"
            class="inline-flex items-center rounded-full border border-dark-400 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-800"
            @click="closeMobileMenu"
          >
            Admin
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { getMenuByKey, getPublicSettingsMap } from '../lib/cms'

const authStore = useAuthStore()
const cartStore = useCartStore()
const route = useRoute()
const mobileMenuOpen = ref(false)
const siteName = ref('Lola As One')

const fallbackNavigationItems = [
  { id: 'workshops', label: 'Workshops', itemType: 'page', href: '/workshops', pageKey: 'workshops' },
  { id: 'half-term', label: 'Half Term', itemType: 'page', href: '/half-term', pageKey: 'half-term' },
  { id: 'summer-holiday', label: 'Summer Holiday', itemType: 'page', href: '/summer-holiday', pageKey: 'summer-holiday' },
  { id: 'adult-workshops', label: 'Adult Workshops', itemType: 'page', href: '/adult-workshops', pageKey: 'adult-workshops' },
  { id: 'boxes', label: 'Boxes', itemType: 'page', href: '/boxes', pageKey: 'boxes' },
  { id: 'blog', label: 'Blog', itemType: 'page', href: '/blog', pageKey: 'blog' },
  { id: 'about', label: 'About', itemType: 'page', href: '/about', pageKey: 'about' },
  { id: 'contact', label: 'Contact', itemType: 'page', href: '/contact', pageKey: 'contact' }
]

const navigationItems = ref([...fallbackNavigationItems])

const isActiveNavItem = (item) => {
  if (!item?.href) return false
  if (item.href === '/') return route.path === '/'
  return route.path === item.href || route.path.startsWith(`${item.href}/`)
}

const desktopNavClass = (item) => [
  'border-b border-transparent pb-1 text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors',
  isActiveNavItem(item)
    ? 'border-primary-500 text-primary-500'
    : 'text-dark-700 hover:text-primary-500'
]

const mobileNavClass = (item) => [
  'block rounded-md px-1 py-3 text-[14px] font-semibold uppercase tracking-[0.14em] transition-colors',
  isActiveNavItem(item)
    ? 'text-primary-500'
    : 'text-dark-700 hover:text-primary-500'
]

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
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

watch(() => route.fullPath, () => {
  closeMobileMenu()
})

onMounted(() => {
  loadNavigation()
  loadSiteName()
})
</script>
