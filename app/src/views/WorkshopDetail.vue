<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <font-awesome-icon icon="spinner" class="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <p class="text-gray-600">Loading workshop details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center mb-2">
          <font-awesome-icon icon="exclamation-circle" class="w-5 h-5 text-red-600 mr-2" />
          <h3 class="text-lg font-semibold text-red-900">Error Loading Workshop</h3>
        </div>
        <p class="text-red-700">{{ error }}</p>
        <router-link
          :to="backRoute"
          class="inline-block mt-4 text-primary-600 hover:text-primary-700"
        >
          ← {{ backLabel }}
        </router-link>
      </div>
    </div>

    <!-- Workshop Content -->
    <div v-else-if="workshop" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <router-link
          :to="backRoute"
          class="text-sm text-gray-600 hover:text-primary-600 flex items-center"
        >
          <font-awesome-icon icon="chevron-left" class="w-3 h-3 mr-1" />
          {{ backLabel }}
        </router-link>
      </nav>

      <WorkshopContentSingleSeries
        v-if="isSingleSeriesLayout"
        :workshop="workshop"
        :age-group="ageGroup"
        :formatted-description="formattedDescription"
        :session-events="seriesSessions"
        :session-quantities="seriesSessionQuantities"
        @increment-session="incrementSeriesSession"
        @decrement-session="decrementSeriesSession"
      />

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <component
            :is="contentTemplateComponent"
            :workshop="workshop"
            :age-group="ageGroup"
            :duration="duration"
            :formatted-description="formattedDescription"
            :related-workshops="relatedWorkshops"
            @select-related="goToWorkshop"
          />
        </div>

        <!-- Booking Sidebar (Right Column) -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
            <!-- Price -->
            <div v-if="hasPrice" class="mb-6">
              <div class="text-sm text-gray-600 mb-1">{{ priceLabel }}</div>
              <div class="text-4xl font-bold text-gray-900">
                £{{ formattedPrice }}
                <span v-if="priceSuffix" class="text-lg text-gray-500 font-normal">{{ priceSuffix }}</span>
              </div>
            </div>

            <div v-if="!isEnquiryOnly" class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Availability</span>
                <span class="text-sm font-semibold" :class="capacityTextClass">
                  {{ capacityText }}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  class="h-3 rounded-full transition-all duration-300"
                  :class="capacityBarClass"
                  :style="{ width: capacityPercentage + '%' }"
                ></div>
              </div>
            </div>

            <!-- Enquiry Only -->
            <div v-if="isEnquiryOnly" class="space-y-4">
              <div class="rounded-xl border border-primary-200 bg-primary-50 p-4">
                <div class="flex items-center mb-2">
                  <font-awesome-icon icon="envelope" class="w-5 h-5 text-primary-700 mr-2" />
                  <span class="font-semibold text-primary-900">Book By Email</span>
                </div>
                <p class="text-sm text-primary-800">
                  This event is arranged by enquiry rather than instant checkout. Email us to check availability and tell us what you have in mind.
                </p>
              </div>

              <a
                :href="enquiryEmailHref"
                class="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                <font-awesome-icon icon="envelope" class="w-4 h-4 mr-2" />
                Email {{ enquiryEmail }}
              </a>

              <router-link
                to="/contact"
                class="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                Go To Contact Page
              </router-link>

              <p class="text-xs text-gray-500 text-center">
                We’ll confirm availability and next steps by email.
              </p>
            </div>

            <!-- Sold Out / Waitlist -->
            <div v-else-if="isSoldOut">
              <div v-if="workshop.waitlist_enabled" class="space-y-4">
                <div class="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div class="flex items-center mb-2">
                    <font-awesome-icon icon="exclamation-circle" class="w-5 h-5 text-warning-600 mr-2" />
                    <span class="font-semibold text-warning-900">Sold Out</span>
                  </div>
                  <p class="text-sm text-warning-700">
                    This workshop is currently full. Join the waitlist to be notified if a spot becomes available.
                  </p>
                </div>
                <button
                  @click="showWaitlistModal = true"
                  class="w-full px-6 py-3 bg-warning-600 text-white font-semibold rounded-lg hover:bg-warning-700 transition-colors"
                >
                  Join Waitlist ({{ capacity.waitlist_count }} waiting)
                </button>
              </div>
              <div v-else class="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
                <font-awesome-icon icon="times-circle" class="w-8 h-8 text-gray-400 mb-2" />
                <p class="font-semibold text-gray-700">Sold Out</p>
                <p class="text-sm text-gray-600 mt-1">This workshop is fully booked.</p>
              </div>
            </div>

            <!-- Booking Form -->
            <form v-else @submit.prevent="handleBooking" class="space-y-6">
              <!-- Number of Attendees -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Number of Attendees
                </label>
                <select
                  v-model="bookingForm.numberOfAttendees"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option v-for="n in maxAttendees" :key="n" :value="n">
                    {{ n }} {{ n === 1 ? 'person' : 'people' }}
                  </option>
                </select>
              </div>

              <!-- Attendee Details -->
              <div v-for="(attendee, index) in bookingForm.attendees" :key="index" class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-900 mb-3">
                  Attendee {{ index + 1 }}
                </h4>
                <div class="space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        v-model="attendee.firstName"
                        type="text"
                        required
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        v-model="attendee.lastName"
                        type="text"
                        required
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                      Email (optional)
                    </label>
                    <input
                      v-model="attendee.email"
                      type="email"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                      Special Requirements / Dietary Needs
                    </label>
                    <textarea
                      v-model="attendee.notes"
                      rows="2"
                      class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Any allergies, dietary requirements, or special needs..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Customer Contact Info -->
              <div class="border-t border-gray-200 pt-6">
                <h4 class="font-semibold text-gray-900 mb-3">Your Contact Information</h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      v-model="bookingForm.customerEmail"
                      type="email"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      v-model="bookingForm.customerPhone"
                      type="tel"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="07XXX XXXXXX"
                    />
                  </div>
                </div>
              </div>

              <!-- Total Price -->
              <div class="border-t border-gray-200 pt-4">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-lg font-semibold text-gray-900">Total</span>
                  <span class="text-2xl font-bold text-primary-600">£{{ totalPrice }}</span>
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="submitting"
                class="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <font-awesome-icon v-if="submitting" icon="spinner" class="w-5 h-5 mr-2 animate-spin" />
                <span>{{ submitting ? 'Processing...' : 'Book Now' }}</span>
              </button>

              <p class="text-xs text-gray-500 text-center">
                You'll be redirected to secure checkout to complete your booking.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Waitlist Modal -->
    <JoinEventWaitlistModal
      v-model="showWaitlistModal"
      :event-id="workshop?.id"
      :event-title="workshop?.offering?.title || ''"
      @success="handleWaitlistSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import JoinEventWaitlistModal from '../components/JoinEventWaitlistModal.vue'
