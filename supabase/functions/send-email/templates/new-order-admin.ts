import { baseLayout, plainTextLayout } from './base-layout.ts'

interface NewOrderAdminData {
  orderNumber: string
  customerName: string
  customerEmail: string
  orderTotal: number
  orderItems: Array<{
    name: string
    quantity: number
    price: number
    type: string
    attendees?: number
    eventDate?: string
    eventTime?: string
  }>
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
  hasEvents: boolean
  hasPhysicalProducts: boolean
}

export default function newOrderAdmin(data: NewOrderAdminData) {
  const html = baseLayout(`
    <h2>New Order Received! 🎉</h2>
    
    <div class="info-box" style="border-left-color: #28a745;">
      <strong>Order Number:</strong> ${data.orderNumber}<br>
      <strong>Total:</strong> £${data.orderTotal.toFixed(2)}
    </div>
    
    <h3>Customer Details</h3>
    <table class="table">
      <tr>
        <td><strong>Name</strong></td>
        <td>${data.customerName}</td>
      </tr>
      <tr>
        <td><strong>Email</strong></td>
        <td><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td>
      </tr>
    </table>
    
    <h3>Order Items</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Type</th>
          <th>Details</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${data.orderItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.type === 'event' ? '🎨 Event' : item.type === 'product_physical' ? '📦 Product' : '💾 Digital'}</td>
            <td>
              ${item.type === 'event' && item.attendees ? `
                <strong>${item.attendees} attendee${item.attendees > 1 ? 's' : ''}</strong><br>
                ${item.eventDate ? `📅 ${item.eventDate}` : ''}
                ${item.eventTime ? ` at ${item.eventTime}` : ''}
              ` : `Qty: ${item.quantity}`}
            </td>
            <td>£${item.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-size: 18px;">
          <td colspan="3"><strong>Total</strong></td>
          <td><strong>£${data.orderTotal.toFixed(2)}</strong></td>
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
    
    <h3>Action Required</h3>
    <ul>
      ${data.hasPhysicalProducts ? '<li>📦 <strong>Fulfill physical products</strong> - Pack and ship items</li>' : ''}
      ${data.hasEvents ? '<li>🎨 <strong>Event bookings confirmed</strong> - Attendees have been notified</li>' : ''}
      <li>📧 Customer has been sent confirmation email</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://hubbjhtjyubzczxengyo.supabase.co/project/hubbjhtjyubzczxengyo" class="button">View in Admin Panel</a>
    </div>
    
    <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
      This is an automated notification from your Lola As One e-commerce system.
    </p>
  `)

  const text = plainTextLayout(`
New Order Received!

Order Number: ${data.orderNumber}
Total: £${data.orderTotal.toFixed(2)}

CUSTOMER DETAILS
Name: ${data.customerName}
Email: ${data.customerEmail}

ORDER ITEMS
${data.orderItems.map(item => {
  const typeIcon = item.type === 'event' ? '🎨' : item.type === 'product_physical' ? '📦' : '💾'
  const details = item.type === 'event' && item.attendees
    ? `${item.attendees} attendee${item.attendees > 1 ? 's' : ''}${item.eventDate ? ` - ${item.eventDate}` : ''}${item.eventTime ? ` at ${item.eventTime}` : ''}`
    : `x${item.quantity}`
  return `${typeIcon} ${item.name} ${details} - £${item.price.toFixed(2)}`
}).join('\n')}

Total: £${data.orderTotal.toFixed(2)}

${data.shippingAddress ? `
SHIPPING ADDRESS
${data.shippingAddress.line1}
${data.shippingAddress.line2 || ''}
${data.shippingAddress.city}
${data.shippingAddress.postcode}
${data.shippingAddress.country}
` : ''}

ACTION REQUIRED
${data.hasPhysicalProducts ? '📦 Fulfill physical products - Pack and ship items' : ''}
${data.hasEvents ? '🎨 Event bookings confirmed - Attendees have been notified' : ''}
📧 Customer has been sent confirmation email

View in Admin Panel:
https://hubbjhtjyubzczxengyo.supabase.co/project/hubbjhtjyubzczxengyo

This is an automated notification from your Lola As One e-commerce system.
  `)

  return {
    subject: `New Order: ${data.orderNumber} - £${data.orderTotal.toFixed(2)}`,
    html,
    text,
  }
}

