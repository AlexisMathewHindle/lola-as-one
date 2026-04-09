<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Navigation</h1>
        <p class="mt-1 text-sm text-gray-600">
          Manage menu items, visibility, labels, links, and sort order for the site navigation.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <div class="relative">
            <select
              v-model="selectedMenuKey"
              class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 sm:min-w-56"
            >
              <option
                v-for="menu in menus"
                :key="menu.id"
                :value="menu.menu_key"
              >
                Menu - {{ menu.name }}
              </option>
            </select>
            <font-awesome-icon
              icon="chevron-down"
              class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        <button
          @click="startCreateItem"
          class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <font-awesome-icon icon="plus" class="mr-2 h-4 w-4" />
          Add Menu Item
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
    >
      {{ error }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ currentMenu?.name || 'Menu Items' }}
          </h2>
          <p class="mt-1 text-sm text-gray-600">
            {{ currentMenu?.description || 'Edit the menu items shown on the public site.' }}
          </p>
        </div>

        <div v-if="loading" class="px-6 py-12 text-center">
          <div class="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p class="mt-4 text-sm text-gray-600">Loading menu items...</p>
        </div>

        <div v-else-if="!menuItems.length" class="px-6 py-12 text-center">
          <font-awesome-icon icon="list" class="h-12 w-12 text-gray-300" />
          <p class="mt-4 text-sm text-gray-600">This menu does not have any items yet.</p>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <article
            v-for="item in menuItems"
            :key="item.id"
            class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900">{{ item.label }}</h3>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="item.is_enabled ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ item.is_enabled ? 'Visible' : 'Hidden' }}
                </span>
                <span class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                  {{ item.item_type === 'page' ? 'Page link' : 'External link' }}
                </span>
              </div>

              <div class="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  <span class="font-medium text-gray-700">Target:</span>
                  {{ itemTargetLabel(item) }}
                </p>
                <p>
                  <span class="font-medium text-gray-700">Sort order:</span>
                  {{ item.sort_order }}
                </p>
                <p v-if="item.item_type === 'page' && item.page && !item.page.show_in_navigation" class="text-warning-700">
                  This linked page is currently hidden at the page level, so it will not appear publicly until page visibility is enabled.
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 lg:justify-end">
              <button
                @click="toggleVisibility(item)"
                :disabled="saving"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ item.is_enabled ? 'Hide' : 'Show' }}
              </button>
              <button
                @click="startEditItem(item)"
                :disabled="saving"
                class="inline-flex items-center justify-center rounded-lg border border-primary-300 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <font-awesome-icon icon="edit" class="mr-2 h-4 w-4" />
                Edit
              </button>
              <button
                @click="handleDeleteItem(item)"
                :disabled="saving"
                class="inline-flex items-center justify-center rounded-lg border border-danger-300 px-3 py-2 text-sm font-medium text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <font-awesome-icon icon="trash" class="mr-2 h-4 w-4" />
                Delete
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'Edit Menu Item' : 'Add Menu Item' }}
          </h2>
          <p class="mt-1 text-sm text-gray-600">
            Configure the label, destination, visibility, and sort order for this menu item.
          </p>
        </div>

        <form class="space-y-5 px-6 py-6" @submit.prevent="handleSubmit">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Label</label>
            <input
              v-model="form.label"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Menu item label"
            >
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Link Type</label>
              <div class="relative">
                <select
                  v-model="form.itemType"
                  class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="page">Page</option>
                  <option value="external">External URL</option>
                </select>
                <font-awesome-icon
                  icon="chevron-down"
                  class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                v-model.number="form.sortOrder"
                type="number"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
                step="1"
              >
            </div>
          </div>

          <div v-if="form.itemType === 'page'">
            <label class="mb-2 block text-sm font-medium text-gray-700">Linked Page</label>
            <div class="relative">
              <select
                v-model="form.pageId"
                class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a page</option>
                <option
                  v-for="page in pageOptions"
                  :key="page.id"
                  :value="page.id"
                >
                  {{ page.title }} ({{ page.path }})
                </option>
              </select>
              <font-awesome-icon
                icon="chevron-down"
                class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400"
              />
            </div>
            <p class="mt-2 text-xs text-gray-500">
              Only published pages are available here. If a linked page is hidden at the page level, it still will not show publicly.
            </p>
          </div>

          <div v-else class="space-y-5">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">External URL</label>
              <input
                v-model="form.url"
                type="url"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com"
              >
            </div>

            <label class="flex items-center gap-3 text-sm text-gray-700">
              <input
                v-model="form.openInNewTab"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              Open external links in a new tab
            </label>
          </div>

          <label class="flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="form.isEnabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Show this item publicly
          </label>

          <div class="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              :disabled="saving"
              class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <font-awesome-icon
                :icon="saving ? 'spinner' : 'save'"
                class="mr-2 h-4 w-4"
                :class="{ 'animate-spin': saving }"
              />
              {{ saving ? 'Saving...' : (isEditing ? 'Update Item' : 'Create Item') }}
            </button>

            <button
              type="button"
              @click="resetForm"
              :disabled="saving"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  deleteMenuItem,
  getAdminMenuByKey,
  getAllSiteMenus,
  getPublishedSitePages,
  saveMenuItem
} from '../../lib/cms'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const menus = ref([])
const selectedMenuKey = ref('header_primary')
const currentMenu = ref(null)
const menuItems = ref([])
const pageOptions = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const editingItemId = ref(null)

