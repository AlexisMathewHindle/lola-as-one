import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IncomingAnswer {
  question_key?: string
  answer?: unknown
}

interface FeedbackFormRequest {
  name?: string | null
  email?: string | null
  answers?: IncomingAnswer[]
}

interface FeedbackQuestion {
  question_key: string
  label: string
  field_type: string
  options: string[]
  is_required: boolean
}

interface AnswerSnapshot {
  question_key: string
  label: string
  field_type: string
  answer: string | number | string[]
}

type EmailResult = {
  recipient: string
  template: string
  success: boolean
  error?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CHOICE_TYPES = new Set(['single_choice', 'multi_choice'])
const SHORT_TEXT_MAX = 500
const LONG_TEXT_MAX = 5000

function normalizeText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+$/g, '')
    .trim()
    .slice(0, maxLength)
}

function formatSubmissionDate(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  })
}

function getAdminEmails(): string[] {
  const configured = Deno.env.get('ADMIN_EMAILS') ||
    Deno.env.get('EMAIL_REPLY_TO') ||
    Deno.env.get('SUPPORT_EMAIL') ||
    'hello@lotsoflovelyart.com'

  const emails = configured
    .split(',')
    .map((email) => email.trim())
    .filter((email) => emailRegex.test(email))

  return emails.length > 0 ? emails : ['hello@lotsoflovelyart.com']
}

function getFunctionsBaseUrl(supabaseUrl: string): string {
  return (Deno.env.get('FUNCTIONS_BASE_URL') || supabaseUrl).replace(/\/$/, '')
}

/**
 * Validate one incoming answer against its question, returning a normalized
 * snapshot or null when the answer is empty. Throws with a friendly message
 * when the answer is present but invalid.
 */
function buildSnapshot(question: FeedbackQuestion, rawAnswer: unknown): AnswerSnapshot | null {
  const base = {
    question_key: question.question_key,
    label: question.label,
    field_type: question.field_type,
  }

  if (question.field_type === 'rating') {
    if (rawAnswer === null || rawAnswer === undefined || rawAnswer === '' || Number(rawAnswer) === 0) {
      return null
    }
    const rating = Number(rawAnswer)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error(`"${question.label}" must be a rating from 1 to 5.`)
    }
    return { ...base, answer: rating }
  }

  if (question.field_type === 'multi_choice') {
    const values = Array.isArray(rawAnswer) ? rawAnswer.map((value) => String(value).trim()).filter(Boolean) : []
    if (values.length === 0) return null
    const invalid = values.filter((value) => !question.options.includes(value))
    if (invalid.length > 0) {
      throw new Error(`"${question.label}" has an option we do not recognise.`)
    }
    return { ...base, answer: [...new Set(values)] }
  }

  if (question.field_type === 'single_choice') {
    const value = normalizeText(rawAnswer, SHORT_TEXT_MAX)
    if (!value) return null
    if (!question.options.includes(value)) {
      throw new Error(`"${question.label}" has an option we do not recognise.`)
    }
    return { ...base, answer: value }
  }

  if (question.field_type === 'email') {
    const value = normalizeText(rawAnswer, SHORT_TEXT_MAX).toLowerCase()
    if (!value) return null
    if (!emailRegex.test(value)) {
      throw new Error(`"${question.label}" needs a valid email address.`)
    }
    return { ...base, answer: value }
  }

  const maxLength = question.field_type === 'long_text' ? LONG_TEXT_MAX : SHORT_TEXT_MAX
  const value = normalizeText(rawAnswer, maxLength)
  if (!value) return null
  return { ...base, answer: value }
}

function displayAnswer(snapshot: AnswerSnapshot): string {
  if (snapshot.field_type === 'rating') {
    return `${snapshot.answer} / 5 stars`
  }
  if (Array.isArray(snapshot.answer)) {
    return snapshot.answer.join(', ')
  }
  return String(snapshot.answer)
}

