import { baseLayout, plainTextLayout } from './base-layout.ts'

interface ProductReviewRequestData {
  customerName: string
  productNames: string[]
  orderNumber: string
  reviewLink: string
  incentiveText?: string
}

export default function productReviewRequest(data: ProductReviewRequestData) {
  const products = data.productNames.join(', ')

  const html = baseLayout(`
    <h2>How was your purchase?</h2>

    <p>Hi ${data.customerName},</p>

    <p>We hope you are enjoying your recent Lots of Lovely Art order.</p>

    <div class="info-box">
      <strong>Order number:</strong> ${data.orderNumber}<br>
      <strong>Items:</strong> ${products}
    </div>

    <p>Your review helps other customers choose the right creative materials and gifts.</p>

    ${data.incentiveText ? `<p>${data.incentiveText}</p>` : ''}

    <div style="text-align: center;">
      <a href="${data.reviewLink}" class="button">Leave a Review</a>
    </div>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
How was your purchase?

Hi ${data.customerName},

We hope you are enjoying your recent Lots of Lovely Art order.

Order number: ${data.orderNumber}
Items: ${products}

${data.incentiveText || ''}

Leave a review:
${data.reviewLink}

With love,
The LoLA Team
  `)

  return {
    subject: `Review Your Lots of Lovely Art Order ${data.orderNumber}`,
    html,
    text,
  }
}
