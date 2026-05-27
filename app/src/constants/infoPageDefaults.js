export const INFO_PAGE_DEFAULTS = {
  about: {
    title: 'About Lola As One',
    summary: 'Learn more about Lola As One and the creative community behind it.',
    sectionTitle: 'About Lola As One',
    bodyHtml: `
      <h2>Our Story</h2>
      <p>Lola As One is the coming together of two beloved creative ventures: <strong>Lola Creative Space</strong> and <strong>Lots of Lovely Art</strong>. What started as a passion for bringing creativity to our community has grown into a vibrant hub where people of all ages and skill levels can explore their artistic side.</p>
      <p><strong>Lola Creative Space</strong> began with a simple idea: create a welcoming environment where people could gather, learn, and create together. Our hands-on workshops became a place where friendships formed, skills developed, and creativity flourished.</p>
      <p><strong>Lots of Lovely Art</strong> emerged from the desire to bring that creative experience into people's homes through carefully curated art boxes filled with high-quality supplies and thoughtful projects.</p>
      <p>Today, as <strong>Lola As One</strong>, we're united in our mission to make creativity accessible, enjoyable, and meaningful.</p>
      <h2>Our Mission & Values</h2>
      <p>We believe creativity is for everyone. Our mission is to inspire, support, and celebrate creative expression in all its forms.</p>
      <h3>Inclusivity</h3>
      <p>Everyone is welcome here, regardless of age, skill level, or background. Creativity knows no boundaries.</p>
      <h3>Community</h3>
      <p>We're more than a business - we're a community of makers, learners, and friends who support each other.</p>
      <h3>Inspiration</h3>
      <p>We strive to spark curiosity, encourage experimentation, and celebrate the joy of creating something new.</p>
      <h3>Quality</h3>
      <p>From our workshops to our art boxes, we're committed to providing high-quality experiences and materials.</p>
      <h2>What We Do</h2>
      <h3>Creative Workshops</h3>
      <p>Join us for hands-on creative experiences designed for all ages and skill levels, with expert instruction, quality materials, and a supportive environment.</p>
      <h3>Art Boxes</h3>
      <p>Bring creativity home with curated art boxes, high-quality supplies, and step-by-step projects.</p>
      <h3>Digital Resources</h3>
      <p>Access creative inspiration anytime with printable templates, online tutorials, and resources designed to fuel your creativity.</p>
      <p><a href="/workshops">Explore workshops</a> or <a href="/boxes">shop art boxes</a>.</p>
    `.trim()
  },
  contact: {
    title: 'Contact Lola As One',
    summary: "Have questions about workshops, art boxes, bookings, or creative projects? We'd love to hear from you.",
    sectionTitle: 'Contact Information',
    bodyHtml: `
      <p>We're here to help. Send us a message using the form, email the studio directly, or use the details below to find us.</p>
      <p>For booking changes, please include the workshop name, date, and the booking email address so the team can help quickly.</p>
    `.trim()
  },
  'workshop-faqs': {
    title: 'Workshop FAQs',
    summary: 'Useful details about attending, changing, and preparing for LoLA art workshops.',
    sectionTitle: 'Workshop FAQs',
    bodyHtml: `
      <h2>How long does a workshop last?</h2>
      <p>The LoLA art workshops generally last 1 hour unless specified otherwise. Please arrive before the workshop to allow your child to settle into the space.</p>
      <h2>What to bring?</h2>
      <p>We provide all art materials and lots of creative fun, but do dress for mess. There will be aprons for those who would like them. Please note that you will be taking the artwork home with you after the session.</p>
      <h2>Where can I wait for my child?</h2>
      <p>Parents are kindly requested to leave the workshop area during the class to minimise distraction. Please relax and enjoy a drink and a snack in the LoLA cafe.</p>
      <h2>What if I need to change my booking, cancel, or my child is unwell?</h2>
      <p>Our workshop requires a 48-hour cancellation notice to ensure a full refund or rescheduling. Cancellations made less than 48 hours before the scheduled workshop will not be eligible for a refund. This policy allows us to manage resources effectively and offer spots to other participants. Please note that if your child does not attend due to illness, these rules still apply.</p>
      <p>Changes to bookings can be made by emailing the team at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
      <h2>Photography</h2>
      <p>We like to take photographs of the LoLA studio and all the wonderful artwork the children create, however we will avoid taking photos of faces. These photos can be used on social media or our website. If you would prefer your child not to be photographed at all, please let us know by emailing us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
      <h2>Allergies and medication</h2>
      <p>Because the LoLA space is both a cafe and workshop space, please make us aware of any allergies or ask staff for more details on what we use in our food. Please note that allergies are not catered for.</p>
      <p>If your child takes any medication that we need to be aware of, please immediately alert a member of staff or email us at <a href="mailto:hello@lotsoflovelyart.com">hello@lotsoflovelyart.com</a>.</p>
      <p>We assume that by booking this session you have parental responsibility for the children booked. Please inform us if another guardian will be attending the session or if guardianship will change before the session starts. Please read our <a href="/privacy-policy">data protection information</a>.</p>
      <h2>Still have a question?</h2>
      <p>Please do not hesitate to email us if you have any questions.</p>
      <p>With kind wishes,<br>The LoLA team</p>
    `.trim()
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    summary: '',
    sectionTitle: 'Privacy Policy',
    bodyHtml: '<p>The privacy policy is being updated. Please contact the studio for privacy questions.</p>'
  },
  'terms-and-conditions': {
    title: 'Terms and Conditions',
    summary: '',
    sectionTitle: 'Terms and Conditions',
    bodyHtml: '<p>The terms and conditions are being updated. Please contact the studio for booking questions.</p>'
  }
}

export const INFO_PAGE_MEDIA = {
  about: {
    heroImage: {
      src: '/img/images/about_page_01.png',
      alt: 'Lola founders outside the creative space',
      position: 'center'
    },
    featureImage: {
      src: '/img/images/about_02.png',
      alt: 'Illustration of the Lola shopfront',
      position: 'center'
    },
    closingImage: {
      src: '/img/images/about_page_02.png',
      alt: 'Painted paper houses and art materials on a workshop table',
      position: 'center'
    }
  }
}

export const infoPageDefaultsFor = (pageKey) => {
  if (pageKey === 'faqs') return INFO_PAGE_DEFAULTS['workshop-faqs']
  return INFO_PAGE_DEFAULTS[pageKey] || null
}

export const infoPageMediaFor = (pageKey) => INFO_PAGE_MEDIA[pageKey] || null
