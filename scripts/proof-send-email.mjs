import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: 'supabase/functions/.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const recipient = process.env.TEST_EMAIL
const proofRunId = `email-proof-${new Date().toISOString()}`

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or service role key in .env.local / supabase/functions/.env')
  process.exit(1)
}

if (!recipient) {
  console.error('Set TEST_EMAIL to a non-owner recipient before running this proof.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const payload = {
  template: 'order-confirmation',
  to: recipient,
  data: {
    orderNumber: 'EMAIL-PROOF',
    customerName: 'Email Proof',
    orderItems: [
      {
        name: 'Email proof workshop',
        quantity: 1,
        price: 1,
      },
    ],
    subtotal: 1,
    shipping: 0,
    vat: 0,
    total: 1,
    paymentMethod: 'Proof only',
  },
  metadata: {
    proofRunId,
    source: 'scripts/proof-send-email.mjs',
  },
}

console.log(`Sending proof email to ${recipient}`)
console.log(`Proof run: ${proofRunId}`)

const { data, error } = await supabase.functions.invoke('send-email', {
  body: payload,
})

if (error) {
  console.error('send-email returned an error:')
  console.error(error)
} else {
  console.log('send-email response:')
  console.log(data)
}

const { data: logs, error: logError } = await supabase
  .from('email_logs')
  .select('template, recipient, status, error_message, resend_id, sent_at, metadata')
  .contains('metadata', { proofRunId })
  .order('sent_at', { ascending: false })
  .limit(5)

if (logError) {
  console.error('Could not fetch email log proof:')
  console.error(logError)
  process.exit(error ? 1 : 0)
}

console.log('Matching email_logs rows:')
console.log(JSON.stringify(logs || [], null, 2))

const sent = (logs || []).some((row) => row.status === 'sent')
process.exit(!error && sent ? 0 : 1)
