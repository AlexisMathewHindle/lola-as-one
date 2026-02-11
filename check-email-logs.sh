#!/bin/bash

# Check email logs in the database

echo "📊 Checking email logs..."
echo ""

psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 
  id,
  template,
  recipient,
  status,
  sent_at,
  resend_id
FROM email_logs 
ORDER BY sent_at DESC 
LIMIT 10;
"

