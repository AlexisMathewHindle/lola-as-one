<template>
  <section class="bg-white py-16 sm:py-20">
    <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
      <p
        v-if="config.eyebrow"
        class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-600"
      >
        {{ config.eyebrow }}
      </p>
      <h2
        v-if="config.title"
        class="text-3xl font-display font-bold text-gray-900 sm:text-4xl"
      >
        {{ config.title }}
      </h2>

      <div
        v-if="config.body_html"
        class="prose prose-stone mx-auto mt-6 max-w-3xl text-left sm:text-center"
        v-html="config.body_html"
      ></div>

      <div v-if="config.cta" class="mt-8">
        <router-link
          v-if="!isExternalCmsLink(config.cta)"
          :to="resolveCmsLink(config.cta)"
          class="inline-flex items-center rounded-full border border-primary-300 px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
        >
          {{ config.cta.label }}
          <font-awesome-icon icon="arrow-right" class="ml-2" />
        </router-link>
        <a
          v-else
          :href="resolveCmsLink(config.cta)"
          :target="config.cta.open_in_new_tab ? '_blank' : undefined"
          :rel="config.cta.open_in_new_tab ? 'noreferrer noopener' : undefined"
          class="inline-flex items-center rounded-full border border-primary-300 px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
        >
          {{ config.cta.label }}
          <font-awesome-icon icon="arrow-right" class="ml-2" />
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { isExternalCmsLink, resolveCmsLink } from '../../utils/cmsLink'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const config = computed(() => props.section.config_json || {})
</script>
