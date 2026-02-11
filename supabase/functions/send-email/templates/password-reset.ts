import { baseLayout, plainTextLayout } from './base-layout.ts'

interface PasswordResetData {
  resetLink: string
  expiryMinutes: number
}

export default function passwordReset(data: PasswordResetData) {
  const html = baseLayout(`
    <h2>Reset Your Password 🔐</h2>
    
    <p>We received a request to reset your password for your Lola As One account.</p>
    
    <p>Click the button below to create a new password:</p>
    
    <a href="${data.resetLink}" class="button">Reset Password</a>
    
    <div class="info-box" style="margin-top: 30px;">
      <strong>⏰ This link will expire in ${data.expiryMinutes} minutes</strong>
    </div>
    
    <p style="margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #3498db;">${data.resetLink}</p>
    
    <div style="margin-top: 40px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
      <strong>⚠️ Didn't request this?</strong><br>
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </div>
    
    <p style="margin-top: 30px;">If you have any concerns, please contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Reset Your Password

We received a request to reset your password for your Lola As One account.

Click this link to create a new password:
${data.resetLink}

⏰ This link will expire in ${data.expiryMinutes} minutes

⚠️ DIDN'T REQUEST THIS?
If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

If you have any concerns, please contact us at hello@lolaasone.com

With love,
The Lola As One Team
  `)

  return {
    subject: 'Reset Your Password - Lola As One',
    html,
    text,
  }
}