import WorkshopContentAdult from '../components/workshops/WorkshopContentAdult.vue'
import WorkshopContentDefault from '../components/workshops/WorkshopContentDefault.vue'
import WorkshopContentSingleSeries from '../components/workshops/WorkshopContentSingleSeries.vue'
import {
  getWorkshopAgeLabel,
  isAdultWorkshopLayout,
  isEnquiryOnlyWorkshop as usesEnquiryOnlyLayout,
  isSingleSeriesWorkshopLayout
} from '../utils/workshopDisplay'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toastStore = useToastStore()

// State
const workshop = ref(null)
const capacity = ref(null)
const relatedWorkshops = ref([])
const seriesSessions = ref([])
const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const showWaitlistModal = ref(false)
const enquiryEmail = 'hello@lolaasone.com'

// Booking form
const bookingForm = ref({
  numberOfAttendees: 1,
  attendees: [
    { firstName: '', lastName: '', email: '', notes: '' }
  ],
  customerEmail: '',
  customerPhone: ''
})

// Fetch workshop details
const fetchWorkshop = async () => {
  try {
    loading.value = true
    error.value = null
    capacity.value = null
    relatedWorkshops.value = []
    seriesSessions.value = []

    // Fetch workshop by slug (join with offering)
    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings!inner(*),
        category:event_categories(
          id,
          name,
          slug,
          description,
          age_range,
          color_hex,
          icon,
          parent_id,
          featured_image_url,
          layout_key
        )
      `)
      .eq('offering.slug', route.params.slug)
      .eq('offering.status', 'published')
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Workshop not found')
      }
      throw fetchError
    }

    workshop.value = data

    if (isSingleSeriesWorkshopLayout(data)) {
      await fetchSingleSeriesSessions()
    } else {
      // Fetch capacity
      await fetchCapacity()

      // Fetch related workshops
      await fetchRelatedWorkshops()
    }
  } catch (err) {
    console.error('Error fetching workshop:', err)
    error.value = err.message || 'Failed to load workshop details. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch capacity
const fetchCapacity = async () => {
  if (!workshop.value) return

  try {
    const { data, error: fetchError } = await supabase
      .from('event_capacity')
      .select('*')
      .eq('offering_event_id', workshop.value.id)
      .single()

    if (fetchError) {
      console.error('Error fetching capacity:', fetchError)
      // Set default capacity if not found
      capacity.value = {
        total_capacity: workshop.value.max_capacity || 0,
        spaces_booked: 0,
        spaces_reserved: 0,
        spaces_available: workshop.value.max_capacity || 0,
        waitlist_enabled: false,
        waitlist_count: 0
      }
    } else {
      capacity.value = data
      console.log('Capacity data:', data)
      console.log('Waitlist enabled:', data.waitlist_enabled)
      console.log('Spaces available:', data.spaces_available)
    }
  } catch (err) {
    console.error('Error fetching capacity:', err)
  }
}

const fetchSingleSeriesSessions = async () => {
  if (!workshop.value) return

  try {
    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings!inner(*),
        capacity:event_capacity(*),
        category:event_categories(
          id,
          name,
          slug,
          description,
          age_range,
          color_hex,
          icon,
          parent_id,
          featured_image_url,
          layout_key
        )
      `)
      .eq('offering.status', 'published')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_start_time', { ascending: true })

    if (workshop.value.category_id) {
      query = query.eq('category_id', workshop.value.category_id)
    }

    const { data, error: fetchError } = await query

    if (fetchError) throw fetchError

    const sameSeriesSessions = (data || []).filter((session) => {
      if (workshop.value.category_id && session.category_id !== workshop.value.category_id) {
        return false
      }

      if (!workshop.value.category_id && session.offering?.title !== workshop.value.offering?.title) {
        return false
      }

      return isSingleSeriesWorkshopLayout(session)
    })

    if (sameSeriesSessions.length > 0) {
      seriesSessions.value = sameSeriesSessions
      return
    }

    seriesSessions.value = [workshop.value]
  } catch (err) {
    console.error('Error fetching single-series sessions:', err)
    seriesSessions.value = [workshop.value]
  }
}

