import { baseLayout, plainTextLayout } from './base-layout.ts'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Attendee {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  allergies?: string
  notes?: string
}

interface EventBookingSummary {
  eventName: string
  eventDate: string
  eventTime?: string
  location?: string
  numberOfAttendees: number
  bookingReference: string
  attendees?: Attendee[]
}

interface EventBookingData {
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  numberOfAttendees: number
  bookingReference: string
  orderNumber: string
  pricePaid: number
  orderItems?: OrderItem[]
  subtotal?: number
  shipping?: number
  vat?: number
  total?: number
  paymentMethod?: string
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  whatToBring?: string
  parkingInfo?: string
  cancellationPolicy?: string
  attendees?: Attendee[]
  events?: EventBookingSummary[]
  supportEmail?: string
  siteUrl?: string
}

const LOLA_LOCATION = 'LoLA Creative Space, 50B Northbrook Street, Newbury, RG14 1DT'
const DEFAULT_SITE_URL = 'https://lolacreativespace.com'
const FAQ_PATH = '/workshop-faqs'
const LOLA_LAYOUT = {
  brandName: 'LoLA',
  plainHeader: 'LoLA',
  tagline: 'Lots of Lovely Art',
  footerBrand: 'Lots of Lovely Art',
  footerTagline: '',
  receivingReasonBrand: 'Lots of Lovely Art',
}

function amount(value: unknown, fallback: number): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

function formatMoney(value: number): string {
  return `£${value.toFixed(2)}`
}

function normaliseOrderItems(data: EventBookingData): OrderItem[] {
  const orderItems = Array.isArray(data.orderItems) ? data.orderItems : []
  const validOrderItems = orderItems.filter((item) => item?.name)

  if (validOrderItems.length > 0) {
    return validOrderItems.map((item) => ({
      name: item.name,
      quantity: amount(item.quantity, 1),
      price: amount(item.price, 0),
    }))
  }

  return [{
    name: data.eventName || 'Workshop booking',
    quantity: amount(data.numberOfAttendees, 1),
    price: amount(data.pricePaid, 0),
  }]
}

function normaliseEvents(data: EventBookingData): EventBookingSummary[] {
  const eventBookings = Array.isArray(data.events) ? data.events : []
  const validEventBookings = eventBookings.filter((event) => event?.eventName)

  if (validEventBookings.length > 0) {
    return validEventBookings.map((event, index) => ({
      eventName: event.eventName,
      eventDate: event.eventDate || 'TBA',
      eventTime: event.eventTime || 'TBA',
      location: event.location || LOLA_LOCATION,
      numberOfAttendees: amount(event.numberOfAttendees, 1),
      bookingReference: event.bookingReference || data.bookingReference || `Booking ${index + 1}`,
      attendees: Array.isArray(event.attendees) ? event.attendees : undefined,
    }))
  }

  return [{
    eventName: data.eventName || 'your workshop',
    eventDate: data.eventDate || 'TBA',
    eventTime: data.eventTime || 'TBA',
    location: data.location || LOLA_LOCATION,
    numberOfAttendees: amount(data.numberOfAttendees, 1),
    bookingReference: data.bookingReference || data.orderNumber,
    attendees: Array.isArray(data.attendees) ? data.attendees : undefined,
  }]
}

function locationForSentence(location: string): string {
  const trimmedLocation = location.trim()

  if (!trimmedLocation || /^tba$/i.test(trimmedLocation)) {
    return trimmedLocation || LOLA_LOCATION
  }

  return /^(the|our)\b/i.test(trimmedLocation) ? trimmedLocation : `the ${trimmedLocation}`
}

function buildFaqUrl(siteUrl?: string): string {
  const siteUrlValue = siteUrl?.trim() || DEFAULT_SITE_URL
  const normalizedSiteUrl = /^https?:\/\//i.test(siteUrlValue)
    ? siteUrlValue
    : `https://${siteUrlValue}`

  return `${normalizedSiteUrl.replace(/\/+$/, '')}${FAQ_PATH}`
}

