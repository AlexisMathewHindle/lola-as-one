import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkEmailLogs() {
  console.log('📊 Checking Email Logs...\n')

  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error fetching logs:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('📭 No email logs found')
    return
  }

  console.log(`📧 Found ${data.length} recent emails:\n`)
  
  data.forEach((log, index) => {
    console.log(`${index + 1}. ${log.template}`)
    console.log(`   To: ${log.recipient}`)
    console.log(`   Status: ${log.status}`)
    console.log(`   Resend ID: ${log.resend_id}`)
    console.log(`   Sent: ${new Date(log.sent_at).toLocaleString()}`)
    console.log('')
  })
}

checkEmailLogs()