// Fetch related workshops (same category, upcoming)
const fetchRelatedWorkshops = async () => {
  if (!workshop.value) return

  try {
    let query = supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings!inner(*),
        category:event_categories(
          id,
          name,
          slug,
          description,
          age_range,
          color_hex,
          icon,
          parent_id,
          featured_image_url,
          layout_key
        )
      `)
      .eq('offering.status', 'published')
      .eq('offering.type', 'event')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .neq('id', workshop.value.id)
      .order('event_date', { ascending: true })
      .limit(4)

    if (workshop.value.category_id) {
      query = query.eq('category_id', workshop.value.category_id)
    }

    const { data, error: fetchError } = await query

    if (fetchError) throw fetchError

    relatedWorkshops.value = data || []
  } catch (err) {
    console.error('Error fetching related workshops:', err)
    relatedWorkshops.value = []
  }
}

// Computed properties
const ageGroup = computed(() => {
  if (!workshop.value) return null
  return getWorkshopAgeLabel(workshop.value)
})

const isSingleSeriesLayout = computed(() => {
  if (!workshop.value) return false
  return isSingleSeriesWorkshopLayout(workshop.value)
})

const contentTemplateComponent = computed(() => {
  if (!workshop.value) return WorkshopContentDefault
  return isAdultWorkshopLayout(workshop.value) ? WorkshopContentAdult : WorkshopContentDefault
})

const isEnquiryOnly = computed(() => {
  if (!workshop.value) return false
  return usesEnquiryOnlyLayout(workshop.value)
})

const backRoute = computed(() => {
  if (!workshop.value) return '/workshops'
  return isAdultWorkshopLayout(workshop.value) ? '/adult-workshops' : '/workshops'
})

const backLabel = computed(() => {
  if (!workshop.value) return 'Back to Workshops'
  return isAdultWorkshopLayout(workshop.value) ? 'Back to Adult Workshops' : 'Back to Workshops'
})

const seriesSessionQuantities = computed(() => {
  return cartStore.items.reduce((quantities, item) => {
    const key = item.event_id || item.id || item.productId

    if (key) {
      quantities[key] = item.quantity
    }

    return quantities
  }, {})
})

const duration = computed(() => {
  if (!workshop.value || !workshop.value.event_start_time || !workshop.value.event_end_time) {
    return ''
  }

  const start = workshop.value.event_start_time
  const end = workshop.value.event_end_time

  // Parse times (format: HH:MM:SS)
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const durationMinutes = endMinutes - startMinutes

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${minutes}m`
  }
})


