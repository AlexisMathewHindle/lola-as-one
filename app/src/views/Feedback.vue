<template>
  <div class="min-h-screen bg-dark-50">
    <section class="border-b border-dark-200 bg-white">
      <div class="section-shell py-9 sm:py-11 lg:py-12">
        <div class="max-w-3xl">
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-600">
            Your Feedback
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
      <div class="mx-auto max-w-2xl">
        <section class="rounded-lg border border-dark-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
          <div v-if="introBodyHtml" class="cms-copy mb-7 text-[15px] leading-7 text-dark-700" v-html="introBodyHtml" />

          <div v-if="loading" class="py-10 text-center text-dark-500">
            <span class="mx-auto mb-3 block h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500"></span>
            <p class="text-sm">Loading the feedback form...</p>
          </div>

          <!-- No active questions -->
          <div
            v-else-if="questions.length === 0"
            class="rounded-lg border border-dark-200 bg-dark-50 p-5 text-[15px] leading-7 text-dark-600"
          >
            We are not collecting feedback through this page right now. Please check
            back soon, or email us at
            <a href="mailto:hello@lotsoflovelyart.com" class="font-semibold text-primary-600 underline">hello@lotsoflovelyart.com</a>.
          </div>

          <!-- Success -->
          <div v-else-if="formSuccess" class="rounded-lg border border-success-200 bg-success-50 p-5">
            <div class="flex items-start gap-3">
              <font-awesome-icon icon="check-circle" class="mt-0.5 text-xl text-success-600" />
              <div>
                <p class="font-semibold text-success-900">Thank you for your feedback.</p>
                <p class="text-sm text-success-700">We read every response and it helps us make the studio better.</p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form v-else class="space-y-7" @submit.prevent="handleSubmit">
            <div v-if="formError" class="rounded-lg border border-danger-200 bg-danger-50 p-4">
              <div class="flex items-start gap-3">
                <font-awesome-icon icon="exclamation-circle" class="mt-0.5 text-xl text-danger-600" />
                <p class="text-sm text-danger-700">{{ formError }}</p>
              </div>
            </div>

            <!-- Questions -->
            <div v-for="question in questions" :key="question.id" class="space-y-2">
              <label :for="`q-${question.id}`" class="block text-sm font-medium text-dark-800">
                {{ question.label }}
                <span v-if="question.is_required" class="text-danger-600">*</span>
              </label>
              <p v-if="question.help_text" class="text-sm text-dark-500">{{ question.help_text }}</p>

              <!-- Star rating -->
              <div v-if="question.field_type === 'rating'" class="flex items-center gap-1">
                <button
                  v-for="star in 5"
                  :key="star"
                  type="button"
                  class="p-1 transition-colors"
                  :class="star <= (answers[question.question_key] || 0) ? 'text-primary-500' : 'text-dark-300 hover:text-primary-300'"
                  :aria-label="`${star} star${star === 1 ? '' : 's'}`"
                  @click="setRating(question.question_key, star)"
                >
                  <font-awesome-icon icon="star" class="h-6 w-6" />
                </button>
                <button
                  v-if="answers[question.question_key]"
                  type="button"
                  class="ml-2 text-xs text-dark-400 underline hover:text-dark-600"
                  @click="setRating(question.question_key, 0)"
                >
                  Clear
                </button>
              </div>

              <!-- Long text -->
              <textarea
                v-else-if="question.field_type === 'long_text'"
                :id="`q-${question.id}`"
                v-model="answers[question.question_key]"
                rows="4"
                class="w-full resize-y rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                :class="{ 'border-danger-500': errors[question.question_key] }"
                :disabled="formSubmitting"
              />

              <!-- Single choice -->
              <div v-else-if="question.field_type === 'single_choice'" class="space-y-2">
                <label
                  v-for="option in question.options"
                  :key="option"
                  class="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-200 px-4 py-2.5 text-[15px] text-dark-800 transition-colors hover:border-primary-300"
                  :class="answers[question.question_key] === option ? 'border-primary-400 bg-primary-50' : ''"
                >
                  <input
                    v-model="answers[question.question_key]"
                    type="radio"
                    :name="`q-${question.id}`"
                    :value="option"
                    class="h-4 w-4 border-dark-300 text-primary-600 focus:ring-primary-500"
                    :disabled="formSubmitting"
                  />
                  <span>{{ option }}</span>
                </label>
              </div>

              <!-- Multiple choice -->
              <div v-else-if="question.field_type === 'multi_choice'" class="space-y-2">
                <label
                  v-for="option in question.options"
                  :key="option"
                  class="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-200 px-4 py-2.5 text-[15px] text-dark-800 transition-colors hover:border-primary-300"
                  :class="(answers[question.question_key] || []).includes(option) ? 'border-primary-400 bg-primary-50' : ''"
                >
                  <input
                    v-model="answers[question.question_key]"
                    type="checkbox"
                    :value="option"
                    class="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                    :disabled="formSubmitting"
                  />
                  <span>{{ option }}</span>
                </label>
              </div>

              <!-- Short text / email -->
              <input
                v-else
                :id="`q-${question.id}`"
                v-model="answers[question.question_key]"
                :type="question.field_type === 'email' ? 'email' : 'text'"
                class="w-full rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                :class="{ 'border-danger-500': errors[question.question_key] }"
                :disabled="formSubmitting"
              />

              <p v-if="errors[question.question_key]" class="text-sm text-danger-600">{{ errors[question.question_key] }}</p>
            </div>

            <!-- About you (optional) -->
            <div class="space-y-5 rounded-lg border border-dark-200 bg-dark-50 p-4 sm:p-5">
              <p class="text-sm font-medium text-dark-700">About you (optional)</p>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="respondent-name" class="mb-2 block text-sm font-medium text-dark-700">Name</label>
                  <input
                    id="respondent-name"
                    v-model="respondent.name"
                    type="text"
                    placeholder="Your name"
                    class="w-full rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    :disabled="formSubmitting"
                  />
                </div>
                <div>
                  <label for="respondent-email" class="mb-2 block text-sm font-medium text-dark-700">Email</label>
                  <input
                    id="respondent-email"
                    v-model="respondent.email"
                    type="email"
                    placeholder="you@example.com"
                    class="w-full rounded-lg border border-dark-300 bg-white px-4 py-3 text-[15px] text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    :class="{ 'border-danger-500': errors._email }"
                    :disabled="formSubmitting"
                  />
                  <p v-if="errors._email" class="mt-1 text-sm text-danger-600">{{ errors._email }}</p>
                </div>
              </div>
              <p class="text-xs text-dark-500">
                Leave these blank to send your feedback anonymously. If you add your
                email we may reply.
              </p>
            </div>

            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="formSubmitting"
            >
              <span v-if="!formSubmitting" class="flex items-center justify-center">
                <font-awesome-icon icon="envelope" class="mr-2" />
                Send Feedback
              </span>
              <span v-else class="flex items-center justify-center">
                <span class="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></span>
                Sending...
              </span>
            </button>
          </form>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { infoPageDefaultsFor } from '../constants/infoPageDefaults'
