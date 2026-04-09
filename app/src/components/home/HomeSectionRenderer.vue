<template>
  <component
    :is="component"
    v-if="component"
    :section="section"
  />
</template>

<script setup>
import { computed } from 'vue'
import HomeFeaturedOfferingsSection from './HomeFeaturedOfferingsSection.vue'
import HomeFeatureSplitSection from './HomeFeatureSplitSection.vue'
import HomeHeroSliderSection from './HomeHeroSliderSection.vue'
import HomeImageGallerySection from './HomeImageGallerySection.vue'
import HomeNewsletterSection from './HomeNewsletterSection.vue'
import HomeRichTextSection from './HomeRichTextSection.vue'
import HomeTestimonialSection from './HomeTestimonialSection.vue'
import HomeWorkshopCalendarSection from './HomeWorkshopCalendarSection.vue'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const componentMap = {
  hero_banner: HomeHeroSliderSection,
  featured_offerings: HomeFeaturedOfferingsSection,
  feature_split: HomeFeatureSplitSection,
  rich_text: HomeRichTextSection,
  testimonial_strip: HomeTestimonialSection,
  newsletter_cta: HomeNewsletterSection,
  schedule_grid: HomeWorkshopCalendarSection,
  image_gallery: HomeImageGallerySection
}

const component = computed(() => componentMap[props.section.section_type] || null)
</script>
