<template>
  <div class="min-h-screen bg-white">
    <section class="border-b border-gray-200 bg-gray-50">
      <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-wide text-primary-600">Contact</p>
        <h1 class="mt-3 max-w-3xl text-4xl font-bold text-gray-900 sm:text-5xl">
          {{ pageTitle }}
        </h1>
        <p v-if="pageSummary" class="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
          {{ pageSummary }}
        </p>
      </div>
    </section>

    <section class="bg-white py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div class="space-y-8">
            <div>
              <h2 class="text-3xl font-bold text-gray-900">
                {{ contactSectionTitle }}
              </h2>
              <div
                v-if="contactBodyHtml"
                class="cms-copy mt-5 max-w-none text-gray-700"
                v-html="contactBodyHtml"
              />
            </div>

            <div class="space-y-5">
              <div class="flex items-start rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                  <font-awesome-icon icon="envelope" class="text-lg text-primary-600" />
                </div>
                <div class="ml-4">
                  <h3 class="text-base font-semibold text-gray-900">Email</h3>
                  <a :href="`mailto:${contactEmail}`" class="mt-1 inline-flex text-primary-600 hover:text-primary-700">
                    {{ contactEmail }}
                  </a>
                  <p class="mt-1 text-sm text-gray-500">We'll respond as soon as we can.</p>
                </div>
              </div>

              <div
                v-if="contactVenue || addressLines.length"
                class="flex items-start rounded-lg border border-gray-200 bg-gray-50 p-5"
              >
                <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-secondary-100">
                  <font-awesome-icon icon="map-marker-alt" class="text-lg text-secondary-600" />
                </div>
                <div class="ml-4">
                  <h3 class="text-base font-semibold text-gray-900">Address</h3>
                  <p v-if="contactVenue" class="mt-1 font-medium text-gray-700">{{ contactVenue }}</p>
                  <div class="mt-1 text-gray-600">
                    <p v-for="line in addressLines" :key="line">{{ line }}</p>
                  </div>
                </div>
              </div>

              <div
                v-if="openingTimes.length"
                class="rounded-lg border border-gray-200 bg-gray-50 p-5"
              >
                <div class="mb-4 flex items-center">
                  <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-success-100">
                    <font-awesome-icon icon="clock" class="text-lg text-success-600" />
                  </div>
                  <h3 class="ml-4 text-base font-semibold text-gray-900">Opening Times</h3>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                  <div
                    v-for="entry in openingTimes"
                    :key="entry.day"
                    class="flex justify-between gap-4"
                  >
                    <span class="font-medium text-gray-800">{{ entry.day }}</span>
                    <span class="text-right">{{ entry.hours }}</span>
                  </div>
                </div>
              </div>

              <div v-if="socialItems.length" class="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <h3 class="text-base font-semibold text-gray-900">Follow Us</h3>
                <div class="mt-4 flex flex-wrap gap-2">
                  <a
                    v-for="item in socialItems"
                    :key="item.label"
                    :href="item.href"
                    target="_blank"
                    rel="noreferrer noopener"
                    class="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-primary-500 hover:text-primary-600"
                  >
                    {{ item.label }}
                    <font-awesome-icon icon="external-link-alt" class="ml-2 h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 class="text-3xl font-bold text-gray-900">
                Send a Message
              </h2>

              <div v-if="formSuccess" class="mt-6 rounded-lg border border-success-200 bg-success-50 p-4">
                <div class="flex items-center">
                  <font-awesome-icon icon="check-circle" class="mr-3 text-xl text-success-600" />
                  <div>
                    <p class="font-semibold text-success-900">Message sent successfully!</p>
                    <p class="text-sm text-success-700">We'll get back to you as soon as possible.</p>
                  </div>
                </div>
              </div>

              <div v-if="formError" class="mt-6 rounded-lg border border-danger-200 bg-danger-50 p-4">
                <div class="flex items-center">
                  <font-awesome-icon icon="exclamation-circle" class="mr-3 text-xl text-danger-600" />
                  <div>
                    <p class="font-semibold text-danger-900">Failed to send message</p>
                    <p class="text-sm text-danger-700">{{ formError }}</p>
                  </div>
                </div>
              </div>

              <form class="mt-6 space-y-6" @submit.prevent="handleSubmit">
                <div>
                  <label for="name" class="mb-2 block text-sm font-medium text-gray-700">
                    Name <span class="text-danger-600">*</span>
                  </label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    required
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    :class="{ 'border-danger-500': errors.name }"
                    placeholder="Your name"
                    :disabled="formSubmitting"
                  >
                  <p v-if="errors.name" class="mt-1 text-sm text-danger-600">{{ errors.name }}</p>
                </div>

                <div>
                  <label for="email" class="mb-2 block text-sm font-medium text-gray-700">
                    Email <span class="text-danger-600">*</span>
                  </label>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    required
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    :class="{ 'border-danger-500': errors.email }"
                    placeholder="your@email.com"
                    :disabled="formSubmitting"
                  >
                  <p v-if="errors.email" class="mt-1 text-sm text-danger-600">{{ errors.email }}</p>
                </div>

                <div>
                  <label for="subject" class="mb-2 block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    id="subject"
                    v-model="form.subject"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    placeholder="What is this about?"
                    :disabled="formSubmitting"
                  >
                </div>

                <div>
                  <label for="message" class="mb-2 block text-sm font-medium text-gray-700">
                    Message <span class="text-danger-600">*</span>
                  </label>
                  <textarea
                    id="message"
                    v-model="form.message"
                    rows="5"
                    required
                    class="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    :class="{ 'border-danger-500': errors.message }"
                    placeholder="How can we help you?"
                    :disabled="formSubmitting"
                  />
                  <p v-if="errors.message" class="mt-1 text-sm text-danger-600">{{ errors.message }}</p>
                </div>

                <button
                  type="submit"
                  class="w-full rounded-lg bg-primary-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="formSubmitting"
                >
                  <span v-if="!formSubmitting" class="flex items-center justify-center">
                    <font-awesome-icon icon="envelope" class="mr-2" />
                    Send Message
                  </span>
                  <span v-else class="flex items-center justify-center">
                    <span class="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></span>
                    Sending...
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { infoPageDefaultsFor } from '../constants/infoPageDefaults'
import { getPageWithSectionsByKey, getPublicSettingsMap } from '../lib/cms'
import { supabase } from '../lib/supabase'

