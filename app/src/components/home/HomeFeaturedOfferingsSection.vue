<template>
  <section :class="sectionClasses">
    <div class="section-shell">
      <div class="section-header mb-12">
        <p
          v-if="config.eyebrow"
          class="section-kicker"
        >
          {{ config.eyebrow }}
        </p>
        <h2 class="section-title mb-4">
          {{ config.title }}
        </h2>
        <p
          v-if="config.intro"
          class="section-intro mx-auto max-w-2xl"
        >
          {{ config.intro }}
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="items.length" class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="item in items"
          :key="item.id"
          class="group section-card overflow-hidden rounded-[1.1rem] transition-colors hover:border-primary-300"
        >
          <router-link :to="item.href" class="block">
            <div class="relative h-56 overflow-hidden bg-stone-100">
              <img
                v-if="item.featured_image_url"
                :src="item.featured_image_url"
                :alt="item.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              >
              <div
                v-else
                class="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100"
              >
                <font-awesome-icon
                  :icon="config.offering_type === 'event' ? 'palette' : 'box'"
                  class="text-5xl text-primary-400"
                />
              </div>

              <div
                v-if="item.badge"
                class="absolute right-4 top-4 rounded-full bg-dark-800/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
              >
                {{ item.badge }}
              </div>
            </div>

            <div class="p-6">
              <h3 class="text-[1.2rem] font-medium text-gray-900">{{ item.title }}</h3>
              <p class="mt-3 text-sm leading-6 text-gray-600 line-clamp-3">
                {{ item.description_short || item.fallbackDescription }}
              </p>

              <div class="mt-6 flex items-center justify-between gap-4">
                <div>
                  <p class="text-lg font-medium text-primary-700">{{ item.priceLabel }}</p>
                  <p class="mt-1 text-sm text-gray-500">{{ item.metaLabel }}</p>
                </div>
                <font-awesome-icon icon="arrow-right" class="text-primary-500 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </router-link>
        </article>
      </div>

      <div v-else class="rounded-[1.1rem] border border-dashed border-dark-300 bg-dark-50 px-6 py-12 text-center">
        <p class="text-sm text-gray-500">{{ emptyMessage }}</p>
      </div>

      <div v-if="config.cta" class="mt-12 text-center">
        <router-link
          v-if="!isExternalCmsLink(config.cta)"
          :to="resolveCmsLink(config.cta)"
          class="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-700"
        >
          {{ config.cta.label }}
          <font-awesome-icon icon="arrow-right" class="ml-2" />
        </router-link>
        <a
          v-else
          :href="resolveCmsLink(config.cta)"
          :target="config.cta.open_in_new_tab ? '_blank' : undefined"
          :rel="config.cta.open_in_new_tab ? 'noreferrer noopener' : undefined"
          class="inline-flex items-center rounded-full bg-primary-600 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-700"
        >
          {{ config.cta.label }}
          <font-awesome-icon icon="arrow-right" class="ml-2" />
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { isExternalCmsLink, resolveCmsLink } from '../../utils/cmsLink'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const loading = ref(false)
const items = ref([])
const config = computed(() => props.section.config_json || {})

const sectionClasses = computed(() => config.value.background_style === 'muted'
  ? 'section-surface-muted section-frame py-16 sm:py-20'
  : 'section-surface py-16 sm:py-20'
)

const emptyMessage = computed(() => {
  if (config.value.offering_type === 'event') {
    return 'No featured workshops are available right now.'
  }

  return 'No featured products are available right now.'
})

const formatDate = (dateString) => {
  if (!dateString) return 'Dates coming soon'

  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

const fetchEventOfferings = async () => {
  const limit = Number(config.value.limit) || 3

  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('id, title, slug, description_short, featured_image_url')
    .eq('type', 'event')
    .eq('status', 'published')
    .eq('featured', config.value.featured_only !== false)
    .limit(limit)

  if (offeringsError) throw offeringsError
  if (!offerings?.length) return []

  const offeringIds = offerings.map(item => item.id)
  const { data: events, error: eventsError } = await supabase
    .from('offering_events')
    .select('offering_id, event_date, price_gbp')
    .in('offering_id', offeringIds)

  if (eventsError) throw eventsError

  return offerings.map(offering => {
    const event = events?.find(entry => entry.offering_id === offering.id)

    return {
      ...offering,
      href: `/workshops/${offering.slug}`,
      priceLabel: event?.price_gbp ? `£${event.price_gbp}` : 'See details',
      metaLabel: formatDate(event?.event_date),
      fallbackDescription: 'Join us for a creative experience.',
      badge: config.value.badge_label || null
    }
  })
}

const fetchProductOfferings = async () => {
  const limit = Number(config.value.limit) || 3

  const { data: offerings, error: offeringsError } = await supabase
    .from('offerings')
    .select('id, title, slug, description_short, featured_image_url')
    .eq('type', 'product_physical')
    .eq('status', 'published')
    .eq('featured', config.value.featured_only !== false)
    .limit(limit)

  if (offeringsError) throw offeringsError
  if (!offerings?.length) return []

  const offeringIds = offerings.map(item => item.id)
  const { data: products, error: productsError } = await supabase
    .from('offering_products')
    .select('offering_id, price_gbp, available_for_subscription, stock_quantity')
    .in('offering_id', offeringIds)

  if (productsError) throw productsError

  return offerings.map(offering => {
    const product = products?.find(entry => entry.offering_id === offering.id)
    const stockQuantity = product?.stock_quantity || 0
    const stockStatus = stockQuantity > 0
      ? (stockQuantity <= 5 ? 'Low stock' : 'In stock')
      : 'Out of stock'

    return {
      ...offering,
      href: `/boxes/${offering.slug}`,
      priceLabel: product?.price_gbp ? `£${product.price_gbp}${product.available_for_subscription ? '/month' : ''}` : 'See details',
      metaLabel: stockStatus,
      fallbackDescription: 'Curated art supplies for creative fun.',
      badge: product?.available_for_subscription ? 'Subscription' : null
    }
  })
}

const loadItems = async () => {
  try {
    loading.value = true

    items.value = config.value.offering_type === 'event'
      ? await fetchEventOfferings()
      : await fetchProductOfferings()
  } catch (error) {
    console.error('Error loading featured offerings section:', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(config, loadItems, { deep: true })

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
