<template>
  <header ref="navigationRoot" class="border-b border-dark-200 bg-dark-50 text-dark-800">
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
              <div
                v-if="hasDropdownItems(item)"
                class="relative"
                @keydown.escape.stop="closeDesktopDropdown"
              >
                <button
                  type="button"
                  :class="[desktopNavClass(item), 'inline-flex items-center gap-1.5']"
                  aria-haspopup="true"
                  :aria-expanded="isDesktopDropdownOpen(item) ? 'true' : 'false'"
                  @click.stop="toggleDesktopDropdown(item)"
                >
                  <span>{{ item.label }}</span>
                  <font-awesome-icon
                    icon="chevron-down"
                    class="h-3 w-3 transition-transform"
                    :class="{ 'rotate-180': isDesktopDropdownOpen(item) }"
                  />
                </button>

                <div
                  v-if="isDesktopDropdownOpen(item)"
                  class="absolute left-1/2 top-full z-30 mt-3 w-72 -translate-x-1/2 rounded-lg border border-dark-200 bg-white py-2 opacity-100 shadow-lg"
                  @click.stop
                >
                  <router-link
                    :to="item.href"
                    :class="dropdownNavClass(item)"
                    @click="closeDesktopDropdown"
                  >
                    All Summer Holiday Events
                  </router-link>
                  <router-link
                    v-for="child in item.children"
                    :key="child.id"
                    :to="child.href"
                    :class="dropdownNavClass(child)"
                    @click="closeDesktopDropdown"
                  >
                    {{ child.label }}
                  </router-link>
                </div>
              </div>
              <router-link
                v-else-if="item.itemType === 'page'"
                :to="item.href"
                :class="desktopNavClass(item)"
                @click="closeDesktopDropdown"
              >
                {{ item.label }}
              </router-link>
              <a
                v-else
                :href="item.href"
                :target="item.openInNewTab ? '_blank' : undefined"
                :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
                :class="desktopNavClass(item)"
                @click="closeDesktopDropdown"
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
            @click="closeDesktopDropdown"
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
            @click="closeDesktopDropdown"
          >
            Account
          </router-link>

          <router-link
            v-else
            to="/login"
            class="inline-flex items-center rounded-full border border-dark-300 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-500"
            @click="closeDesktopDropdown"
          >
            Sign In
          </router-link>

          <router-link
            v-if="authStore.isAdmin"
            to="/admin"
            class="inline-flex items-center rounded-full border border-dark-400 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-800 transition-colors hover:border-dark-700 hover:text-dark-900"
            @click="closeDesktopDropdown"
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
            <div v-if="hasDropdownItems(item)" class="border-b border-dark-100 pb-1 last:border-b-0">
              <button
                type="button"
                :class="mobileDropdownButtonClass(item)"
                :aria-expanded="isMobileDropdownOpen(item) ? 'true' : 'false'"
                aria-haspopup="true"
                @click="toggleMobileDropdown(item)"
              >
                <span>{{ item.label }}</span>
                <font-awesome-icon
                  icon="chevron-down"
                  class="h-3 w-3 transition-transform"
                  :class="{ 'rotate-180': isMobileDropdownOpen(item) }"
                />
              </button>

              <div
                v-if="isMobileDropdownOpen(item)"
                class="ml-3 border-l border-dark-200 pb-2 pl-4"
              >
                <router-link
                  :to="item.href"
                  :class="mobileDropdownItemClass(item)"
                  @click="closeMobileMenu"
                >
                  All Summer Holiday Events
                </router-link>
                <router-link
                  v-for="child in item.children"
                  :key="`${child.id}-mobile`"
                  :to="child.href"
                  :class="mobileDropdownItemClass(child)"
                  @click="closeMobileMenu"
                >
                  {{ child.label }}
                </router-link>
              </div>
            </div>
            <router-link
              v-else-if="item.itemType === 'page'"
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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { getMenuByKey, getPublicSettingsMap, getSummerHolidayDropdownItems } from '../lib/cms'

const authStore = useAuthStore()
const cartStore = useCartStore()
const route = useRoute()
const mobileMenuOpen = ref(false)
const navigationRoot = ref(null)
const siteName = ref('LoLA')

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
const desktopDropdownItemId = ref(null)
const mobileDropdownItemId = ref(null)

const hasDropdownItems = (item) => Array.isArray(item?.children) && item.children.length > 0

const isSummerHolidayNavItem = (item) => {
  if (!item) return false

  return item.pageKey === 'summer-holiday' ||
    item.routeName === 'SummerHoliday' ||
    item.href === '/summer-holiday'
}

const isActiveNavItem = (item) => {
  if (!item?.href) return false
  if (hasDropdownItems(item) && item.children.some((child) => isActiveNavItem(child))) return true
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

const mobileDropdownButtonClass = (item) => [
  'flex w-full items-center justify-between rounded-md px-1 py-3 text-left text-[14px] font-semibold uppercase tracking-[0.14em] transition-colors',
  isActiveNavItem(item)
    ? 'text-primary-500'
    : 'text-dark-700 hover:text-primary-500'
]

const dropdownNavClass = (item) => [
  'block px-4 py-3 text-sm font-medium text-dark-700 transition-colors hover:bg-dark-50 hover:text-primary-500',
  isActiveNavItem(item)
    ? 'bg-primary-50 text-primary-600'
    : ''
]

const mobileDropdownItemClass = (item) => [
  'block rounded-md px-1 py-2 text-sm font-medium transition-colors',
  isActiveNavItem(item)
    ? 'text-primary-500'
    : 'text-dark-600 hover:text-primary-500'
]

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  mobileDropdownItemId.value = null
}

const closeDesktopDropdown = () => {
  desktopDropdownItemId.value = null
}

const isDesktopDropdownOpen = (item) => desktopDropdownItemId.value === item.id

const toggleDesktopDropdown = (item) => {
  desktopDropdownItemId.value = isDesktopDropdownOpen(item) ? null : item.id
}

const isMobileDropdownOpen = (item) => mobileDropdownItemId.value === item.id

const toggleMobileDropdown = (item) => {
  mobileDropdownItemId.value = isMobileDropdownOpen(item) ? null : item.id
}

const handleDocumentClick = (event) => {
  if (navigationRoot.value?.contains(event.target)) return

  closeDesktopDropdown()
  closeMobileMenu()
}

const withSummerHolidayDropdown = async (items) => {
  const dropdownItems = await getSummerHolidayDropdownItems()
  if (!dropdownItems.length) return items

  return items.map((item) => {
    if (!isSummerHolidayNavItem(item)) return item

    return {
      ...item,
      children: dropdownItems
    }
  })
}

const loadNavigation = async () => {
  try {
    const menu = await getMenuByKey('header_primary')
    const items = menu?.items?.length ? menu.items : fallbackNavigationItems
    navigationItems.value = await withSummerHolidayDropdown(items)
  } catch (error) {
    console.error('Error loading header navigation:', error)

    try {
      navigationItems.value = await withSummerHolidayDropdown(fallbackNavigationItems)
    } catch (dropdownError) {
      console.error('Error loading summer holiday dropdown:', dropdownError)
    }
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
  closeDesktopDropdown()
  closeMobileMenu()
})

onMounted(() => {
  loadNavigation()
  loadSiteName()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
