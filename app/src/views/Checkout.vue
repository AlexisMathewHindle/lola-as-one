<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2">
          Checkout
        </h1>
        <p class="text-base sm:text-lg text-gray-600">
          Complete your order
        </p>
      </div>

      <!-- Empty Cart Redirect -->
      <div v-if="cartStore.items.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
        <div class="max-w-md mx-auto">
          <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <font-awesome-icon icon="shopping-cart" class="w-12 h-12 text-gray-400" />
          </div>
          <h2 class="text-2xl font-display font-bold text-gray-900 mb-3">
            Your cart is empty
          </h2>
          <p class="text-gray-600 mb-6">
            Add some items to your cart before checking out.
          </p>
          <router-link
            to="/shop"
            class="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <font-awesome-icon icon="shopping-bag" class="w-4 h-4 mr-2" />
            Continue Shopping
          </router-link>
        </div>
      </div>

      <!-- Checkout Form -->
      <form v-else @submit.prevent="handleCheckout" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Customer Info (2/3 width) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Information -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
              Customer Information
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- First Name -->
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  v-model="form.firstName"
                  type="text"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="{ 'border-red-500': errors.firstName }"
                />
                <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">{{ errors.firstName }}</p>
              </div>

              <!-- Last Name -->
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  v-model="form.lastName"
                  type="text"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="{ 'border-red-500': errors.lastName }"
                />
                <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">{{ errors.lastName }}</p>
              </div>

              <!-- Email -->
              <div class="sm:col-span-2">
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span class="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="{ 'border-red-500': errors.email }"
                />
                <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
                <p class="text-xs text-gray-500 mt-1">Order confirmation will be sent to this email</p>
              </div>

              <!-- Phone -->
              <div class="sm:col-span-2">
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+44 20 1234 5678"
                />
                <p class="text-xs text-gray-500 mt-1">Optional - for delivery updates</p>
              </div>
            </div>
          </div>

          <!-- Event Attendees -->
          <div v-if="eventBookings.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
              <div>
                <h2 class="text-xl font-display font-bold text-gray-900">
                  Workshop Attendees
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                  Add the attendee names for each workshop booking so we know who is coming to which event.
                </p>
              </div>
              <div class="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                {{ eventBookings.length }} {{ eventBookings.length === 1 ? 'event booking' : 'event bookings' }}
              </div>
            </div>

            <div class="space-y-6">
              <div
                v-for="booking in eventBookings"
                :key="booking.itemKey"
                class="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
              >
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ booking.title }}
                    </h3>
                    <div class="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span v-if="booking.eventDate" class="flex items-center">
                        <font-awesome-icon icon="calendar" class="w-4 h-4 mr-1" />
                        {{ formatDate(booking.eventDate) }}
                      </span>
                      <span v-if="booking.eventTime" class="flex items-center">
                        <font-awesome-icon icon="clock" class="w-4 h-4 mr-1" />
                        {{ booking.eventTime }}
                      </span>
                    </div>
                  </div>
                  <div class="text-sm font-medium text-gray-700">
                    {{ booking.quantity }} {{ booking.quantity === 1 ? 'attendee' : 'attendees' }}
                  </div>
                </div>

                <div class="space-y-4">
                  <div
                    v-for="(attendee, attendeeIndex) in booking.attendees"
                    :key="`${booking.itemKey}-${attendeeIndex}`"
                    class="rounded-lg border border-white bg-white p-4 shadow-sm"
                  >
                    <div class="text-sm font-semibold text-gray-900 mb-3">
                      Attendee {{ attendeeIndex + 1 }}
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          :for="`attendee-${booking.itemKey}-${attendeeIndex}-firstName`"
                          class="block text-sm font-medium text-gray-700 mb-2"
                        >
                          First Name <span class="text-red-500">*</span>
                        </label>
                        <input
                          :id="`attendee-${booking.itemKey}-${attendeeIndex}-firstName`"
                          v-model="attendee.firstName"
                          type="text"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          :class="{ 'border-red-500': errors[`attendee-${booking.itemKey}-${attendeeIndex}-firstName`] }"
                          @input="persistEventAttendees(booking)"
                        />
                        <p
                          v-if="errors[`attendee-${booking.itemKey}-${attendeeIndex}-firstName`]"
                          class="text-red-500 text-sm mt-1"
                        >
                          {{ errors[`attendee-${booking.itemKey}-${attendeeIndex}-firstName`] }}
                        </p>
                      </div>

                      <div>
                        <label
                          :for="`attendee-${booking.itemKey}-${attendeeIndex}-lastName`"
                          class="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Last Name <span class="text-red-500">*</span>
                        </label>
                        <input
                          :id="`attendee-${booking.itemKey}-${attendeeIndex}-lastName`"
                          v-model="attendee.lastName"
                          type="text"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          :class="{ 'border-red-500': errors[`attendee-${booking.itemKey}-${attendeeIndex}-lastName`] }"
                          @input="persistEventAttendees(booking)"
                        />
                        <p
                          v-if="errors[`attendee-${booking.itemKey}-${attendeeIndex}-lastName`]"
                          class="text-red-500 text-sm mt-1"
                        >
                          {{ errors[`attendee-${booking.itemKey}-${attendeeIndex}-lastName`] }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Address (only if physical items) -->
          <div v-if="hasPhysicalItems" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
              Shipping Address
            </h2>

            <div class="space-y-4">
              <!-- Address Line 1 -->
              <div>
                <label for="addressLine1" class="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 <span class="text-red-500">*</span>
                </label>
                <input
                  id="addressLine1"
                  v-model="form.addressLine1"
                  type="text"
                  :required="hasPhysicalItems"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :class="{ 'border-red-500': errors.addressLine1 }"
                />
                <p v-if="errors.addressLine1" class="text-red-500 text-sm mt-1">{{ errors.addressLine1 }}</p>
              </div>

              <!-- Address Line 2 -->
              <div>
                <label for="addressLine2" class="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  id="addressLine2"
                  v-model="form.addressLine2"
                  type="text"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- City -->
                <div>
                  <label for="city" class="block text-sm font-medium text-gray-700 mb-2">
                    City <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    v-model="form.city"
                    type="text"
                    :required="hasPhysicalItems"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    :class="{ 'border-red-500': errors.city }"
                  />
                  <p v-if="errors.city" class="text-red-500 text-sm mt-1">{{ errors.city }}</p>
                </div>

                <!-- Postal Code -->
                <div>
                  <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="postalCode"
                    v-model="form.postalCode"
                    type="text"
                    :required="hasPhysicalItems"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    :class="{ 'border-red-500': errors.postalCode }"
                  />
                  <p v-if="errors.postalCode" class="text-red-500 text-sm mt-1">{{ errors.postalCode }}</p>
                </div>
              </div>

              <!-- Country -->
              <div>
                <label for="country" class="block text-sm font-medium text-gray-700 mb-2">
                  Country <span class="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  v-model="form.country"
                  :required="hasPhysicalItems"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="IT">Italy</option>
                  <option value="ES">Spain</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Order Summary (1/3 width) -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
              Order Summary
            </h2>

            <!-- Cart Items -->
            <div class="space-y-4 mb-6">
              <div
                v-for="item in cartStore.items"
                :key="getItemKey(item)"
                class="flex gap-4"
              >
                <!-- Item Image -->
                <div class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                    <font-awesome-icon
                      :icon="item.type === 'event' ? 'calendar' : 'box'"
                      class="w-6 h-6 text-white"
                    />
                  </div>
                </div>

                <!-- Item Details -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-gray-900 truncate">
                    {{ item.title }}
                  </h3>
                  <p class="text-xs text-gray-500 mt-1">
                    Qty: {{ item.quantity }}
                  </p>
                  <p v-if="item.eventDate" class="text-xs text-gray-500">
                    {{ formatDate(item.eventDate) }}
                  </p>
                  <p v-if="item.type === 'event'" class="text-xs text-primary-700 mt-1">
                    Attendee names are collected below for this event.
                  </p>
                </div>

                <!-- Item Price -->
                <div class="text-sm font-semibold text-gray-900">
                  £{{ (item.price * item.quantity).toFixed(2) }}
                </div>
              </div>
            </div>

            <!-- Discount Code -->
            <div class="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label for="discountCode" class="block text-sm font-medium text-gray-700 mb-2">
                Discount Code
              </label>
              <input
                id="discountCode"
                v-model="form.discountCode"
                type="text"
                autocapitalize="characters"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :class="{ 'border-red-500': errors.discountCode }"
                placeholder="Enter your code"
              />
              <p v-if="errors.discountCode" class="text-red-500 text-sm mt-1">
                {{ errors.discountCode }}
              </p>
              <p class="text-xs text-gray-500 mt-2">
                We’ll validate and apply any valid code before you reach the payment step.
              </p>
            </div>

            <!-- Totals -->
            <div class="border-t border-gray-200 pt-4 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal</span>
                <span class="font-semibold text-gray-900">£{{ cartStore.subtotal.toFixed(2) }}</span>
              </div>

              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Shipping</span>
                <span class="font-semibold text-gray-900">
                  {{ shipping === 0 ? 'FREE' : `£${shipping.toFixed(2)}` }}
                </span>
              </div>

              <div class="flex justify-between text-xs text-gray-500">
                <span>VAT (20% included)</span>
                <span>£{{ vat.toFixed(2) }}</span>
              </div>

              <div class="border-t border-gray-200 pt-3 flex justify-between">
                <span class="text-base font-bold text-gray-900">Total</span>
                <span class="text-base font-bold text-gray-900">£{{ total.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="processing"
              class="w-full mt-6 px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <font-awesome-icon v-if="processing" icon="spinner" class="w-5 h-5 animate-spin" />
              <font-awesome-icon v-else icon="lock" class="w-5 h-5" />
              <span>{{ processing ? 'Processing...' : 'Proceed to Payment' }}</span>
            </button>

            <!-- Security Notice -->
            <p class="text-xs text-gray-500 text-center mt-4">
              <font-awesome-icon icon="lock" class="w-3 h-3 mr-1" />
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import { supabase } from '../lib/supabase'

const cartStore = useCartStore()
const toastStore = useToastStore()

// Form data
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  discountCode: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  country: 'GB'
})

// Form errors
const errors = ref({})

// Processing state
const processing = ref(false)
const attendeeDrafts = ref({})

const getItemKey = (item) => {
  const id = item.id || item.productId
  return `${id}-${item.variantId || 'default'}`
}

const createEmptyAttendee = (attendee = {}) => ({
  firstName: attendee.firstName || '',
  lastName: attendee.lastName || '',
  email: attendee.email || '',
  phone: attendee.phone || '',
  notes: attendee.notes || ''
})

const normalizeAttendeeList = (attendees = [], quantity = 0) => {
  const normalized = Array.isArray(attendees)
    ? attendees.slice(0, quantity).map(createEmptyAttendee)
    : []

  while (normalized.length < quantity) {
    normalized.push(createEmptyAttendee())
  }

  return normalized
}

const syncAttendeeDrafts = () => {
  const nextDrafts = {}

  cartStore.items
    .filter(item => item.type === 'event')
    .forEach((item) => {
      const itemKey = getItemKey(item)
      const sourceAttendees = attendeeDrafts.value[itemKey] || item.attendees || []
      nextDrafts[itemKey] = normalizeAttendeeList(sourceAttendees, item.quantity)
    })

  attendeeDrafts.value = nextDrafts
}

watch(
  () => cartStore.items.map(item => ({
    key: getItemKey(item),
    type: item.type,
    quantity: item.quantity,
    attendees: item.attendees || []
  })),
  syncAttendeeDrafts,
  { deep: true, immediate: true }
)

const eventBookings = computed(() => {
  return cartStore.items
    .filter(item => item.type === 'event')
    .map((item) => {
      const itemKey = getItemKey(item)

      return {
        ...item,
        itemKey,
        attendees: attendeeDrafts.value[itemKey] || normalizeAttendeeList(item.attendees, item.quantity)
      }
    })
})

// Check if cart has physical items
const hasPhysicalItems = computed(() => {
  return cartStore.items.some(item =>
    item.type === 'product_physical' ||
    item.type === 'subscription' ||
    !item.type // Legacy items without type are assumed physical
  )
})

// Shipping calculation
const shipping = computed(() => {
  return hasPhysicalItems.value ? 5.00 : 0
})

// VAT calculation (20% included in prices)
const vat = computed(() => {
  return (cartStore.subtotal + shipping.value) * 0.2 / 1.2
})

// Total calculation
const total = computed(() => {
  return cartStore.subtotal + shipping.value
})

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Form validation
const validateForm = () => {
  errors.value = {}

  // Validate customer info
  if (!form.value.firstName.trim()) {
    errors.value.firstName = 'First name is required'
  }
  if (!form.value.lastName.trim()) {
    errors.value.lastName = 'Last name is required'
  }
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email'
  }

  // Validate attendee names for event bookings
  eventBookings.value.forEach((booking) => {
    booking.attendees.forEach((attendee, attendeeIndex) => {
      const firstNameKey = `attendee-${booking.itemKey}-${attendeeIndex}-firstName`
      const lastNameKey = `attendee-${booking.itemKey}-${attendeeIndex}-lastName`

      if (!attendee.firstName.trim()) {
        errors.value[firstNameKey] = 'First name is required'
      }

      if (!attendee.lastName.trim()) {
        errors.value[lastNameKey] = 'Last name is required'
      }
    })
  })

  // Validate shipping address if physical items
  if (hasPhysicalItems.value) {
    if (!form.value.addressLine1.trim()) {
      errors.value.addressLine1 = 'Address is required'
    }
    if (!form.value.city.trim()) {
      errors.value.city = 'City is required'
    }
    if (!form.value.postalCode.trim()) {
      errors.value.postalCode = 'Postal code is required'
    }
  }

  return Object.keys(errors.value).length === 0
}

