import { baseLayout, plainTextLayout } from './base-layout.ts'

interface NewWorkshopAnnouncementData {
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  price: number
  description: string
  bookingLink: string
  featuredImage?: string
}

export default function newWorkshopAnnouncement(data: NewWorkshopAnnouncementData) {
  const html = baseLayout(`
    <h2>New workshop: ${data.eventName}</h2>

    ${data.featuredImage ? `<p><img src="${data.featuredImage}" alt="${data.eventName}" style="max-width: 100%; height: auto; border-radius: 4px;"></p>` : ''}

    <p>${data.description}</p>

    <div class="info-box">
      <strong>Date:</strong> ${data.eventDate}<br>
      <strong>Time:</strong> ${data.eventTime}<br>
      <strong>Location:</strong> ${data.location}<br>
      <strong>Price:</strong> £${data.price.toFixed(2)}
    </div>

    <div style="text-align: center;">
      <a href="${data.bookingLink}" class="button">Book Workshop</a>
    </div>
  `)

  const text = plainTextLayout(`
New workshop: ${data.eventName}

${data.description}

Date: ${data.eventDate}
Time: ${data.eventTime}
Location: ${data.location}
Price: £${data.price.toFixed(2)}

Book workshop:
${data.bookingLink}
  `)

  return {
    subject: `New Workshop: ${data.eventName}`,
    html,
    text,
  }
}
