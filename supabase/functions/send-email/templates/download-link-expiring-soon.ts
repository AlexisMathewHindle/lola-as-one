import { baseLayout, plainTextLayout } from './base-layout.ts'

interface DownloadLinkExpiringSoonData {
  customerName: string
  productName: string
  downloadLink: string
  expiryTime: string
  orderNumber: string
}

export default function downloadLinkExpiringSoon(data: DownloadLinkExpiringSoonData) {
  const html = baseLayout(`
    <h2>Your download link expires soon</h2>

    <p>Hi ${data.customerName},</p>

    <p>Your download link for <strong>${data.productName}</strong> expires on ${data.expiryTime}.</p>

    <div class="info-box warning-box">
      <strong>Order number:</strong> ${data.orderNumber}<br>
      <strong>Product:</strong> ${data.productName}<br>
      <strong>Expires:</strong> ${data.expiryTime}
    </div>

    <div style="text-align: center;">
      <a href="${data.downloadLink}" class="button">Download Now</a>
    </div>

    <p>If you need a fresh link after expiry, email us with your order number.</p>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Your download link expires soon

Hi ${data.customerName},

Your download link for ${data.productName} expires on ${data.expiryTime}.

Order number: ${data.orderNumber}
Download:
${data.downloadLink}

If you need a fresh link after expiry, email us with your order number.

With love,
The LoLA Team
  `)

  return {
    subject: `Download Link Expiring - ${data.productName}`,
    html,
    text,
  }
}
