import { baseLayout, plainTextLayout } from './base-layout.ts'

interface PasswordChangedData {
  customerName?: string
  changeDateTime: string
  ipAddress?: string
  supportEmail?: string
}

export default function passwordChanged(data: PasswordChangedData) {
  const supportEmail = data.supportEmail || 'hello@lolaasone.com'
  const greeting = data.customerName ? `Hi ${data.customerName},` : 'Hello,'

  const html = baseLayout(`
    <h2>Your password has been changed</h2>

    <p>${greeting}</p>

    <p>The password for your Lola As One account was changed on ${data.changeDateTime}.</p>

    <div class="info-box">
      <strong>Changed:</strong> ${data.changeDateTime}
      ${data.ipAddress ? `<br><strong>IP address:</strong> ${data.ipAddress}` : ''}
    </div>

    <p>If you made this change, no further action is needed. If you did not, email us immediately at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your password has been changed

${greeting}

The password for your Lola As One account was changed on ${data.changeDateTime}.

${data.ipAddress ? `IP address: ${data.ipAddress}` : ''}

If you made this change, no further action is needed. If you did not, email us immediately at ${supportEmail}.

With love,
The Lola As One Team
  `)

  return {
    subject: 'Your Lola As One Password Was Changed',
    html,
    text,
  }
}
