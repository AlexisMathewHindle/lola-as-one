<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-16">
      <div class="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <font-awesome-icon icon="spinner" class="mx-auto mb-4 h-10 w-10 animate-spin text-primary-600" />
        <h1 class="text-2xl font-display font-bold text-gray-900">Finding the current workshop</h1>
        <p class="mt-3 text-gray-600">
          This older LoLA Workshops link is being moved to the current booking page.
        </p>
        <router-link
          :to="fallbackTarget"
          class="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
        >
          View Current Workshops
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const props = defineProps({
  mode: {
    type: String,
    default: 'event'
  },
  categorySlug: {
    type: String,
    default: null
  },
  fallbackPath: {
    type: String,
    default: '/workshops'
  }
})

const route = useRoute()
const router = useRouter()
const resolving = ref(false)

const fallbackTarget = computed(() => props.fallbackPath || '/workshops')

const directCategoryRoutes = {
  'adult-art-workshops': '/adult-workshops',
  'adult-workshop': '/adult-workshops',
  'adult-workshops': '/adult-workshops',
  'half-term': '/half-term',
  'holiday-workshops': '/half-term',
  'summer': '/summer-holiday',
  'summer-holiday': '/summer-holiday',
  'summer-workshops': '/summer-holiday'
}

const categoryAliases = {
  'private-parties': 'private-party',
  'adult-art-workshops': 'adult-workshops',
  'adult-workshop': 'adult-workshops',
  'holiday-workshops': 'half-term',
  'summer-workshops': 'summer-holiday'
}

const legacyEventCategoryBySuffix = {
  wed_artclub: 'creative-art-club-4-plus',
  story_of_art_club_4_8: 'story-of-art-club-4-8',
  story_of_art_club_9_13: 'story-of-art-club-9-13',
  lo_tues: 'little-ones-tues-2-4',
  lo_fri: 'little-ones-fri-2-4',
  sat_lo: 'little-ones-sat-2-5',
  sat: 'creative-saturdays-5-plus',
  fam_sun: 'workshops'
}

function getLocalDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extractLegacySuffix(value) {
  const token = normalizeToken(value)
  return token.replace(/^[a-z]{2}\d{2}_/, '')
}

function resolveCategoryAlias(slug) {
  const normalized = normalizeToken(slug)
  return categoryAliases[normalized] || normalized
}

function legacyCategoryFromEventId(value) {
  const normalized = normalizeToken(value)
  const suffix = extractLegacySuffix(normalized)

  return legacyEventCategoryBySuffix[normalized] || legacyEventCategoryBySuffix[suffix] || null
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function buildEventSelect() {
  return `
    id,
    event_date,
    event_start_time,
    offering:offerings!inner(
      id,
      title,
      slug,
      status,
      type,
      metadata
    ),
    category:event_categories(
      id,
      name,
      slug,
      parent_id,
      layout_key
    )
  `
}

async function fetchFirstEvent(buildQuery) {
  const query = buildQuery(
    supabase
      .from('offering_events')
      .select(buildEventSelect())
      .eq('offering.status', 'published')
      .gte('event_date', getLocalDateString())
      .order('event_date', { ascending: true })
      .order('event_start_time', { ascending: true })
      .limit(1)
  )

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data?.[0] || null
}

async function fetchEventByIdentifier(identifier) {
  const token = normalizeToken(identifier)
  if (!token) return null

  if (isUuid(identifier)) {
    const exactEvent = await fetchFirstEvent((query) => query.eq('id', identifier))
    if (exactEvent) return exactEvent
  }

  const exactSlug = await fetchFirstEvent((query) => query.eq('offering.slug', token))
  if (exactSlug) return exactSlug

  const prefixedSlug = await fetchFirstEvent((query) => query.ilike('offering.slug', `${token}-%`))
  if (prefixedSlug) return prefixedSlug

  const categorySlug = legacyCategoryFromEventId(token)
  if (categorySlug && categorySlug !== 'workshops') {
    return fetchFirstEventByCategory(categorySlug)
  }

  return null
}

async function fetchFirstEventByCategory(categorySlug) {
  const normalizedSlug = resolveCategoryAlias(categorySlug)
  if (!normalizedSlug) return null

  const { data: category, error: categoryError } = await supabase
    .from('event_categories')
    .select('id, slug, layout_key, is_active')
    .eq('slug', normalizedSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (categoryError || !category) {
    if (categoryError) throw categoryError
    return null
  }

  return fetchFirstEvent((query) => query.eq('category_id', category.id))
}

async function redirectTo(target) {
  await router.replace(target || fallbackTarget.value)
}

async function resolveLegacyRoute() {
  if (resolving.value) return
  resolving.value = true

  try {
    if (props.mode === 'category') {
      const categorySlug = props.categorySlug || route.params.categorySlug
      const normalizedSlug = resolveCategoryAlias(categorySlug)
      const directRoute = directCategoryRoutes[normalizedSlug]

      if (directRoute) {
        await redirectTo(directRoute)
        return
      }

      const event = await fetchFirstEventByCategory(normalizedSlug)
      if (event?.offering?.slug) {
        await redirectTo(`/workshops/${event.offering.slug}`)
        return
      }

      await redirectTo(fallbackTarget.value)
      return
    }

    const identifier = route.params.id || route.params.legacyId || route.params.pathMatch
    const event = await fetchEventByIdentifier(identifier)

    if (event?.offering?.slug) {
      await redirectTo(`/workshops/${event.offering.slug}`)
      return
    }

    await redirectTo(fallbackTarget.value)
  } catch (error) {
    console.error('Failed to resolve legacy workshop route:', error)
    await redirectTo(fallbackTarget.value)
  } finally {
    resolving.value = false
  }
}

onMounted(resolveLegacyRoute)

watch(
  () => route.fullPath,
  () => resolveLegacyRoute()
)
</script>
