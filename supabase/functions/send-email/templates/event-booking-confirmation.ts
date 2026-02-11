import { baseLayout, plainTextLayout } from './base-layout.ts'

interface Attendee {
  firstName: string
  lastName: string
  email?: string
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
  whatToBring?: string
  parkingInfo?: string
  cancellationPolicy?: string
  attendees?: Attendee[]
}

export default function eventBookingConfirmation(data: EventBookingData) {
  const html = baseLayout(`
    <h2>Your workshop is confirmed! 🎨</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>We're excited to see you at <strong>${data.eventName}</strong>! Your booking has been confirmed.</p>
    
    <div class="info-box">
      <strong>Booking Reference:</strong> ${data.bookingReference}<br>
      <strong>Order Number:</strong> ${data.orderNumber}
    </div>
    
    <h3>Event Details</h3>
    <table class="table">
      <tr>
        <td><strong>Workshop</strong></td>
        <td>${data.eventName}</td>
      </tr>
      <tr>
        <td><strong>Date</strong></td>
        <td>${data.eventDate}</td>
      </tr>
      <tr>
        <td><strong>Time</strong></td>
        <td>${data.eventTime}</td>
      </tr>
      <tr>
        <td><strong>Location</strong></td>
        <td>${data.location}</td>
      </tr>
      <tr>
        <td><strong>Attendees</strong></td>
        <td>${data.numberOfAttendees}</td>
      </tr>
      <tr>
        <td><strong>Price Paid</strong></td>
        <td>£${data.pricePaid.toFixed(2)}</td>
      </tr>
    </table>

    ${data.attendees && data.attendees.length > 0 ? `
      <h3>Attendee Details</h3>
      <table class="table">
        ${data.attendees.map((attendee, index) => `
          <tr>
            <td><strong>Attendee ${index + 1}</strong></td>
            <td>${attendee.firstName} ${attendee.lastName}${attendee.email ? ` (${attendee.email})` : ''}</td>
          </tr>
        `).join('')}
      </table>
    ` : ''}

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
      <p style="font-size: 14px; color: #6c757d;">${data.cancellationPolicy}</p>
    ` : ''}
    
    <p>We'll send you a reminder email 7 days before the workshop, and another one 24 hours before.</p>
    
    <p>If you have any questions, please contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>Looking forward to creating with you!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your workshop is confirmed!

Hi ${data.customerName},

We're excited to see you at ${data.eventName}! Your booking has been confirmed.

Booking Reference: ${data.bookingReference}
Order Number: ${data.orderNumber}

EVENT DETAILS
Workshop: ${data.eventName}
Date: ${data.eventDate}
Time: ${data.eventTime}
Location: ${data.location}
Attendees: ${data.numberOfAttendees}
Price Paid: £${data.pricePaid.toFixed(2)}

${data.attendees && data.attendees.length > 0 ? `
ATTENDEE DETAILS
${data.attendees.map((attendee, index) =>
  `Attendee ${index + 1}: ${attendee.firstName} ${attendee.lastName}${attendee.email ? ` (${attendee.email})` : ''}`
).join('\n')}
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

We'll send you a reminder email 7 days before the workshop, and another one 24 hours before.

If you have any questions, please contact us at hello@lolaasone.com

Looking forward to creating with you!

With love,
The Lola As One Team
  `)

  return {
    subject: `Workshop Confirmed: ${data.eventName}`,
    html,
    text,
  }
}