const form = reactive({
  label: '',
  itemType: 'page',
  pageId: '',
  url: '',
  openInNewTab: false,
  sortOrder: 10,
  isEnabled: true
})

const isEditing = computed(() => !!editingItemId.value)

const nextSortOrder = () => {
  if (!menuItems.value.length) return 10
  return Math.max(...menuItems.value.map(item => Number(item.sort_order) || 0)) + 10
}

const resetForm = () => {
  editingItemId.value = null
  form.label = ''
  form.itemType = 'page'
  form.pageId = ''
  form.url = ''
  form.openInNewTab = false
  form.sortOrder = nextSortOrder()
  form.isEnabled = true
}

const itemTargetLabel = (item) => {
  if (item.item_type === 'external') {
    return item.url
  }

  if (!item.page) {
    return 'Linked page no longer exists'
  }

  return `${item.page.title} (${item.page.path})`
}

const loadMenus = async () => {
  const data = await getAllSiteMenus()
  menus.value = data

  if (!data.some(menu => menu.menu_key === selectedMenuKey.value) && data.length > 0) {
    selectedMenuKey.value = data[0].menu_key
  }
}

const loadPages = async () => {
  pageOptions.value = await getPublishedSitePages()
}

const loadMenu = async () => {
  if (!selectedMenuKey.value) return

  loading.value = true
  error.value = null

  try {
    const menu = await getAdminMenuByKey(selectedMenuKey.value)
    currentMenu.value = menu
    menuItems.value = menu.items || []
    resetForm()
  } catch (err) {
    error.value = err.message || 'Failed to load menu'
    console.error('Error loading menu:', err)
  } finally {
    loading.value = false
  }
}

const startCreateItem = () => {
  resetForm()
}

const startEditItem = (item) => {
  editingItemId.value = item.id
  form.label = item.label || ''
  form.itemType = item.item_type
  form.pageId = item.page_id || ''
  form.url = item.url || ''
  form.openInNewTab = item.open_in_new_tab || false
  form.sortOrder = item.sort_order ?? nextSortOrder()
  form.isEnabled = item.is_enabled
}

const validateForm = () => {
  if (!form.label.trim()) {
    error.value = 'Label is required'
    return false
  }

  if (form.itemType === 'page' && !form.pageId) {
    error.value = 'Please select a page for this menu item'
    return false
  }

  if (form.itemType === 'external' && !form.url.trim()) {
    error.value = 'External URL is required'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!currentMenu.value) return
  if (!validateForm()) return

  saving.value = true
  error.value = null

  try {
    const payload = {
      id: editingItemId.value || undefined,
      menu_id: currentMenu.value.id,
      label: form.label.trim(),
      item_type: form.itemType,
      page_id: form.itemType === 'page' ? form.pageId : null,
      url: form.itemType === 'external' ? form.url.trim() : null,
      open_in_new_tab: form.itemType === 'external' ? form.openInNewTab : false,
      sort_order: Number(form.sortOrder) || 0,
      is_enabled: form.isEnabled
    }

    await saveMenuItem(payload)
    toastStore.success(isEditing.value ? 'Menu item updated' : 'Menu item created')
    await loadMenu()
  } catch (err) {
    error.value = err.message || 'Failed to save menu item'
    toastStore.error(error.value)
    console.error('Error saving menu item:', err)
  } finally {
    saving.value = false
  }
}

const toggleVisibility = async (item) => {
  saving.value = true
  error.value = null

  try {
    await saveMenuItem({
      id: item.id,
      label: item.label,
      item_type: item.item_type,
      page_id: item.page_id,
      url: item.url,
      open_in_new_tab: item.open_in_new_tab,
      sort_order: item.sort_order,
      is_enabled: !item.is_enabled
    })

    toastStore.success(item.is_enabled ? 'Menu item hidden' : 'Menu item shown')
    await loadMenu()
  } catch (err) {
    error.value = err.message || 'Failed to update menu item visibility'
    toastStore.error(error.value)
    console.error('Error updating menu item visibility:', err)
  } finally {
    saving.value = false
  }
}

const handleDeleteItem = async (item) => {
  const confirmed = window.confirm(`Delete "${item.label}" from this menu?`)
  if (!confirmed) return

  saving.value = true
  error.value = null

  try {
    await deleteMenuItem(item.id)
    toastStore.success('Menu item deleted')
    await loadMenu()
  } catch (err) {
    error.value = err.message || 'Failed to delete menu item'
    toastStore.error(error.value)
    console.error('Error deleting menu item:', err)
  } finally {
    saving.value = false
  }
}

watch(selectedMenuKey, () => {
  loadMenu()
})

watch(() => form.itemType, (newType) => {
  if (newType === 'page') {
    form.url = ''
    form.openInNewTab = false
  } else {
    form.pageId = ''
  }
})

watch(() => form.pageId, (pageId) => {
  if (!pageId || form.itemType !== 'page' || form.label.trim()) return

  const page = pageOptions.value.find(entry => entry.id === pageId)
  if (page) {
    form.label = page.title
  }
})

onMounted(async () => {
  try {
    await Promise.all([loadMenus(), loadPages()])
    await loadMenu()
  } catch (err) {
    error.value = err.message || 'Failed to initialize navigation manager'
    console.error('Error initializing navigation manager:', err)
  }
})
</script>
