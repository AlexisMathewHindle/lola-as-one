import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionCancelledData {
  customerName: string
  subscriptionName: string
  cancellationDate: string
  finalBillingDate?: string
  cancellationReason?: string
  browseLink?: string
}

export default function subscriptionCancelled(data: SubscriptionCancelledData) {
  const browseLink = data.browseLink || 'https://lolaasone.com/shop'

  const html = baseLayout(`
    <h2>Your subscription has been cancelled</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your <strong>${data.subscriptionName}</strong> subscription has been cancelled.</p>

    <div class="info-box">
      <strong>Cancelled on:</strong> ${data.cancellationDate}
      ${data.finalBillingDate ? `<br><strong>Final billing date:</strong> ${data.finalBillingDate}` : ''}
      ${data.cancellationReason ? `<br><strong>Reason:</strong> ${data.cancellationReason}` : ''}
    </div>

    <p>Thank you for being part of Lola As One. You can still book workshops or shop one-off items anytime.</p>

    <div style="text-align: center;">
      <a href="${browseLink}" class="button">Browse Lola As One</a>
    </div>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your subscription has been cancelled

Hi ${data.customerName},

Your ${data.subscriptionName} subscription has been cancelled.

Cancelled on: ${data.cancellationDate}
${data.finalBillingDate ? `Final billing date: ${data.finalBillingDate}` : ''}
${data.cancellationReason ? `Reason: ${data.cancellationReason}` : ''}

Browse Lola As One:
${browseLink}

With love,
The Lola As One Team
  `)

  return {
    subject: `Subscription Cancelled - ${data.subscriptionName}`,
    html,
    text,
  }
}
