import { baseLayout, plainTextLayout } from './base-layout.ts'

interface EventReminder24HoursData {
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  weatherInfo?: string
}

export default function eventReminder24Hours(data: EventReminder24HoursData) {
  const html = baseLayout(`
    <h2>Tomorrow's the Day! 🎉</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>This is your final reminder - your workshop is tomorrow!</p>
    
    <div class="info-box" style="border-left-color: #28a745;">
      <strong>Workshop:</strong> ${data.eventName}<br>
      <strong>Date:</strong> ${data.eventDate}<br>
      <strong>Time:</strong> ${data.eventTime}<br>
      <strong>Location:</strong> ${data.location}
    </div>
    
    ${data.weatherInfo ? `
      <div style="margin: 20px 0; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #3498db;">
        <strong>🌤️ Weather Update</strong><br>
        ${data.weatherInfo}
      </div>
    ` : ''}
    
    <h3>Last-Minute Checklist</h3>
    <ul>
      <li>✓ Check the location and plan your route</li>
      <li>✓ Bring any required materials</li>
      <li>✓ Arrive 10 minutes early</li>
      <li>✓ Bring your enthusiasm and creativity!</li>
    </ul>
    
    <p>If you have any last-minute questions or need to contact us urgently, please email <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>We can't wait to see you tomorrow!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Tomorrow's the Day!

Hi ${data.customerName},

This is your final reminder - your workshop is tomorrow!

Workshop: ${data.eventName}
Date: ${data.eventDate}
Time: ${data.eventTime}
Location: ${data.location}

${data.weatherInfo ? `
🌤️ WEATHER UPDATE
${data.weatherInfo}
` : ''}

LAST-MINUTE CHECKLIST
✓ Check the location and plan your route
✓ Bring any required materials
✓ Arrive 10 minutes early
✓ Bring your enthusiasm and creativity!

If you have any last-minute questions or need to contact us urgently, please email hello@lolaasone.com

We can't wait to see you tomorrow!

With love,
The Lola As One Team
  `)

  return {
    subject: `Tomorrow: ${data.eventName}!`,
    html,
    text,
  }
}

