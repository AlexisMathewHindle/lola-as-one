import { baseLayout, plainTextLayout } from './base-layout.ts'

interface BookingCancelledData {
  customerName: string
  eventName: string
  eventDate: string
  bookingReference: string
  refundAmount?: number
  cancellationDate?: string
  bookingLink?: string
}

export default function bookingCancelled(data: BookingCancelledData) {
  const refundAmount = typeof data.refundAmount === 'number' ? `£${data.refundAmount.toFixed(2)}` : null

  const html = baseLayout(`
    <h2>Your booking has been cancelled</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your booking for <strong>${data.eventName}</strong> has been cancelled.</p>

    <div class="info-box">
      <strong>Booking reference:</strong> ${data.bookingReference}<br>
      <strong>Workshop:</strong> ${data.eventName}<br>
      <strong>Date:</strong> ${data.eventDate}
      ${data.cancellationDate ? `<br><strong>Cancelled on:</strong> ${data.cancellationDate}` : ''}
      ${refundAmount ? `<br><strong>Refund amount:</strong> ${refundAmount}` : ''}
    </div>

    ${data.bookingLink ? `
      <p>You can browse upcoming workshops whenever you are ready.</p>
      <div style="text-align: center;">
        <a href="${data.bookingLink}" class="button">Browse Workshops</a>
      </div>
    ` : ''}

    <p>If you have any questions, email us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a>.</p>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your booking has been cancelled

Hi ${data.customerName},

Your booking for ${data.eventName} has been cancelled.

Booking reference: ${data.bookingReference}
Workshop: ${data.eventName}
Date: ${data.eventDate}
${data.cancellationDate ? `Cancelled on: ${data.cancellationDate}` : ''}
${refundAmount ? `Refund amount: ${refundAmount}` : ''}

${data.bookingLink ? `Browse workshops:\n${data.bookingLink}` : ''}

If you have any questions, email us at hello@lolaasone.com.

With love,
The Lola As One Team
  `)

  return {
    subject: `Booking Cancelled: ${data.eventName}`,
    html,
    text,
  }
}
