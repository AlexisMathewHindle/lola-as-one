import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionResumedData {
  customerName: string
  subscriptionName: string
  resumeDate: string
  nextBillingDate: string
  nextBoxShippingDate?: string
  manageSubscriptionLink?: string
}

export default function subscriptionResumed(data: SubscriptionResumedData) {
  const manageLink = data.manageSubscriptionLink || 'https://lolaasone.com/account/subscriptions'

  const html = baseLayout(`
    <h2>Your subscription has resumed</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your <strong>${data.subscriptionName}</strong> subscription is active again.</p>

    <table class="table">
      <tr><td><strong>Resumed on</strong></td><td>${data.resumeDate}</td></tr>
      <tr><td><strong>Next billing date</strong></td><td>${data.nextBillingDate}</td></tr>
      ${data.nextBoxShippingDate ? `<tr><td><strong>Next box ships</strong></td><td>${data.nextBoxShippingDate}</td></tr>` : ''}
    </table>

    <div style="text-align: center;">
      <a href="${manageLink}" class="button">Manage Subscription</a>
    </div>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your subscription has resumed

Hi ${data.customerName},

Your ${data.subscriptionName} subscription is active again.

Resumed on: ${data.resumeDate}
Next billing date: ${data.nextBillingDate}
${data.nextBoxShippingDate ? `Next box ships: ${data.nextBoxShippingDate}` : ''}

Manage subscription:
${manageLink}

With love,
The Lola As One Team
  `)

  return {
    subject: `Subscription Resumed - ${data.subscriptionName}`,
    html,
    text,
  }
}
