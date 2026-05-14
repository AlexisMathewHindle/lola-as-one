import { baseLayout, plainTextLayout } from './base-layout.ts'

interface WelcomeEmailData {
  customerName: string
  emailAddress: string
  accountCreatedDate?: string
  accountLink?: string
  browseLink?: string
}

export default function welcomeEmail(data: WelcomeEmailData) {
  const accountLink = data.accountLink || 'https://lolaasone.com/account'
  const browseLink = data.browseLink || 'https://lolaasone.com'

  const html = baseLayout(`
    <h2>Welcome to Lola As One</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your account is ready. You can use it to view orders, manage bookings, and keep your details up to date.</p>

    <div class="info-box">
      <strong>Email:</strong> ${data.emailAddress}
      ${data.accountCreatedDate ? `<br><strong>Created:</strong> ${data.accountCreatedDate}` : ''}
    </div>

    <p><a href="${accountLink}" class="button">View Account</a></p>
    <p><a href="${browseLink}">Browse workshops and products</a></p>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Welcome to Lola As One

Hi ${data.customerName},

Your account is ready. You can use it to view orders, manage bookings, and keep your details up to date.

Email: ${data.emailAddress}
${data.accountCreatedDate ? `Created: ${data.accountCreatedDate}` : ''}

View account:
${accountLink}

Browse:
${browseLink}

With love,
The Lola As One Team
  `)

  return {
    subject: 'Welcome to Lola As One',
    html,
    text,
  }
}
