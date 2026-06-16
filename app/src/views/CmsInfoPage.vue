<template>
  <div v-if="isLegacyAboutPage" class="min-h-screen bg-dark-50">
    <h1 class="sr-only">{{ pageTitle }}</h1>

    <section v-if="pageMedia.heroImage" class="bg-white">
      <img
        :src="pageMedia.heroImage.src"
        :alt="pageMedia.heroImage.alt"
        class="about-banner about-banner-top"
        :style="imagePositionStyle(pageMedia.heroImage)"
      >
    </section>

    <section class="section-shell py-10 sm:py-14 lg:py-16">
      <div>
        <div v-if="loading" class="rounded-lg border border-dark-200 bg-white p-6 text-dark-600 shadow-sm">
          Loading page content...
        </div>

        <div v-else-if="error" class="rounded-lg border border-danger-200 bg-danger-50 p-6">
          <h2 class="text-2xl font-bold text-red-900">Page unavailable</h2>
          <p class="mt-3 text-sm leading-6 text-danger-800">
            {{ error }}
          </p>
          <router-link class="mt-5 inline-flex text-sm font-semibold text-primary-600 hover:text-primary-700" to="/contact">
            Contact the studio
          </router-link>
        </div>

        <div v-else>
          <div
            v-if="aboutIntroHtml"
            class="cms-copy mx-auto mb-8 max-w-3xl text-center text-base leading-8 text-dark-600 sm:mb-10"
            v-html="aboutIntroHtml"
          />

          <article class="about-story-panel rounded-lg border border-dark-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
            <figure v-if="pageMedia.featureImage" class="about-story-feature overflow-hidden rounded-lg border border-dark-200 bg-dark-50">
              <img
                :src="pageMedia.featureImage.src"
                :alt="pageMedia.featureImage.alt"
                class="w-full object-contain"
                :style="imagePositionStyle(pageMedia.featureImage)"
              >
            </figure>

            <div class="about-story-copy cms-copy text-dark-600">
              <template
                v-for="section in visibleSections"
                :key="section.section_key"
              >
                <p v-if="sectionConfig(section).eyebrow" class="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">
                  {{ sectionConfig(section).eyebrow }}
                </p>
                <div
                  v-if="sectionConfig(section).body_html"
                  v-html="sectionConfig(section).body_html"
                />
              </template>
            </div>
          </article>

          <div
            v-if="aboutContactHtml"
            class="cms-copy mx-auto mt-10 max-w-3xl text-center text-dark-600"
            v-html="aboutContactHtml"
          />
        </div>
      </div>
    </section>

    <section v-if="pageMedia.closingImage" class="bg-white">
      <img
        :src="pageMedia.closingImage.src"
        :alt="pageMedia.closingImage.alt"
        class="about-banner about-banner-bottom"
        :style="imagePositionStyle(pageMedia.closingImage)"
      >
    </section>
  </div>

  <div v-else class="min-h-screen bg-white">
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
import { infoPageDefaultsFor, infoPageMediaFor } from '@/constants/infoPageDefaults'
import { setPageSeo } from '@/lib/seo'

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
const isLegacyAboutPage = computed(() => props.pageKey === 'about')
const firstSectionConfig = computed(() => sectionConfig(visibleSections.value[0]))
const pageMedia = computed(() => {
  const defaults = normalizeMedia(infoPageMediaFor(props.pageKey) || {})
  const sectionMedia = mediaConfigFromSections(visibleSections.value)

  if (!sectionMedia) return defaults

  return {
    heroImage: resolveMediaImage(sectionMedia, 'hero_image', 'heroImage', defaults.heroImage),
    featureImage: resolveMediaImage(sectionMedia, 'feature_image', 'featureImage', defaults.featureImage),
    closingImage: resolveMediaImage(sectionMedia, 'closing_image', 'closingImage', defaults.closingImage)
  }
})
const aboutIntroHtml = computed(() => (
  firstSectionConfig.value?.intro_html || textToParagraphHtml(pageSummary.value)
))
const aboutContactHtml = computed(() => (
  firstSectionConfig.value?.contact_html || ''
))

function pathForPageKey(pageKey) {
  return {
    about: '/about',
    'workshop-faqs': '/workshop-faqs',
    'privacy-policy': '/privacy-policy',
    'terms-and-conditions': '/terms-and-conditions'
  }[pageKey] || `/${pageKey}`
}

function fallbackTitle(pageKey) {
  return infoPageDefaultsFor(pageKey)?.title || 'Information'
}

