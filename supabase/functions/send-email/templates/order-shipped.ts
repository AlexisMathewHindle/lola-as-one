import { baseLayout, plainTextLayout } from './base-layout.ts'

interface OrderShippedData {
  customerName: string
  orderNumber: string
  trackingNumber: string
  carrier: string
  trackingUrl: string
  estimatedDelivery: string
  shippedItems: Array<{
    name: string
    quantity: number
  }>
}

export default function orderShipped(data: OrderShippedData) {
  const html = baseLayout(`
    <h2>Your Order Has Shipped! 📦</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Great news! Your order has been shipped and is on its way to you.</p>
    
    <div class="info-box">
      <strong>Order Number:</strong> ${data.orderNumber}<br>
      <strong>Carrier:</strong> ${data.carrier}<br>
      <strong>Tracking Number:</strong> ${data.trackingNumber}<br>
      <strong>Estimated Delivery:</strong> ${data.estimatedDelivery}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.trackingUrl}" class="button">Track Your Package</a>
    </div>
    
    <h3>Items Shipped</h3>
    <ul>
      ${data.shippedItems.map(item => `
        <li>${item.name} (Quantity: ${item.quantity})</li>
      `).join('')}
    </ul>
    
    <h3>What to Do If Your Package Doesn't Arrive</h3>
    <p>If your package hasn't arrived by the estimated delivery date, please:</p>
    <ol>
      <li>Check the tracking information for updates</li>
      <li>Check with neighbors or building reception</li>
      <li>Contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></li>
    </ol>
    
    <p>Thank you for your order!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your Order Has Shipped!

Hi ${data.customerName},

Great news! Your order has been shipped and is on its way to you.

Order Number: ${data.orderNumber}
Carrier: ${data.carrier}
Tracking Number: ${data.trackingNumber}
Estimated Delivery: ${data.estimatedDelivery}

TRACK YOUR PACKAGE
${data.trackingUrl}

ITEMS SHIPPED
${data.shippedItems.map(item => `- ${item.name} (Quantity: ${item.quantity})`).join('\n')}

WHAT TO DO IF YOUR PACKAGE DOESN'T ARRIVE
If your package hasn't arrived by the estimated delivery date, please:
1. Check the tracking information for updates
2. Check with neighbors or building reception
3. Contact us at hello@lolaasone.com

Thank you for your order!

With love,
The Lola As One Team
  `)

  return {
    subject: `Your Order Has Shipped - ${data.orderNumber}`,
    html,
    text,
  }
}

