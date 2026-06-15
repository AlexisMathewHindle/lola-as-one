<template>
  <div class="min-h-screen bg-dark-50">
    <section class="border-b border-dark-200 bg-white">
      <div class="section-shell py-9 sm:py-11 lg:py-12">
        <div class="max-w-3xl">
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">
            Get In Touch
          </p>
          <h1 class="mt-3 text-4xl font-light leading-tight text-dark-900 sm:text-5xl">
            {{ heroTitle }}
          </h1>
          <p v-if="heroSummary" class="mt-5 max-w-2xl text-base leading-8 text-dark-600 sm:text-lg">
            {{ heroSummary }}
          </p>
        </div>
      </div>
    </section>

    <section class="section-shell py-10 sm:py-14 lg:py-16">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_25rem] xl:gap-12">
        <section class="rounded-lg border border-dark-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
          <div class="max-w-2xl">
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">
              Message The Studio
            </p>
            <h2 class="mt-3 text-3xl font-light leading-tight text-dark-900 sm:text-4xl">
              How can we help?
            </h2>
            <p class="mt-4 text-[15px] leading-7 text-dark-600">
              Choose the closest enquiry type and send the team the details. For booking changes, include the workshop name, date, and booking email address.
            </p>
            <div
              v-if="hasCustomContactCopy"
              class="cms-copy mt-5 rounded-lg border border-dark-200 bg-dark-50 p-4 text-sm text-dark-700"
              v-html="contactBodyHtml"
            />
          </div>

          <div v-if="formSuccess" class="mt-6 rounded-lg border border-success-200 bg-success-50 p-4">
            <div class="flex items-start gap-3">
              <font-awesome-icon icon="check-circle" class="mt-0.5 text-xl text-success-600" />
              <div>
                <p class="font-semibold text-success-900">Message sent successfully.</p>
                <p class="text-sm text-success-700">We'll get back to you as soon as possible.</p>
              </div>
            </div>
          </div>

          <div v-if="formError" class="mt-6 rounded-lg border border-danger-200 bg-danger-50 p-4">
            <div class="flex items-start gap-3">
              <font-awesome-icon icon="exclamation-circle" class="mt-0.5 text-xl text-danger-600" />
              <div>
                <p class="font-semibold text-danger-900">Failed to send message</p>
                <p class="text-sm text-danger-700">{{ formError }}</p>
              </div>
            </div>
          </div>

          <form class="mt-7 space-y-5" @submit.prevent="handleSubmit">
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="name" class="mb-2 block text-sm font-medium text-dark-700">
                  Name <span class="text-danger-600">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-dark-50"
                  :class="{ 'border-danger-500 focus:border-danger-500 focus:ring-danger-100': errors.name }"
                  placeholder="Your name"
                  :disabled="formSubmitting"
                >
                <p v-if="errors.name" class="mt-1 text-sm text-danger-600">{{ errors.name }}</p>
              </div>

              <div>
                <label for="email" class="mb-2 block text-sm font-medium text-dark-700">
                  Email <span class="text-danger-600">*</span>
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-dark-50"
                  :class="{ 'border-danger-500 focus:border-danger-500 focus:ring-danger-100': errors.email }"
                  placeholder="you@example.com"
                  :disabled="formSubmitting"
                >
                <p v-if="errors.email" class="mt-1 text-sm text-danger-600">{{ errors.email }}</p>
              </div>
            </div>

            <div>
              <label for="subject" class="mb-2 block text-sm font-medium text-dark-700">
                Enquiry type
              </label>
              <select
                id="subject"
                v-model="form.subject"
                class="w-full rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-dark-50"
                :disabled="formSubmitting"
              >
                <option
                  v-for="option in enquiryOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div>
              <label for="message" class="mb-2 block text-sm font-medium text-dark-700">
                Message <span class="text-danger-600">*</span>
              </label>
              <textarea
                id="message"
                v-model="form.message"
                rows="7"
                required
                class="w-full resize-y rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-dark-50"
                :class="{ 'border-danger-500 focus:border-danger-500 focus:ring-danger-100': errors.message }"
                placeholder="Tell us what you need help with."
                :disabled="formSubmitting"
              />
              <p v-if="errors.message" class="mt-1 text-sm text-danger-600">{{ errors.message }}</p>
            </div>

            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        </section>

        <aside class="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <section class="overflow-hidden rounded-lg border border-dark-200 bg-white shadow-sm">
            <img
              src="/img/images/about_page_02.png"
              alt="Painted paper houses and art materials on a workshop table"
              class="h-44 w-full object-cover"
            >

            <div class="space-y-5 p-5 sm:p-6">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">
                Helpful Details
              </p>
              <h2 class="mt-2 text-2xl font-light text-dark-900">
                A few things worth including
              </h2>
              <ul class="space-y-4 text-[15px] leading-7 text-dark-600">
                <li class="flex gap-3">
                  <font-awesome-icon icon="calendar-check" class="mt-1 text-primary-500" />
                  <span>For booking changes, include the workshop name, date, and booking email address.</span>
                </li>
                <li class="flex gap-3">
                  <font-awesome-icon icon="users" class="mt-1 text-secondary-700" />
                  <span>For parties or private events, share the preferred date, group size, and age range.</span>
                </li>
                <li class="flex gap-3">
                  <font-awesome-icon icon="box" class="mt-1 text-success-700" />
                  <span>For art boxes or orders, include your order number if you have one.</span>
                </li>
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { infoPageDefaultsFor } from '../constants/infoPageDefaults'
import { getPageWithSectionsByKey } from '../lib/cms'
import { setPageSeo } from '../lib/seo'
import { supabase } from '../lib/supabase'

