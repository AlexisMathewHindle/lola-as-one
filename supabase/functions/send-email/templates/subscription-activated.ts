import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SubscriptionActivatedData {
  customerName: string
  subscriptionName: string
  billingInterval: 'month' | 'year'
  pricePerCycle: number
  nextBillingDate: string
  firstBoxShippingDate?: string
}

export default function subscriptionActivated(data: SubscriptionActivatedData) {
  const intervalText = data.billingInterval === 'month' ? 'monthly' : 'yearly'
  
  const html = baseLayout(`
    <h2>Welcome to your subscription</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Your subscription to <strong>${data.subscriptionName}</strong> is now active! We're thrilled to have you as part of our community.</p>
    
    <h3>Subscription Details</h3>
    <table class="table">
      <tr>
        <td><strong>Subscription</strong></td>
        <td>${data.subscriptionName}</td>
      </tr>
      <tr>
        <td><strong>Billing</strong></td>
        <td>£${data.pricePerCycle.toFixed(2)} ${intervalText}</td>
      </tr>
      <tr>
        <td><strong>Next Billing Date</strong></td>
        <td>${data.nextBillingDate}</td>
      </tr>
      ${data.firstBoxShippingDate ? `
        <tr>
          <td><strong>First Box Ships</strong></td>
          <td>${data.firstBoxShippingDate}</td>
        </tr>
      ` : ''}
    </table>
    
    <h3>What to Expect</h3>
    <p>You'll receive your ${intervalText} box filled with handcrafted goodies. Each box is carefully curated with love and attention to detail.</p>
    
    <p>You can manage your subscription anytime from your account dashboard:</p>
    <ul>
      <li>Pause or resume your subscription</li>
      <li>Update payment method</li>
      <li>Change shipping address</li>
      <li>View upcoming boxes</li>
    </ul>
    
    <a href="https://www.lotsoflovelyart.com/account/subscriptions" class="button">Manage Subscription</a>
    
    <p>If you have any questions, we're here to help at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a></p>
    
    <p>Thank you for subscribing!</p>
    
    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Welcome to your subscription!

Hi ${data.customerName},

Your subscription to ${data.subscriptionName} is now active! We're thrilled to have you as part of our community.

SUBSCRIPTION DETAILS
Subscription: ${data.subscriptionName}
Billing: £${data.pricePerCycle.toFixed(2)} ${intervalText}
Next Billing Date: ${data.nextBillingDate}
${data.firstBoxShippingDate ? `First Box Ships: ${data.firstBoxShippingDate}` : ''}

WHAT TO EXPECT
You'll receive your ${intervalText} box filled with handcrafted goodies. Each box is carefully curated with love and attention to detail.

You can manage your subscription anytime from your account dashboard:
- Pause or resume your subscription
- Update payment method
- Change shipping address
- View upcoming boxes

Manage your subscription: https://www.lotsoflovelyart.com/account/subscriptions

If you have any questions, we're here to help at hello@lotsoflovelyart.com

Thank you for subscribing!

With love,
The LoLA Team
  `)

  return {
    subject: `Subscription Activated: ${data.subscriptionName}`,
    html,
    text,
  }
}
