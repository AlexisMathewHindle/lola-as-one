import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionEndingSoonData {
  customerName: string
  subscriptionName: string
  endDate: string
  finalBillingDate?: string
  reactivateLink?: string
}

export default function subscriptionEndingSoon(data: SubscriptionEndingSoonData) {
  const reactivateLink = data.reactivateLink || 'https://www.lotsoflovelyart.com/account/subscriptions'

  const html = baseLayout(`
    <h2>Your subscription is ending soon</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your <strong>${data.subscriptionName}</strong> subscription is scheduled to end on ${data.endDate}.</p>

    <div class="info-box warning-box">
      <strong>End date:</strong> ${data.endDate}
      ${data.finalBillingDate ? `<br><strong>Final billing date:</strong> ${data.finalBillingDate}` : ''}
    </div>

    <p>If you would like to keep receiving your subscription, you can reactivate it before it ends.</p>

    <div style="text-align: center;">
      <a href="${reactivateLink}" class="button">Reactivate Subscription</a>
    </div>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your subscription is ending soon

Hi ${data.customerName},

Your ${data.subscriptionName} subscription is scheduled to end on ${data.endDate}.

End date: ${data.endDate}
${data.finalBillingDate ? `Final billing date: ${data.finalBillingDate}` : ''}

Reactivate subscription:
${reactivateLink}

With love,
The LoLA Team
  `)

  return {
    subject: `Subscription Ending Soon - ${data.subscriptionName}`,
    html,
    text,
  }
}
