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
          to="/workshops"
          class="inline-block mt-4 text-primary-600 hover:text-primary-700"
        >
          ← Back to Workshops
        </router-link>
      </div>
    </div>

    <!-- Workshop Content -->
    <div v-else-if="workshop" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Breadcrumb -->
      <nav class="mb-6">
        <router-link
          to="/workshops"
          class="text-sm text-gray-600 hover:text-primary-600 flex items-center"
        >
          <font-awesome-icon icon="chevron-left" class="w-3 h-3 mr-1" />
          Back to Workshops
        </router-link>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content (Left Column) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Hero Section -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <!-- Featured Image -->
            <div v-if="workshop.offering.featured_image_url" class="aspect-video bg-gray-100">
              <img
                :src="workshop.offering.featured_image_url"
                :alt="workshop.offering.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <font-awesome-icon icon="palette" class="w-24 h-24 text-primary-400" />
            </div>

            <!-- Workshop Info -->
            <div class="p-6 sm:p-8">
              <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
                {{ workshop.offering.title }}
              </h1>

              <!-- Short Description -->
              <p v-if="workshop.offering.description_short" class="text-lg text-gray-600 mb-6">
                {{ workshop.offering.description_short }}
              </p>

              <!-- Event Details Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <!-- Date -->
                <div class="flex items-start">
                  <font-awesome-icon icon="calendar" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <div class="text-sm font-medium text-gray-500">Date</div>
                    <div class="text-base font-semibold text-gray-900">{{ formatDate(workshop.event_date) }}</div>
                  </div>
                </div>

                <!-- Time -->
                <div class="flex items-start">
                  <font-awesome-icon icon="clock" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <div class="text-sm font-medium text-gray-500">Time</div>
                    <div class="text-base font-semibold text-gray-900">
                      {{ formatTime(workshop.event_start_time) }} - {{ formatTime(workshop.event_end_time) }}
                      <span class="text-sm text-gray-500">({{ duration }})</span>
                    </div>
                  </div>
                </div>

                <!-- Location -->
                <div class="flex items-start">
                  <font-awesome-icon icon="map-marker-alt" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <div class="text-sm font-medium text-gray-500">Location</div>
                    <div class="text-base font-semibold text-gray-900">{{ workshop.location_name || 'TBA' }}</div>
                    <div v-if="workshop.location_city" class="text-sm text-gray-600">
                      {{ workshop.location_city }}{{ workshop.location_postcode ? ', ' + workshop.location_postcode : '' }}
                    </div>
                  </div>
                </div>

                <!-- Age Group -->
                <div v-if="ageGroup" class="flex items-start">
                  <font-awesome-icon icon="users" class="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <div class="text-sm font-medium text-gray-500">Age Group</div>
                    <div class="text-base font-semibold text-gray-900">{{ ageGroup }}</div>
                  </div>
                </div>
              </div>

              <!-- Capacity Progress Bar -->
              <div class="mb-6">
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
            </div>
          </div>

          <!-- Full Description -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">About This Workshop</h2>
            <div class="prose max-w-none text-gray-700" v-html="formattedDescription"></div>
          </div>

          <!-- Related Workshops (if any) -->
          <div v-if="relatedWorkshops.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 class="text-2xl font-display font-bold text-gray-900 mb-4">More Workshops</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="related in relatedWorkshops"
                :key="related.id"
                @click="goToWorkshop(related)"
                class="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
              >
                <h3 class="font-semibold text-gray-900 mb-2">{{ related.offering.title }}</h3>
                <div class="text-sm text-gray-600 space-y-1">
                  <div class="flex items-center">
                    <font-awesome-icon icon="calendar" class="w-3 h-3 mr-2" />
                    {{ formatDate(related.event_date) }}
                  </div>
                  <div class="flex items-center">
                    <font-awesome-icon icon="clock" class="w-3 h-3 mr-2" />
                    {{ formatTime(related.event_start_time) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Booking Sidebar (Right Column) -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
            <!-- Price -->
            <div class="mb-6">
              <div class="text-sm text-gray-600 mb-1">Price per person</div>
              <div class="text-4xl font-bold text-gray-900">
                £{{ workshop.price_gbp }}
                <span class="text-lg text-gray-500 font-normal">/ person</span>
              </div>
            </div>

            <!-- Sold Out / Waitlist -->
            <div v-if="isSoldOut">
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

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toastStore = useToastStore()

// State
const workshop = ref(null)
const capacity = ref(null)
const relatedWorkshops = ref([])
const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const showWaitlistModal = ref(false)

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

    // Fetch workshop by slug (join with offering)
    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings!inner(*)
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

    // Fetch capacity
    await fetchCapacity()

    // Fetch related workshops
    await fetchRelatedWorkshops()
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

// Fetch related workshops (same category, upcoming)
const fetchRelatedWorkshops = async () => {
  if (!workshop.value) return

  try {
    const category = workshop.value.offering.metadata?.category

    const { data, error: fetchError } = await supabase
      .from('offering_events')
      .select(`
        *,
        offering:offerings!inner(*)
      `)
      .eq('offering.status', 'published')
      .eq('offering.type', 'event')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .neq('id', workshop.value.id)
      .order('event_date', { ascending: true })
      .limit(4)

    if (fetchError) throw fetchError

    // Filter by category if available
    if (category && data) {
      relatedWorkshops.value = data.filter(w => w.offering.metadata?.category === category).slice(0, 4)
    } else {
      relatedWorkshops.value = data || []
    }
  } catch (err) {
    console.error('Error fetching related workshops:', err)
    relatedWorkshops.value = []
  }
}

// Computed properties
const ageGroup = computed(() => {
  if (!workshop.value) return null
  const metadata = workshop.value.offering.metadata || {}
  return metadata.age_group || null
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

// Handle booking submission
const handleBooking = async () => {
  try {
    submitting.value = true

    // Add workshop to cart with attendee details
    cartStore.addItem({
      id: workshop.value.offering.id,
      type: 'event',
      title: workshop.value.offering.title,
      price: workshop.value.price_gbp,
      quantity: bookingForm.value.numberOfAttendees,
      image: workshop.value.offering.featured_image_url,
      slug: workshop.value.offering.slug,
      eventDate: workshop.value.event_date,
      eventTime: workshop.value.event_time
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