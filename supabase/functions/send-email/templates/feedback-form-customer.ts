import { baseLayout, plainTextLayout } from './base-layout.ts'

interface FeedbackFormCustomerData {
  respondentName: string
  referenceNumber: string
  submissionDate: string
}

export default function feedbackFormCustomer(data: FeedbackFormCustomerData) {
  const html = baseLayout(`
    <h2>Thank you for your feedback</h2>

    <p>Hi ${data.respondentName},</p>

    <p>Thank you for taking the time to share your feedback with us. We read every response, and it helps us make the LoLA studio, workshops, and art boxes better.</p>

    <div class="info-box">
      <strong>Reference Number:</strong> ${data.referenceNumber}<br>
      <strong>Submitted:</strong> ${data.submissionDate}
    </div>

    <p>If you would like to add anything, you can always reach us at
    <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>

    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Thank You For Your Feedback

Hi ${data.respondentName},

Thank you for taking the time to share your feedback with us. We read every response, and it helps us make the LoLA studio, workshops, and art boxes better.

Reference Number: ${data.referenceNumber}
Submitted: ${data.submissionDate}

If you would like to add anything, you can always reach us at hello@lotsoflovelyart.com.

With love,
The LoLA Team
  `)

  return {
    subject: `Thank you for your feedback - ${data.referenceNumber}`,
    html,
    text,
  }
}
