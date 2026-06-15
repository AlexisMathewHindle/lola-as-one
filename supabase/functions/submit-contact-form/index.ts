import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactFormRequest {
  name?: string
  email?: string
  subject?: string
  message?: string
}

type EmailResult = {
  recipient: string
  template: string
  success: boolean
  error?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeText(value: unknown, maxLength: number): string {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+$/g, '')
    .trim()
    .slice(0, maxLength)
}

function validatePayload(payload: ContactFormRequest) {
  const name = normalizeText(payload.name, 160)
  const email = normalizeText(payload.email, 320).toLowerCase()
  const subject = normalizeText(payload.subject, 180) || 'Contact form submission'
  const message = normalizeText(payload.message, 5000)

  if (name.length < 2) {
    throw new Error('Please enter your name.')
  }

  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address.')
  }

  if (message.length < 10) {
    throw new Error('Please enter a message of at least 10 characters.')
  }

  return { name, email, subject, message }
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
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }

    const payload = validatePayload(await req.json())
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: submission, error: submissionError } = await supabase
      .from('contact_submissions')
      .insert({
        name: payload.name,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
        status: 'new',
        metadata: {
          source: 'public-contact-form',
          userAgent: req.headers.get('user-agent') || null,
        },
      })
      .select('id, created_at')
      .single()

    if (submissionError) {
      throw submissionError
    }

    const referenceNumber = `CONTACT-${String(submission.id).slice(0, 8).toUpperCase()}`
    const submissionDate = formatSubmissionDate(submission.created_at)
    const templateData = {
      customerName: payload.name,
      customerEmail: payload.email,
      subject: payload.subject,
      message: payload.message,
      referenceNumber,
      submissionDate,
    }

    const emailResults: EmailResult[] = []
    const metadata = {
      source: 'public-contact-form',
      submissionId: submission.id,
      referenceNumber,
    }

    const adminEmails = getAdminEmails()

    for (const adminEmail of adminEmails) {
      const response = await invokeSendEmail(supabaseUrl, serviceRoleKey, {
        template: 'contact-form-admin',
        to: adminEmail,
        data: templateData,
        metadata,
      })

      emailResults.push({
        recipient: adminEmail,
        template: 'contact-form-admin',
        success: !response.error,
        error: response.error?.message,
      })
    }

    const customerResponse = await invokeSendEmail(supabaseUrl, serviceRoleKey, {
      template: 'contact-form-customer',
      to: payload.email,
      data: templateData,
      metadata,
    })

    emailResults.push({
      recipient: payload.email,
      template: 'contact-form-customer',
      success: !customerResponse.error,
      error: customerResponse.error?.message,
    })

    const failedEmails = emailResults.filter((result) => !result.success)
    if (failedEmails.length > 0) {
      console.error('Contact submission saved but email sending failed:', failedEmails)
      return new Response(
        JSON.stringify({
          error: 'Message saved, but email notification failed.',
          submissionId: submission.id,
          referenceNumber,
          emailResults,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502,
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId: submission.id,
        referenceNumber,
        emailResults,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Contact form submission error:', error)
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
