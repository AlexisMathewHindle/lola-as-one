import { baseLayout, plainTextLayout } from './base-layout.ts'

interface WaitlistProductData {
  customerName: string
  productName: string
  productImage?: string
  price: number
  stockQuantity?: number
  expiryTime: string
  productLink: string
}

export default function waitlistProductAvailable(data: WaitlistProductData) {
  const html = baseLayout(`
    <h2>Back in Stock! 🎉</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Great news! <strong>${data.productName}</strong> is back in stock!</p>
    
    ${data.productImage ? `
      <div style="text-align: center; margin: 30px 0;">
        <img src="${data.productImage}" alt="${data.productName}" style="max-width: 100%; height: auto; border-radius: 8px;">
      </div>
    ` : ''}
    
    <div class="info-box" style="border-left-color: #28a745;">
      <strong>Product:</strong> ${data.productName}<br>
      <strong>Price:</strong> £${data.price.toFixed(2)}<br>
      ${data.stockQuantity ? `<strong>Stock:</strong> Limited quantity available` : ''}
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; text-align: center;">
      <strong style="font-size: 18px;">⏰ You have 48 hours to purchase!</strong><br>
      <span style="color: #856404;">This offer expires on ${data.expiryTime}</span>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.productLink}" class="button" style="font-size: 18px; padding: 16px 32px;">Shop Now</a>
    </div>
    
    <p style="margin-top: 30px;">Don't miss out! This is a limited restock, and once it's gone, it's gone.</p>
    
    <p>If you have any questions, please contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>Happy shopping!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Back in Stock!

Hi ${data.customerName},

Great news! ${data.productName} is back in stock!

PRODUCT DETAILS
Product: ${data.productName}
Price: £${data.price.toFixed(2)}
${data.stockQuantity ? 'Stock: Limited quantity available' : ''}

⏰ YOU HAVE 48 HOURS TO PURCHASE!
This offer expires on ${data.expiryTime}

SHOP NOW:
${data.productLink}

Don't miss out! This is a limited restock, and once it's gone, it's gone.

If you have any questions, please contact us at hello@lolaasone.com

Happy shopping!

With love,
The Lola As One Team
  `)

  return {
    subject: `Back in Stock: ${data.productName}!`,
    html,
    text,
  }
}

