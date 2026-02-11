import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Email template types
type EmailTemplate = 
  | 'order-confirmation'
  | 'event-booking-confirmation'
  | 'subscription-activated'
  | 'subscription-renewal-success'
  | 'subscription-payment-failed'
  | 'password-reset'
  | 'contact-form-customer'
  | 'contact-form-admin'
  | 'digital-download-ready'
  | 'order-shipped'
  | 'event-reminder-7-days'
  | 'event-reminder-24-hours'
  | 'waitlist-event-available'
  | 'waitlist-product-available'

interface EmailRequest {
  template: EmailTemplate
  to: string
  data: Record<string, any>
}

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    // Parse request body
    const { template, to, data }: EmailRequest = await req.json()

    // Validate inputs
    if (!template || !to || !data) {
      throw new Error('Missing required fields: template, to, or data')
    }

    // Get email content based on template
    const emailContent = await getEmailContent(template, data)

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lola As One <onboarding@resend.dev>',
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const result = await response.json()

    // Log email sent (optional - for tracking)
    await supabase.from('email_logs').insert({
      template,
      recipient: to,
      resend_id: result.id,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Get email content based on template
async function getEmailContent(template: EmailTemplate, data: Record<string, any>) {
  // Import template functions
  const templates = {
    'order-confirmation': await import('./templates/order-confirmation.ts'),
    'event-booking-confirmation': await import('./templates/event-booking-confirmation.ts'),
    'subscription-activated': await import('./templates/subscription-activated.ts'),
    'subscription-renewal-success': await import('./templates/subscription-renewal-success.ts'),
    'subscription-payment-failed': await import('./templates/subscription-payment-failed.ts'),
    'password-reset': await import('./templates/password-reset.ts'),
    'contact-form-customer': await import('./templates/contact-form-customer.ts'),
    'contact-form-admin': await import('./templates/contact-form-admin.ts'),
    'digital-download-ready': await import('./templates/digital-download-ready.ts'),
    'order-shipped': await import('./templates/order-shipped.ts'),
    'event-reminder-7-days': await import('./templates/event-reminder-7-days.ts'),
    'event-reminder-24-hours': await import('./templates/event-reminder-24-hours.ts'),
    'waitlist-event-available': await import('./templates/waitlist-event-available.ts'),
    'waitlist-product-available': await import('./templates/waitlist-product-available.ts'),
    'new-order-admin': await import('./templates/new-order-admin.ts'),
  }

  const templateModule = templates[template]
  if (!templateModule || !templateModule.default) {
    throw new Error(`Template not found: ${template}`)
  }

  return templateModule.default(data)
}