function questionsSentenceHtml(supportEmail: string, faqUrl: string): string {
  return `If you have any questions about your booking, please refer to our <a href="${faqUrl}">FAQ page</a> for further information or contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.`
}

function questionsSentenceText(supportEmail: string, faqUrl: string): string {
  return `If you have any questions about your booking, please refer to our FAQ page (${faqUrl}) for further information or contact us at ${supportEmail}.`
}

function attendeeName(attendee: Attendee, index: number): string {
  const name = `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim()
  return name || `Attendee ${index + 1}`
}

export default function eventBookingConfirmation(data: EventBookingData) {
  const supportEmail = data.supportEmail || 'hello@lotsoflovelyart.com'
  const faqUrl = buildFaqUrl(data.siteUrl)
  const orderItems = normaliseOrderItems(data)
  const eventBookings = normaliseEvents(data)
  const hasMultipleEvents = eventBookings.length > 1
  const hasAttendeeDetails = eventBookings.some((event) => event.attendees && event.attendees.length > 0)
  const primaryEvent = eventBookings[0]
  const itemTotal = orderItems.reduce((sum, item) => sum + item.price, 0)
  const subtotal = amount(data.subtotal, itemTotal)
  const shipping = amount(data.shipping, 0)
  const total = amount(data.total, subtotal + shipping)
  const vat = amount(data.vat, total > 0 ? total * 0.20 / 1.20 : 0)
  const paymentMethod = data.paymentMethod || 'Card ending in ****'
  const html = baseLayout(`
    <h2>${hasMultipleEvents ? 'Your workshops are confirmed' : 'Your workshop is confirmed'}</h2>

    <p>Hi ${data.customerName},</p>
    
    ${hasMultipleEvents
      ? `<p>Your bookings are confirmed. We look forward to seeing you at ${locationForSentence(LOLA_LOCATION)}.</p>`
      : `<p>Your booking for <strong>${primaryEvent.eventName}</strong> is confirmed. We look forward to seeing you at ${locationForSentence(primaryEvent.location || LOLA_LOCATION)}.</p>`}
    
    <div class="info-box">
      ${!hasMultipleEvents ? `<strong>Booking Reference:</strong> ${primaryEvent.bookingReference}<br>` : ''}
      <strong>Order Number:</strong> ${data.orderNumber}
    </div>
    
    <h3>Workshop Details</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Workshop</th>
          <th>Date & Time</th>
          <th>Attendees</th>
          <th>Reference</th>
        </tr>
      </thead>
      <tbody>
        ${eventBookings.map((event) => `
          <tr>
            <td>
              <strong>${event.eventName}</strong>
            </td>
            <td>
              ${event.eventDate}
              ${event.eventTime ? `<br>${event.eventTime}` : ''}
            </td>
            <td>${event.numberOfAttendees}</td>
            <td>${event.bookingReference}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${hasAttendeeDetails ? `
      <h3>Attendees</h3>
      ${eventBookings.map((event) => event.attendees && event.attendees.length > 0 ? `
        <p><strong>${event.eventName}</strong></p>
        <table class="table">
          ${event.attendees.map((attendee, index) => `
            <tr>
              <td><strong>${attendeeName(attendee, index)}</strong></td>
              <td>
                ${attendee.email ? `<a href="mailto:${attendee.email}">${attendee.email}</a><br>` : ''}
                ${attendee.phone ? `${attendee.phone}<br>` : ''}
                ${attendee.allergies ? `<span class="muted">Allergies: ${attendee.allergies}</span>` : ''}
              </td>
            </tr>
          `).join('')}
        </table>
      ` : '').join('')}
    ` : ''}

    ${hasMultipleEvents ? `
      <div class="info-box">
        Please keep this email for all ${eventBookings.length} workshop bookings in this order.
      </div>
    ` : ''}

    <h3>Payment Summary</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatMoney(item.price)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"><strong>Subtotal</strong></td>
          <td style="text-align: right;">${formatMoney(subtotal)}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Shipping</strong></td>
          <td style="text-align: right;">${formatMoney(shipping)}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>VAT</strong></td>
          <td style="text-align: right;">${formatMoney(vat)}</td>
        </tr>
        <tr style="font-size: 18px;">
          <td colspan="2"><strong>Total</strong></td>
          <td style="text-align: right;"><strong>${formatMoney(total)}</strong></td>
        </tr>
      </tfoot>
    </table>

    ${data.shippingAddress ? `
      <h3>Delivery Address</h3>
      <div class="info-box">
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
        ${data.shippingAddress.city}<br>
        ${data.shippingAddress.postcode}<br>
        ${data.shippingAddress.country}
      </div>
    ` : ''}

    <p><strong>Payment Method:</strong> ${paymentMethod}</p>

    ${data.whatToBring ? `
      <h3>What to Bring</h3>
      <div class="info-box">
        ${data.whatToBring}
      </div>
    ` : ''}
    
    ${data.parkingInfo ? `
      <h3>Parking & Directions</h3>
      <div class="info-box">
        ${data.parkingInfo}
      </div>
    ` : ''}
    
    ${data.cancellationPolicy ? `
      <h3>Cancellation Policy</h3>
      <p class="muted">${data.cancellationPolicy}</p>
    ` : ''}
    
    <p>${questionsSentenceHtml(supportEmail, faqUrl)}</p>
    
    <p>With thanks,<br>The LoLA Team</p>
  `, LOLA_LAYOUT)

  const text = plainTextLayout(`
${hasMultipleEvents ? 'Your workshops are confirmed' : 'Your workshop is confirmed'}

Hi ${data.customerName},

${hasMultipleEvents
  ? `Your bookings are confirmed. We look forward to seeing you at ${locationForSentence(LOLA_LOCATION)}.`
  : `Your booking for ${primaryEvent.eventName} is confirmed. We look forward to seeing you at ${locationForSentence(primaryEvent.location || LOLA_LOCATION)}.`}

${!hasMultipleEvents ? `Booking Reference: ${primaryEvent.bookingReference}` : ''}
Order Number: ${data.orderNumber}

WORKSHOP DETAILS
${eventBookings.map((event) => `
Workshop: ${event.eventName}
Date: ${event.eventDate}
Time: ${event.eventTime || 'TBA'}
Attendees: ${event.numberOfAttendees}
Booking Reference: ${event.bookingReference}
`).join('\n')}

${hasAttendeeDetails ? `
ATTENDEES
${eventBookings.map((event) => {
  if (!event.attendees || event.attendees.length === 0) {
    return ''
  }

  return `${event.eventName}\n${event.attendees.map((attendee, index) => {
    const contact = [attendee.email, attendee.phone].filter(Boolean).join(', ')
    const allergies = attendee.allergies ? ` - Allergies: ${attendee.allergies}` : ''
    return `${attendeeName(attendee, index)}${contact ? ` (${contact})` : ''}${allergies}`
  }).join('\n')}`
}).join('\n')}
` : ''}

PAYMENT SUMMARY
Item | Quantity | Price
${orderItems.map(item => `${item.name} | ${item.quantity} | ${formatMoney(item.price)}`).join('\n')}

Subtotal: ${formatMoney(subtotal)}
Shipping: ${formatMoney(shipping)}
VAT: ${formatMoney(vat)}
Total: ${formatMoney(total)}

Payment Method: ${paymentMethod}

${data.shippingAddress ? `
DELIVERY ADDRESS
${data.shippingAddress.line1}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city}
${data.shippingAddress.postcode}
${data.shippingAddress.country}
` : ''}

${data.whatToBring ? `
WHAT TO BRING
${data.whatToBring}
` : ''}

${data.parkingInfo ? `
PARKING & DIRECTIONS
${data.parkingInfo}
` : ''}

${data.cancellationPolicy ? `
CANCELLATION POLICY
${data.cancellationPolicy}
` : ''}

${questionsSentenceText(supportEmail, faqUrl)}

With thanks,
The LoLA Team
  `, LOLA_LAYOUT)

  return {
    subject: hasMultipleEvents
      ? `Workshops confirmed: ${eventBookings.length} bookings`
      : `Workshop confirmed: ${primaryEvent.eventName}`,
    html,
    text,
  }
}