async function invokeSendEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  body: Record<string, unknown>,
): Promise<{ data: unknown; error: null | { message: string; status?: number } }> {
  const functionsBaseUrl = getFunctionsBaseUrl(supabaseUrl)
  const authToken = (Deno.env.get('FUNCTIONS_GATEWAY_JWT') || serviceRoleKey).trim()
  const response = await fetch(`${functionsBaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: authToken,
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  })

  const text = await response.text().catch(() => '')
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }

  if (!response.ok) {
    return {
      data,
      error: {
        message: data?.error || text || `send-email returned ${response.status}`,
        status: response.status,
      },
    }
  }

  return { data, error: null }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 },
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }

    const payload = (await req.json()) as FeedbackFormRequest
    const respondentName = payload.name ? normalizeText(payload.name, 160) : ''
    const respondentEmail = payload.email ? normalizeText(payload.email, 320).toLowerCase() : ''

    if (respondentEmail && !emailRegex.test(respondentEmail)) {
      throw new Error('Please enter a valid email address.')
    }

    const incomingAnswers = Array.isArray(payload.answers) ? payload.answers : []
    const answersByKey = new Map<string, unknown>()
    for (const item of incomingAnswers) {
      if (item && typeof item.question_key === 'string') {
        answersByKey.set(item.question_key, item.answer)
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Load the live active questions; never trust the client's list.
    const { data: questionRows, error: questionsError } = await supabase
      .from('feedback_questions')
      .select('question_key, label, field_type, options, is_required')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (questionsError) {
      throw questionsError
    }

    const questions: FeedbackQuestion[] = (questionRows || []).map((row: any) => ({
      question_key: row.question_key,
      label: row.label,
      field_type: row.field_type,
      options: Array.isArray(row.options) ? row.options.map((option: unknown) => String(option)) : [],
      is_required: Boolean(row.is_required),
    }))

    if (questions.length === 0) {
      throw new Error('Feedback is not being collected right now.')
    }

    const snapshots: AnswerSnapshot[] = []
    const missingRequired: string[] = []

    for (const question of questions) {
      const snapshot = buildSnapshot(question, answersByKey.get(question.question_key))
      if (snapshot) {
        snapshots.push(snapshot)
      } else if (question.is_required) {
        missingRequired.push(question.label)
      }
    }

    if (missingRequired.length > 0) {
      throw new Error(`Please answer: ${missingRequired.join(', ')}.`)
    }

    if (snapshots.length === 0) {
      throw new Error('Please answer at least one question before sending.')
    }

    const { data: submission, error: submissionError } = await supabase
      .from('feedback_submissions')
      .insert({
        respondent_name: respondentName || null,
        respondent_email: respondentEmail || null,
        answers: snapshots,
        status: 'new',
        metadata: {
          source: 'public-feedback-form',
          userAgent: req.headers.get('user-agent') || null,
        },
      })
      .select('id, created_at')
      .single()

    if (submissionError) {
      throw submissionError
    }

    const referenceNumber = `FEEDBACK-${String(submission.id).slice(0, 8).toUpperCase()}`
    const submissionDate = formatSubmissionDate(submission.created_at)
    const displayAnswers = snapshots.map((snapshot) => ({
      label: snapshot.label,
      value: displayAnswer(snapshot),
    }))

    const metadata = {
      source: 'public-feedback-form',
      submissionId: submission.id,
      referenceNumber,
    }

    const emailResults: EmailResult[] = []

    for (const adminEmail of getAdminEmails()) {
      const response = await invokeSendEmail(supabaseUrl, serviceRoleKey, {
        template: 'feedback-form-admin',
        to: adminEmail,
        data: {
          respondentName: respondentName || 'Anonymous',
          respondentEmail: respondentEmail || 'Not provided',
          answers: displayAnswers,
          referenceNumber,
          submissionDate,
        },
        metadata,
      })

      emailResults.push({
        recipient: adminEmail,
        template: 'feedback-form-admin',
        success: !response.error,
        error: response.error?.message,
      })
    }

    if (respondentEmail) {
      const response = await invokeSendEmail(supabaseUrl, serviceRoleKey, {
        template: 'feedback-form-customer',
        to: respondentEmail,
        data: {
          respondentName: respondentName || 'there',
          referenceNumber,
          submissionDate,
        },
        metadata,
      })

      emailResults.push({
        recipient: respondentEmail,
        template: 'feedback-form-customer',
        success: !response.error,
        error: response.error?.message,
      })
    }

    const failedEmails = emailResults.filter((result) => !result.success)
    if (failedEmails.length > 0) {
      console.error('Feedback saved but email sending failed:', failedEmails)
      return new Response(
        JSON.stringify({
          error: 'Feedback saved, but the email notification failed.',
          submissionId: submission.id,
          referenceNumber,
          emailResults,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submission.id,
        referenceNumber,
        emailResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('Feedback form submission error:', error)
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