const formattedDescription = computed(() => {
  if (!workshop.value || !workshop.value.offering.description_long) {
    return '<p class="text-gray-600">No description available.</p>'
  }
  // Convert line breaks to paragraphs
  return workshop.value.offering.description_long
    .split('\n\n')
    .map(para => `<p class="mb-4">${para.replace(/\n/g, '<br>')}</p>`)
    .join('')
})

const isSoldOut = computed(() => {
  if (!capacity.value) return false
  return capacity.value.spaces_available <= 0
})

const maxAttendees = computed(() => {
  if (!capacity.value) return 1
  return Math.min(10, capacity.value.spaces_available)
})

const totalPrice = computed(() => {
  if (!workshop.value) return '0.00'
  const price = parseFloat(workshop.value.price_gbp)
  const total = price * bookingForm.value.numberOfAttendees
  return total.toFixed(2)
})

const hasPrice = computed(() => {
  if (!workshop.value) return false
  return workshop.value.price_gbp !== null && workshop.value.price_gbp !== undefined && workshop.value.price_gbp !== ''
})

const formattedPrice = computed(() => {
  if (!hasPrice.value) return null
  return Number(workshop.value.price_gbp).toFixed(2)
})

const priceLabel = computed(() => {
  return isEnquiryOnly.value ? 'Event price' : 'Price per person'
})

const priceSuffix = computed(() => {
  return isEnquiryOnly.value ? '' : '/ person'
})

const enquiryEmailHref = computed(() => {
  const subject = workshop.value?.offering?.title
    ? `Booking enquiry: ${workshop.value.offering.title}`
    : 'Booking enquiry'

  return `mailto:${enquiryEmail}?subject=${encodeURIComponent(subject)}`
})

const capacityPercentage = computed(() => {
  if (!capacity.value || capacity.value.total_capacity === 0) return 0
  return Math.round((capacity.value.spaces_booked / capacity.value.total_capacity) * 100)
})

const capacityText = computed(() => {
  if (!capacity.value) return ''

  if (capacity.value.spaces_available === 0) {
    return 'Sold Out'
  } else if (capacity.value.spaces_available <= 3) {
    return `Only ${capacity.value.spaces_available} spots left!`
  } else {
    return `${capacity.value.spaces_available} spots available`
  }
})

const capacityTextClass = computed(() => {
  if (!capacity.value) return 'text-gray-600'

  if (capacity.value.spaces_available === 0) {
    return 'text-red-600'
  } else if (capacity.value.spaces_available <= 3) {
    return 'text-warning-600'
  } else {
    return 'text-success-600'
  }
})

