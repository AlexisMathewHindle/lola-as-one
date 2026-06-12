import { baseLayout, plainTextLayout } from './base-layout.ts'

interface OrderCancelledData {
  customerName: string
  orderNumber: string
  cancellationReason?: string
  refundAmount?: number
  refundTimeline?: string
}

export default function orderCancelled(data: OrderCancelledData) {
  const refundAmount = typeof data.refundAmount === 'number' ? `£${data.refundAmount.toFixed(2)}` : null

  const html = baseLayout(`
    <h2>Your order has been cancelled</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your order <strong>${data.orderNumber}</strong> has been cancelled.</p>

    <div class="info-box">
      <strong>Order number:</strong> ${data.orderNumber}
      ${data.cancellationReason ? `<br><strong>Reason:</strong> ${data.cancellationReason}` : ''}
      ${refundAmount ? `<br><strong>Refund amount:</strong> ${refundAmount}` : ''}
      ${data.refundTimeline ? `<br><strong>Refund timing:</strong> ${data.refundTimeline}` : ''}
    </div>

    <p>If you have any questions, email us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your order has been cancelled

Hi ${data.customerName},

Your order ${data.orderNumber} has been cancelled.

Order number: ${data.orderNumber}
${data.cancellationReason ? `Reason: ${data.cancellationReason}` : ''}
${refundAmount ? `Refund amount: ${refundAmount}` : ''}
${data.refundTimeline ? `Refund timing: ${data.refundTimeline}` : ''}

If you have any questions, email us at hello@lotsoflovelyart.com.

With love,
The LoLA Team
  `)

  return {
    subject: `Order Cancelled - ${data.orderNumber}`,
    html,
    text,
  }
}
