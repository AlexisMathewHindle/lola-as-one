import { baseLayout, plainTextLayout } from './base-layout.ts'

interface EventCapacityFullAdminData {
  eventName: string
  eventDate: string
  totalCapacity: number
  waitlistCount?: number
  adminLink?: string
}

export default function eventCapacityFullAdmin(data: EventCapacityFullAdminData) {
  const html = baseLayout(`
    <h2>Workshop is full</h2>

    <p><strong>${data.eventName}</strong> has reached capacity.</p>

    <div class="info-box success-box">
      <strong>Workshop:</strong> ${data.eventName}<br>
      <strong>Date:</strong> ${data.eventDate}<br>
      <strong>Total capacity:</strong> ${data.totalCapacity}
      ${typeof data.waitlistCount === 'number' ? `<br><strong>Waitlist count:</strong> ${data.waitlistCount}` : ''}
    </div>

    ${data.adminLink ? `<p><a href="${data.adminLink}" class="button">View Event</a></p>` : ''}
  `)

  const text = plainTextLayout(`
Workshop is full

${data.eventName} has reached capacity.

Workshop: ${data.eventName}
Date: ${data.eventDate}
Total capacity: ${data.totalCapacity}
${typeof data.waitlistCount === 'number' ? `Waitlist count: ${data.waitlistCount}` : ''}

${data.adminLink ? `View event:\n${data.adminLink}` : ''}
  `)

  return {
    subject: `Workshop Full: ${data.eventName}`,
    html,
    text,
  }
}
