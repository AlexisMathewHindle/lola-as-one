<template>
  <footer
    v-if="!isAdminRoute"
    class="border-t border-dark-200 bg-dark-50 text-dark-700"
  >
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
      <div class="border-b border-dark-200 pb-8">
        <div class="max-w-3xl">
          <p class="text-[10px] font-semibold uppercase tracking-[0.32em] text-dark-500">
            Lola As One
          </p>
          <h2 class="mt-3 text-[1.85rem] font-light leading-tight text-dark-900 sm:text-[2.15rem]">
            {{ siteName }}
          </h2>
          <p class="mt-4 max-w-2xl text-[15px] leading-7 text-dark-600">
            {{ footerIntro }}
          </p>
          <p class="mt-3 text-sm text-dark-500">
            {{ siteTagline }}
          </p>
        </div>
      </div>

      <div class="grid gap-10 pt-8 md:grid-cols-2 xl:grid-cols-[1fr_0.95fr_1.1fr]">
        <section class="space-y-8">
          <div class="grid gap-8 sm:grid-cols-2">
            <div class="space-y-4">
              <h3 class="text-[11px] font-semibold uppercase tracking-[0.28em] text-dark-500">
                Explore
              </h3>
              <nav class="space-y-3">
                <template v-for="item in footerPrimaryItems" :key="item.id">
                  <router-link
                    v-if="item.itemType === 'page'"
                    :to="item.href"
                    class="block text-[15px] text-dark-700 transition-colors hover:text-primary-500"
                  >
                    {{ item.label }}
                  </router-link>
                  <a
                    v-else
                    :href="item.href"
                    :target="item.openInNewTab ? '_blank' : undefined"
                    :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
                    class="block text-[15px] text-dark-700 transition-colors hover:text-primary-500"
                  >
                    {{ item.label }}
                  </a>
                </template>
              </nav>
            </div>

            <div class="space-y-4">
              <h3 class="text-[11px] font-semibold uppercase tracking-[0.28em] text-dark-500">
                Information
              </h3>
              <nav class="space-y-3">
                <template v-for="item in footerSecondaryItems" :key="item.id">
                  <router-link
                    v-if="item.itemType === 'page'"
                    :to="item.href"
                    class="block text-[15px] text-dark-700 transition-colors hover:text-primary-500"
                  >
                    {{ item.label }}
                  </router-link>
                  <a
                    v-else
                    :href="item.href"
                    :target="item.openInNewTab ? '_blank' : undefined"
                    :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
                    class="block text-[15px] text-dark-700 transition-colors hover:text-primary-500"
                  >
                    {{ item.label }}
                  </a>
                </template>
              </nav>
            </div>
          </div>

          <div class="text-[13px] text-dark-500">
            <p>{{ copyrightText }}</p>
          </div>
        </section>

        <section class="border-t border-dark-200 pt-8 md:border-t-0 md:border-l md:border-dark-200 md:pl-10 md:pt-0">
          <h3 class="text-[11px] font-semibold uppercase tracking-[0.28em] text-dark-500">
            Opening Times
          </h3>
          <div class="mt-4 space-y-2.5">
            <div
              v-for="entry in openingTimes"
              :key="entry.day"
              class="flex items-baseline justify-between gap-4 text-[14px]"
            >
              <span class="font-medium text-dark-800">{{ entry.day }}</span>
              <span class="text-right text-dark-600">{{ entry.hours }}</span>
            </div>
          </div>
        </section>

        <section class="border-t border-dark-200 pt-8 md:border-t-0 md:border-l md:border-dark-200 md:pl-10 md:pt-0">
          <div>
            <h3 class="text-[11px] font-semibold uppercase tracking-[0.28em] text-dark-500">
              Come And Find Us
            </h3>
            <div class="mt-4 space-y-1 text-[14px] leading-7 text-dark-700">
              <p class="font-medium text-dark-900">{{ contactVenue }}</p>
              <p v-for="line in addressLines" :key="line">{{ line }}</p>
            </div>
          </div>

          <div class="mt-7 space-y-2">
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-dark-500">
              Contact
            </p>
            <a
              :href="`mailto:${contactEmail}`"
              class="inline-flex items-center text-[15px] text-primary-500 transition-colors hover:text-primary-600"
            >
              <font-awesome-icon icon="envelope" class="mr-2 h-3.5 w-3.5" />
              {{ contactEmail }}
            </a>
          </div>

          <div v-if="socialItems.length" class="mt-7 space-y-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-dark-500">
              Follow
            </p>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="item in socialItems"
                :key="item.label"
                :href="item.href"
                target="_blank"
                rel="noreferrer noopener"
                class="inline-flex items-center rounded-full border border-dark-300 bg-white px-3 py-1.5 text-[12px] font-medium text-dark-700 transition-colors hover:border-primary-500 hover:text-primary-500"
              >
                {{ item.label }}
                <font-awesome-icon icon="external-link-alt" class="ml-2 h-3 w-3" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getMenuByKey, getPublicSettingsMap } from '../lib/cms'

