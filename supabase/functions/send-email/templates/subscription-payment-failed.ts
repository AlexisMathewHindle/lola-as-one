import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionPaymentFailedData {
  customerName: string
  subscriptionName: string
  failedAmount: number
  failureReason?: string
  retryDate?: string
  updatePaymentLink: string
}

export default function subscriptionPaymentFailed(data: SubscriptionPaymentFailedData) {
  const html = baseLayout(`
    <h2>Payment Failed - Action Required ⚠️</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>We tried to process your payment for <strong>${data.subscriptionName}</strong>, but unfortunately it didn't go through.</p>
    
    <div class="info-box" style="border-left-color: #dc3545;">
      <strong>Amount:</strong> £${data.failedAmount.toFixed(2)}<br>
      ${data.failureReason ? `<strong>Reason:</strong> ${data.failureReason}<br>` : ''}
      ${data.retryDate ? `<strong>Next Retry:</strong> ${data.retryDate}` : ''}
    </div>
    
    <h3>What You Need to Do</h3>
    <p>Please update your payment method to keep your subscription active:</p>
    
    <a href="${data.updatePaymentLink}" class="button">Update Payment Method</a>
    
    <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
      <strong>⚠️ Important</strong><br>
      If we can't process your payment, your subscription may be paused or cancelled. We'll retry the payment automatically, but updating your payment method now will ensure uninterrupted service.
    </div>
    
    <h3>Common Reasons for Payment Failure</h3>
    <ul>
      <li>Insufficient funds</li>
      <li>Expired card</li>
      <li>Card declined by bank</li>
      <li>Incorrect billing address</li>
    </ul>
    
    <p>If you need help or have questions, please contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Payment Failed - Action Required

Hi ${data.customerName},

We tried to process your payment for ${data.subscriptionName}, but unfortunately it didn't go through.

Amount: £${data.failedAmount.toFixed(2)}
${data.failureReason ? `Reason: ${data.failureReason}` : ''}
${data.retryDate ? `Next Retry: ${data.retryDate}` : ''}

WHAT YOU NEED TO DO
Please update your payment method to keep your subscription active:
${data.updatePaymentLink}

⚠️ IMPORTANT
If we can't process your payment, your subscription may be paused or cancelled. We'll retry the payment automatically, but updating your payment method now will ensure uninterrupted service.

COMMON REASONS FOR PAYMENT FAILURE
- Insufficient funds
- Expired card
- Card declined by bank
- Incorrect billing address

If you need help or have questions, please contact us at hello@lolaasone.com

With love,
The Lola As One Team
  `)

  return {
    subject: `Payment Failed - ${data.subscriptionName}`,
    html,
    text,
  }
}

