import { baseLayout, plainTextLayout } from './base-layout.ts'

interface LowStockAlertAdminData {
  productName: string
  currentStock: number
  lowStockThreshold: number
  productId?: string
  adminLink?: string
}

export default function lowStockAlertAdmin(data: LowStockAlertAdminData) {
  const html = baseLayout(`
    <h2>Low stock alert</h2>

    <p>A product has reached its low stock threshold.</p>

    <div class="info-box warning-box">
      <strong>Product:</strong> ${data.productName}<br>
      <strong>Current stock:</strong> ${data.currentStock}<br>
      <strong>Low stock threshold:</strong> ${data.lowStockThreshold}
      ${data.productId ? `<br><strong>Product ID:</strong> ${data.productId}` : ''}
    </div>

    ${data.adminLink ? `<p><a href="${data.adminLink}" class="button">Manage Inventory</a></p>` : ''}
  `)

  const text = plainTextLayout(`
Low stock alert

A product has reached its low stock threshold.

Product: ${data.productName}
Current stock: ${data.currentStock}
Low stock threshold: ${data.lowStockThreshold}
${data.productId ? `Product ID: ${data.productId}` : ''}

${data.adminLink ? `Manage inventory:\n${data.adminLink}` : ''}
  `)

  return {
    subject: `Low Stock: ${data.productName}`,
    html,
    text,
  }
}
