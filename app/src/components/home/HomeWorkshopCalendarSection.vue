<template>
  <section :id="section.section_key" class="bg-[#fbf7ef] py-16 sm:py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <p
            v-if="config.eyebrow"
            class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-600"
          >
            {{ config.eyebrow }}
          </p>
          <h2 class="text-3xl font-display font-bold text-stone-900 sm:text-4xl">
            {{ config.title || 'Creative Workshops' }}
          </h2>
          <p
            v-if="config.intro"
            class="mt-4 text-base leading-7 text-stone-600"
          >
            {{ config.intro }}
          </p>
        </div>

        <div v-if="primaryCta">
          <router-link
            v-if="!isExternalCmsLink(primaryCta)"
            :to="resolveCmsLink(primaryCta)"
            class="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            {{ primaryCta.label }}
          </router-link>
          <a
            v-else
            :href="resolveCmsLink(primaryCta)"
            :target="primaryCta.open_in_new_tab ? '_blank' : undefined"
            :rel="primaryCta.open_in_new_tab ? 'noreferrer noopener' : undefined"
            class="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            {{ primaryCta.label }}
          </a>
        </div>
      </div>

      <WorkshopCalendar
        class="mt-10"
        :show-view-toggle="true"
      />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import WorkshopCalendar from '../workshops/WorkshopCalendar.vue'
import { isExternalCmsLink, resolveCmsLink } from '../../utils/cmsLink'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const config = computed(() => props.section.config_json || {})
const primaryCta = computed(() => config.value.primary_cta || null)
</script>
