import { baseLayout, plainTextLayout } from './base-layout.ts'

interface EmailAddressChangedData {
  customerName?: string
  oldEmail: string
  newEmail: string
  changeDateTime: string
  supportEmail?: string
}

export default function emailAddressChanged(data: EmailAddressChangedData) {
  const supportEmail = data.supportEmail || 'hello@lotsoflovelyart.com'
  const greeting = data.customerName ? `Hi ${data.customerName},` : 'Hello,'

  const html = baseLayout(`
    <h2>Your email address has been changed</h2>

    <p>${greeting}</p>

    <p>The email address on your Lots of Lovely Art account was changed.</p>

    <div class="info-box">
      <strong>Old email:</strong> ${data.oldEmail}<br>
      <strong>New email:</strong> ${data.newEmail}<br>
      <strong>Changed:</strong> ${data.changeDateTime}
    </div>

    <p>If you did not make this change, email us immediately at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your email address has been changed

${greeting}

The email address on your Lots of Lovely Art account was changed.

Old email: ${data.oldEmail}
New email: ${data.newEmail}
Changed: ${data.changeDateTime}

If you did not make this change, email us immediately at ${supportEmail}.

With love,
The LoLA Team
  `)

  return {
    subject: 'Your Lots of Lovely Art Email Address Was Changed',
    html,
    text,
  }
}
