import { baseLayout, plainTextLayout } from './base-layout.ts'

interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  orderItems: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  shipping: number
  vat: number
  total: number
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  paymentMethod: string
  estimatedDelivery?: string
}

export default function orderConfirmation(data: OrderConfirmationData) {
  const html = baseLayout(`
    <h2>Thank you for your order! 🎉</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>We've received your order and we're getting it ready. You'll receive a shipping confirmation email with tracking information once your order has been dispatched.</p>
    
    <div class="info-box">
      <strong>Order Number:</strong> ${data.orderNumber}
    </div>
    
    <h3>Order Summary</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${data.orderItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>£${item.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"><strong>Subtotal</strong></td>
          <td>£${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Shipping</strong></td>
          <td>£${data.shipping.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>VAT</strong></td>
          <td>£${data.vat.toFixed(2)}</td>
        </tr>
        <tr style="font-size: 18px;">
          <td colspan="2"><strong>Total</strong></td>
          <td><strong>£${data.total.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>
    
    ${data.shippingAddress ? `
      <h3>Shipping Address</h3>
      <div class="info-box">
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
        ${data.shippingAddress.city}<br>
        ${data.shippingAddress.postcode}<br>
        ${data.shippingAddress.country}
      </div>
    ` : ''}
    
    ${data.estimatedDelivery ? `
      <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
    ` : ''}
    
    <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
    
    <p>If you have any questions about your order, please don't hesitate to contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>Thank you for supporting Lola As One!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Thank you for your order!

Hi ${data.customerName},

We've received your order and we're getting it ready. You'll receive a shipping confirmation email with tracking information once your order has been dispatched.

Order Number: ${data.orderNumber}

ORDER SUMMARY
${data.orderItems.map(item => `${item.name} x${item.quantity} - £${item.price.toFixed(2)}`).join('\n')}

Subtotal: £${data.subtotal.toFixed(2)}
Shipping: £${data.shipping.toFixed(2)}
VAT: £${data.vat.toFixed(2)}
Total: £${data.total.toFixed(2)}

${data.shippingAddress ? `
SHIPPING ADDRESS
${data.shippingAddress.line1}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city}
${data.shippingAddress.postcode}
${data.shippingAddress.country}
` : ''}

${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ''}

Payment Method: ${data.paymentMethod}

If you have any questions about your order, please contact us at hello@lolaasone.com

Thank you for supporting Lola As One!

With love,
The Lola As One Team
  `)

  return {
    subject: `Order Confirmation - ${data.orderNumber}`,
    html,
    text,
  }
}