const CONTACT_PAGE_KEY = 'contact'
const contactDefaults = infoPageDefaultsFor(CONTACT_PAGE_KEY) || {
  title: 'Contact Lola As One',
  summary: '',
  sectionTitle: 'Contact Information',
  bodyHtml: ''
}

const enquiryOptions = [
  { value: 'Workshop booking', label: 'Workshop booking' },
  { value: 'Art boxes', label: 'Art boxes' },
  { value: 'Parties and private events', label: 'Parties and private events' },
  { value: 'General question', label: 'General question' }
]

const defaultEnquirySubject = enquiryOptions[0].value

const page = ref(null)
const pageSections = ref([])

const form = ref({
  name: '',
  email: '',
  subject: defaultEnquirySubject,
  message: ''
})

const formSubmitting = ref(false)
const formSuccess = ref(false)
const formError = ref(null)
const errors = ref({})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const pageTitle = computed(() => page.value?.title || contactDefaults.title)
const pageSummary = computed(() => page.value?.seo_description || contactDefaults.summary)

const heroTitle = computed(() => {
  const title = String(pageTitle.value || '').trim()
  return !title || title.toLowerCase() === 'contact' ? 'Contact LoLA' : title
})

const heroSummary = computed(() =>
  pageSummary.value ||
  contactDefaults.summary ||
  "Questions about workshops, bookings, parties or art boxes? Send us a note."
)

const contactSection = computed(() =>
  pageSections.value.find(section => section.section_key === 'contact_content') ||
  pageSections.value.find(section => section.section_type === 'rich_text') ||
  pageSections.value[0] ||
  null
)

const contactSectionConfig = computed(() => contactSection.value?.config_json || {})
const contactBodyHtml = computed(() => contactSectionConfig.value.body_html || contactDefaults.bodyHtml)
const normalizedDefaultContactBody = String(contactDefaults.bodyHtml || '').replace(/\s+/g, ' ').trim()
const hasCustomContactCopy = computed(() => {
  const copy = String(contactBodyHtml.value || '').replace(/\s+/g, ' ').trim()
  return Boolean(copy && copy !== normalizedDefaultContactBody)
})

const loadContactPage = async () => {
  try {
    const pageData = await getPageWithSectionsByKey(CONTACT_PAGE_KEY)
    page.value = pageData
    pageSections.value = pageData?.sections || []
    setPageSeo({
      title: pageData?.seo_title || pageTitle.value,
      description: pageData?.seo_description || pageSummary.value,
      path: '/contact'
    })
  } catch (err) {
    page.value = null
    pageSections.value = []
    setPageSeo({
      title: contactDefaults.title,
      description: contactDefaults.summary,
      path: '/contact'
    })
    console.error('Error loading contact CMS content:', err)
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

    const { error } = await supabase.functions.invoke('submit-contact-form', {
      body: {
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        subject: form.value.subject.trim() || defaultEnquirySubject,
        message: form.value.message.trim()
      }
    })

    if (error) throw error

    formSuccess.value = true
    form.value = {
      name: '',
      email: '',
      subject: defaultEnquirySubject,
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
