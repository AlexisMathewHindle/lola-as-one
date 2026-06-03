import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Email template types
type EmailTemplate = 
  | 'order-confirmation'
  | 'order-delivered'
  | 'order-cancelled'
  | 'refund-processed'
  | 'event-booking-confirmation'
  | 'event-cancelled'
  | 'booking-cancelled'
  | 'subscription-activated'
  | 'subscription-renewal-success'
  | 'subscription-payment-failed'
  | 'subscription-paused'
  | 'subscription-resumed'
  | 'subscription-cancelled'
  | 'subscription-ending-soon'
  | 'subscription-box-shipped'
  | 'password-reset'
  | 'password-changed'
  | 'email-address-changed'
  | 'welcome-email'
  | 'contact-form-customer'
  | 'contact-form-admin'
  | 'newsletter-subscription-confirmed'
  | 'newsletter-unsubscribed'
  | 'digital-download-ready'
  | 'download-link-expiring-soon'
  | 'gift-card-purchased'
  | 'gift-card-received'
  | 'order-shipped'
  | 'event-reminder-7-days'
  | 'event-reminder-24-hours'
  | 'event-feedback-request'
  | 'waitlist-event-available'
  | 'waitlist-product-available'
  | 'waitlist-spot-expired'
  | 'new-order-admin'
  | 'low-stock-alert-admin'
  | 'event-capacity-full-admin'
  | 'subscription-payment-failed-admin'
  | 'new-waitlist-entry-admin'
  | 'product-review-request'
  | 'abandoned-cart-reminder'
  | 'new-workshop-announcement'
  | 'new-product-launch'
  | 'seasonal-promotion'
  | 'birthday-anniversary-email'

interface EmailRequest {
  template: EmailTemplate
  to: string
  data: Record<string, any>
  metadata?: Record<string, any>
}

