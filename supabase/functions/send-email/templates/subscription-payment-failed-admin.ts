import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionPaymentFailedAdminData {
  customerName: string
  customerEmail: string
  subscriptionName: string
  failedAmount: number
  failureReason?: string
  retryDate?: string
  adminLink?: string
}

export default function subscriptionPaymentFailedAdmin(data: SubscriptionPaymentFailedAdminData) {
  const amount = `£${data.failedAmount.toFixed(2)}`

  const html = baseLayout(`
    <h2>Subscription payment failed</h2>

    <p>A subscription payment needs attention.</p>

    <div class="info-box danger-box">
      <strong>Customer:</strong> ${data.customerName}<br>
      <strong>Email:</strong> <a href="mailto:${data.customerEmail}">${data.customerEmail}</a><br>
      <strong>Subscription:</strong> ${data.subscriptionName}<br>
      <strong>Failed amount:</strong> ${amount}
      ${data.failureReason ? `<br><strong>Reason:</strong> ${data.failureReason}` : ''}
      ${data.retryDate ? `<br><strong>Retry date:</strong> ${data.retryDate}` : ''}
    </div>

    ${data.adminLink ? `<p><a href="${data.adminLink}" class="button">View Customer</a></p>` : ''}
  `)

  const text = plainTextLayout(`
Subscription payment failed

Customer: ${data.customerName}
Email: ${data.customerEmail}
Subscription: ${data.subscriptionName}
Failed amount: ${amount}
${data.failureReason ? `Reason: ${data.failureReason}` : ''}
${data.retryDate ? `Retry date: ${data.retryDate}` : ''}

${data.adminLink ? `View customer:\n${data.adminLink}` : ''}
  `)

  return {
    subject: `Subscription Payment Failed - ${data.customerEmail}`,
    html,
    text,
  }
}
