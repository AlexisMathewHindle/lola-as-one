import { baseLayout, plainTextLayout } from './base-layout.ts'

interface ContactFormAdminData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  subject: string
  message: string
  referenceNumber: string
  submissionDate: string
}

export default function contactFormAdmin(data: ContactFormAdminData) {
  const html = baseLayout(`
    <h2>New Contact Form Submission 📬</h2>
    
    <div class="info-box">
      <strong>Reference:</strong> ${data.referenceNumber}<br>
      <strong>Submitted:</strong> ${data.submissionDate}
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
      ${data.customerPhone ? `
        <tr>
          <td><strong>Phone</strong></td>
          <td>${data.customerPhone}</td>
        </tr>
      ` : ''}
      <tr>
        <td><strong>Subject</strong></td>
        <td>${data.subject}</td>
      </tr>
    </table>
    
    <h3>Message</h3>
    <div class="info-box">
      ${data.message.replace(/\n/g, '<br>')}
    </div>
    
    <a href="mailto:${data.customerEmail}?subject=Re: ${encodeURIComponent(data.subject)}" class="button">Reply to Customer</a>
  `)

  const text = plainTextLayout(`
New Contact Form Submission

Reference: ${data.referenceNumber}
Submitted: ${data.submissionDate}

CUSTOMER DETAILS
Name: ${data.customerName}
Email: ${data.customerEmail}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}
Subject: ${data.subject}

MESSAGE
${data.message}

Reply to: ${data.customerEmail}
  `)

  return {
    subject: `New Contact: ${data.subject} - ${data.referenceNumber}`,
    html,
    text,
  }
}

