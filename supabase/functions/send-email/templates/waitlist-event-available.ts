import { baseLayout, plainTextLayout } from './base-layout.ts'

interface WaitlistEventData {
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  spacesAvailable: number
  price: number
  expiryTime: string
  bookingLink: string
}

export default function waitlistEventAvailable(data: WaitlistEventData) {
  const html = baseLayout(`
    <h2>Great News - A Spot is Available! 🎉</h2>
    
    <p>Hi ${data.customerName},</p>
    
    <p>Exciting news! A space has become available for <strong>${data.eventName}</strong> that you were waiting for!</p>
    
    <div class="info-box" style="border-left-color: #28a745;">
      <strong>Workshop:</strong> ${data.eventName}<br>
      <strong>Date:</strong> ${data.eventDate}<br>
      <strong>Time:</strong> ${data.eventTime}<br>
      <strong>Location:</strong> ${data.location}<br>
      <strong>Spaces Available:</strong> ${data.spacesAvailable}<br>
      <strong>Price:</strong> £${data.price.toFixed(2)}
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; text-align: center;">
      <strong style="font-size: 18px;">⏰ You have 24 hours to book!</strong><br>
      <span style="color: #856404;">This offer expires on ${data.expiryTime}</span>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.bookingLink}" class="button" style="font-size: 18px; padding: 16px 32px;">Book Your Spot Now</a>
    </div>
    
    <p style="margin-top: 30px;">Don't miss out on this opportunity! If you don't book within 24 hours, we'll offer the spot to the next person on the waitlist.</p>
    
    <p>If you have any questions, please contact us at <a href="mailto:hello@lolaasone.com">hello@lolaasone.com</a></p>
    
    <p>Looking forward to seeing you!</p>
    
    <p>With love,<br>The Lola As One Team</p>
  `)

  const text = plainTextLayout(`
Great News - A Spot is Available!

Hi ${data.customerName},

Exciting news! A space has become available for ${data.eventName} that you were waiting for!

WORKSHOP DETAILS
Workshop: ${data.eventName}
Date: ${data.eventDate}
Time: ${data.eventTime}
Location: ${data.location}
Spaces Available: ${data.spacesAvailable}
Price: £${data.price.toFixed(2)}

⏰ YOU HAVE 24 HOURS TO BOOK!
This offer expires on ${data.expiryTime}

BOOK YOUR SPOT NOW:
${data.bookingLink}

Don't miss out on this opportunity! If you don't book within 24 hours, we'll offer the spot to the next person on the waitlist.

If you have any questions, please contact us at hello@lolaasone.com

Looking forward to seeing you!

With love,
The Lola As One Team
  `)

  return {
    subject: `Spot Available: ${data.eventName}!`,
    html,
    text,
  }
}

