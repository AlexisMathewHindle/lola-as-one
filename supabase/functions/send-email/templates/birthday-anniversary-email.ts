import { baseLayout, plainTextLayout } from './base-layout.ts'

interface BirthdayAnniversaryEmailData {
  customerName: string
  occasion: 'birthday' | 'anniversary'
  message?: string
  offerCode?: string
  offerValidUntil?: string
  browseLink?: string
}

export default function birthdayAnniversaryEmail(data: BirthdayAnniversaryEmailData) {
  const browseLink = data.browseLink || 'https://www.lotsoflovelyart.com'
  const title = data.occasion === 'birthday' ? 'A little birthday note from us' : 'Thank you for another year with us'

  const html = baseLayout(`
    <h2>${title}</h2>

    <p>Hi ${data.customerName},</p>

    <p>${data.message || (data.occasion === 'birthday' ? 'Wishing you a creative and joyful birthday.' : 'Thank you for being part of the Lots of Lovely Art community.')}</p>

    ${data.offerCode || data.offerValidUntil ? `
      <div class="info-box success-box">
        ${data.offerCode ? `<strong>Offer code:</strong> ${data.offerCode}<br>` : ''}
        ${data.offerValidUntil ? `<strong>Valid until:</strong> ${data.offerValidUntil}` : ''}
      </div>
    ` : ''}

    <div style="text-align: center;">
      <a href="${browseLink}" class="button">Browse Lots of Lovely Art</a>
    </div>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
${title}

Hi ${data.customerName},

${data.message || (data.occasion === 'birthday' ? 'Wishing you a creative and joyful birthday.' : 'Thank you for being part of the Lots of Lovely Art community.')}

${data.offerCode ? `Offer code: ${data.offerCode}` : ''}
${data.offerValidUntil ? `Valid until: ${data.offerValidUntil}` : ''}

Browse Lots of Lovely Art:
${browseLink}

With love,
The LoLA Team
  `)

  return {
    subject: title,
    html,
    text,
  }
}
