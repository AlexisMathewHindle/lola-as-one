import { baseLayout, plainTextLayout } from './base-layout.ts'

interface FeedbackAnswer {
  label: string
  value: string
}

interface FeedbackFormAdminData {
  respondentName: string
  respondentEmail: string
  answers: FeedbackAnswer[]
  referenceNumber: string
  submissionDate: string
}

export default function feedbackFormAdmin(data: FeedbackFormAdminData) {
  const answersHtml = (data.answers || [])
    .map((answer) => `
      <tr>
        <td><strong>${answer.label}</strong></td>
        <td>${String(answer.value).replace(/\n/g, '<br>')}</td>
      </tr>
    `)
    .join('')

  const answersText = (data.answers || [])
    .map((answer) => `${answer.label}\n${answer.value}\n`)
    .join('\n')

  const canReply = data.respondentEmail && data.respondentEmail !== 'Not provided'

  const html = baseLayout(`
    <h2>New feedback from the website</h2>

    <div class="info-box">
      <strong>Reference:</strong> ${data.referenceNumber}<br>
      <strong>Submitted:</strong> ${data.submissionDate}
    </div>

    <h3>From</h3>
    <table class="table">
      <tr>
        <td><strong>Name</strong></td>
        <td>${data.respondentName}</td>
      </tr>
      <tr>
        <td><strong>Email</strong></td>
        <td>${canReply ? `<a href="mailto:${data.respondentEmail}">${data.respondentEmail}</a>` : data.respondentEmail}</td>
      </tr>
    </table>

    <h3>Answers</h3>
    <table class="table">
      ${answersHtml}
    </table>

    ${canReply ? `<a href="mailto:${data.respondentEmail}?subject=Re: your feedback (${data.referenceNumber})" class="button">Reply</a>` : ''}
  `)

  const text = plainTextLayout(`
New Feedback From The Website

Reference: ${data.referenceNumber}
Submitted: ${data.submissionDate}

FROM
Name: ${data.respondentName}
Email: ${data.respondentEmail}

ANSWERS
${answersText}
  `)

  return {
    subject: `New feedback - ${data.referenceNumber}`,
    html,
    text,
  }
}
