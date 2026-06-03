// Base email layout for all templates
function getSupportEmail(): string {
  const denoEnv = (globalThis as any).Deno?.env
  return denoEnv?.get('SUPPORT_EMAIL') || denoEnv?.get('EMAIL_REPLY_TO') || 'hello@lotsoflovelyart.com'
}

export function baseLayout(content: string): string {
  const supportEmail = getSupportEmail()
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lola As One</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #fcfaf5;
      color: #403a35;
      font-weight: 300;
    }
    .email-container {
      max-width: 600px;
      margin: 24px auto;
      background-color: #ffffff;
      border: 1px solid #e4ddd4;
    }
    .header {
      background-color: #ffffff;
      border-top: 6px solid #b26758;
      border-bottom: 1px solid #e4ddd4;
      padding: 30px 24px 26px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #332f2c;
      font-size: 28px;
      font-weight: 300;
      line-height: 1.08;
    }
    .header p {
      margin: 10px 0 0;
      color: #7a6d61;
      font-size: 14px;
      line-height: 1.5;
    }
    .content {
      padding: 38px 32px;
    }
    .footer {
      background-color: #f9f8f6;
      padding: 30px 32px;
      text-align: center;
      font-size: 14px;
      color: #5d544c;
      border-top: 1px solid #e4ddd4;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #b26758;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #9e584a;
    }
    h2 {
      color: #332f2c;
      font-size: 26px;
      line-height: 1.12;
      font-weight: 300;
      margin-top: 0;
    }
    h3 {
      color: #332f2c;
      font-size: 18px;
      line-height: 1.25;
      font-weight: 400;
      margin: 28px 0 12px;
    }
    p {
      line-height: 1.65;
      margin: 16px 0;
    }
    a {
      color: #9e584a;
    }
    .info-box {
      background-color: #f9f8f6;
      border: 1px solid #e4ddd4;
      border-left: 4px solid #b26758;
      padding: 20px;
      margin: 20px 0;
    }
    .success-box {
      background-color: #f4f7f4;
      border-left-color: #6f8c75;
    }
    .warning-box {
      background-color: #fcf7ea;
      border-left-color: #c79334;
    }
    .danger-box {
      background-color: #fcf2f1;
      border-left-color: #c4564a;
    }
    .muted {
      color: #7a6d61;
      font-size: 14px;
    }
    .file-card {
      margin: 20px 0;
      padding: 20px;
      background-color: #f9f8f6;
      border: 1px solid #e4ddd4;
      border-radius: 4px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .table th,
    .table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e4ddd4;
    }
    .table th {
      background-color: #f9f8f6;
      font-weight: 600;
      color: #403a35;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #9e584a;
      text-decoration: none;
    }
    @media (max-width: 640px) {
      .email-container {
        margin: 0;
        border-left: 0;
        border-right: 0;
      }
      .content,
      .footer {
        padding-left: 22px;
        padding-right: 22px;
      }
      .table th,
      .table td {
        padding: 10px 8px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Lola As One</h1>
      <p>Art workshops, creative projects, and handmade moments.</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Lola As One</strong></p>
      <p>Creative workshops and art-led goods in the UK</p>
      <div class="social-links">
        <a href="https://instagram.com/lolaasone">Instagram</a> |
        <a href="https://facebook.com/lolaasone">Facebook</a> |
        <a href="mailto:${supportEmail}">Contact Us</a>
      </div>
      <p style="font-size: 12px; color: #7a6d61; margin-top: 20px;">
        You're receiving this email because you made a purchase or signed up for updates from Lola As One.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Plain text version generator
export function plainTextLayout(content: string): string {
  const supportEmail = getSupportEmail()
  return `
LOLA AS ONE
===========

${content}

---
Lola As One
Creative workshops and art-led goods in the UK
Instagram: https://instagram.com/lolaasone
Facebook: https://facebook.com/lolaasone
Email: ${supportEmail}
  `.trim()
}
