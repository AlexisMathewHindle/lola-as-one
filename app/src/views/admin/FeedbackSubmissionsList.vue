<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Feedback Responses</h1>
        <p class="mt-1 max-w-2xl text-sm text-gray-600">
          Feedback submitted through the public page. These are also emailed to
          hello@lotsoflovelyart.com when they arrive.
        </p>
      </div>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        @click="load"
      >
        <font-awesome-icon icon="sync" :class="loading ? 'animate-spin' : ''" class="h-4 w-4" />
        Refresh
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      <div>
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
        <select
          v-model="filters.status"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">All</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
        </select>
      </div>
      <div class="flex-1">
        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search name, email, or answer text"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <p class="text-sm text-gray-500">{{ filteredSubmissions.length }} shown</p>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
      <font-awesome-icon icon="spinner" class="h-5 w-5 animate-spin" />
      <p class="mt-2 text-sm">Loading responses...</p>
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredSubmissions.length === 0"
      class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500"
    >
      <font-awesome-icon icon="star" class="h-6 w-6 text-gray-300" />
      <p class="mt-2 text-sm">
        {{ submissions.length === 0 ? 'No feedback yet. Responses will appear here.' : 'No responses match your filters.' }}
      </p>
    </div>

    <!-- List -->
    <div v-else class="space-y-4">
      <article
        v-for="submission in filteredSubmissions"
        :key="submission.id"
        class="rounded-xl border bg-white shadow-sm"
        :class="submission.status === 'new' ? 'border-primary-200' : 'border-gray-200'"
      >
        <div class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            class="flex flex-1 items-center gap-3 text-left"
            @click="toggle(submission.id)"
          >
            <font-awesome-icon
              :icon="expandedId === submission.id ? 'chevron-down' : 'chevron-right'"
              class="h-3 w-3 text-gray-400"
            />
            <div>
              <p class="text-sm font-semibold text-gray-900">
                {{ submission.respondent_name || 'Anonymous' }}
                <span v-if="submission.respondent_email" class="font-normal text-gray-500">
                  · {{ submission.respondent_email }}
                </span>
              </p>
              <p class="text-xs text-gray-500">
                {{ formatDate(submission.created_at) }} · {{ answerCount(submission) }} answer{{ answerCount(submission) === 1 ? '' : 's' }}
              </p>
            </div>
          </button>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="statusClass(submission.status)"
            >
              {{ statusLabel(submission.status) }}
            </span>
            <select
              :value="submission.status"
              class="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500"
              @change="setStatus(submission, $event.target.value)"
            >
              <option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
            </select>
            <button
              type="button"
              title="Delete response"
              class="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
              @click="remove(submission)"
            >
              <font-awesome-icon icon="trash" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Detail -->
        <div v-if="expandedId === submission.id" class="border-t border-gray-100 px-4 py-4">
          <dl class="space-y-3">
            <div v-for="(answer, index) in normalizedAnswers(submission)" :key="index">
              <dt class="text-sm font-medium text-gray-700">{{ answer.label }}</dt>
              <dd class="mt-0.5 text-sm text-gray-900">
                <span v-if="answer.isRating" class="inline-flex items-center gap-0.5 text-primary-500">
                  <font-awesome-icon v-for="star in 5" :key="star" icon="star" :class="star <= answer.rating ? 'text-primary-500' : 'text-gray-300'" class="h-4 w-4" />
                  <span class="ml-1 text-gray-500">{{ answer.rating }} / 5</span>
                </span>
                <span v-else class="whitespace-pre-line">{{ answer.display }}</span>
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  FEEDBACK_SUBMISSION_STATUSES,
  deleteFeedbackSubmission,
  getFeedbackSubmissions,
  updateFeedbackSubmissionStatus
} from '../../lib/feedback'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const statuses = FEEDBACK_SUBMISSION_STATUSES
const submissions = ref([])
const loading = ref(true)
const error = ref(null)
const expandedId = ref(null)
const filters = ref({ status: '', search: '' })

function statusLabel(status) {
  const labels = { new: 'New', read: 'Read', archived: 'Archived', spam: 'Spam' }
  return labels[status] || status
}

function statusClass(status) {
  const classes = {
    new: 'bg-primary-100 text-primary-700',
    read: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-600',
    spam: 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function normalizedAnswers(submission) {
  const answers = Array.isArray(submission.answers) ? submission.answers : []
  return answers.map((answer) => {
    const isRating = answer.field_type === 'rating'
    const value = answer.answer
    return {
      label: answer.label || answer.question_key || 'Answer',
      isRating,
      rating: isRating ? Number(value) || 0 : 0,
      display: Array.isArray(value) ? value.join(', ') : String(value ?? '')
    }
  })
}

function answerCount(submission) {
  return Array.isArray(submission.answers) ? submission.answers.length : 0
}

const filteredSubmissions = computed(() => {
  const search = filters.value.search.trim().toLowerCase()
  return submissions.value.filter((submission) => {
    if (filters.value.status && submission.status !== filters.value.status) return false
    if (!search) return true

    const haystack = [
      submission.respondent_name || '',
      submission.respondent_email || '',
      ...(Array.isArray(submission.answers)
        ? submission.answers.map((answer) =>
            `${answer.label || ''} ${Array.isArray(answer.answer) ? answer.answer.join(' ') : answer.answer ?? ''}`
          )
        : [])
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })
})

function toggle(id) {
  expandedId.value = expandedId.value === id ? null : id
}

async function setStatus(submission, status) {
  if (submission.status === status) return
  const previous = submission.status
  submission.status = status
  try {
    await updateFeedbackSubmissionStatus(submission.id, status)
    toastStore.success(`Marked as ${statusLabel(status).toLowerCase()}`)
  } catch (updateError) {
    submission.status = previous
    toastStore.error(updateError.message || 'Could not update the status.')
  }
}

async function remove(submission) {
  if (!window.confirm('Delete this feedback response? This cannot be undone.')) return
  try {
    await deleteFeedbackSubmission(submission.id)
    submissions.value = submissions.value.filter((item) => item.id !== submission.id)
    toastStore.success('Response deleted')
  } catch (deleteError) {
    toastStore.error(deleteError.message || 'Could not delete the response.')
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    submissions.value = await getFeedbackSubmissions()
  } catch (loadError) {
    error.value = loadError.message || 'Could not load the responses.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