const capacityBarClass = computed(() => {
  if (!capacity.value) return 'bg-gray-400'

  const percentage = capacityPercentage.value

  if (percentage >= 100) {
    return 'bg-red-500'
  } else if (percentage >= 75) {
    return 'bg-warning-500'
  } else {
    return 'bg-success-500'
  }
})

// Watch for route changes to refetch workshop data
watch(() => route.params.slug, () => {
  fetchWorkshop()
})

// Watch numberOfAttendees and update attendees array
watch(() => bookingForm.value.numberOfAttendees, (newCount, oldCount) => {
  const currentAttendees = bookingForm.value.attendees

  if (newCount > oldCount) {
    // Add new attendees
    for (let i = oldCount; i < newCount; i++) {
      currentAttendees.push({ firstName: '', lastName: '', email: '', notes: '' })
    }
  } else if (newCount < oldCount) {
    // Remove attendees
    currentAttendees.splice(newCount)
  }
})

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  // Parse time (format: HH:MM:SS)
  const [hour, minute] = timeString.split(':').map(Number)

  // Convert to 12-hour format
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const minuteStr = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : ''

  return `${hour12}${minuteStr}${period}`
}

const goToWorkshop = (relatedWorkshop) => {
  router.push(`/workshops/${relatedWorkshop.offering.slug}`)
}

const getSessionSpacesAvailable = (session) => {
  const capacityRecord = Array.isArray(session.capacity)
    ? session.capacity[0] || null
    : session.capacity || null

  if (capacityRecord && typeof capacityRecord.spaces_available === 'number') {
    return capacityRecord.spaces_available
  }

  if (
    typeof session.max_capacity === 'number' &&
    typeof session.current_bookings === 'number'
  ) {
    return Math.max(session.max_capacity - session.current_bookings, 0)
  }

  return null
}

const getSessionQuantity = (session) => {
  return seriesSessionQuantities.value[session.id] || 0
}

const incrementSeriesSession = (session) => {
  const currentQuantity = getSessionQuantity(session)
  const spacesAvailable = getSessionSpacesAvailable(session)

  if (spacesAvailable !== null && currentQuantity >= spacesAvailable) {
    return
  }

  if (currentQuantity > 0) {
    cartStore.updateQuantity(session.id, currentQuantity + 1)
    return
  }

  cartStore.addItem({
    id: session.offering.id,
    offering_id: session.offering.id,
    event_id: session.id,
    type: 'event',
    title: session.offering.title,
    price: session.price_gbp,
    image: session.offering.featured_image_url || session.category?.featured_image_url || null,
    slug: session.offering.slug,
    eventDate: session.event_date,
    eventTime: session.event_start_time
  })
}

const decrementSeriesSession = (session) => {
  const currentQuantity = getSessionQuantity(session)

  if (currentQuantity <= 0) {
    return
  }

  cartStore.updateQuantity(session.id, currentQuantity - 1)
}

// Handle booking submission
const handleBooking = async () => {
  try {
    submitting.value = true

    // Add workshop to cart with attendee details
    cartStore.addItem({
      id: workshop.value.offering.id,
      offering_id: workshop.value.offering.id,
      event_id: workshop.value.id,
      type: 'event',
      title: workshop.value.offering.title,
      price: workshop.value.price_gbp,
      quantity: bookingForm.value.numberOfAttendees,
      image: workshop.value.offering.featured_image_url,
      slug: workshop.value.offering.slug,
      eventDate: workshop.value.event_date,
      eventTime: workshop.value.event_start_time
    }, bookingForm.value.numberOfAttendees, null, bookingForm.value.attendees)

    // Navigate to cart
    router.push('/cart')

  } catch (err) {
    console.error('Error adding to cart:', err)
    toastStore.error('Failed to add to cart. Please try again.')
  } finally {
    submitting.value = false
  }
}

// Handle waitlist success
const handleWaitlistSuccess = async (data) => {
  console.log('Successfully joined waitlist:', data)
  // Refresh capacity to update waitlist count
  await fetchCapacity()
}

// Initialize
onMounted(() => {
  fetchWorkshop()
})
</script>