serve(async (req) => {
  let supabase: any = null
  let requestedTemplate = ''
  let requestedRecipient = ''
  let requestedMetadata: Record<string, any> | undefined

  try {
    console.log('📧 Send email function called')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    console.log('Resend API key present:', !!resendApiKey)

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    // Parse request body
    const { template, to, data, metadata }: EmailRequest = await req.json()
    requestedTemplate = template
    requestedRecipient = to
    requestedMetadata = metadata

    console.log('📧 Email request:', { template, to, dataKeys: Object.keys(data) })

    // Validate inputs
    if (!template || !to || !data) {
      throw new Error('Missing required fields: template, to, or data')
    }

    const supportEmail = Deno.env.get('SUPPORT_EMAIL') || Deno.env.get('EMAIL_REPLY_TO') || 'hello@lotsoflovelyart.com'
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://www.lotsoflovelyart.com'
    const templateData = {
      supportEmail,
      siteUrl,
      ...data,
    }

    // Get email content based on template
    console.log('📧 Getting email content for template:', template)
    const emailContent = await getEmailContent(template, templateData)
    console.log('📧 Email content generated:', { subject: emailContent.subject, hasHtml: !!emailContent.html })

    // Send email via Resend
    console.log('📧 Sending email via Resend to:', to)
    const fromAddress = Deno.env.get('EMAIL_FROM') || 'Lola As One <onboarding@resend.dev>'
    const replyToAddress = Deno.env.get('EMAIL_REPLY_TO')?.trim()
    const resendPayload: Record<string, any> = {
      from: fromAddress,
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }

    if (replyToAddress) {
      resendPayload.reply_to = replyToAddress
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })

    console.log('📧 Resend API response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Resend API error:', error)
      throw new Error(`Resend API error: ${error}`)
    }

    const result = await response.json()
    console.log('✅ Email sent successfully, Resend ID:', result.id)

    // Log email sent (optional - for tracking)
    await supabase.from('email_logs').insert({
      template,
      recipient: to,
      resend_id: result.id,
      status: 'sent',
      metadata: {
        ...(metadata || {}),
        subject: emailContent.subject,
      },
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
    if (supabase && requestedTemplate && requestedRecipient) {
      try {
        await supabase.from('email_logs').insert({
          template: requestedTemplate,
          recipient: requestedRecipient,
          status: 'failed',
          error_message: error.message || String(error),
          metadata: requestedMetadata || null,
          sent_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error('Failed to log email failure:', logError)
      }
    }

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
    'order-delivered': await import('./templates/order-delivered.ts'),
    'order-cancelled': await import('./templates/order-cancelled.ts'),
    'refund-processed': await import('./templates/refund-processed.ts'),
    'event-booking-confirmation': await import('./templates/event-booking-confirmation.ts'),
    'event-cancelled': await import('./templates/event-cancelled.ts'),
    'booking-cancelled': await import('./templates/booking-cancelled.ts'),
    'subscription-activated': await import('./templates/subscription-activated.ts'),
    'subscription-renewal-success': await import('./templates/subscription-renewal-success.ts'),
    'subscription-payment-failed': await import('./templates/subscription-payment-failed.ts'),
    'subscription-paused': await import('./templates/subscription-paused.ts'),
    'subscription-resumed': await import('./templates/subscription-resumed.ts'),
    'subscription-cancelled': await import('./templates/subscription-cancelled.ts'),
    'subscription-ending-soon': await import('./templates/subscription-ending-soon.ts'),
    'subscription-box-shipped': await import('./templates/subscription-box-shipped.ts'),
    'password-reset': await import('./templates/password-reset.ts'),
    'password-changed': await import('./templates/password-changed.ts'),
    'email-address-changed': await import('./templates/email-address-changed.ts'),
    'welcome-email': await import('./templates/welcome-email.ts'),
    'contact-form-customer': await import('./templates/contact-form-customer.ts'),
    'contact-form-admin': await import('./templates/contact-form-admin.ts'),
    'newsletter-subscription-confirmed': await import('./templates/newsletter-subscription-confirmed.ts'),
    'newsletter-unsubscribed': await import('./templates/newsletter-unsubscribed.ts'),
    'digital-download-ready': await import('./templates/digital-download-ready.ts'),
    'download-link-expiring-soon': await import('./templates/download-link-expiring-soon.ts'),
    'gift-card-purchased': await import('./templates/gift-card-purchased.ts'),
    'gift-card-received': await import('./templates/gift-card-received.ts'),
    'order-shipped': await import('./templates/order-shipped.ts'),
    'event-reminder-7-days': await import('./templates/event-reminder-7-days.ts'),
    'event-reminder-24-hours': await import('./templates/event-reminder-24-hours.ts'),
    'event-feedback-request': await import('./templates/event-feedback-request.ts'),
    'waitlist-event-available': await import('./templates/waitlist-event-available.ts'),
    'waitlist-product-available': await import('./templates/waitlist-product-available.ts'),
    'waitlist-spot-expired': await import('./templates/waitlist-spot-expired.ts'),
    'new-order-admin': await import('./templates/new-order-admin.ts'),
    'low-stock-alert-admin': await import('./templates/low-stock-alert-admin.ts'),
    'event-capacity-full-admin': await import('./templates/event-capacity-full-admin.ts'),
    'subscription-payment-failed-admin': await import('./templates/subscription-payment-failed-admin.ts'),
    'new-waitlist-entry-admin': await import('./templates/new-waitlist-entry-admin.ts'),
    'product-review-request': await import('./templates/product-review-request.ts'),
    'abandoned-cart-reminder': await import('./templates/abandoned-cart-reminder.ts'),
    'new-workshop-announcement': await import('./templates/new-workshop-announcement.ts'),
    'new-product-launch': await import('./templates/new-product-launch.ts'),
    'seasonal-promotion': await import('./templates/seasonal-promotion.ts'),
    'birthday-anniversary-email': await import('./templates/birthday-anniversary-email.ts'),
  }

  const templateModule = templates[template]
  if (!templateModule || !templateModule.default) {
    throw new Error(`Template not found: ${template}`)
  }

  return templateModule.default(data)
}
