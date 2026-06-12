import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionBoxShippedData {
  customerName: string
  subscriptionName: string
  trackingNumber?: string
  carrier?: string
  trackingUrl?: string
  estimatedDelivery?: string
  nextBillingDate?: string
  boxContents?: string[]
}

export default function subscriptionBoxShipped(data: SubscriptionBoxShippedData) {
  const html = baseLayout(`
    <h2>Your subscription box has shipped</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your <strong>${data.subscriptionName}</strong> box is on its way.</p>

    <div class="info-box">
      ${data.carrier ? `<strong>Carrier:</strong> ${data.carrier}<br>` : ''}
      ${data.trackingNumber ? `<strong>Tracking number:</strong> ${data.trackingNumber}<br>` : ''}
      ${data.estimatedDelivery ? `<strong>Estimated delivery:</strong> ${data.estimatedDelivery}<br>` : ''}
      ${data.nextBillingDate ? `<strong>Next billing date:</strong> ${data.nextBillingDate}` : ''}
    </div>

    ${data.boxContents && data.boxContents.length > 0 ? `
      <h3>Inside this box</h3>
      <ul>
        ${data.boxContents.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    ` : ''}

    ${data.trackingUrl ? `
      <div style="text-align: center;">
        <a href="${data.trackingUrl}" class="button">Track Your Box</a>
      </div>
    ` : ''}

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your subscription box has shipped

Hi ${data.customerName},

Your ${data.subscriptionName} box is on its way.

${data.carrier ? `Carrier: ${data.carrier}` : ''}
${data.trackingNumber ? `Tracking number: ${data.trackingNumber}` : ''}
${data.estimatedDelivery ? `Estimated delivery: ${data.estimatedDelivery}` : ''}
${data.nextBillingDate ? `Next billing date: ${data.nextBillingDate}` : ''}

${data.boxContents && data.boxContents.length > 0 ? `INSIDE THIS BOX\n${data.boxContents.join('\n')}` : ''}

${data.trackingUrl ? `Track your box:\n${data.trackingUrl}` : ''}

With love,
The LoLA Team
  `)

  return {
    subject: `Your ${data.subscriptionName} Box Has Shipped`,
    html,
    text,
  }
}
