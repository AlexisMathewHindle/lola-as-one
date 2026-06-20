import { baseLayout, plainTextLayout } from './base-layout.ts'

type AdminAttendee = {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  email?: string
  phone?: string
  allergies?: string
  notes?: string
}

type AdminAttendees = number | string | AdminAttendee[]

type AdminOrderItem = {
  name: string
  quantity: number
  price: number
  type: string
  attendees?: AdminAttendees
  eventDate?: string
  eventTime?: string
  location?: string
  bookingReference?: string
}

interface EventBookingAdminData {
  orderNumber: string
  customerName: string
  customerEmail: string
  orderTotal: number
  orderItems: AdminOrderItem[]
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  hasPhysicalProducts?: boolean
  adminLink?: string
}

function attendeeCount(attendees: AdminAttendees | undefined, fallbackQuantity: number): number {
  if (Array.isArray(attendees)) {
    return attendees.length || fallbackQuantity
  }

  if (typeof attendees === 'number') {
    return Number.isFinite(attendees) && attendees > 0 ? attendees : fallbackQuantity
  }

  if (typeof attendees === 'string') {
    const parsedCount = Number.parseInt(attendees, 10)
    return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : fallbackQuantity
  }

  return fallbackQuantity
}

function calculateAge(dateOfBirth: string | undefined, referenceDate: string | undefined): number | null {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null
  const ref = referenceDate && /^\d{4}-\d{2}-\d{2}$/.test(referenceDate) ? referenceDate : new Date().toISOString().slice(0, 10)
  const [by, bm, bd] = dateOfBirth.split('-').map(Number)
  const [ry, rm, rd] = ref.split('-').map(Number)
  let age = ry - by
  if (rm < bm || (rm === bm && rd < bd)) age -= 1
  return age >= 0 ? age : null
}

