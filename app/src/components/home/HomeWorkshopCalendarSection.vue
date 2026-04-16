<template>
  <section :id="section.section_key" class="section-surface-cream section-frame py-16 sm:py-20">
    <div class="section-shell">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="section-header-left max-w-3xl">
          <p
            v-if="config.eyebrow"
            class="section-kicker"
          >
            {{ config.eyebrow }}
          </p>
          <h2 class="section-title">
            {{ config.title || 'Creative Workshops' }}
          </h2>
          <p
            v-if="config.intro"
            class="section-intro"
          >
            {{ config.intro }}
          </p>
        </div>

        <div v-if="primaryCta">
          <router-link
            v-if="!isExternalCmsLink(primaryCta)"
            :to="resolveCmsLink(primaryCta)"
            class="inline-flex items-center justify-center rounded-full bg-dark-800 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-dark-700"
          >
            {{ primaryCta.label }}
          </router-link>
          <a
            v-else
            :href="resolveCmsLink(primaryCta)"
            :target="primaryCta.open_in_new_tab ? '_blank' : undefined"
            :rel="primaryCta.open_in_new_tab ? 'noreferrer noopener' : undefined"
            class="inline-flex items-center justify-center rounded-full bg-dark-800 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-dark-700"
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
