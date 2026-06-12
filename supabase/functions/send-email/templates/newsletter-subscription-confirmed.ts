import { baseLayout, plainTextLayout } from './base-layout.ts'

interface NewsletterSubscriptionConfirmedData {
  subscriberEmail: string
  subscriptionDate?: string
  preferencesLink?: string
  unsubscribeLink?: string
  browseLink?: string
}

export default function newsletterSubscriptionConfirmed(data: NewsletterSubscriptionConfirmedData) {
  const browseLink = data.browseLink || 'https://www.lotsoflovelyart.com'

  const html = baseLayout(`
    <h2>You are on the list</h2>

    <p>Thanks for signing up to Lots of Lovely Art updates.</p>

    <div class="info-box">
      <strong>Email:</strong> ${data.subscriberEmail}
      ${data.subscriptionDate ? `<br><strong>Subscribed:</strong> ${data.subscriptionDate}` : ''}
    </div>

    <p>We will send workshop news, product updates, and creative notes from the studio.</p>

    <p><a href="${browseLink}" class="button">Browse Lots of Lovely Art</a></p>
    ${data.preferencesLink ? `<p><a href="${data.preferencesLink}">Manage preferences</a></p>` : ''}
    ${data.unsubscribeLink ? `<p class="muted"><a href="${data.unsubscribeLink}">Unsubscribe</a></p>` : ''}

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
You are on the list

Thanks for signing up to Lots of Lovely Art updates.

Email: ${data.subscriberEmail}
${data.subscriptionDate ? `Subscribed: ${data.subscriptionDate}` : ''}

Browse Lots of Lovely Art:
${browseLink}

${data.preferencesLink ? `Manage preferences:\n${data.preferencesLink}` : ''}
${data.unsubscribeLink ? `Unsubscribe:\n${data.unsubscribeLink}` : ''}

With love,
The LoLA Team
  `)

  return {
    subject: 'You Are Subscribed to Lots of Lovely Art Updates',
    html,
    text,
  }
}
