import { baseLayout, plainTextLayout } from './base-layout.ts'

interface GiftCardPurchasedData {
  purchaserName: string
  giftCardCode: string
  amount: number
  recipientEmail?: string
  expiryDate?: string
  orderNumber: string
  redeemLink?: string
}

export default function giftCardPurchased(data: GiftCardPurchasedData) {
  const amount = `£${data.amount.toFixed(2)}`
  const redeemLink = data.redeemLink || 'https://www.lotsoflovelyart.com/shop'

  const html = baseLayout(`
    <h2>Your gift card is ready</h2>

    <p>Hi ${data.purchaserName},</p>

    <p>Thank you for purchasing a Lots of Lovely Art gift card.</p>

    <div class="info-box success-box">
      <strong>Gift card code:</strong> ${data.giftCardCode}<br>
      <strong>Amount:</strong> ${amount}<br>
      <strong>Order number:</strong> ${data.orderNumber}
      ${data.recipientEmail ? `<br><strong>Recipient:</strong> ${data.recipientEmail}` : ''}
      ${data.expiryDate ? `<br><strong>Expires:</strong> ${data.expiryDate}` : ''}
    </div>

    <p>The gift card can be used toward eligible Lots of Lovely Art products or workshops.</p>

    <div style="text-align: center;">
      <a href="${redeemLink}" class="button">Browse Lots of Lovely Art</a>
    </div>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your gift card is ready

Hi ${data.purchaserName},

Thank you for purchasing a Lots of Lovely Art gift card.

Gift card code: ${data.giftCardCode}
Amount: ${amount}
Order number: ${data.orderNumber}
${data.recipientEmail ? `Recipient: ${data.recipientEmail}` : ''}
${data.expiryDate ? `Expires: ${data.expiryDate}` : ''}

Browse Lots of Lovely Art:
${redeemLink}

With love,
The LoLA Team
  `)

  return {
    subject: `Gift Card Purchased - ${amount}`,
    html,
    text,
  }
}
