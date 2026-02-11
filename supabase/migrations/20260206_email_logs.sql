-- Email Logs Table
-- Track all emails sent through the system

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template TEXT NOT NULL,
  recipient TEXT NOT NULL,
  resend_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_template ON email_logs(template);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_resend_id ON email_logs(resend_id);

-- Comments
COMMENT ON TABLE email_logs IS 'Tracks all emails sent through the Resend email service';
COMMENT ON COLUMN email_logs.template IS 'Email template identifier (e.g., order-confirmation, event-booking-confirmation)';
COMMENT ON COLUMN email_logs.recipient IS 'Email address of the recipient';
COMMENT ON COLUMN email_logs.resend_id IS 'Resend API email ID for tracking';
COMMENT ON COLUMN email_logs.status IS 'Current status of the email';
COMMENT ON COLUMN email_logs.metadata IS 'Additional data about the email (subject, data passed to template, etc.)';