const persistEventAttendees = (booking) => {
  cartStore.updateItemAttendees(
    booking.productId || booking.id,
    booking.attendees.map(attendee => ({ ...attendee })),
    booking.variantId
  )
}

const buildCheckoutItems = () => {
  return cartStore.items.map((item) => {
    if (item.type !== 'event') {
      return item
    }

    const itemKey = getItemKey(item)
    const attendees = normalizeAttendeeList(attendeeDrafts.value[itemKey] || item.attendees, item.quantity)
      .map(attendee => ({
        ...attendee,
        firstName: attendee.firstName.trim(),
        lastName: attendee.lastName.trim(),
        email: attendee.email?.trim() || '',
        phone: attendee.phone?.trim() || '',
        notes: attendee.notes?.trim() || ''
      }))

    cartStore.updateItemAttendees(item.productId || item.id, attendees, item.variantId)

    return {
      ...item,
      attendees
    }
  })
}

// Handle checkout
const handleCheckout = async () => {
  if (!validateForm()) {
    // Scroll to first error
    const firstError = Object.keys(errors.value)[0]
    const element = document.getElementById(firstError)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.focus()
    }
    return
  }

  try {
    processing.value = true
    const items = buildCheckoutItems()
    const discountCode = form.value.discountCode.trim().toUpperCase()

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        items,
        discountCode: discountCode || null,
        customer: {
          email: form.value.email,
          firstName: form.value.firstName,
          lastName: form.value.lastName,
          phone: form.value.phone
        },
        shipping: hasPhysicalItems.value ? {
          name: `${form.value.firstName} ${form.value.lastName}`,
          address: {
            line1: form.value.addressLine1,
            line2: form.value.addressLine2,
            city: form.value.city,
            postal_code: form.value.postalCode,
            country: form.value.country
          }
        } : null
      }
    })

    if (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }

    if (!data || !data.url) {
      throw new Error('Invalid response from checkout service')
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url

  } catch (err) {
    console.error('Checkout error:', err)

    // Extract the error message from the response
    let errorMessage = 'Failed to process checkout. Please try again.'

    if (err.context?.body) {
      try {
        const errorBody = typeof err.context.body === 'string'
          ? JSON.parse(err.context.body)
          : err.context.body
        errorMessage = errorBody.error || errorMessage
      } catch (parseError) {
        console.error('Error parsing error response:', parseError)
      }
    } else if (err.message) {
      errorMessage = err.message
    }

    // Provide specific guidance for stock/capacity errors
    if (errorMessage.includes('Insufficient stock')) {
      const match = errorMessage.match(/Insufficient stock for (.+)/)
      const productName = match ? match[1] : 'one or more items'
      toastStore.error(`${productName} is out of stock. Please remove it from your cart and try again.`)
    } else if (errorMessage.toLowerCase().includes('discount code')) {
      errors.value.discountCode = errorMessage
      const element = document.getElementById('discountCode')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    } else if (errorMessage.includes('Insufficient capacity')) {
      toastStore.error(errorMessage + ' Please reduce the number of attendees.')
    } else {
      toastStore.error(errorMessage)
    }
  } finally {
    processing.value = false
  }
}
</script>
