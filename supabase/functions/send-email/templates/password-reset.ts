import { baseLayout, plainTextLayout } from './base-layout.ts'

interface PasswordResetData {
  resetLink: string
  expiryMinutes: number
}

export default function passwordReset(data: PasswordResetData) {
  const html = baseLayout(`
    <h2>Reset your password</h2>
    
    <p>We received a request to reset your password for your Lots of Lovely Art account.</p>
    
    <p>Click the button below to create a new password:</p>
    
    <a href="${data.resetLink}" class="button">Reset Password</a>
    
    <div class="info-box" style="margin-top: 30px;">
      <strong>This link will expire in ${data.expiryMinutes} minutes</strong>
    </div>
    
    <p style="margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;"><a href="${data.resetLink}">${data.resetLink}</a></p>
    
    <div class="info-box warning-box" style="margin-top: 40px;">
      <strong>Didn't request this?</strong><br>
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </div>
    
    <p style="margin-top: 30px;">If you have any concerns, please contact us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a></p>
    
    <p>With love,<br>The LoLA Team</p>
  `)

  const text = plainTextLayout(`
Reset Your Password

We received a request to reset your password for your Lots of Lovely Art account.

Click this link to create a new password:
${data.resetLink}

This link will expire in ${data.expiryMinutes} minutes

DIDN'T REQUEST THIS?
If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

If you have any concerns, please contact us at hello@lotsoflovelyart.com

With love,
The LoLA Team
  `)

  return {
    subject: 'Reset Your Password - Lots of Lovely Art',
    html,
    text,
  }
}