function fallbackSummary(pageKey) {
  return infoPageDefaultsFor(pageKey)?.summary || ''
}

function sectionConfig(section) {
  return section?.config_json || {}
}

function mediaConfigFromSections(pageSections) {
  return pageSections
    .map(sectionConfig)
    .find(hasMediaConfig) || null
}

function hasMediaConfig(config) {
  return hasOwn(config, 'hero_image') ||
    hasOwn(config, 'heroImage') ||
    hasOwn(config, 'feature_image') ||
    hasOwn(config, 'featureImage') ||
    hasOwn(config, 'closing_image') ||
    hasOwn(config, 'closingImage')
}

function normalizeMedia(media) {
  return {
    heroImage: normalizeImage(media.heroImage || media.hero_image),
    featureImage: normalizeImage(media.featureImage || media.feature_image),
    closingImage: normalizeImage(media.closingImage || media.closing_image)
  }
}

function resolveMediaImage(media, snakeKey, camelKey, fallback) {
  if (!hasOwn(media, snakeKey) && !hasOwn(media, camelKey)) return fallback
  return normalizeImage(media[snakeKey] || media[camelKey])
}

function normalizeImage(image) {
  if (!image?.src) return null

  return {
    src: image.src,
    alt: image.alt || '',
    position: image.position || 'center'
  }
}

function imagePositionStyle(image) {
  return image?.position ? { objectPosition: image.position } : undefined
}

function textToParagraphHtml(text) {
  if (!text) return ''
  return `<p>${escapeHtml(text)}</p>`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key)
}

async function loadPage() {
  loading.value = true
  error.value = ''

  try {
    const pageData = await getPageWithSectionsByKey(props.pageKey)
    page.value = pageData
    sections.value = (pageData?.sections || []).filter(section => section.is_enabled !== false)
    setPageSeo({
      title: pageData?.seo_title || pageTitle.value,
      description: pageData?.seo_description || pageSummary.value,
      path: pageData?.path || pathForPageKey(props.pageKey)
    })
  } catch (err) {
    page.value = null
    sections.value = []
    error.value = fallbackSectionsFor(props.pageKey).length
      ? ''
      : (err?.message || 'This page could not be loaded from the CMS.')
    setPageSeo({
      title: fallbackTitle(props.pageKey),
      description: fallbackSummary(props.pageKey),
      path: pathForPageKey(props.pageKey)
    })
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
  color: #332f2c;
  font-weight: 400;
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
  color: #9e584a;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 160ms ease, text-decoration-color 160ms ease;
}

.cms-copy :deep(a:hover) {
  color: #84483e;
  text-decoration-color: #d7ad9b;
}

.about-banner {
  display: block;
  width: 100%;
  object-fit: cover;
}

.about-banner-top {
  aspect-ratio: 4.25 / 1;
  min-height: 12rem;
}

.about-banner-bottom {
  aspect-ratio: 3.3 / 1;
  min-height: 13rem;
}

.about-story-panel {
  margin-inline: auto;
  width: 100%;
}

.about-story-panel::after {
  clear: both;
  content: "";
  display: block;
}

.about-story-feature {
  margin: 0 auto 2rem;
  max-width: 52rem;
}

.about-story-feature img {
  display: block;
  margin-inline: auto;
  width: 100%;
}

.about-story-copy {
  margin-inline: auto;
  max-width: 52rem;
}

.about-story-copy :deep(h2:first-child),
.about-story-copy :deep(h3:first-child),
.about-story-copy :deep(p:first-child) {
  margin-top: 0;
}

.about-story-copy :deep(h2:not(:first-of-type)) {
  clear: left;
  padding-top: 1rem;
}

.about-story-copy :deep(a) {
  border: 1px solid #efddaf;
  border-radius: 0.35rem;
  color: #b26758 !important;
  display: inline-flex;
  margin-top: 0.25rem;
  padding: 0.5rem 0.9rem;
  text-decoration: none;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.about-story-copy :deep(a:hover) {
  background: #fcf8ee;
  border-color: #e5ca82;
  color: #9e584a !important;
}

.about-story-copy :deep(a u) {
  text-decoration: none;
}

@media (min-width: 640px) {
  .about-banner-top {
    min-height: 14rem;
  }

  .about-banner-bottom {
    min-height: 16rem;
  }
}

@media (min-width: 768px) {
  .about-story-feature {
    float: left;
    margin: 0 2rem 1.5rem 0;
    max-width: 32rem;
    width: min(42%, 32rem);
  }

  .about-story-copy {
    max-width: none;
  }
}
</style>
