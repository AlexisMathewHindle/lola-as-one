<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
            Welcome to <span class="text-primary-600">Lola As One</span>
          </h1>
          <p class="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Where creativity meets community. Discover hands-on workshops, curated art boxes, and creative inspiration.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link
              to="/workshops"
              class="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <font-awesome-icon icon="calendar" class="mr-2" />
              Explore Workshops
            </router-link>
            <router-link
              to="/boxes"
              class="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 text-lg font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
            >
              <font-awesome-icon icon="box" class="mr-2" />
              Shop Art Boxes
            </router-link>
          </div>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary-200 rounded-full opacity-20 blur-3xl"></div>
    </section>

    <!-- Featured Workshops Section -->
    <section class="py-16 sm:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
            Upcoming Workshops
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Join us for hands-on creative experiences designed for all ages and skill levels
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="loadingWorkshops" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>

        <!-- Workshops Grid -->
        <div v-else-if="featuredWorkshops.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="workshop in featuredWorkshops"
            :key="workshop.id"
            class="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
            @click="$router.push(`/workshops/${workshop.slug}`)"
          >
            <!-- Workshop Image -->
            <div class="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
              <img
                v-if="workshop.featured_image_url"
                :src="workshop.featured_image_url"
                :alt="workshop.title"
                class="w-full h-full object-cover"
              >
              <div v-else class="flex items-center justify-center h-full">
                <font-awesome-icon icon="palette" class="text-6xl text-primary-400" />
              </div>
            </div>

            <!-- Workshop Info -->
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                {{ workshop.title }}
              </h3>
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                {{ workshop.description_short || 'Join us for a creative experience' }}
              </p>
              <div class="flex items-center justify-between">
                <div class="flex items-center text-sm text-gray-500">
                  <font-awesome-icon icon="calendar" class="mr-2" />
                  <span>{{ formatDate(workshop.next_event_date) }}</span>
                </div>
                <div class="text-lg font-semibold text-primary-600">
                  £{{ workshop.price_gbp }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <font-awesome-icon icon="calendar" class="text-6xl text-gray-300 mb-4" />
          <p class="text-gray-500">No upcoming workshops at the moment. Check back soon!</p>
        </div>

        <!-- View All Button -->
        <div class="text-center mt-12">
          <router-link
            to="/workshops"
            class="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            View All Workshops
            <font-awesome-icon icon="arrow-right" class="ml-2" />
          </router-link>
        </div>
      </div>
    </section>

    <!-- Featured Boxes Section -->
    <section class="py-16 sm:py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
            Our Art Boxes
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Curated art supplies and creative projects delivered to your door
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="loadingBoxes" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>

        <!-- Boxes Grid -->
        <div v-else-if="featuredBoxes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="box in featuredBoxes"
            :key="box.id"
            class="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
            @click="$router.push(`/boxes/${box.slug}`)"
          >
            <!-- Box Image -->
            <div class="relative h-48 bg-gradient-to-br from-secondary-100 to-secondary-200">
              <img
                v-if="box.featured_image_url"
                :src="box.featured_image_url"
                :alt="box.title"
                class="w-full h-full object-cover"
              >
              <div v-else class="flex items-center justify-center h-full">
                <font-awesome-icon icon="box" class="text-6xl text-secondary-400" />
              </div>

              <!-- Subscription Badge -->
              <div v-if="box.is_subscription" class="absolute top-3 right-3">
                <span class="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                  Subscription
                </span>
              </div>
            </div>

            <!-- Box Info -->
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                {{ box.title }}
              </h3>
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                {{ box.description_short || 'Curated art supplies for creative fun' }}
              </p>
              <div class="flex items-center justify-between">
                <div class="text-lg font-semibold text-primary-600">
                  £{{ box.price_gbp }}
                  <span v-if="box.is_subscription" class="text-sm text-gray-500">/month</span>
                </div>
                <span class="text-sm text-gray-500">
                  {{ box.stock_status === 'in_stock' ? 'In Stock' : 'Low Stock' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <font-awesome-icon icon="box" class="text-6xl text-gray-300 mb-4" />
          <p class="text-gray-500">No art boxes available at the moment. Check back soon!</p>
        </div>

        <!-- View All Button -->
        <div class="text-center mt-12">
          <router-link
            to="/boxes"
            class="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Shop All Boxes
            <font-awesome-icon icon="arrow-right" class="ml-2" />
          </router-link>
        </div>
      </div>
    </section>

    <!-- About Preview Section -->
    <section class="py-16 sm:py-20 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-6">
          About Lola As One
        </h2>
        <p class="text-lg text-gray-600 mb-4">
          We're a creative community bringing together the best of Lola Creative Space and Lots of Lovely Art.
        </p>
        <p class="text-lg text-gray-600 mb-8">
          Our mission is to inspire creativity, foster community, and make art accessible to everyone through hands-on workshops, curated art boxes, and creative resources.
        </p>
        <router-link
          to="/about"
          class="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
        >
          Learn More About Us
          <font-awesome-icon icon="arrow-right" class="ml-2" />
        </router-link>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-16 sm:py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
            What Our Community Says
          </h2>
          <p class="text-lg text-gray-600">
            Hear from our creative community
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="testimonial in testimonials"
            :key="testimonial.id"
            class="bg-white rounded-xl shadow-md p-8"
          >
            <div class="flex items-center mb-4">
              <font-awesome-icon
                v-for="star in 5"
                :key="star"
                icon="star"
                class="text-yellow-400 text-sm"
              />
            </div>
            <p class="text-gray-600 mb-6 italic">
              "{{ testimonial.quote }}"
            </p>
            <div class="flex items-center">
              <div class="w-12 h-12 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg">
                {{ testimonial.initials }}
              </div>
              <div class="ml-4">
                <p class="font-semibold text-gray-900">{{ testimonial.name }}</p>
                <p class="text-sm text-gray-500">{{ testimonial.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter Section -->
    <section class="py-16 sm:py-20 bg-primary-600">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
          Stay Creative
        </h2>
        <p class="text-lg text-primary-100 mb-8">
          Subscribe to our newsletter for creative inspiration, workshop updates, and exclusive offers
        </p>

        <form @submit.prevent="handleNewsletterSubmit" class="max-w-md mx-auto">
          <div class="flex flex-col sm:flex-row gap-3">
            <input
              v-model="newsletterEmail"
              type="email"
              required
              placeholder="Enter your email"
              class="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              :disabled="newsletterSubmitting"
            >
            <button
              type="submit"
              class="px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="newsletterSubmitting"
            >
              <span v-if="!newsletterSubmitting">Subscribe</span>
              <span v-else>Subscribing...</span>
            </button>
          </div>

          <!-- Success Message -->
          <div v-if="newsletterSuccess" class="mt-4 text-white">
            <font-awesome-icon icon="check-circle" class="mr-2" />
            Thanks for subscribing!
          </div>

          <!-- Error Message -->
          <div v-if="newsletterError" class="mt-4 text-red-200">
            <font-awesome-icon icon="exclamation-circle" class="mr-2" />
            {{ newsletterError }}
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

// Featured Workshops
const loadingWorkshops = ref(true)
const featuredWorkshops = ref([])

// Featured Boxes
const loadingBoxes = ref(true)
const featuredBoxes = ref([])

// Testimonials (hardcoded for v1)
const testimonials = ref([
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Workshop Participant',
    initials: 'SJ',
    quote: 'The watercolor workshop was amazing! The instructor was patient and encouraging, and I left with a beautiful painting I\'m proud of.'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Subscription Box Member',
    initials: 'MC',
    quote: 'My kids love the monthly art boxes! Each one is thoughtfully curated with high-quality supplies and fun projects.'
  },
  {
    id: 3,
    name: 'Emma Williams',
    role: 'Regular Customer',
    initials: 'EW',
    quote: 'Lola As One has reignited my passion for creativity. The community here is so welcoming and supportive!'
  }
])

// Newsletter
const newsletterEmail = ref('')
const newsletterSubmitting = ref(false)
const newsletterSuccess = ref(false)
const newsletterError = ref(null)

// Fetch featured workshops
const fetchFeaturedWorkshops = async () => {
  try {
    loadingWorkshops.value = true

    // Fetch featured offerings of type 'event'
    const { data: offerings, error: offeringsError } = await supabase
      .from('offerings')
      .select('id, title, slug, description_short, featured_image_url')
      .eq('type', 'event')
      .eq('status', 'published')
      .eq('featured', true)
      .limit(3)

    if (offeringsError) throw offeringsError

    if (offerings && offerings.length > 0) {
      // Fetch event details for each offering
      const offeringIds = offerings.map(o => o.id)
      const { data: events, error: eventsError } = await supabase
        .from('offering_events')
        .select('offering_id, event_date, price_gbp')
        .in('offering_id', offeringIds)

      if (eventsError) throw eventsError

      // Merge offerings with event data
      featuredWorkshops.value = offerings.map(offering => {
        const event = events?.find(e => e.offering_id === offering.id)
        return {
          ...offering,
          next_event_date: event?.event_date,
          price_gbp: event?.price_gbp || 0
        }
      })
    }
  } catch (err) {
    console.error('Error fetching featured workshops:', err)
  } finally {
    loadingWorkshops.value = false
  }
}

// Fetch featured boxes
const fetchFeaturedBoxes = async () => {
  try {
    loadingBoxes.value = true

    // Fetch featured offerings of type 'product_physical'
    const { data: offerings, error: offeringsError } = await supabase
      .from('offerings')
      .select('id, title, slug, description_short, featured_image_url')
      .eq('type', 'product_physical')
      .eq('status', 'published')
      .eq('featured', true)
      .limit(3)

    if (offeringsError) throw offeringsError

    if (offerings && offerings.length > 0) {
      // Fetch product details for each offering
      const offeringIds = offerings.map(o => o.id)
      const { data: products, error: productsError } = await supabase
        .from('offering_products')
        .select('offering_id, price_gbp, available_for_subscription, stock_quantity')
        .in('offering_id', offeringIds)

      if (productsError) throw productsError

      // Merge offerings with product data
      featuredBoxes.value = offerings.map(offering => {
        const product = products?.find(p => p.offering_id === offering.id)
        const stockQuantity = product?.stock_quantity || 0
        const stockStatus = stockQuantity > 0
          ? (stockQuantity <= 5 ? 'low_stock' : 'in_stock')
          : 'out_of_stock'

        return {
          ...offering,
          price_gbp: product?.price_gbp || 0,
          is_subscription: product?.available_for_subscription || false,
          stock_status: stockStatus
        }
      })
    }
  } catch (err) {
    console.error('Error fetching featured boxes:', err)
  } finally {
    loadingBoxes.value = false
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'TBA'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

// Handle newsletter submission
const handleNewsletterSubmit = async () => {
  try {
    newsletterSubmitting.value = true
    newsletterSuccess.value = false
    newsletterError.value = null

    // TODO: Implement newsletter subscription
    // For now, just show success message
    await new Promise(resolve => setTimeout(resolve, 1000))

    newsletterSuccess.value = true
    newsletterEmail.value = ''

    // Hide success message after 5 seconds
    setTimeout(() => {
      newsletterSuccess.value = false
    }, 5000)
  } catch (err) {
    console.error('Newsletter subscription error:', err)
    newsletterError.value = 'Failed to subscribe. Please try again.'
  } finally {
    newsletterSubmitting.value = false
  }
}

// Initialize
onMounted(() => {
  fetchFeaturedWorkshops()
  fetchFeaturedBoxes()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