const CONTACT_PAGE_KEY = 'contact'
const contactDefaults = infoPageDefaultsFor(CONTACT_PAGE_KEY) || {
  title: 'Contact Lola As One',
  summary: '',
  sectionTitle: 'Contact Information',
  bodyHtml: ''
}

const fallbackAddressLines = [
  '50B Northbrook Street',
  'Newbury RG14 1DT'
]

const fallbackOpeningTimes = [
  { day: 'Mon', hours: 'Closed' },
  { day: 'Tues', hours: '9am - 5pm' },
  { day: 'Wed', hours: '9am - 6pm' },
  { day: 'Thurs', hours: '9am - 6pm' },
  { day: 'Fri', hours: '9am - 5pm' },
  { day: 'Sat', hours: '9.30am - 3pm' },
  { day: 'Sun', hours: '9.30am - 1pm' }
]

const fallbackSocialLinks = {
  instagram: 'https://www.instagram.com/lotsoflovelyart/',
  facebook: 'https://www.facebook.com/lotsoflovelyart'
}

const page = ref(null)
const pageSections = ref([])
const settings = ref({})

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const formSubmitting = ref(false)
const formSuccess = ref(false)
const formError = ref(null)
const errors = ref({})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeOpeningTimes = (entries) => {
  if (!Array.isArray(entries)) return []

  return entries
    .map(entry => ({
      day: String(entry?.day || '').trim(),
      hours: String(entry?.hours || '').trim()
    }))
    .filter(entry => entry.day && entry.hours)
}

const settingValue = (key, fallback = '') => {
  const value = settings.value?.[key]?.value
  return value === undefined || value === null || value === '' ? fallback : value
}

const pageTitle = computed(() => page.value?.title || contactDefaults.title)
const pageSummary = computed(() => page.value?.seo_description || contactDefaults.summary)

const contactSection = computed(() =>
  pageSections.value.find(section => section.section_key === 'contact_content') ||
  pageSections.value.find(section => section.section_type === 'rich_text') ||
  pageSections.value[0] ||
  null
)

const contactSectionConfig = computed(() => contactSection.value?.config_json || {})
const contactSectionTitle = computed(() => contactSectionConfig.value.title || contactDefaults.sectionTitle)
const contactBodyHtml = computed(() => contactSectionConfig.value.body_html || contactDefaults.bodyHtml)

const contactEmail = computed(() => settingValue('contact_email', 'hello@lotsoflovelyart.com'))
const contactVenue = computed(() => settingValue('contact_venue', 'LoLA Lots of Lovely Art Creative Space'))
const addressLines = computed(() => {
  const lines = settings.value?.contact_address_lines?.value
  return Array.isArray(lines) && lines.length ? lines : fallbackAddressLines
})
const openingTimes = computed(() => {
  const savedOpeningTimes = normalizeOpeningTimes(settings.value?.opening_times?.value)
  return savedOpeningTimes.length ? savedOpeningTimes : fallbackOpeningTimes
})
const socialItems = computed(() => {
  const links = settings.value?.social_links || fallbackSocialLinks

  return [
    links.instagram ? { label: 'Instagram', href: links.instagram } : null,
    links.facebook ? { label: 'Facebook', href: links.facebook } : null,
    links.youtube ? { label: 'YouTube', href: links.youtube } : null
  ].filter(Boolean)
})

const loadContactPage = async () => {
  try {
    const pageData = await getPageWithSectionsByKey(CONTACT_PAGE_KEY)
    page.value = pageData
    pageSections.value = pageData?.sections || []
    document.title = pageData?.seo_title || `${pageTitle.value} | Lola As One`
  } catch (err) {
    page.value = null
    pageSections.value = []
    document.title = `${contactDefaults.title} | Lola As One`
    console.error('Error loading contact CMS content:', err)
  }
}

const loadContactSettings = async () => {
  try {
    settings.value = await getPublicSettingsMap()
  } catch (err) {
    settings.value = {}
    console.error('Error loading contact settings:', err)
  }
}

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.name || form.value.name.trim().length < 2) {
    errors.value.name = 'Please enter your name (at least 2 characters)'
    isValid = false
  }

  if (!form.value.email || !emailRegex.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    isValid = false
  }

  if (!form.value.message || form.value.message.trim().length < 10) {
    errors.value.message = 'Please enter a message (at least 10 characters)'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  formSuccess.value = false
  formError.value = null

  if (!validateForm()) return

  try {
    formSubmitting.value = true

    const { error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          name: form.value.name.trim(),
          email: form.value.email.trim(),
          subject: form.value.subject.trim() || null,
          message: form.value.message.trim(),
          status: 'new'
        }
      ])

    if (error) throw error

    formSuccess.value = true
    form.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    }

    setTimeout(() => {
      formSuccess.value = false
    }, 5000)
  } catch (err) {
    console.error('Contact form submission error:', err)
    formError.value = 'Failed to send message. Please try again or email us directly.'
  } finally {
    formSubmitting.value = false
  }
}

onMounted(() => {
  loadContactPage()
  loadContactSettings()
})
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
