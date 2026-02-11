import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionRenewalData {
  customerName: string
  subscriptionName: string
  amountCharged: number
  billingDate: string
  nextBillingDate: string
  invoiceNumber: string
  paymentMethod: string
}

export default function subscriptionRenewalSuccess(data: SubscriptionRenewalData) {
  const html = baseLayout(`
    <h2>Payment Successful 💳</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Your subscription to <strong>${data.subscriptionName}</strong> has been renewed successfully!</p>
    
    <h3>Payment Details</h3>
    <table class="table">
      <tr>
        <td><strong>Amount Charged</strong></td>
        <td>£${data.amountCharged.toFixed(2)}</td>
      </tr>
      <tr>
        <td><strong>Billing Date</strong></td>
        <td>${data.billingDate}</td>
      </tr>
      <tr>
        <td><strong>Next Billing Date</strong></td>
        <td>${data.nextBillingDate}</td>
      </tr>
      <tr>
        <td><strong>Invoice Number</strong></td>
        <td>${data.invoiceNumber}</td>
      </tr>
      <tr>
        <td><strong>Payment Method</strong></td>
        <td>${data.paymentMethod}</td>
      </tr>
    </table>
    
    <p>Your next box will be shipped soon. We'll send you a tracking email once it's on its way!</p>
    
    <a href="https://lolaasone.com/account/subscriptions" class="button">Manage Subscription</a>
    
    <p>Thank you for being a valued subscriber!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Payment Successful

Hi ${data.customerName},

Your subscription to ${data.subscriptionName} has been renewed successfully!

PAYMENT DETAILS
Amount Charged: £${data.amountCharged.toFixed(2)}
Billing Date: ${data.billingDate}
Next Billing Date: ${data.nextBillingDate}
Invoice Number: ${data.invoiceNumber}
Payment Method: ${data.paymentMethod}

Your next box will be shipped soon. We'll send you a tracking email once it's on its way!

Manage your subscription: https://lolaasone.com/account/subscriptions

Thank you for being a valued subscriber!

With love,
The Lola As One Team
  `)

  return {
    subject: `Payment Successful - ${data.subscriptionName}`,
    html,
    text,
  }
}