function attendeeName(attendee: AdminAttendee, index: number): string {
  const name = `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim()
  return name || `Attendee ${index + 1}`
}

function attendeeHtml(attendees: AdminAttendees | undefined, eventDate?: string): string {
  if (!Array.isArray(attendees) || attendees.length === 0) {
    return ''
  }

  return `
    <div style="margin-top: 8px;">
      ${attendees.map((attendee, index) => {
        const age = calculateAge(attendee.dateOfBirth, eventDate)
        return `
        <div style="margin-bottom: 8px;">
          ${attendeeName(attendee, index)}
          ${age !== null ? `<br><span class="muted">Age at event: ${age} ${age === 1 ? 'year old' : 'years old'}</span>` : ''}
          ${attendee.email ? `<br><a href="mailto:${attendee.email}">${attendee.email}</a>` : ''}
          ${attendee.phone ? `<br>${attendee.phone}` : ''}
          ${attendee.allergies ? `<br><span class="muted">Allergies: ${attendee.allergies}</span>` : ''}
          ${attendee.notes ? `<br><span class="muted">Notes: ${attendee.notes}</span>` : ''}
        </div>
      `}).join('')}
    </div>
  `
}

function attendeeText(attendees: AdminAttendees | undefined, eventDate?: string): string {
  if (!Array.isArray(attendees) || attendees.length === 0) {
    return ''
  }

  return attendees.map((attendee, index) => {
    const age = calculateAge(attendee.dateOfBirth, eventDate)
    const ageLabel = age !== null ? ` - Age at event: ${age} ${age === 1 ? 'year old' : 'years old'}` : ''
    const contact = [attendee.email, attendee.phone].filter(Boolean).join(', ')
    const allergies = attendee.allergies ? ` - Allergies: ${attendee.allergies}` : ''
    const notes = attendee.notes ? ` - Notes: ${attendee.notes}` : ''
    return `    ${attendeeName(attendee, index)}${ageLabel}${contact ? ` (${contact})` : ''}${allergies}${notes}`
  }).join('\n')
}

function formatMoney(value: number): string {
  return `£${value.toFixed(2)}`
}

function itemTypeLabel(type: string): string {
  if (type === 'product_physical') return 'Product'
  if (type === 'product_digital') return 'Digital'
  if (type === 'discount') return 'Discount'
  return type
}

export default function eventBookingAdmin(data: EventBookingAdminData) {
  const eventItems = data.orderItems.filter((item) => item.type === 'event')
  const otherItems = data.orderItems.filter((item) => item.type !== 'event')
  const primaryEvent = eventItems[0]
  const adminLink = data.adminLink || 'https://hubbjhtjyubzczxengyo.supabase.co/project/hubbjhtjyubzczxengyo'
  const eventLabel = eventItems.length === 1 ? 'event booking' : 'event bookings'
  const html = baseLayout(`
    <h2>New ${eventLabel}</h2>
    
    <div class="info-box success-box">
      <strong>Order Number:</strong> ${data.orderNumber}<br>
      <strong>Total:</strong> ${formatMoney(data.orderTotal)}<br>
      <strong>Events:</strong> ${eventItems.length}
    </div>
    
    <h3>Customer Details</h3>
    <table class="table">
      <tr>
        <td><strong>Name</strong></td>
        <td>${data.customerName}</td>
      </tr>
      <tr>
        <td><strong>Email</strong></td>
        <td><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td>
      </tr>
    </table>
    
    <h3>Booking Details</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Workshop</th>
          <th>Date & Time</th>
          <th>Attendees</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${eventItems.map((item) => `
          <tr>
            <td>
              <strong>${item.name}</strong>
              ${item.bookingReference ? `<br><span class="muted">${item.bookingReference}</span>` : ''}
              ${item.location ? `<br><span class="muted">${item.location}</span>` : ''}
            </td>
            <td>
              ${item.eventDate || 'TBA'}
              ${item.eventTime ? `<br>${item.eventTime}` : ''}
            </td>
            <td>
              <strong>${attendeeCount(item.attendees, item.quantity)} attendee${attendeeCount(item.attendees, item.quantity) > 1 ? 's' : ''}</strong>
              ${attendeeHtml(item.attendees, item.eventDate)}
            </td>
            <td>${formatMoney(item.price)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${otherItems.length > 0 ? `
      <h3>Other Basket Items</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${otherItems.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${itemTypeLabel(item.type)}</td>
              <td>${item.quantity}</td>
              <td>${formatMoney(item.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}
    
    ${data.shippingAddress ? `
      <h3>Shipping Address</h3>
      <div class="info-box">
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
        ${data.shippingAddress.city}<br>
        ${data.shippingAddress.postcode}<br>
        ${data.shippingAddress.country}
      </div>
    ` : ''}
    
    <h3>Action Required</h3>
    <ul>
      <li><strong>Review booking details</strong> - check attendees and event capacity</li>
      ${data.hasPhysicalProducts ? '<li><strong>Fulfill physical products</strong> - pack and ship items</li>' : ''}
      <li>Customer event booking confirmation email is sent from the event booking template</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${adminLink}" class="button">View in Admin Panel</a>
    </div>
    
    <p class="muted" style="margin-top: 30px;">
      This is an automated event booking notification from your Lots of Lovely Art e-commerce system.
    </p>
  `)

  const text = plainTextLayout(`
New ${eventLabel}

Order Number: ${data.orderNumber}
Total: ${formatMoney(data.orderTotal)}
Events: ${eventItems.length}

CUSTOMER DETAILS
Name: ${data.customerName}
Email: ${data.customerEmail}

BOOKING DETAILS
${eventItems.map((item) => {
  const dateTime = [item.eventDate, item.eventTime].filter(Boolean).join(' at ') || 'TBA'
  const location = item.location ? `\n  Location: ${item.location}` : ''
  const bookingReference = item.bookingReference ? `\n  Booking Reference: ${item.bookingReference}` : ''
  const attendees = `${attendeeCount(item.attendees, item.quantity)} attendee${attendeeCount(item.attendees, item.quantity) > 1 ? 's' : ''}`
  const attendeeDetails = attendeeText(item.attendees, item.eventDate)
  return `${item.name}\n  ${dateTime}${location}${bookingReference}\n  ${attendees}${attendeeDetails ? `\n${attendeeDetails}` : ''}\n  ${formatMoney(item.price)}`
}).join('\n\n')}

${otherItems.length > 0 ? `
OTHER BASKET ITEMS
${otherItems.map((item) => `${itemTypeLabel(item.type)}: ${item.name} x${item.quantity} - ${formatMoney(item.price)}`).join('\n')}
` : ''}

${data.shippingAddress ? `
SHIPPING ADDRESS
${data.shippingAddress.line1}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city}
${data.shippingAddress.postcode}
${data.shippingAddress.country}
` : ''}

ACTION REQUIRED
Review booking details - check attendees and event capacity
${data.hasPhysicalProducts ? 'Fulfill physical products - pack and ship items' : ''}
Customer event booking confirmation email is sent from the event booking template

View in Admin Panel:
${adminLink}

This is an automated event booking notification from your Lots of Lovely Art e-commerce system.
  `)

  const subjectEvent = primaryEvent
    ? `${primaryEvent.name}${primaryEvent.eventDate ? ` - ${primaryEvent.eventDate}` : ''}`
    : data.orderNumber

  return {
    subject: eventItems.length === 1
      ? `New event booking: ${subjectEvent}`
      : `New event bookings: ${data.orderNumber}`,
    html,
    text,
  }
}
