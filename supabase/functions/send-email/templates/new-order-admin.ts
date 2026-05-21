import { baseLayout, plainTextLayout } from './base-layout.ts'

type AdminAttendee = {
  firstName?: string
  lastName?: string
  email?: string
  allergies?: string
}

type AdminAttendees = number | string | AdminAttendee[]

interface NewOrderAdminData {
  orderNumber: string
  customerName: string
  customerEmail: string
  orderTotal: number
  orderItems: Array<{
    name: string
    quantity: number
    price: number
    type: string
    attendees?: AdminAttendees
    eventDate?: string
    eventTime?: string
  }>
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  hasEvents: boolean
  hasPhysicalProducts: boolean
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

function attendeeName(attendee: AdminAttendee, index: number): string {
  const name = `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim()
  return name || `Attendee ${index + 1}`
}

function attendeeHtml(attendees: AdminAttendees | undefined): string {
  if (!Array.isArray(attendees) || attendees.length === 0) {
    return ''
  }

  return `
    <div style="margin-top: 8px;">
      ${attendees.map((attendee, index) => `
        <div>
          ${attendeeName(attendee, index)}
          ${attendee.allergies ? `<br><span class="muted">Allergies: ${attendee.allergies}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `
}

function attendeeText(attendees: AdminAttendees | undefined): string {
  if (!Array.isArray(attendees) || attendees.length === 0) {
    return ''
  }

  return attendees.map((attendee, index) => {
    const allergies = attendee.allergies ? ` - Allergies: ${attendee.allergies}` : ''
    return `    ${attendeeName(attendee, index)}${allergies}`
  }).join('\n')
}

export default function newOrderAdmin(data: NewOrderAdminData) {
  const html = baseLayout(`
    <h2>New order received</h2>
    
    <div class="info-box success-box">
      <strong>Order Number:</strong> ${data.orderNumber}<br>
      <strong>Total:</strong> £${data.orderTotal.toFixed(2)}
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
    
    <h3>Order Items</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Type</th>
          <th>Details</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${data.orderItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.type === 'event' ? 'Event' : item.type === 'product_physical' ? 'Product' : item.type === 'discount' ? 'Discount' : 'Digital'}</td>
            <td>
              ${item.type === 'event' && item.attendees ? `
                <strong>${attendeeCount(item.attendees, item.quantity)} attendee${attendeeCount(item.attendees, item.quantity) > 1 ? 's' : ''}</strong><br>
                ${item.eventDate ? `${item.eventDate}` : ''}
                ${item.eventTime ? ` at ${item.eventTime}` : ''}
                ${attendeeHtml(item.attendees)}
              ` : `Qty: ${item.quantity}`}
            </td>
            <td>£${item.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-size: 18px;">
          <td colspan="3"><strong>Total</strong></td>
          <td><strong>£${data.orderTotal.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>
    
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
      ${data.hasPhysicalProducts ? '<li><strong>Fulfill physical products</strong> - pack and ship items</li>' : ''}
      ${data.hasEvents ? '<li><strong>Event bookings recorded</strong> - check attendees and capacity</li>' : ''}
      <li>Customer order confirmation email has been sent</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://hubbjhtjyubzczxengyo.supabase.co/project/hubbjhtjyubzczxengyo" class="button">View in Admin Panel</a>
    </div>
    
    <p class="muted" style="margin-top: 30px;">
      This is an automated notification from your Lola As One e-commerce system.
    </p>
  `)

  const text = plainTextLayout(`
New Order Received!

Order Number: ${data.orderNumber}
Total: £${data.orderTotal.toFixed(2)}

CUSTOMER DETAILS
Name: ${data.customerName}
Email: ${data.customerEmail}

ORDER ITEMS
${data.orderItems.map(item => {
  const typeLabel = item.type === 'event' ? 'Event' : item.type === 'product_physical' ? 'Product' : item.type === 'discount' ? 'Discount' : 'Digital'
  const details = item.type === 'event' && item.attendees
    ? `${attendeeCount(item.attendees, item.quantity)} attendee${attendeeCount(item.attendees, item.quantity) > 1 ? 's' : ''}${item.eventDate ? ` - ${item.eventDate}` : ''}${item.eventTime ? ` at ${item.eventTime}` : ''}${attendeeText(item.attendees) ? `\n${attendeeText(item.attendees)}` : ''}`
    : `x${item.quantity}`
  return `${typeLabel}: ${item.name} ${details} - £${item.price.toFixed(2)}`
}).join('\n')}

Total: £${data.orderTotal.toFixed(2)}

${data.shippingAddress ? `
SHIPPING ADDRESS
${data.shippingAddress.line1}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city}
${data.shippingAddress.postcode}
${data.shippingAddress.country}
` : ''}

ACTION REQUIRED
${data.hasPhysicalProducts ? 'Fulfill physical products - pack and ship items' : ''}
${data.hasEvents ? 'Event bookings recorded - check attendees and capacity' : ''}
Customer order confirmation email has been sent

View in Admin Panel:
https://hubbjhtjyubzczxengyo.supabase.co/project/hubbjhtjyubzczxengyo

This is an automated notification from your Lola As One e-commerce system.
  `)

  return {
    subject: `New Order: ${data.orderNumber} - £${data.orderTotal.toFixed(2)}`,
    html,
    text,
  }
}
