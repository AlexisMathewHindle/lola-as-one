import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: 'supabase/functions/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const recipient = process.env.TEST_EMAIL
const scope = process.env.EMAIL_TEST_SCOPE || 'core'
const delayMs = Number.parseInt(process.env.EMAIL_TEST_DELAY_MS || '1400', 10)
const siteUrl = process.env.SITE_URL || process.env.APP_URL || 'https://lolacreativespace.com'
const proofRunId = `email-template-proof-${scope}-${new Date().toISOString()}`

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or service role key in .env.local / supabase/functions/.env')
  process.exit(1)
}

if (!recipient) {
  console.error('Set TEST_EMAIL to the inbox that should receive the proof emails.')
  process.exit(1)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const data = {
  customerName: 'Email Proof',
  customerEmail: 'proof@example.com',
  customerPhone: '+44 7700 900123',
  emailAddress: 'proof@example.com',
  subscriberEmail: 'proof@example.com',
  oldEmail: 'old-proof@example.com',
  newEmail: 'proof@example.com',
  changeDateTime: '5 June 2026, 10:00',
  accountCreatedDate: '5 June 2026',
  orderNumber: 'EMAIL-PROOF',
  orderItems: [
    {
      name: 'Proof workshop',
      quantity: 1,
      price: 12,
      type: 'event',
      eventDate: 'Saturday, 20 June 2026',
      eventTime: '10:00 - 12:00',
      location: 'Lola Creative Space',
      bookingReference: 'BKG-EMAIL-PROOF',
      attendees: [
        {
          firstName: 'Email',
          lastName: 'Proof',
          email: 'proof@example.com',
          allergies: 'None',
        },
      ],
    },
    { name: 'Proof art kit', quantity: 2, price: 8, type: 'product_physical' },
  ],
  deliveredItems: [
    { name: 'Proof workshop', quantity: 1 },
    { name: 'Proof art kit', quantity: 2 },
  ],
  deliveryDate: '5 June 2026',
  subtotal: 28,
  shipping: 0,
  vat: 0,
  total: 28,
  paymentMethod: 'Proof only',
  estimatedDelivery: 'Proof only',
  shippingAddress: {
    line1: 'Proof address',
    city: 'London',
    postcode: 'N1 1AA',
    country: 'United Kingdom',
  },
  eventName: 'Proof Workshop',
  eventDate: 'Saturday, 20 June 2026',
  eventTime: '10:00 - 12:00',
  location: 'Lola Creative Space',
  numberOfAttendees: 1,
  bookingReference: 'BKG-EMAIL-PROOF',
  pricePaid: 12,
  whatToBring: 'Nothing. This is an email proof.',
  parkingInfo: 'Proof parking information.',
  cancellationPolicy: 'Proof cancellation policy.',
  attendees: [
    {
      firstName: 'Email',
      lastName: 'Proof',
      email: 'proof@example.com',
      allergies: 'None',
    },
  ],
  orderTotal: 28,
  hasEvents: true,
  hasPhysicalProducts: false,
  eventId: 'proof-event',
  totalCapacity: 12,
  waitlistCount: 3,
  adminLink: `${siteUrl}/admin`,
  subject: 'Email proof contact subject',
  message: 'This is an email proof message.',
  referenceNumber: 'CONTACT-EMAIL-PROOF',
  submissionDate: '5 June 2026, 10:00',
  resetLink: `${siteUrl}/reset-password?token=proof`,
  expiryMinutes: 60,
  subscriptionName: 'Proof Subscription',
  billingInterval: 'month',
  pricePerCycle: 29.99,
  nextBillingDate: '20 July 2026',
  firstBoxShippingDate: '25 June 2026',
  amountCharged: 29.99,
  billingDate: '20 June 2026',
  invoiceNumber: 'INV-EMAIL-PROOF',
  failedAmount: 29.99,
  failureReason: 'Proof failure reason',
  retryDate: '21 June 2026',
  updatePaymentLink: `${siteUrl}/account/payment`,
  endDate: '20 August 2026',
  finalBillingDate: '20 July 2026',
  reactivateLink: `${siteUrl}/account/subscriptions`,
  boxContents: ['Proof brush', 'Proof paper'],
  carrier: 'Royal Mail',
  trackingNumber: 'PROOF123',
  trackingUrl: 'https://www.royalmail.com/track-your-item',
  shippedItems: [
    { name: 'Proof item', quantity: 1 },
  ],
  productName: 'Proof Product',
  productNames: ['Proof Product', 'Proof Kit'],
  productId: 'proof-product',
  currentStock: 2,
  lowStockThreshold: 5,
  productImage: `${siteUrl}/proof-product.jpg`,
  productLink: `${siteUrl}/products/proof-product`,
  price: 12,
  stockQuantity: 5,
  stockNote: 'Proof stock note',
  downloadLinks: [
    {
      name: 'Proof PDF',
      url: `${siteUrl}/downloads/proof.pdf`,
      format: 'PDF',
      size: '1 MB',
    },
  ],
  downloadLink: `${siteUrl}/downloads/proof.pdf`,
  expiryDate: '20 July 2026',
  expiryTime: '20 July 2026, 10:00',
  giftCardCode: 'GIFT-PROOF',
  amount: 25,
  purchaserName: 'Proof Purchaser',
  recipientName: 'Proof Recipient',
  recipientEmail: 'recipient@example.com',
  senderName: 'Proof Sender',
  redemptionLink: `${siteUrl}/gift-cards/redeem`,
  redeemLink: `${siteUrl}/shop`,
  personalMessage: 'This is a proof gift message.',
  spacesAvailable: 1,
  bookingLink: `${siteUrl}/workshops/proof-workshop`,
  itemName: 'Proof Workshop',
  originalNotificationDate: '4 June 2026',
  rejoinLink: `${siteUrl}/waitlist`,
  alternativesLink: `${siteUrl}/workshops`,
  feedbackLink: `${siteUrl}/contact?proof=feedback`,
  photoShareLink: `${siteUrl}/contact?proof=photos`,
  weatherInfo: 'Proof weather information.',
  browseLink: `${siteUrl}/shop`,
  accountLink: `${siteUrl}/account`,
  preferencesLink: `${siteUrl}/newsletter/preferences`,
  unsubscribeLink: `${siteUrl}/newsletter/unsubscribe`,
  resubscribeLink: `${siteUrl}/newsletter`,
  socialLink: 'https://www.instagram.com/lotsoflovelyart/',
  unsubscribeDate: '5 June 2026',
  subscriptionDate: '5 June 2026',
  cartItems: [
    { name: 'Proof cart item', quantity: 1, price: 12 },
  ],
  cartTotal: 12,
  cartLink: `${siteUrl}/cart`,
  discountCode: 'PROOF10',
  title: 'Proof Promotion',
  description: 'This is proof copy for a launch email.',
  ctaLabel: 'View Proof',
  ctaLink: `${siteUrl}/workshops`,
  validUntil: '20 July 2026',
  featuredImage: `${siteUrl}/proof.jpg`,
  featuredItems: [
    { name: 'Proof feature', price: 12 },
  ],
  occasion: 'birthday',
  offerCode: 'PROOF10',
  offerValidUntil: '20 July 2026',
  incentiveText: 'Proof incentive text.',
  reviewLink: `${siteUrl}/reviews/proof`,
  refundAmount: 12,
  refundReason: 'Proof refund reason',
  processingTimeline: 'Proof processing timeline.',
  cancellationDate: '5 June 2026',
  cancellationReason: 'Proof cancellation reason.',
}

const coreTemplates = [
  'order-confirmation',
  'event-booking-confirmation',
  'event-booking-admin',
  'new-order-admin',
]

const allTemplates = [
  'order-confirmation',
  'order-delivered',
  'order-cancelled',
  'refund-processed',
  'event-booking-confirmation',
  'event-booking-admin',
  'event-cancelled',
  'booking-cancelled',
  'subscription-activated',
  'subscription-renewal-success',
  'subscription-payment-failed',
  'subscription-paused',
  'subscription-resumed',
  'subscription-cancelled',
  'subscription-ending-soon',
  'subscription-box-shipped',
  'password-reset',
  'password-changed',
  'email-address-changed',
  'welcome-email',
  'contact-form-customer',
  'contact-form-admin',
  'newsletter-subscription-confirmed',
  'newsletter-unsubscribed',
  'digital-download-ready',
  'download-link-expiring-soon',
  'gift-card-purchased',
  'gift-card-received',
  'order-shipped',
  'event-reminder-7-days',
  'event-reminder-24-hours',
  'event-feedback-request',
  'waitlist-event-available',
  'waitlist-product-available',
  'waitlist-spot-expired',
  'new-order-admin',
  'low-stock-alert-admin',
  'event-capacity-full-admin',
  'subscription-payment-failed-admin',
  'new-waitlist-entry-admin',
  'product-review-request',
  'abandoned-cart-reminder',
  'new-workshop-announcement',
  'new-product-launch',
  'seasonal-promotion',
  'birthday-anniversary-email',
]

const templates = scope === 'all' ? allTemplates : coreTemplates
const supabase = createClient(supabaseUrl, serviceRoleKey)
const results = []

console.log(`Proof run: ${proofRunId}`)
console.log(`Recipient: ${recipient}`)
console.log(`Scope: ${scope}`)
console.log(`Templates: ${templates.length}`)

for (const template of templates) {
  const startedAt = new Date().toISOString()
  const { data: response, error } = await supabase.functions.invoke('send-email', {
    body: {
      template,
      to: recipient,
      data,
      metadata: {
        proofRunId,
        template,
        source: 'scripts/proof-email-templates.mjs',
        startedAt,
      },
    },
  })

  if (error) {
    console.error(`FAILED ${template}: ${error.message || error}`)
    results.push({ template, status: 'failed', error: error.message || String(error) })
  } else {
    console.log(`sent ${template}: ${response?.id || 'ok'}`)
    results.push({ template, status: 'sent', id: response?.id || null })
  }

  await wait(delayMs)
}

const { data: logs, error: logError } = await supabase
  .from('email_logs')
  .select('template, recipient, status, error_message, resend_id, sent_at, metadata')
  .contains('metadata', { proofRunId })
  .order('sent_at', { ascending: false })
  .limit(templates.length + 5)

if (logError) {
  console.error('Could not fetch email_logs proof rows:')
  console.error(logError)
} else {
  const sentCount = (logs || []).filter((row) => row.status === 'sent').length
  const failedCount = (logs || []).filter((row) => row.status === 'failed').length
  console.log(`email_logs summary: sent=${sentCount}, failed=${failedCount}`)
  console.log(JSON.stringify(logs || [], null, 2))
}

const failed = results.filter((result) => result.status !== 'sent')

if (failed.length > 0) {
  console.error('Failed templates:')
  console.error(JSON.stringify(failed, null, 2))
  process.exit(1)
}
