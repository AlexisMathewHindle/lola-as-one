import { baseLayout, plainTextLayout } from './base-layout.ts'

interface EventCancelledData {
  customerName: string
  eventName: string
  eventDate: string
  bookingReference?: string
  cancellationReason?: string
  refundAmount?: number
  alternativesLink?: string
}

export default function eventCancelled(data: EventCancelledData) {
  const refundAmount = typeof data.refundAmount === 'number' ? `£${data.refundAmount.toFixed(2)}` : null

  const html = baseLayout(`
    <h2>Your workshop has been cancelled</h2>

    <p>Hi ${data.customerName},</p>

    <p>We are sorry, but <strong>${data.eventName}</strong> on ${data.eventDate} has been cancelled.</p>

    <div class="info-box danger-box">
      <strong>Workshop:</strong> ${data.eventName}<br>
      <strong>Original date:</strong> ${data.eventDate}
      ${data.bookingReference ? `<br><strong>Booking reference:</strong> ${data.bookingReference}` : ''}
      ${data.cancellationReason ? `<br><strong>Reason:</strong> ${data.cancellationReason}` : ''}
      ${refundAmount ? `<br><strong>Refund amount:</strong> ${refundAmount}` : ''}
    </div>

    <p>If a refund is due, it will be returned to your original payment method.</p>

    ${data.alternativesLink ? `
      <div style="text-align: center;">
        <a href="${data.alternativesLink}" class="button">View Other Workshops</a>
      </div>
    ` : ''}

    <p>If you need help, email us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a>.</p>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your workshop has been cancelled

Hi ${data.customerName},

We are sorry, but ${data.eventName} on ${data.eventDate} has been cancelled.

Workshop: ${data.eventName}
Original date: ${data.eventDate}
${data.bookingReference ? `Booking reference: ${data.bookingReference}` : ''}
${data.cancellationReason ? `Reason: ${data.cancellationReason}` : ''}
${refundAmount ? `Refund amount: ${refundAmount}` : ''}

If a refund is due, it will be returned to your original payment method.

${data.alternativesLink ? `View other workshops:\n${data.alternativesLink}` : ''}

If you need help, email us at hello@lolaasone.com.

With love,
The Lola As One Team
  `)

  return {
    subject: `Workshop Cancelled: ${data.eventName}`,
    html,
    text,
  }
}
