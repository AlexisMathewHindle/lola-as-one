<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Information Pages</h1>
        <p class="mt-1 text-sm text-gray-600">
          Edit the CMS-backed footer information pages, including workshop FAQs, privacy, and terms.
        </p>
      </div>

      <a
        v-if="form.path"
        :href="form.path"
        target="_blank"
        rel="noreferrer noopener"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <font-awesome-icon icon="external-link-alt" class="mr-2 h-4 w-4" />
        Preview
      </a>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
    >
      {{ error }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.75fr_1.8fr]">
      <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Pages</h2>
          <p class="mt-1 text-sm text-gray-600">
            These pages can be linked in the footer navigation.
          </p>
        </div>

        <div class="space-y-2 p-4">
          <button
            v-for="pageOption in pageOptions"
            :key="pageOption.key"
            type="button"
            class="w-full rounded-lg border px-4 py-3 text-left transition-colors"
            :class="selectedPageKey === pageOption.key
              ? 'border-primary-500 bg-primary-50 text-primary-800'
              : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-gray-50'"
            @click="selectedPageKey = pageOption.key"
          >
            <span class="block text-sm font-semibold">{{ pageOption.label }}</span>
            <span class="mt-1 block text-xs text-gray-500">{{ pageOption.path }}</span>
          </button>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">Page Content</h2>
          <p class="mt-1 text-sm text-gray-600">
            Changes are saved to the CMS tables used by the public information page renderer.
          </p>
        </div>

        <div v-if="loading" class="px-6 py-12 text-center">
          <div class="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p class="mt-4 text-sm text-gray-600">Loading page content...</p>
        </div>

        <form v-else class="space-y-6 px-6 py-6" @submit.prevent="handleSave">
          <div class="grid gap-5 lg:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Page Title</label>
              <input
                v-model="form.title"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Public Path</label>
              <input
                v-model="form.path"
                type="text"
                readonly
                class="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-600"
              >
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">SEO Title</label>
              <input
                v-model="form.seoTitle"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">Section Heading</label>
              <input
                v-model="form.sectionTitle"
                type="text"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Page Summary</label>
            <textarea
              v-model="form.seoDescription"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <label class="flex items-center gap-3 text-sm text-gray-700">
              <input
                v-model="form.isPublished"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              Published
            </label>

            <label class="flex items-center gap-3 text-sm text-gray-700">
              <input
                v-model="form.showInNavigation"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              Available for navigation menus
            </label>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Body Content</label>
            <RichTextEditor
              v-model="form.bodyHtml"
              placeholder="Write the page content..."
            />
          </div>

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
              {{ saving ? 'Saving...' : 'Save Page' }}
            </button>

            <button
              type="button"
              :disabled="saving"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              @click="loadPage"
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
import { onMounted, reactive, ref, watch } from 'vue'
import RichTextEditor from '../../components/shared/RichTextEditor.vue'
import {
  getAdminPageWithSectionsByKey,
  saveSitePage,
  upsertPageSections
} from '../../lib/cms'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const pageOptions = [
  { key: 'workshop-faqs', label: 'Workshop FAQs', path: '/workshop-faqs' },
  { key: 'privacy-policy', label: 'Privacy Policy', path: '/privacy-policy' },
  { key: 'terms-and-conditions', label: 'Terms and Conditions', path: '/terms-and-conditions' }
]

const selectedPageKey = ref('workshop-faqs')
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const currentPage = ref(null)

const form = reactive({
  pageId: '',
  path: '',
  title: '',
  seoTitle: '',
  seoDescription: '',
  isPublished: true,
  showInNavigation: true,
  sectionKey: '',
  sectionTitle: '',
  bodyHtml: ''
})

const sectionKeyForPage = (pageKey) => `${pageKey.replace(/-/g, '_')}_content`

const resetForm = (page, section) => {
  form.pageId = page?.id || ''
  form.path = page?.path || ''
  form.title = page?.title || ''
  form.seoTitle = page?.seo_title || ''
  form.seoDescription = page?.seo_description || ''
  form.isPublished = page?.status === 'published'
  form.showInNavigation = page?.show_in_navigation !== false
  form.sectionKey = section?.section_key || sectionKeyForPage(selectedPageKey.value)
  form.sectionTitle = section?.config_json?.title || page?.title || ''
  form.bodyHtml = section?.config_json?.body_html || ''
}

const loadPage = async () => {
  loading.value = true
  error.value = null

  try {
    const page = await getAdminPageWithSectionsByKey(selectedPageKey.value)
    const richTextSection = (page.sections || []).find(section => section.section_type === 'rich_text') || page.sections?.[0]

    currentPage.value = page
    resetForm(page, richTextSection)
  } catch (err) {
    currentPage.value = null
    resetForm(null, null)
    error.value = err.message || 'Failed to load information page'
    console.error('Error loading information page:', err)
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  if (!form.pageId) {
    error.value = 'This page has not been seeded in the CMS yet.'
    return false
  }

  if (!form.title.trim()) {
    error.value = 'Page title is required'
    return false
  }

  if (!form.sectionTitle.trim()) {
    error.value = 'Section heading is required'
    return false
  }

  return true
}

const handleSave = async () => {
  if (!validateForm()) return

  saving.value = true
  error.value = null

  try {
    const isPublished = Boolean(form.isPublished)

    await saveSitePage({
      id: form.pageId,
      title: form.title.trim(),
      seo_title: form.seoTitle.trim() || null,
      seo_description: form.seoDescription.trim() || null,
      status: isPublished ? 'published' : 'draft',
      show_in_navigation: Boolean(form.showInNavigation),
      published_at: isPublished
        ? (currentPage.value?.published_at || new Date().toISOString())
        : currentPage.value?.published_at
    })

    await upsertPageSections([
      {
        page_id: form.pageId,
        section_key: form.sectionKey || sectionKeyForPage(selectedPageKey.value),
        section_type: 'rich_text',
        sort_order: 10,
        is_enabled: true,
        config_json: {
          title: form.sectionTitle.trim(),
          body_html: form.bodyHtml
        }
      }
    ])

    toastStore.success('Information page saved')
    await loadPage()
  } catch (err) {
    error.value = err.message || 'Failed to save information page'
    toastStore.error(error.value)
    console.error('Error saving information page:', err)
  } finally {
    saving.value = false
  }
}

watch(selectedPageKey, () => {
  loadPage()
})

onMounted(loadPage)
</script>
