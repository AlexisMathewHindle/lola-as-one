import { baseLayout, plainTextLayout } from './base-layout.ts'

interface DigitalDownloadData {
  customerName: string
  productName: string
  downloadLinks: Array<{
    name: string
    url: string
    format: string
    size: string
  }>
  expiryDate: string
  orderNumber: string
}

export default function digitalDownloadReady(data: DigitalDownloadData) {
  const html = baseLayout(`
    <h2>Your Download is Ready! 📥</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Thank you for your purchase! Your digital download for <strong>${data.productName}</strong> is ready.</p>
    
    <div class="info-box">
      <strong>Order Number:</strong> ${data.orderNumber}
    </div>
    
    <h3>Download Your Files</h3>
    ${data.downloadLinks.map(link => `
      <div style="margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
        <strong>${link.name}</strong><br>
        <span style="color: #6c757d; font-size: 14px;">${link.format} • ${link.size}</span><br>
        <a href="${link.url}" class="button" style="margin-top: 10px;">Download ${link.name}</a>
      </div>
    `).join('')}
    
    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
      <strong>⏰ Important</strong><br>
      These download links will expire on <strong>${data.expiryDate}</strong>. Please download your files before then.
    </div>
    
    <h3>Download Instructions</h3>
    <ol>
      <li>Click the download button for each file</li>
      <li>Save the files to your computer</li>
      <li>If you have trouble downloading, try a different browser</li>
    </ol>
    
    <p>If you need a new download link after expiry, please contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a> with your order number.</p>
    
    <p>Enjoy your purchase!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Your Download is Ready!

Hi ${data.customerName},

Thank you for your purchase! Your digital download for ${data.productName} is ready.

Order Number: ${data.orderNumber}

DOWNLOAD YOUR FILES
${data.downloadLinks.map(link => `
${link.name} (${link.format} • ${link.size})
${link.url}
`).join('\n')}

⏰ IMPORTANT
These download links will expire on ${data.expiryDate}. Please download your files before then.

DOWNLOAD INSTRUCTIONS
1. Click the download link for each file
2. Save the files to your computer
3. If you have trouble downloading, try a different browser

If you need a new download link after expiry, please contact us at hello@lolaasone.com with your order number.

Enjoy your purchase!

With love,
The Lola As One Team
  `)

  return {
    subject: `Your Download is Ready - ${data.productName}`,
    html,
    text,
  }
}

