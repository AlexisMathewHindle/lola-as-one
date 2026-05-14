import { baseLayout, plainTextLayout } from './base-layout.ts'

interface AbandonedCartReminderData {
  customerName?: string
  cartItems: Array<{ name: string; quantity: number; price: number }>
  cartTotal: number
  cartLink: string
  discountCode?: string
}

export default function abandonedCartReminder(data: AbandonedCartReminderData) {
  const greeting = data.customerName ? `Hi ${data.customerName},` : 'Hello,'

  const html = baseLayout(`
    <h2>You left something in your basket</h2>

    <p>${greeting}</p>

    <p>Your Lola As One basket is still waiting for you.</p>

    <table class="table">
      ${data.cartItems.map((item) => `
        <tr>
          <td>${item.name} x${item.quantity}</td>
          <td>£${item.price.toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr>
        <td><strong>Total</strong></td>
        <td><strong>£${data.cartTotal.toFixed(2)}</strong></td>
      </tr>
    </table>

    ${data.discountCode ? `<p class="info-box">Use code <strong>${data.discountCode}</strong> at checkout.</p>` : ''}

    <div style="text-align: center;">
      <a href="${data.cartLink}" class="button">Return to Basket</a>
    </div>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
You left something in your basket

${greeting}

Your Lola As One basket is still waiting for you.

${data.cartItems.map((item) => `${item.name} x${item.quantity} - £${item.price.toFixed(2)}`).join('\n')}
Total: £${data.cartTotal.toFixed(2)}

${data.discountCode ? `Use code ${data.discountCode} at checkout.` : ''}

Return to basket:
${data.cartLink}

With love,
The Lola As One Team
  `)

  return {
    subject: 'Your Lola As One Basket Is Waiting',
    html,
    text,
  }
}
