<template>
  <footer
    v-if="!isAdminRoute"
    class="border-t border-stone-200 bg-[#f5efe4] text-stone-700"
  >
    <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
      <div class="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
        <div class="space-y-5">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.35em] text-stone-500">
              Lola As One
            </p>
            <h2 class="mt-4 font-display text-3xl text-stone-900 sm:text-4xl">
              {{ siteName }}
            </h2>
          </div>

          <p class="max-w-md text-sm leading-7 text-stone-600 sm:text-[15px]">
            {{ footerIntro }}
          </p>

          <p class="max-w-sm text-sm italic text-stone-500">
            {{ siteTagline }}
          </p>
        </div>

        <div class="space-y-4">
          <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Explore
          </h3>
          <nav class="space-y-3">
            <template v-for="item in footerPrimaryItems" :key="item.id">
              <router-link
                v-if="item.itemType === 'page'"
                :to="item.href"
                class="block text-sm text-stone-700 transition-colors hover:text-primary-700"
              >
                {{ item.label }}
              </router-link>
              <a
                v-else
                :href="item.href"
                :target="item.openInNewTab ? '_blank' : undefined"
                :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
                class="block text-sm text-stone-700 transition-colors hover:text-primary-700"
              >
                {{ item.label }}
              </a>
            </template>
          </nav>
        </div>

        <div class="space-y-4">
          <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Information
          </h3>
          <nav class="space-y-3">
            <template v-for="item in footerSecondaryItems" :key="item.id">
              <router-link
                v-if="item.itemType === 'page'"
                :to="item.href"
                class="block text-sm text-stone-700 transition-colors hover:text-primary-700"
              >
                {{ item.label }}
              </router-link>
              <a
                v-else
                :href="item.href"
                :target="item.openInNewTab ? '_blank' : undefined"
                :rel="item.openInNewTab ? 'noreferrer noopener' : undefined"
                class="block text-sm text-stone-700 transition-colors hover:text-primary-700"
              >
                {{ item.label }}
              </a>
            </template>
          </nav>

          <div class="pt-3 text-sm text-stone-500">
            <p>{{ copyrightText }}</p>
          </div>
        </div>

        <div class="space-y-5">
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Visit
            </h3>
            <div class="mt-4 space-y-1 text-sm leading-7 text-stone-700">
              <p class="font-medium text-stone-900">{{ contactVenue }}</p>
              <p v-for="line in addressLines" :key="line">{{ line }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Contact
            </p>
            <a
              :href="`mailto:${contactEmail}`"
              class="inline-flex items-center text-sm text-primary-700 transition-colors hover:text-primary-800"
            >
              <font-awesome-icon icon="envelope" class="mr-2 h-3.5 w-3.5" />
              {{ contactEmail }}
            </a>
          </div>

          <div v-if="socialItems.length" class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Follow
            </p>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="item in socialItems"
                :key="item.label"
                :href="item.href"
                target="_blank"
                rel="noreferrer noopener"
                class="inline-flex items-center rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-primary-400 hover:text-primary-700"
              >
                {{ item.label }}
                <font-awesome-icon icon="external-link-alt" class="ml-2 h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
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
  { id: 'footer-contact', label: 'Contact', itemType: 'page', href: '/contact' }
]

const fallbackSocialLinks = {
  instagram: 'https://www.instagram.com/lotsoflovelyart/',
  facebook: 'https://www.facebook.com/lotsoflovelyart'
}

const fallbackAddressLines = [
  '50B Northbrook Street',
  'Newbury RG14 1DT'
]

const siteName = ref('Lola As One')
const siteTagline = ref('Where creativity meets community.')
const footerPrimaryItems = ref([...fallbackFooterPrimaryItems])
const footerSecondaryItems = ref([...fallbackFooterSecondaryItems])
const footerIntro = ref('Creative classes, workshops, art boxes and warm community moments from the Lola creative space in Newbury.')
const contactVenue = ref('LoLA Lots of Lovely Art Creative Space')
const contactEmail = ref('hello@lotsoflovelyart.com')
const addressLines = ref([...fallbackAddressLines])
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