const route = useRoute()

const fallbackFooterPrimaryItems = [
  { id: 'footer-workshops', label: 'Workshops', itemType: 'page', href: '/workshops' },
  { id: 'footer-boxes', label: 'Boxes', itemType: 'page', href: '/boxes' },
  { id: 'footer-blog', label: 'Blog', itemType: 'page', href: '/blog' }
]

const fallbackFooterSecondaryItems = [
  { id: 'footer-about', label: 'About', itemType: 'page', href: '/about' },
  { id: 'footer-contact', label: 'Contact', itemType: 'page', href: '/contact' },
  { id: 'footer-workshop-faqs', label: 'Workshop FAQs', itemType: 'page', href: '/workshop-faqs' },
  { id: 'footer-privacy-policy', label: 'Privacy Policy', itemType: 'page', href: '/privacy-policy' },
  { id: 'footer-terms', label: 'Terms and Conditions', itemType: 'page', href: '/terms-and-conditions' }
]

const fallbackSocialLinks = {
  instagram: 'https://www.instagram.com/lotsoflovelyart/',
  facebook: 'https://www.facebook.com/lotsoflovelyart'
}

const fallbackAddressLines = [
  '50B Northbrook Street',
  'Newbury RG14 1DT'
]

const fallbackOpeningTimes = [
  { day: 'Mon', hours: 'Closed' },
  { day: 'Tues', hours: '9am - 5pm' },
  { day: 'Wed', hours: '9am - 6pm' },
  { day: 'Thurs', hours: '9am - 6pm' },
  { day: 'Fri', hours: '9am - 5pm' },
  { day: 'Sat', hours: '9.30am - 3pm' },
  { day: 'Sun', hours: '9.30am - 1pm' }
]

const normalizeOpeningTimes = (entries) => {
  if (!Array.isArray(entries)) return []

  return entries
    .map(entry => ({
      day: String(entry?.day || '').trim(),
      hours: String(entry?.hours || '').trim()
    }))
    .filter(entry => entry.day && entry.hours)
}

const siteName = ref('LoLA')
const siteTagline = ref('Where creativity meets community.')
const footerPrimaryItems = ref([...fallbackFooterPrimaryItems])
const footerSecondaryItems = ref([...fallbackFooterSecondaryItems])
const footerIntro = ref('Creative classes, workshops, art boxes and warm community moments from the Lola creative space in Newbury.')
const contactVenue = ref('LoLA Lots of Lovely Art Creative Space')
const contactEmail = ref('hello@lotsoflovelyart.com')
const addressLines = ref([...fallbackAddressLines])
const openingTimes = ref([...fallbackOpeningTimes])
const socialLinks = ref({ ...fallbackSocialLinks })
const copyrightText = ref(`Copyright ${new Date().getFullYear()} All rights reserved`)

const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const socialItems = computed(() => {
  const links = socialLinks.value || {}

  return [
    links.instagram ? { label: 'Instagram', href: links.instagram } : null,
    links.facebook ? { label: 'Facebook', href: links.facebook } : null,
    links.youtube ? { label: 'YouTube', href: links.youtube } : null
  ].filter(Boolean)
})

const loadFooterMenus = async () => {
  try {
    const [primaryMenu, secondaryMenu] = await Promise.all([
      getMenuByKey('footer_primary'),
      getMenuByKey('footer_secondary')
    ])

    if (primaryMenu?.items?.length) {
      footerPrimaryItems.value = primaryMenu.items
    }

    if (secondaryMenu?.items?.length) {
      footerSecondaryItems.value = secondaryMenu.items
    }
  } catch (error) {
    console.error('Error loading footer menus:', error)
  }
}

const loadFooterSettings = async () => {
  try {
    const settings = await getPublicSettingsMap()

    if (settings.site_name?.value) {
      siteName.value = settings.site_name.value
    }

    if (settings.site_tagline?.value) {
      siteTagline.value = settings.site_tagline.value
    }

    if (settings.footer_intro?.value) {
      footerIntro.value = settings.footer_intro.value
    }

    if (settings.contact_venue?.value) {
      contactVenue.value = settings.contact_venue.value
    }

    if (Array.isArray(settings.contact_address_lines?.value) && settings.contact_address_lines.value.length) {
      addressLines.value = settings.contact_address_lines.value
    }

    if (settings.contact_email?.value) {
      contactEmail.value = settings.contact_email.value
    }

    if (settings.copyright_text?.value) {
      copyrightText.value = settings.copyright_text.value
    }

    const savedOpeningTimes = normalizeOpeningTimes(settings.opening_times?.value)
    if (savedOpeningTimes.length) {
      openingTimes.value = savedOpeningTimes
    }

    if (settings.social_links) {
      socialLinks.value = {
        ...fallbackSocialLinks,
        ...settings.social_links
      }
    }
  } catch (error) {
    console.error('Error loading footer settings:', error)
  }
}

onMounted(() => {
  loadFooterMenus()
  loadFooterSettings()
})
</script>
