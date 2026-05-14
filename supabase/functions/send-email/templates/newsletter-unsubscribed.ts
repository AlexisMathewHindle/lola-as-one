import { baseLayout, plainTextLayout } from './base-layout.ts'

interface NewsletterUnsubscribedData {
  emailAddress: string
  unsubscribeDate: string
  resubscribeLink?: string
  socialLink?: string
}

export default function newsletterUnsubscribed(data: NewsletterUnsubscribedData) {
  const html = baseLayout(`
    <h2>You have been unsubscribed</h2>

    <p>${data.emailAddress} has been removed from Lola As One updates.</p>

    <div class="info-box">
      <strong>Unsubscribed:</strong> ${data.unsubscribeDate}
    </div>

    ${data.resubscribeLink ? `<p>If this was a mistake, you can <a href="${data.resubscribeLink}">resubscribe here</a>.</p>` : ''}
    ${data.socialLink ? `<p>You can still keep in touch on <a href="${data.socialLink}">social media</a>.</p>` : ''}

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
You have been unsubscribed

${data.emailAddress} has been removed from Lola As One updates.

Unsubscribed: ${data.unsubscribeDate}

${data.resubscribeLink ? `Resubscribe:\n${data.resubscribeLink}` : ''}
${data.socialLink ? `Social media:\n${data.socialLink}` : ''}

With love,
The Lola As One Team
  `)

  return {
    subject: 'You Have Been Unsubscribed',
    html,
    text,
  }
}
