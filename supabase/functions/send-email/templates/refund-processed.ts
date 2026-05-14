import { baseLayout, plainTextLayout } from './base-layout.ts'

interface RefundProcessedData {
  customerName: string
  orderNumber: string
  refundAmount: number
  refundReason?: string
  paymentMethod?: string
  processingTimeline?: string
}

export default function refundProcessed(data: RefundProcessedData) {
  const amount = `£${data.refundAmount.toFixed(2)}`

  const html = baseLayout(`
    <h2>Your refund has been processed</h2>

    <p>Hi ${data.customerName},</p>

    <p>We have processed a refund for order <strong>${data.orderNumber}</strong>.</p>

    <div class="info-box success-box">
      <strong>Refund amount:</strong> ${amount}<br>
      <strong>Order number:</strong> ${data.orderNumber}
      ${data.refundReason ? `<br><strong>Reason:</strong> ${data.refundReason}` : ''}
      ${data.paymentMethod ? `<br><strong>Payment method:</strong> ${data.paymentMethod}` : ''}
    </div>

    <p>${data.processingTimeline || 'Refunds usually appear on your original payment method within 5-10 business days.'}</p>

    <p>If you have any questions, email us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a>.</p>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your refund has been processed

Hi ${data.customerName},

We have processed a refund for order ${data.orderNumber}.

Refund amount: ${amount}
Order number: ${data.orderNumber}
${data.refundReason ? `Reason: ${data.refundReason}` : ''}
${data.paymentMethod ? `Payment method: ${data.paymentMethod}` : ''}

${data.processingTimeline || 'Refunds usually appear on your original payment method within 5-10 business days.'}

If you have any questions, email us at hello@lolaasone.com.

With love,
The Lola As One Team
  `)

  return {
    subject: `Refund Processed - ${data.orderNumber}`,
    html,
    text,
  }
}
