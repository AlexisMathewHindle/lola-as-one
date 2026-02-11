import { baseLayout, plainTextLayout } from './base-layout.ts'

interface EventReminder7DaysData {
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  numberOfAttendees: number
  whatToBring?: string
  parkingInfo?: string
}

export default function eventReminder7Days(data: EventReminder7DaysData) {
  const html = baseLayout(`
    <h2>Workshop Reminder - 7 Days to Go! 🎨</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Just a friendly reminder that your workshop is coming up in one week!</p>
    
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
    </table>
    
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
    
    <p>We'll send you another reminder 24 hours before the workshop.</p>
    
    <p>If you have any questions or need to make changes to your booking, please contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>Looking forward to seeing you!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Workshop Reminder - 7 Days to Go!

Hi ${data.customerName},

Just a friendly reminder that your workshop is coming up in one week!

EVENT DETAILS
Workshop: ${data.eventName}
Date: ${data.eventDate}
Time: ${data.eventTime}
Location: ${data.location}
Attendees: ${data.numberOfAttendees}

${data.whatToBring ? `
WHAT TO BRING
${data.whatToBring}
` : ''}

${data.parkingInfo ? `
PARKING & DIRECTIONS
${data.parkingInfo}
` : ''}

We'll send you another reminder 24 hours before the workshop.

If you have any questions or need to make changes to your booking, please contact us at hello@lolaasone.com

Looking forward to seeing you!

With love,
The Lola As One Team
  `)

  return {
    subject: `Reminder: ${data.eventName} - 7 Days Away!`,
    html,
    text,
  }
}

