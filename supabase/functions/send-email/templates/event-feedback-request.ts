import { baseLayout, plainTextLayout } from './base-layout.ts'

interface EventFeedbackRequestData {
  customerName: string
  eventName: string
  eventDate: string
  feedbackLink: string
  bookingReference?: string
  photoShareLink?: string
}

export default function eventFeedbackRequest(data: EventFeedbackRequestData) {
  const html = baseLayout(`
    <h2>How was ${data.eventName}?</h2>

    <p>Hi ${data.customerName},</p>

    <p>Thank you for joining us for <strong>${data.eventName}</strong>. We hope it felt creative, relaxed, and worth your time.</p>

    <div class="info-box">
      <strong>Workshop:</strong> ${data.eventName}<br>
      <strong>Date:</strong> ${data.eventDate}
      ${data.bookingReference ? `<br><strong>Booking reference:</strong> ${data.bookingReference}` : ''}
    </div>

    <p>Your feedback helps us shape future workshops and improve the studio experience for every guest.</p>

    <div style="text-align: center;">
      <a href="${data.feedbackLink}" class="button">Share Feedback</a>
    </div>

    ${data.photoShareLink ? `
      <p>If you took photos you are happy for us to see, you can share them here: <a href="${data.photoShareLink}">upload workshop photos</a>.</p>
    ` : ''}

    <p class="muted">This should only take a couple of minutes. If anything needs a direct reply, email us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a>.</p>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
How was ${data.eventName}?

Hi ${data.customerName},

Thank you for joining us for ${data.eventName}. We hope it felt creative, relaxed, and worth your time.

Workshop: ${data.eventName}
Date: ${data.eventDate}
${data.bookingReference ? `Booking reference: ${data.bookingReference}` : ''}

Your feedback helps us shape future workshops and improve the studio experience for every guest.

Share feedback:
${data.feedbackLink}

${data.photoShareLink ? `
Share workshop photos:
${data.photoShareLink}
` : ''}

If anything needs a direct reply, email us at hello@lolaasone.com.

With love,
The Lola As One Team
  `)

  return {
    subject: `How was ${data.eventName}?`,
    html,
    text,
  }
}
