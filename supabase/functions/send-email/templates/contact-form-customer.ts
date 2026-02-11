import { baseLayout, plainTextLayout } from './base-layout.ts'

interface ContactFormCustomerData {
  customerName: string
  customerEmail: string
  subject: string
  message: string
  referenceNumber: string
  submissionDate: string
}

export default function contactFormCustomer(data: ContactFormCustomerData) {
  const html = baseLayout(`
    <h2>We've Received Your Message 📧</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Thank you for contacting us! We've received your message and will get back to you within 24-48 hours.</p>
    
    <div class="info-box">
      <strong>Reference Number:</strong> ${data.referenceNumber}<br>
      <strong>Submitted:</strong> ${data.submissionDate}
    </div>
    
    <h3>Your Message</h3>
    <div class="info-box">
      <strong>Subject:</strong> ${data.subject}<br><br>
      ${data.message.replace(/\n/g, '<br>')}
    </div>
    
    <p>If you need immediate assistance, you can also reach us at:</p>
    <ul>
      <li>Email: <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></li>
      <li>Instagram: <a href="https://instagram.com/lolaasone">@lolaasone</a></li>
    </ul>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
We've Received Your Message

Hi ${data.customerName},

Thank you for contacting us! We've received your message and will get back to you within 24-48 hours.

Reference Number: ${data.referenceNumber}
Submitted: ${data.submissionDate}

YOUR MESSAGE
Subject: ${data.subject}

${data.message}

If you need immediate assistance, you can also reach us at:
- Email: hello@lolaasone.com
- Instagram: @lolaasone

With love,
The Lola As One Team
  `)

  return {
    subject: `Message Received - ${data.referenceNumber}`,
    html,
    text,
  }
}