import { getActiveFeedbackQuestions } from '../lib/feedback'
import { getPageWithSectionsByKey } from '../lib/cms'
import { setPageSeo } from '../lib/seo'
import { supabase } from '../lib/supabase'

const FEEDBACK_PAGE_KEY = 'feedback'
const feedbackDefaults = infoPageDefaultsFor(FEEDBACK_PAGE_KEY) || {
  title: 'Feedback',
  summary: '',
  sectionTitle: 'We would love your feedback',
  bodyHtml: ''
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const page = ref(null)
const pageSections = ref([])
const questions = ref([])
const answers = reactive({})
const respondent = reactive({ name: '', email: '' })
const errors = ref({})

const loading = ref(true)
const formSubmitting = ref(false)
const formSuccess = ref(false)
const formError = ref(null)

const pageTitle = computed(() => page.value?.title || feedbackDefaults.title)
const pageSummary = computed(() => page.value?.seo_description || feedbackDefaults.summary)

const heroTitle = computed(() => {
  const title = String(pageTitle.value || '').trim()
  return !title || title.toLowerCase() === 'feedback' ? 'Tell us what you thought' : title
})

const heroSummary = computed(() => pageSummary.value || feedbackDefaults.summary)

const introSection = computed(() =>
  pageSections.value.find((section) => section.section_key === 'feedback_content') ||
  pageSections.value.find((section) => section.section_type === 'rich_text') ||
  pageSections.value[0] ||
  null
)

const introBodyHtml = computed(() => introSection.value?.config_json?.body_html || feedbackDefaults.bodyHtml)

function initAnswers() {
  questions.value.forEach((question) => {
    if (question.field_type === 'multi_choice') {
      answers[question.question_key] = []
    } else if (question.field_type === 'rating') {
      answers[question.question_key] = 0
    } else {
      answers[question.question_key] = ''
    }
  })
}

function setRating(key, value) {
  answers[key] = value
}

function hasAnswer(question) {
  const value = answers[question.question_key]
  if (question.field_type === 'multi_choice') return Array.isArray(value) && value.length > 0
  if (question.field_type === 'rating') return Number(value) > 0
  return String(value ?? '').trim().length > 0
}

function validate() {
  const nextErrors = {}

  questions.value.forEach((question) => {
    if (question.is_required && !hasAnswer(question)) {
      nextErrors[question.question_key] = 'This question needs an answer.'
    }
    if (
      question.field_type === 'email' &&
      hasAnswer(question) &&
      !emailRegex.test(String(answers[question.question_key]).trim())
    ) {
      nextErrors[question.question_key] = 'Please enter a valid email address.'
    }
  })

  if (respondent.email.trim() && !emailRegex.test(respondent.email.trim())) {
    nextErrors._email = 'Please enter a valid email address.'
  }

  const answeredAny = questions.value.some((question) => hasAnswer(question))
  if (!answeredAny && Object.keys(nextErrors).length === 0) {
    formError.value = 'Please answer at least one question before sending.'
    errors.value = nextErrors
    return false
  }

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

function buildAnswerPayload() {
  return questions.value
    .filter((question) => hasAnswer(question))
    .map((question) => ({
      question_key: question.question_key,
      answer:
        question.field_type === 'rating'
          ? Number(answers[question.question_key])
          : question.field_type === 'multi_choice'
            ? [...answers[question.question_key]]
            : String(answers[question.question_key]).trim()
    }))
}

async function handleSubmit() {
  formError.value = null
  formSuccess.value = false

  if (!validate()) {
    if (!formError.value) {
      formError.value = 'Please check the highlighted questions.'
    }
    return
  }

  try {
    formSubmitting.value = true

    const { error } = await supabase.functions.invoke('submit-feedback-form', {
      body: {
        name: respondent.name.trim() || null,
        email: respondent.email.trim() || null,
        answers: buildAnswerPayload()
      }
    })

    if (error) throw error

    formSuccess.value = true
  } catch (err) {
    console.error('Feedback submission error:', err)
    formError.value = 'Sorry, we could not send your feedback. Please try again, or email hello@lotsoflovelyart.com.'
  } finally {
    formSubmitting.value = false
  }
}

async function loadPage() {
  try {
    const pageData = await getPageWithSectionsByKey(FEEDBACK_PAGE_KEY)
    page.value = pageData
    pageSections.value = pageData?.sections || []
  } catch (err) {
    page.value = null
    pageSections.value = []
    console.error('Error loading feedback CMS content:', err)
  }

  setPageSeo({
    title: page.value?.seo_title || pageTitle.value,
    description: page.value?.seo_description || pageSummary.value,
    path: '/feedback'
  })

  try {
    questions.value = await getActiveFeedbackQuestions()
    initAnswers()
  } catch (err) {
    questions.value = []
    console.error('Error loading feedback questions:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadPage)
</script>

<style scoped>
.cms-copy :deep(h2),
.cms-copy :deep(h3) {
  color: #111827;
  font-weight: 700;
  line-height: 1.2;
  margin: 1.5rem 0 0.75rem;
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

.cms-copy :deep(a) {
  color: #2563eb;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
