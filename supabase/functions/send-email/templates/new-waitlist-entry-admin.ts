import { baseLayout, plainTextLayout } from './base-layout.ts'

interface NewWaitlistEntryAdminData {
  customerName: string
  customerEmail: string
  itemName: string
  requestedQuantity?: number
  entryDate: string
  waitlistCount?: number
  adminLink?: string
}

export default function newWaitlistEntryAdmin(data: NewWaitlistEntryAdminData) {
  const html = baseLayout(`
    <h2>New waitlist entry</h2>

    <p>A customer has joined a waitlist.</p>

    <table class="table">
      <tr><td><strong>Name</strong></td><td>${data.customerName}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td></tr>
      <tr><td><strong>Item</strong></td><td>${data.itemName}</td></tr>
      ${typeof data.requestedQuantity === 'number' ? `<tr><td><strong>Requested quantity</strong></td><td>${data.requestedQuantity}</td></tr>` : ''}
      <tr><td><strong>Entry date</strong></td><td>${data.entryDate}</td></tr>
      ${typeof data.waitlistCount === 'number' ? `<tr><td><strong>Current waitlist count</strong></td><td>${data.waitlistCount}</td></tr>` : ''}
    </table>

    ${data.adminLink ? `<p><a href="${data.adminLink}" class="button">View Waitlist</a></p>` : ''}
  `)

  const text = plainTextLayout(`
New waitlist entry

Name: ${data.customerName}
Email: ${data.customerEmail}
Item: ${data.itemName}
${typeof data.requestedQuantity === 'number' ? `Requested quantity: ${data.requestedQuantity}` : ''}
Entry date: ${data.entryDate}
${typeof data.waitlistCount === 'number' ? `Current waitlist count: ${data.waitlistCount}` : ''}

${data.adminLink ? `View waitlist:\n${data.adminLink}` : ''}
  `)

  return {
    subject: `New Waitlist Entry - ${data.itemName}`,
    html,
    text,
  }
}
