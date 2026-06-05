import { baseLayout, plainTextLayout } from './base-layout.ts'

interface OrderDeliveredData {
  customerName: string
  orderNumber: string
  deliveryDate: string
  deliveredItems: Array<{ name: string; quantity: number }>
  reviewLink?: string
  supportEmail?: string
}

export default function orderDelivered(data: OrderDeliveredData) {
  const supportEmail = data.supportEmail || 'hello@lolacreativespace.com'
  const itemText = data.deliveredItems.map((item) => `${item.name} x${item.quantity}`).join('\n')

  const html = baseLayout(`
    <h2>Your order has been delivered</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your order <strong>${data.orderNumber}</strong> was marked as delivered on ${data.deliveryDate}.</p>

    <h3>Delivered Items</h3>
    <table class="table">
      ${data.deliveredItems.map((item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
        </tr>
      `).join('')}
    </table>

    ${data.reviewLink ? `
      <p>We would love to hear how everything arrived.</p>
      <div style="text-align: center;">
        <a href="${data.reviewLink}" class="button">Leave a Review</a>
      </div>
    ` : ''}

    <p>If anything is missing or damaged, email us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your order has been delivered

Hi ${data.customerName},

Your order ${data.orderNumber} was marked as delivered on ${data.deliveryDate}.

DELIVERED ITEMS
${itemText}

${data.reviewLink ? `Leave a review:\n${data.reviewLink}` : ''}

If anything is missing or damaged, email us at ${supportEmail}.

With love,
The Lola As One Team
  `)

  return {
    subject: `Delivered: ${data.orderNumber}`,
    html,
    text,
  }
}
