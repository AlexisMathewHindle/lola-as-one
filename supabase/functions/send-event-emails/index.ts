import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type EventEmailTemplate =
  | 'event-reminder-7-days'
  | 'event-reminder-24-hours'
  | 'event-feedback-request'

interface OfferingEvent {
  id: string
  event_date: string
  event_start_time: string | null
  location_name: string | null
  location_address: string | null
  location_city: string | null
  location_postcode: string | null
  offering?: {
    title?: string | null
  } | null
}

interface Booking {
  id: string
  offering_event_id: string
  customer_email: string
  customer_name: string | null
  number_of_attendees: number | null
}

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error(`Could not calculate date in time zone: ${timeZone}`)
  }

  return `${year}-${month}-${day}`
}

function addDaysToDateKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day))
  next.setUTCDate(next.getUTCDate() + days)
  return next.toISOString().slice(0, 10)
}

function formatEventDate(eventDate: string): string {
  return new Date(`${eventDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function buildLocation(event: OfferingEvent): string {
  const parts = [
    event.location_name,
    event.location_address,
    event.location_city,
    event.location_postcode,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : 'TBA'
}

function buildFeedbackLink(siteUrl: string, booking: Booking, event: OfferingEvent): string {
  const configuredBase = Deno.env.get('EVENT_FEEDBACK_URL')
  const base = configuredBase || `${siteUrl.replace(/\/$/, '')}/contact`
  const url = new URL(base)
  url.searchParams.set('booking', booking.id)
  url.searchParams.set('event', event.id)
  return url.toString()
}

async function hasAlreadySent(
  supabase: ReturnType<typeof createClient>,
  template: EventEmailTemplate,
  recipient: string,
  bookingId: string,
) {
  const { data, error } = await supabase
    .from('email_logs')
    .select('id')
    .eq('template', template)
    .eq('recipient', recipient)
    .contains('metadata', { bookingId })
    .limit(1)

  if (error) {
    console.warn('Could not check email log for duplicate event email:', error)
    return false
  }

  return Boolean(data && data.length > 0)
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const siteUrl = Deno.env.get('SITE_URL') || 'https://lolacreativespace.com'
    const timeZone = Deno.env.get('EVENT_EMAIL_TIME_ZONE') || 'Europe/London'

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }

    const cronSecret = Deno.env.get('EVENT_EMAIL_CRON_SECRET')
    if (cronSecret) {
      const authHeader = req.headers.get('authorization') || ''
      const headerSecret = req.headers.get('x-cron-secret') || ''
      const bearerSecret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

      if (headerSecret !== cronSecret && bearerSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 401,
        })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const today = dateKeyInTimeZone(new Date(), timeZone)
    const sevenDaysOut = addDaysToDateKey(today, 7)
    const tomorrow = addDaysToDateKey(today, 1)
    const yesterday = addDaysToDateKey(today, -1)
    const targetDates = [sevenDaysOut, tomorrow, yesterday]

    const { data: events, error: eventsError } = await supabase
      .from('offering_events')
      .select(`
        id,
        event_date,
        event_start_time,
        location_name,
        location_address,
        location_city,
        location_postcode,
        offering:offerings(title)
      `)
      .in('event_date', targetDates)

    if (eventsError) {
      throw eventsError
    }

    const eventRows = (events || []) as OfferingEvent[]
    const eventIds = eventRows.map((event) => event.id)

    if (eventIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, skipped: 0 }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const eventById = new Map(eventRows.map((event) => [event.id, event]))
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, offering_event_id, customer_email, customer_name, number_of_attendees')
      .eq('status', 'confirmed')
      .in('offering_event_id', eventIds)

    if (bookingsError) {
      throw bookingsError
    }

    const results: Array<{
      bookingId: string
      template?: EventEmailTemplate
      recipient: string
      status: 'sent' | 'skipped' | 'failed'
      reason?: string
    }> = []

    for (const booking of (bookings || []) as Booking[]) {
      const event = eventById.get(booking.offering_event_id)
      const recipient = booking.customer_email

      if (!event || !recipient) {
        results.push({
          bookingId: booking.id,
          recipient: recipient || '',
          status: 'skipped',
          reason: 'missing event or recipient',
        })
        continue
      }

      let template: EventEmailTemplate | null = null
      if (event.event_date === sevenDaysOut) {
        template = 'event-reminder-7-days'
      } else if (event.event_date === tomorrow) {
        template = 'event-reminder-24-hours'
      } else if (event.event_date === yesterday) {
        template = 'event-feedback-request'
      }

      if (!template) {
        results.push({
          bookingId: booking.id,
          recipient,
          status: 'skipped',
          reason: 'event date outside send windows',
        })
        continue
      }

      const alreadySent = await hasAlreadySent(supabase, template, recipient, booking.id)
      if (alreadySent) {
        results.push({
          bookingId: booking.id,
          template,
          recipient,
          status: 'skipped',
          reason: 'already sent',
        })
        continue
      }

      const eventName = event.offering?.title || 'your workshop'
      const commonData = {
        customerName: booking.customer_name || 'there',
        eventName,
        eventDate: formatEventDate(event.event_date),
        eventTime: event.event_start_time || 'TBA',
        location: buildLocation(event),
        numberOfAttendees: booking.number_of_attendees || 1,
      }

      const data = template === 'event-feedback-request'
        ? {
          customerName: commonData.customerName,
          eventName: commonData.eventName,
          eventDate: commonData.eventDate,
          bookingReference: `BKG-${booking.id.slice(0, 8)}`,
          feedbackLink: buildFeedbackLink(siteUrl, booking, event),
        }
        : commonData

      const emailResponse = await supabase.functions.invoke('send-email', {
        body: {
          template,
          to: recipient,
          data,
          metadata: {
            bookingId: booking.id,
            eventId: event.id,
            automation: 'event-lifecycle',
          },
        },
      })

      if (emailResponse.error) {
        console.error('Failed to send event email:', emailResponse.error)
        results.push({
          bookingId: booking.id,
          template,
          recipient,
          status: 'failed',
          reason: String(emailResponse.error.message || emailResponse.error),
        })
      } else {
        results.push({
          bookingId: booking.id,
          template,
          recipient,
          status: 'sent',
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((result) => result.status === 'sent').length,
        skipped: results.filter((result) => result.status === 'skipped').length,
        failed: results.filter((result) => result.status === 'failed').length,
        windows: {
          today,
          sevenDaysOut,
          tomorrow,
          yesterday,
          timeZone,
        },
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Event email scheduler error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
