import { baseLayout, plainTextLayout } from './base-layout.ts'

interface WaitlistSpotExpiredData {
  customerName: string
  itemName: string
  originalNotificationDate?: string
  rejoinLink?: string
  alternativesLink?: string
}

export default function waitlistSpotExpired(data: WaitlistSpotExpiredData) {
  const html = baseLayout(`
    <h2>Your waitlist offer has expired</h2>

    <p>Hi ${data.customerName},</p>

    <p>The reserved opportunity for <strong>${data.itemName}</strong> has now expired.</p>

    <div class="info-box warning-box">
      <strong>Item:</strong> ${data.itemName}
      ${data.originalNotificationDate ? `<br><strong>Original notification:</strong> ${data.originalNotificationDate}` : ''}
    </div>

    <p>If you are still interested, you can rejoin the waitlist or browse other available options.</p>

    ${data.rejoinLink ? `<p><a href="${data.rejoinLink}" class="button">Rejoin Waitlist</a></p>` : ''}
    ${data.alternativesLink ? `<p><a href="${data.alternativesLink}">View alternatives</a></p>` : ''}

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your waitlist offer has expired

Hi ${data.customerName},

The reserved opportunity for ${data.itemName} has now expired.

${data.originalNotificationDate ? `Original notification: ${data.originalNotificationDate}` : ''}
${data.rejoinLink ? `Rejoin waitlist:\n${data.rejoinLink}` : ''}
${data.alternativesLink ? `View alternatives:\n${data.alternativesLink}` : ''}

With love,
The LoLA Team
  `)

  return {
    subject: `Waitlist Offer Expired - ${data.itemName}`,
    html,
    text,
  }
}
