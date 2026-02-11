// Base email layout for all templates
export function baseLayout(content: string): string {
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #2c3e50;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #3498db;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #2980b9;
    }
    h2 {
      color: #2c3e50;
      font-size: 24px;
      margin-top: 0;
    }
    p {
      line-height: 1.6;
      margin: 16px 0;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #3498db;
      padding: 20px;
      margin: 20px 0;
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
      border-bottom: 1px solid #e9ecef;
    }
    .table th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #3498db;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Lola As One</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>Lola As One</strong></p>
      <p>Handcrafted with love in the UK</p>
      <div class="social-links">
        <a href="https://instagram.com/lolaasone">Instagram</a> |
        <a href="https://facebook.com/lolaasone">Facebook</a> |
        <a href="mailto:hello@lolaasone.com">Contact Us</a>
      </div>
      <p style="font-size: 12px; color: #adb5bd; margin-top: 20px;">
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
  return `
LOLA AS ONE
===========

${content}

---
Lola As One
Handcrafted with love in the UK
Instagram: https://instagram.com/lolaasone
Facebook: https://facebook.com/lolaasone
Email: hello@lolaasone.com
  `.trim()
}

