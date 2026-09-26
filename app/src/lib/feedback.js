import { supabase } from './supabase'

const QUESTION_FIELDS =
  'id, question_key, label, help_text, field_type, options, is_required, is_active, sort_order, created_at, updated_at'

export const FEEDBACK_FIELD_TYPES = [
  { value: 'rating', label: 'Star rating (1 to 5)' },
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multi_choice', label: 'Multiple choice' },
  { value: 'email', label: 'Email address' }
]

export const FEEDBACK_CHOICE_TYPES = ['single_choice', 'multi_choice']

export function isChoiceType(fieldType) {
  return FEEDBACK_CHOICE_TYPES.includes(fieldType)
}

/**
 * Turn a label into a stable snake_case question_key that satisfies the
 * feedback_questions_key_format_check constraint
 * (^[a-z0-9]+(?:_[a-z0-9]+)*$).
 */
export function toQuestionKey(label) {
  const base = String(label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')

  return base || 'question'
}

/**
 * Ensure a key is unique within a set of already-used keys, appending _2, _3, ...
 */
export function uniqueQuestionKey(base, usedKeys) {
  let key = base
  let suffix = 2
  while (usedKeys.has(key)) {
    key = `${base}_${suffix}`
    suffix += 1
  }
  return key
}

/**
 * Fetch every question for the admin manager, in display order.
 */
export async function getAllFeedbackQuestions() {
  const { data, error } = await supabase
    .from('feedback_questions')
    .select(QUESTION_FIELDS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch only active questions for the public feedback form, in display order.
 */
export async function getActiveFeedbackQuestions() {
  const { data, error } = await supabase
    .from('feedback_questions')
    .select(QUESTION_FIELDS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Insert or update a batch of questions by primary key (id).
 * Rows without an id are inserted; rows with an id are updated.
 */
export async function upsertFeedbackQuestions(questions) {
  if (!questions.length) return []

  const { data, error } = await supabase
    .from('feedback_questions')
    .upsert(questions, { onConflict: 'id' })
    .select(QUESTION_FIELDS)

  if (error) throw error
  return data || []
}

/**
 * Delete a question by id.
 */
export async function deleteFeedbackQuestion(id) {
  const { error } = await supabase
    .from('feedback_questions')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

const SUBMISSION_FIELDS =
  'id, respondent_name, respondent_email, answers, status, metadata, created_at, updated_at'

export const FEEDBACK_SUBMISSION_STATUSES = ['new', 'read', 'archived', 'spam']

/**
 * Fetch feedback submissions for the admin inbox, newest first.
 */
export async function getFeedbackSubmissions() {
  const { data, error } = await supabase
    .from('feedback_submissions')
    .select(SUBMISSION_FIELDS)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Update a submission's triage status.
 */
export async function updateFeedbackSubmissionStatus(id, status) {
  const { data, error } = await supabase
    .from('feedback_submissions')
    .update({ status })
    .eq('id', id)
    .select(SUBMISSION_FIELDS)
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a submission by id.
 */
export async function deleteFeedbackSubmission(id) {
  const { error } = await supabase
    .from('feedback_submissions')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
