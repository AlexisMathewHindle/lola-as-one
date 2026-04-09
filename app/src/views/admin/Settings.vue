<template>
  <div class="max-w-5xl space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Site Settings</h1>
        <p class="text-sm text-gray-600">
          Manage the branding and footer/contact details now used by the public site.
        </p>
      </div>

      <button
        @click="handleSubmit"
        :disabled="loading || saving"
        class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <font-awesome-icon
          :icon="saving ? 'spinner' : 'save'"
          class="mr-2 h-4 w-4"
          :class="{ 'animate-spin': saving }"
        />
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
    >
      {{ error }}
    </div>

    <div v-if="loading" class="rounded-xl border border-gray-200 bg-white p-10 text-center">
      <div class="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
      <p class="mt-4 text-sm text-gray-600">Loading site settings...</p>
    </div>

    <template v-else>
      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Branding</h2>
          <p class="mt-1 text-sm text-gray-600">
            These values are used in the header and footer.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Site Name</label>
            <input
              v-model="form.siteName"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Lola As One"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Site Tagline</label>
            <input
              v-model="form.siteTagline"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Where creativity meets community."
            >
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Footer Copy</h2>
          <p class="mt-1 text-sm text-gray-600">
            Control the editorial content shown in the footer.
          </p>
        </div>

        <div class="space-y-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Footer Intro</label>
            <textarea
              v-model="form.footerIntro"
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Short introduction shown in the footer brand column"
            ></textarea>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Copyright Text</label>
            <input
              v-model="form.copyrightText"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Copyright 2026 All rights reserved"
            >
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Contact Details</h2>
          <p class="mt-1 text-sm text-gray-600">
            These values appear in the footer contact column.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Venue Name</label>
            <input
              v-model="form.contactVenue"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="LoLA Lots of Lovely Art Creative Space"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Contact Email</label>
            <input
              v-model="form.contactEmail"
              type="email"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="hello@lotsoflovelyart.com"
            >
          </div>
        </div>

        <div class="mt-6">
          <label class="mb-2 block text-sm font-medium text-gray-700">Address Lines</label>
          <textarea
            v-model="form.contactAddressLines"
            rows="4"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="One address line per row"
          ></textarea>
          <p class="mt-2 text-xs text-gray-500">
            Enter one line per row. Empty lines are ignored.
          </p>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900">Social Links</h2>
          <p class="mt-1 text-sm text-gray-600">
            These links appear as footer follow buttons.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Instagram</label>
            <input
              v-model="form.instagram"
              type="url"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://www.instagram.com/..."
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Facebook</label>
            <input
              v-model="form.facebook"
              type="url"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://www.facebook.com/..."
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">YouTube</label>
            <input
              v-model="form.youtube"
              type="url"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://www.youtube.com/..."
            >
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { getAllSiteSettings, upsertSiteSettings } from '../../lib/cms'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)

const form = reactive({
  siteName: 'Lola As One',
  siteTagline: 'Where creativity meets community.',
  footerIntro: 'Creative classes, workshops, art boxes and warm community moments from the Lola creative space in Newbury.',
  contactVenue: 'LoLA Lots of Lovely Art Creative Space',
  contactAddressLines: '50B Northbrook Street\nNewbury RG14 1DT',
  contactEmail: 'hello@lotsoflovelyart.com',
  instagram: 'https://www.instagram.com/lotsoflovelyart/',
  facebook: 'https://www.facebook.com/lotsoflovelyart',
  youtube: '',
  copyrightText: `Copyright ${new Date().getFullYear()} All rights reserved`
})

const settingDefinitions = [
  {
    key: 'site_name',
    group: 'branding',
    label: 'Site Name',
    sortOrder: 10,
    description: 'Primary site name used in shared branding contexts',
    value: () => ({ value: form.siteName.trim() })
  },
  {
    key: 'site_tagline',
    group: 'branding',
    label: 'Site Tagline',
    sortOrder: 20,
    description: 'Short brand strapline for marketing and footer contexts',
    value: () => ({ value: form.siteTagline.trim() })
  },
  {
    key: 'footer_intro',
    group: 'footer',
    label: 'Footer Intro',
    sortOrder: 10,
    description: 'Introductory footer copy shown in the brand column',
    value: () => ({ value: form.footerIntro.trim() })
  },
  {
    key: 'contact_venue',
    group: 'footer',
    label: 'Contact Venue',
    sortOrder: 20,
    description: 'Venue or studio name shown in the footer contact block',
    value: () => ({ value: form.contactVenue.trim() })
  },
  {
    key: 'contact_address_lines',
    group: 'footer',
    label: 'Contact Address Lines',
    sortOrder: 30,
    description: 'Address lines rendered in the footer contact block',
    value: () => ({
      value: form.contactAddressLines
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
    })
  },
  {
    key: 'contact_email',
    group: 'footer',
    label: 'Contact Email',
    sortOrder: 40,
    description: 'Public contact email shown in the footer',
    value: () => ({ value: form.contactEmail.trim() })
  },
  {
    key: 'copyright_text',
    group: 'footer',
    label: 'Copyright Text',
    sortOrder: 50,
    description: 'Copyright line shown in the footer',
    value: () => ({ value: form.copyrightText.trim() })
  },
  {
    key: 'social_links',
    group: 'footer',
    label: 'Social Links',
    sortOrder: 60,
    description: 'Public social media links used in footer and future social blocks',
    value: () => ({
      instagram: form.instagram.trim() || null,
      facebook: form.facebook.trim() || null,
      youtube: form.youtube.trim() || null
    })
  }
]

const applySettingsToForm = (settings) => {
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.value_json
    return acc
  }, {})

  if (settingsMap.site_name?.value) form.siteName = settingsMap.site_name.value
  if (settingsMap.site_tagline?.value) form.siteTagline = settingsMap.site_tagline.value
  if (settingsMap.footer_intro?.value) form.footerIntro = settingsMap.footer_intro.value
  if (settingsMap.contact_venue?.value) form.contactVenue = settingsMap.contact_venue.value
  if (settingsMap.contact_email?.value) form.contactEmail = settingsMap.contact_email.value
  if (settingsMap.copyright_text?.value) form.copyrightText = settingsMap.copyright_text.value

  if (Array.isArray(settingsMap.contact_address_lines?.value)) {
    form.contactAddressLines = settingsMap.contact_address_lines.value.join('\n')
  }

  if (settingsMap.social_links) {
    form.instagram = settingsMap.social_links.instagram || ''
    form.facebook = settingsMap.social_links.facebook || ''
    form.youtube = settingsMap.social_links.youtube || ''
  }
}

const loadSettings = async () => {
  try {
    loading.value = true
    error.value = null

    const settings = await getAllSiteSettings()
    applySettingsToForm(settings)
  } catch (err) {
    error.value = err.message || 'Failed to load settings'
    console.error('Error loading settings:', err)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    saving.value = true
    error.value = null

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to update settings')

    const payload = settingDefinitions.map(definition => ({
      setting_key: definition.key,
      setting_group: definition.group,
      label: definition.label,
      value_json: definition.value(),
      is_public: true,
      sort_order: definition.sortOrder,
      description: definition.description,
      updated_by: user.id
    }))

    await upsertSiteSettings(payload)

    toastStore.success('Site settings updated')
    await loadSettings()
  } catch (err) {
    error.value = err.message || 'Failed to save settings'
    toastStore.error(error.value)
    console.error('Error saving settings:', err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>
