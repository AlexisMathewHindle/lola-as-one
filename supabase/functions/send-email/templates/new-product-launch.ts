import { baseLayout, plainTextLayout } from './base-layout.ts'

interface NewProductLaunchData {
  productName: string
  price: number
  description: string
  productLink: string
  featuredImage?: string
  stockNote?: string
}

export default function newProductLaunch(data: NewProductLaunchData) {
  const html = baseLayout(`
    <h2>New in: ${data.productName}</h2>

    ${data.featuredImage ? `<p><img src="${data.featuredImage}" alt="${data.productName}" style="max-width: 100%; height: auto; border-radius: 4px;"></p>` : ''}

    <p>${data.description}</p>

    <div class="info-box">
      <strong>Price:</strong> £${data.price.toFixed(2)}
      ${data.stockNote ? `<br><strong>Stock:</strong> ${data.stockNote}` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${data.productLink}" class="button">Shop Now</a>
    </div>
  `)

  const text = plainTextLayout(`
New in: ${data.productName}

${data.description}

Price: £${data.price.toFixed(2)}
${data.stockNote ? `Stock: ${data.stockNote}` : ''}

Shop now:
${data.productLink}
  `)

  return {
    subject: `New at Lots of Lovely Art: ${data.productName}`,
    html,
    text,
  }
}
