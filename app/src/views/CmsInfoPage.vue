<template>
  <div class="min-h-screen bg-white">
    <section class="border-b border-gray-200 bg-gray-50">
      <div class="container mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <p class="text-sm font-semibold uppercase tracking-wide text-primary-600">Information</p>
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

const workshopFaqBodyHtml = `
  <h2>How long does a workshop last?</h2>
  <p>The LoLA art workshops generally last 1 hour unless specified otherwise. Please arrive before the workshop to allow your child to settle into the space.</p>
  <h2>What to bring?</h2>
  <p>We provide all art materials and lots of creative fun, but do dress for mess. There will be aprons for those who would like them. Please note that you will be taking the artwork home with you after the session.</p>
  <h2>Where can I wait for my child?</h2>
  <p>Parents are kindly requested to leave the workshop area during the class to minimise distraction. Please relax and enjoy a drink and a snack in the LoLA cafe.</p>
  <h2>What if I need to change my booking, cancel, or my child is unwell?</h2>
  <p>Our workshop requires a 48-hour cancellation notice to ensure a full refund or rescheduling. Cancellations made less than 48 hours before the scheduled workshop will not be eligible for a refund. This policy allows us to manage resources effectively and offer spots to other participants. Please note that if your child does not attend due to illness, these rules still apply.</p>
  <p>Changes to bookings can be made by emailing the team at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
  <h2>Photography</h2>
  <p>We like to take photographs of the LoLA studio and all the wonderful artwork the children create, however we will avoid taking photos of faces. These photos can be used on social media or our website. If you would prefer your child not to be photographed at all, please let us know by emailing us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
  <h2>Allergies and medication</h2>
  <p>Because the LoLA space is both a cafe and workshop space, please make us aware of any allergies or ask staff for more details on what we use in our food. Please note that allergies are not catered for.</p>
  <p>If your child takes any medication that we need to be aware of, please immediately alert a member of staff or email us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
  <p>We assume that by booking this session you have parental responsibility for the children booked. Please inform us if another guardian will be attending the session or if guardianship will change before the session starts. Please read our <a href="/privacy-policy">data protection information</a>.</p>
  <h2>Still have a question?</h2>
  <p>Please do not hesitate to email us if you have any questions.</p>
  <p>With kind wishes,<br>The LoLA team</p>
`.trim()

const fallbackContent = {
  'workshop-faqs': [
    {
      section_key: 'workshop_faqs_fallback',
      config_json: {
        title: 'Workshop FAQs',
        body_html: workshopFaqBodyHtml
      }
    }
  ],
  'privacy-policy': [
    {
      section_key: 'privacy_fallback',
      config_json: {
        title: 'Privacy Policy',
        body_html: '<p>The privacy policy is being updated. Please contact the studio for privacy questions.</p>'
      }
    }
  ],
  'terms-and-conditions': [
    {
      section_key: 'terms_fallback',
      config_json: {
        title: 'Terms and Conditions',
        body_html: '<p>The terms and conditions are being updated. Please contact the studio for booking questions.</p>'
      }
    }
  ]
}

const pageTitle = computed(() => page.value?.title || fallbackTitle(props.pageKey))
const pageSummary = computed(() => page.value?.seo_description || fallbackSummary(props.pageKey))
const visibleSections = computed(() => sections.value.length ? sections.value : fallbackContent[props.pageKey] || [])

function fallbackTitle(pageKey) {
  if (pageKey === 'workshop-faqs' || pageKey === 'faqs') return 'Workshop FAQs'
  if (pageKey === 'privacy-policy') return 'Privacy Policy'
  if (pageKey === 'terms-and-conditions') return 'Terms and Conditions'
  return 'Information'
}

function fallbackSummary(pageKey) {
  if (pageKey === 'workshop-faqs' || pageKey === 'faqs') {
    return 'Useful details about attending, changing, and preparing for LoLA art workshops.'
  }

  return ''
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
    error.value = fallbackContent[props.pageKey]
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
