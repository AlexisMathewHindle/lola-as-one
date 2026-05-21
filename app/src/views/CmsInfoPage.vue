<template>
  <div class="min-h-screen bg-white">
    <section class="border-b border-gray-200 bg-gray-50">
      <div class="container mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <p class="text-sm font-semibold uppercase tracking-wide text-primary-600">{{ pageEyebrow }}</p>
        <h1 class="mt-3 max-w-3xl text-4xl font-bold text-gray-900 sm:text-5xl">
          {{ pageTitle }}
        </h1>
        <p v-if="pageSummary" class="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
          {{ pageSummary }}
        </p>
      </div>
    </section>

    <section class="py-12 sm:py-16">
      <div class="container mx-auto max-w-4xl px-4">
        <div v-if="loading" class="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
          Loading page content...
        </div>

        <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 class="text-2xl font-bold text-red-900">Page unavailable</h2>
          <p class="mt-3 text-sm leading-6 text-red-800">
            {{ error }}
          </p>
          <router-link class="mt-5 inline-flex text-sm font-semibold text-primary-600 hover:text-primary-700" to="/contact">
            Contact the studio
          </router-link>
        </div>

        <div v-else class="space-y-10">
          <article
            v-for="section in visibleSections"
            :key="section.section_key"
            class="border-b border-gray-200 pb-10 last:border-b-0 last:pb-0"
          >
            <p v-if="sectionConfig(section).eyebrow" class="text-sm font-semibold uppercase tracking-wide text-primary-600">
              {{ sectionConfig(section).eyebrow }}
            </p>
            <h2
              v-if="sectionConfig(section).title"
              class="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl"
            >
              {{ sectionConfig(section).title }}
            </h2>
            <div
              v-if="sectionConfig(section).body_html"
              class="cms-copy mt-5 max-w-none text-gray-700"
              v-html="sectionConfig(section).body_html"
            />
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getPageWithSectionsByKey } from '@/lib/cms'
import { infoPageDefaultsFor } from '@/constants/infoPageDefaults'

const props = defineProps({
  pageKey: {
    type: String,
    required: true
  }
})

const page = ref(null)
const sections = ref([])
const loading = ref(true)
const error = ref('')

const fallbackSectionsFor = (pageKey) => {
  const defaults = infoPageDefaultsFor(pageKey)
  if (!defaults) return []

  return [
    {
      section_key: `${pageKey.replace(/-/g, '_')}_fallback`,
      config_json: {
        title: defaults.sectionTitle || defaults.title,
        body_html: defaults.bodyHtml
      }
    }
  ]
}

const pageTitle = computed(() => page.value?.title || fallbackTitle(props.pageKey))
const pageSummary = computed(() => page.value?.seo_description || fallbackSummary(props.pageKey))
const pageEyebrow = computed(() => props.pageKey === 'about' ? 'About' : 'Information')
const visibleSections = computed(() => sections.value.length ? sections.value : fallbackSectionsFor(props.pageKey))

function fallbackTitle(pageKey) {
  return infoPageDefaultsFor(pageKey)?.title || 'Information'
}

function fallbackSummary(pageKey) {
  return infoPageDefaultsFor(pageKey)?.summary || ''
}

function sectionConfig(section) {
  return section?.config_json || {}
}

async function loadPage() {
  loading.value = true
  error.value = ''

  try {
    const pageData = await getPageWithSectionsByKey(props.pageKey)
    page.value = pageData
    sections.value = (pageData?.sections || []).filter(section => section.is_enabled !== false)
    document.title = pageData?.seo_title || `${pageTitle.value} | Lola As One`
  } catch (err) {
    page.value = null
    sections.value = []
    error.value = fallbackSectionsFor(props.pageKey).length
      ? ''
      : (err?.message || 'This page could not be loaded from the CMS.')
    document.title = `${fallbackTitle(props.pageKey)} | Lola As One`
    console.error('Error loading CMS page:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.pageKey, loadPage, { immediate: true })
</script>

<style scoped>
.cms-copy :deep(h2),
.cms-copy :deep(h3) {
  color: #111827;
  font-weight: 700;
  line-height: 1.2;
  margin: 2rem 0 0.75rem;
}

.cms-copy :deep(h2) {
  font-size: 1.5rem;
}

.cms-copy :deep(h3) {
  font-size: 1.25rem;
}

.cms-copy :deep(p) {
  line-height: 1.75;
  margin: 0 0 1rem;
}

.cms-copy :deep(ul) {
  list-style: disc;
  margin: 0 0 1rem 1.25rem;
  padding: 0;
}

.cms-copy :deep(li) {
  line-height: 1.7;
  margin: 0.35rem 0;
}

.cms-copy :deep(a) {
  color: #2563eb;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
