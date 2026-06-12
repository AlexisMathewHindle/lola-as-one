import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionPausedData {
  customerName: string
  subscriptionName: string
  pauseDate: string
  resumeDate?: string
  reason?: string
  manageSubscriptionLink?: string
}

export default function subscriptionPaused(data: SubscriptionPausedData) {
  const manageLink = data.manageSubscriptionLink || 'https://www.lotsoflovelyart.com/account/subscriptions'

  const html = baseLayout(`
    <h2>Your subscription is paused</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your <strong>${data.subscriptionName}</strong> subscription has been paused.</p>

    <div class="info-box">
      <strong>Paused from:</strong> ${data.pauseDate}
      ${data.resumeDate ? `<br><strong>Scheduled resume date:</strong> ${data.resumeDate}` : ''}
      ${data.reason ? `<br><strong>Reason:</strong> ${data.reason}` : ''}
    </div>

    <p>You will not be charged while your subscription is paused.</p>

    <div style="text-align: center;">
      <a href="${manageLink}" class="button">Manage Subscription</a>
    </div>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your subscription is paused

Hi ${data.customerName},

Your ${data.subscriptionName} subscription has been paused.

Paused from: ${data.pauseDate}
${data.resumeDate ? `Scheduled resume date: ${data.resumeDate}` : ''}
${data.reason ? `Reason: ${data.reason}` : ''}

You will not be charged while your subscription is paused.

Manage subscription:
${manageLink}

With love,
The LoLA Team
  `)

  return {
    subject: `Subscription Paused - ${data.subscriptionName}`,
    html,
    text,
  }
}
