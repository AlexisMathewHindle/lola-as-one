<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Feedback Questions</h1>
        <p class="mt-1 max-w-2xl text-sm text-gray-600">
          Add, edit, remove, and reorder the questions shown on the public feedback
          page. There is no limit on how many you add. Changes go live when you save.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <a
          href="/feedback"
          target="_blank"
          class="inline-flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-primary-600"
        >
          <span>View page</span>
          <font-awesome-icon icon="external-link-alt" class="h-3 w-3" />
        </a>
        <button
          type="button"
          :disabled="saving || loading"
          class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          @click="handleSave"
        >
          <font-awesome-icon :icon="saving ? 'spinner' : 'save'" :class="saving ? 'animate-spin' : ''" class="h-4 w-4" />
          {{ saving ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-if="loading" class="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
      <font-awesome-icon icon="spinner" class="h-5 w-5 animate-spin" />
      <p class="mt-2 text-sm">Loading questions...</p>
    </div>

    <template v-else>
      <p class="text-sm text-gray-500">
        {{ questions.length }} question{{ questions.length === 1 ? '' : 's' }},
        {{ activeCount }} shown on the page. Name and email are separate optional
        fields on the form, so you do not need to add them here.
      </p>

      <div
        v-if="questions.length === 0"
        class="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500"
      >
        <p class="text-sm">No questions yet. Add your first one below.</p>
      </div>

      <!-- Question cards -->
      <div
        v-for="(question, index) in questions"
        :key="question.uid"
        class="rounded-xl border bg-white shadow-sm"
        :class="question.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-80'"
      >
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div class="flex items-center gap-3">
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
              {{ index + 1 }}
            </span>
            <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input v-model="question.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span>{{ question.is_active ? 'Shown on page' : 'Hidden' }}</span>
            </label>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              title="Move up"
              :disabled="index === 0"
              class="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
              @click="moveUp(index)"
            >
              <font-awesome-icon icon="arrow-up" class="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Move down"
              :disabled="index === questions.length - 1"
              class="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
              @click="moveDown(index)"
            >
              <font-awesome-icon icon="arrow-down" class="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Remove question"
              class="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
              @click="removeQuestion(index)"
            >
              <font-awesome-icon icon="trash" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div class="space-y-4 px-4 py-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Question</label>
            <input
              v-model="question.label"
              type="text"
              placeholder="For example, How would you rate your visit?"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">Answer type</label>
              <select
                v-model="question.field_type"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                @change="onTypeChange(question)"
              >
                <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div class="flex items-end">
              <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input v-model="question.is_required" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span>Required (visitor must answer)</span>
              </label>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Help text <span class="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              v-model="question.help_text"
              type="text"
              placeholder="A short hint shown under the question"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <!-- Star rating preview -->
          <div v-if="question.field_type === 'rating'" class="flex items-center gap-1 text-gray-300">
            <font-awesome-icon v-for="star in 5" :key="star" icon="star" class="h-5 w-5" />
            <span class="ml-2 text-xs text-gray-500">Visitors pick 1 to 5 stars</span>
          </div>

          <!-- Choice options editor -->
          <div v-if="isChoiceType(question.field_type)" class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p class="mb-2 text-sm font-medium text-gray-700">
              Options ({{ question.field_type === 'multi_choice' ? 'visitor can pick several' : 'visitor picks one' }})
            </p>
            <div class="space-y-2">
              <div
                v-for="(option, optionIndex) in question.options"
                :key="optionIndex"
                class="flex items-center gap-2"
              >
                <input
                  v-model="question.options[optionIndex]"
                  type="text"
                  placeholder="Option text"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <button
                  type="button"
                  title="Remove option"
                  class="rounded-md p-2 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                  @click="removeOption(question, optionIndex)"
                >
                  <font-awesome-icon icon="times" class="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              type="button"
              class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              @click="addOption(question)"
            >
              <font-awesome-icon icon="plus" class="h-3 w-3" />
              Add option
            </button>
          </div>
        </div>
      </div>

      <!-- Add question + bottom save -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary-300 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
          @click="addQuestion"
        >
          <font-awesome-icon icon="plus" class="h-4 w-4" />
          Add question
        </button>
        <button
          type="button"
          :disabled="saving"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          @click="handleSave"
        >
          <font-awesome-icon :icon="saving ? 'spinner' : 'save'" :class="saving ? 'animate-spin' : ''" class="h-4 w-4" />
          {{ saving ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  FEEDBACK_FIELD_TYPES,
  deleteFeedbackQuestion,
  getAllFeedbackQuestions,
  isChoiceType,
  toQuestionKey,
  uniqueQuestionKey,
  upsertFeedbackQuestions
} from '../../lib/feedback'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const fieldTypes = FEEDBACK_FIELD_TYPES
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const questions = ref([])
const deletedIds = ref([])

let uidCounter = 0
const nextUid = () => {
  uidCounter += 1
  return `q_${uidCounter}`
}

const activeCount = computed(() => questions.value.filter((question) => question.is_active).length)

function toEditable(row) {
  return {
    uid: nextUid(),
    id: row.id || null,
    question_key: row.question_key || '',
    label: row.label || '',
    help_text: row.help_text || '',
    field_type: row.field_type || 'rating',
    options: Array.isArray(row.options) ? row.options.map((option) => String(option)) : [],
    is_required: Boolean(row.is_required),
    is_active: row.is_active !== false
  }
}

function createQuestion() {
  return {
    uid: nextUid(),
    id: null,
    question_key: '',
    label: '',
    help_text: '',
    field_type: 'rating',
    options: [],
    is_required: false,
    is_active: true
  }
}

function addQuestion() {
  questions.value.push(createQuestion())
}

function removeQuestion(index) {
  const [removed] = questions.value.splice(index, 1)
  if (removed?.id) {
    deletedIds.value.push(removed.id)
  }
}

function moveUp(index) {
  if (index <= 0) return
  const [item] = questions.value.splice(index, 1)
  questions.value.splice(index - 1, 0, item)
}

function moveDown(index) {
  if (index >= questions.value.length - 1) return
  const [item] = questions.value.splice(index, 1)
  questions.value.splice(index + 1, 0, item)
}

function onTypeChange(question) {
  if (isChoiceType(question.field_type) && question.options.length === 0) {
    question.options.push('')
  }
}

function addOption(question) {
  question.options.push('')
}

function removeOption(question, optionIndex) {
  question.options.splice(optionIndex, 1)
}

function cleanOptions(options) {
  if (!Array.isArray(options)) return []
  return options.map((option) => String(option).trim()).filter(Boolean)
}

function validate() {
  for (const [index, question] of questions.value.entries()) {
    const position = index + 1
    if (!question.label || question.label.trim().length < 2) {
      return `Question ${position} needs a label of at least 2 characters.`
    }
    if (isChoiceType(question.field_type) && cleanOptions(question.options).length < 1) {
      return `Question ${position} is a choice question, so it needs at least one option.`
    }
  }
  return null
}

async function handleSave() {
  const validationError = validate()
  if (validationError) {
    error.value = validationError
    toastStore.error(validationError)
    return
  }

  saving.value = true
  error.value = null

  try {
    for (const id of deletedIds.value) {
      await deleteFeedbackQuestion(id)
    }
    deletedIds.value = []

    const usedKeys = new Set(
      questions.value.map((question) => question.question_key).filter(Boolean)
    )

    const payload = questions.value.map((question, index) => {
      let key = question.question_key
      if (!key) {
        key = uniqueQuestionKey(toQuestionKey(question.label), usedKeys)
        usedKeys.add(key)
      }

      const row = {
        question_key: key,
        label: question.label.trim(),
        help_text: question.help_text?.trim() ? question.help_text.trim() : null,
        field_type: question.field_type,
        options: cleanOptions(question.options),
        is_required: Boolean(question.is_required),
        is_active: Boolean(question.is_active),
        sort_order: (index + 1) * 10
      }

      if (question.id) {
        row.id = question.id
      }

      return row
    })

    const saved = await upsertFeedbackQuestions(payload)

    // Reload from the saved rows so new ids and keys are reflected in the editor.
    const savedByKey = new Map(saved.map((row) => [row.question_key, row]))
    questions.value = payload
      .map((row) => savedByKey.get(row.question_key))
      .filter(Boolean)
      .sort((first, second) => first.sort_order - second.sort_order)
      .map(toEditable)

    toastStore.success('Feedback questions saved')
  } catch (saveError) {
    error.value = saveError.message || 'Could not save the questions. Please try again.'
    toastStore.error(error.value)
  } finally {
    saving.value = false
  }
}

async function loadQuestions() {
  loading.value = true
  error.value = null
  try {
    const rows = await getAllFeedbackQuestions()
    questions.value = rows.map(toEditable)
  } catch (loadError) {
    error.value = loadError.message || 'Could not load the questions.'
  } finally {
    loading.value = false
  }
}

onMounted(loadQuestions)
</script>
