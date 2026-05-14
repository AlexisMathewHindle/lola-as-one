import { baseLayout, plainTextLayout } from './base-layout.ts'

interface GiftCardReceivedData {
  recipientName: string
  senderName: string
  giftCardCode: string
  amount: number
  personalMessage?: string
  redemptionLink: string
}

export default function giftCardReceived(data: GiftCardReceivedData) {
  const amount = `£${data.amount.toFixed(2)}`

  const html = baseLayout(`
    <h2>You have received a Lola As One gift card</h2>

    <p>Hi ${data.recipientName},</p>

    <p>${data.senderName} has sent you a Lola As One gift card.</p>

    ${data.personalMessage ? `
      <div class="info-box">
        ${data.personalMessage.replace(/\n/g, '<br>')}
      </div>
    ` : ''}

    <div class="info-box success-box">
      <strong>Gift card code:</strong> ${data.giftCardCode}<br>
      <strong>Amount:</strong> ${amount}
    </div>

    <div style="text-align: center;">
      <a href="${data.redemptionLink}" class="button">Use Your Gift Card</a>
    </div>

    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
You have received a Lola As One gift card

Hi ${data.recipientName},

${data.senderName} has sent you a Lola As One gift card.

${data.personalMessage || ''}

Gift card code: ${data.giftCardCode}
Amount: ${amount}

Use your gift card:
${data.redemptionLink}

With love,
The Lola As One Team
  `)

  return {
    subject: `${data.senderName} Sent You a Lola As One Gift Card`,
    html,
    text,
  }
}
