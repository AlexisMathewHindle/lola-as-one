import { baseLayout, plainTextLayout } from './base-layout.ts'

interface SeasonalPromotionData {
  title: string
  message: string
  discountCode?: string
  validUntil?: string
  ctaLabel?: string
  ctaLink: string
  featuredItems?: Array<{ name: string; price?: number }>
}

export default function seasonalPromotion(data: SeasonalPromotionData) {
  const ctaLabel = data.ctaLabel || 'Shop Now'

  const html = baseLayout(`
    <h2>${data.title}</h2>

    <p>${data.message}</p>

    ${data.discountCode || data.validUntil ? `
      <div class="info-box warning-box">
        ${data.discountCode ? `<strong>Code:</strong> ${data.discountCode}<br>` : ''}
        ${data.validUntil ? `<strong>Valid until:</strong> ${data.validUntil}` : ''}
      </div>
    ` : ''}

    ${data.featuredItems && data.featuredItems.length > 0 ? `
      <h3>Featured</h3>
      <table class="table">
        ${data.featuredItems.map((item) => `
          <tr>
            <td>${item.name}</td>
            <td>${typeof item.price === 'number' ? `£${item.price.toFixed(2)}` : ''}</td>
          </tr>
        `).join('')}
      </table>
    ` : ''}

    <div style="text-align: center;">
      <a href="${data.ctaLink}" class="button">${ctaLabel}</a>
    </div>
  `)

  const text = plainTextLayout(`
${data.title}

${data.message}

${data.discountCode ? `Code: ${data.discountCode}` : ''}
${data.validUntil ? `Valid until: ${data.validUntil}` : ''}

${data.featuredItems && data.featuredItems.length > 0 ? `FEATURED\n${data.featuredItems.map((item) => `${item.name}${typeof item.price === 'number' ? ` - £${item.price.toFixed(2)}` : ''}`).join('\n')}` : ''}

${ctaLabel}:
${data.ctaLink}
  `)

  return {
    subject: data.title,
    html,
    text,
  }
}
