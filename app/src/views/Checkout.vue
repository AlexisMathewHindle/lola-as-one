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
                      <span v-if="booking.termLabel" class="flex items-center">
                        <font-awesome-icon icon="calendar" class="w-4 h-4 mr-1" />
                        {{ booking.termLabel }}
                      </span>
                      <span v-if="booking.isTermBundle && booking.items?.length" class="flex items-center">
                        {{ booking.items.length }} {{ booking.items.length === 1 ? 'session' : 'sessions' }}
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
                        <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <label
                            :for="`attendee-${booking.itemKey}-${attendeeIndex}-firstName`"
                            class="block text-sm font-medium text-gray-700"
                          >
                            First Name <span class="text-red-500">*</span>
                          </label>
                          <label
                            v-if="canAddAttendeeToOtherEvents(booking, attendeeIndex) && !isSyncedAttendeeField(booking, attendeeIndex)"
                            :for="`copy-attendee-${booking.itemKey}-${attendeeIndex}`"
                            class="inline-flex items-center gap-2 text-xs font-medium text-gray-700"
                          >
                            <input
                              :id="`copy-attendee-${booking.itemKey}-${attendeeIndex}`"
                              type="checkbox"
                              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              :checked="isAttendeeSyncSource(booking, attendeeIndex)"
                              @change="handleAttendeeSyncToggle(booking, attendeeIndex, $event.target.checked)"
                            />
                            <span>Apply to all workshops</span>
                          </label>
                          <span
                            v-else-if="isSyncedAttendeeField(booking, attendeeIndex)"
                            class="text-xs font-medium text-gray-500"
                          >
                            Applied from another workshop
                          </span>
                        </div>
                        <input
                          :id="`attendee-${booking.itemKey}-${attendeeIndex}-firstName`"
                          v-model="attendee.firstName"
                          type="text"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          :class="{
                            'border-red-500': errors[`attendee-${booking.itemKey}-${attendeeIndex}-firstName`],
                            'bg-gray-100 text-gray-500 cursor-not-allowed': isSyncedAttendeeField(booking, attendeeIndex)
                          }"
                          :disabled="isSyncedAttendeeField(booking, attendeeIndex)"
                          @input="handleAttendeeInput(booking, attendeeIndex)"
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
                          :class="{
                            'border-red-500': errors[`attendee-${booking.itemKey}-${attendeeIndex}-lastName`],
                            'bg-gray-100 text-gray-500 cursor-not-allowed': isSyncedAttendeeField(booking, attendeeIndex)
                          }"
                          :disabled="isSyncedAttendeeField(booking, attendeeIndex)"
                          @input="handleAttendeeInput(booking, attendeeIndex)"
                        />
                        <p
                          v-if="errors[`attendee-${booking.itemKey}-${attendeeIndex}-lastName`]"
                          class="text-red-500 text-sm mt-1"
                        >
                          {{ errors[`attendee-${booking.itemKey}-${attendeeIndex}-lastName`] }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-4">
                      <label
                        :for="`attendee-${booking.itemKey}-${attendeeIndex}-allergies`"
                        class="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Any Allergies?
                      </label>
                      <textarea
                        :id="`attendee-${booking.itemKey}-${attendeeIndex}-allergies`"
                        v-model="attendee.allergies"
                        rows="2"
                        maxlength="240"
                        placeholder="Tell us about allergies or write none"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                        :class="{
                          'bg-gray-100 text-gray-500 cursor-not-allowed': isSyncedAttendeeField(booking, attendeeIndex)
                        }"
                        :disabled="isSyncedAttendeeField(booking, attendeeIndex)"
                        @input="handleAttendeeInput(booking, attendeeIndex)"
                      ></textarea>
                      <p class="text-xs text-gray-500 mt-1">
                        Optional. Use "Apply to all workshops" above if this attendee is coming to multiple sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Checkout Agreements -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-display font-bold text-gray-900 mb-6">
              Agreements
            </h2>

            <div class="space-y-5">
              <div v-if="eventBookings.length > 0">
                <label class="flex items-start gap-3">
                  <input
                    id="healthSafetyAccepted"
                    v-model="form.healthSafetyAccepted"
                    type="checkbox"
                    class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    :class="{ 'border-red-500': errors.healthSafetyAccepted }"
                  />
                  <span class="text-sm leading-6 text-gray-700">
                    <span class="font-semibold text-gray-900">Health and Safety</span> - The children attend the art classes (although overseen by the art teacher) at their own risk. I hereby agree, that while the person/s in charge of the art class will oversee my child to the best of their ability, neither they nor any person connected with Lots of Lovely Art will accept any liability for any claims arising from any accident or injury happening to the child whilst in the session or which may arise as a result of the venue. Lots of Lovely Art undertakes that all reasonable precautions will be taken to ensure the safety and welfare of my child.
                  </span>
                </label>
                <p v-if="errors.healthSafetyAccepted" class="text-red-500 text-sm mt-1 ml-7">
                  {{ errors.healthSafetyAccepted }}
                </p>
              </div>

              <div>
                <label class="flex items-start gap-3">
                  <input
                    id="privacyPolicyAccepted"
                    v-model="form.privacyPolicyAccepted"
                    type="checkbox"
                    class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    :class="{ 'border-red-500': errors.privacyPolicyAccepted }"
                  />
                  <span class="text-sm leading-6 text-gray-700">
                    Agree to our
                    <router-link class="font-semibold text-primary-600 hover:text-primary-700" to="/privacy-policy">
                      Privacy Policy
                    </router-link>
                  </span>
                </label>
                <p v-if="errors.privacyPolicyAccepted" class="text-red-500 text-sm mt-1 ml-7">
                  {{ errors.privacyPolicyAccepted }}
                </p>
              </div>

              <label class="flex items-start gap-3">
                <input
                  id="newsletterOptIn"
                  v-model="form.newsletterOptIn"
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm leading-6 text-gray-700">
                  Newsletters and updates
                </span>
              </label>
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
                  <p v-else-if="item.termLabel" class="text-xs text-gray-500">
                    {{ item.termLabel }}
                  </p>
                  <p v-if="item.isTermBundle && item.items?.length" class="text-xs text-gray-500">
                    {{ item.items.length }} {{ item.items.length === 1 ? 'session' : 'sessions' }}
                  </p>
                </div>

                <!-- Item Price -->
                <div class="text-sm font-semibold text-gray-900">
                  £{{ (Number(item.price || 0) * item.quantity).toFixed(2) }}
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

              <div v-if="siblingDiscountEstimate > 0" class="flex justify-between text-sm text-green-700">
                <span>Sibling discount</span>
                <span class="font-semibold">-£{{ siblingDiscountEstimate.toFixed(2) }}</span>
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

            <p class="mt-3 text-center text-xs leading-5 text-gray-500">
              Workshop questions are covered in
              <router-link class="font-semibold text-primary-600 hover:text-primary-700" to="/workshop-faqs">
                Workshop FAQs
              </router-link>.
            </p>

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
  healthSafetyAccepted: false,
  privacyPolicyAccepted: false,
  newsletterOptIn: false,
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
const attendeeEventSyncSources = ref({})

const getItemKey = (item) => {
  const id = item.id || item.productId
  return `${id}-${item.variantId || 'default'}`
}

const createEmptyAttendee = (attendee = {}) => ({
  firstName: attendee.firstName || '',
  lastName: attendee.lastName || '',
  email: attendee.email || '',
  phone: attendee.phone || '',
  allergies: attendee.allergies || attendee.allergy || '',
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

const hasMultipleEventBookings = computed(() => eventBookings.value.length > 1)

const getAttendeeSyncKey = (attendeeIndex) => String(attendeeIndex)

const getAttendeeSyncSourceItemKey = (attendeeIndex) => {
  return attendeeEventSyncSources.value[getAttendeeSyncKey(attendeeIndex)]
}

const getAttendeeSyncSourceBooking = (attendeeIndex) => {
  const sourceItemKey = getAttendeeSyncSourceItemKey(attendeeIndex)
  return eventBookings.value.find(booking => booking.itemKey === sourceItemKey) || null
}

const canAddAttendeeToOtherEvents = (booking, attendeeIndex) => {
  return hasMultipleEventBookings.value && eventBookings.value.some((otherBooking) => {
    return otherBooking.itemKey !== booking.itemKey && Boolean(otherBooking.attendees[attendeeIndex])
  })
}

const isAttendeeSyncSource = (booking, attendeeIndex) => {
  return getAttendeeSyncSourceItemKey(attendeeIndex) === booking.itemKey
}

const isSyncedAttendeeField = (booking, attendeeIndex) => {
  const sourceBooking = getAttendeeSyncSourceBooking(attendeeIndex)
  return Boolean(sourceBooking && sourceBooking.itemKey !== booking.itemKey)
}

const clearSyncedAttendeeErrors = (attendeeIndex) => {
  const nextErrors = { ...errors.value }

  eventBookings.value.forEach((booking) => {
    if (!isSyncedAttendeeField(booking, attendeeIndex)) {
      return
    }

    delete nextErrors[`attendee-${booking.itemKey}-${attendeeIndex}-firstName`]
    delete nextErrors[`attendee-${booking.itemKey}-${attendeeIndex}-lastName`]
  })

  errors.value = nextErrors
}

const applyAttendeeToOtherEvents = (sourceBooking, attendeeIndex) => {
  const sourceAttendee = sourceBooking?.attendees?.[attendeeIndex]

  if (!sourceAttendee) {
    return
  }

  eventBookings.value.forEach((booking) => {
    const attendee = booking.attendees[attendeeIndex]

    if (attendee && booking.itemKey !== sourceBooking.itemKey) {
      attendee.firstName = sourceAttendee.firstName
      attendee.lastName = sourceAttendee.lastName
      attendee.allergies = sourceAttendee.allergies || ''
    }

    persistEventAttendees(booking)
  })
}

const applyActiveAttendeeSyncs = () => {
  Object.entries(attendeeEventSyncSources.value).forEach(([attendeeIndexKey, sourceItemKey]) => {
    const attendeeIndex = Number(attendeeIndexKey)
    const sourceBooking = eventBookings.value.find(booking => booking.itemKey === sourceItemKey)

    if (sourceBooking) {
      applyAttendeeToOtherEvents(sourceBooking, attendeeIndex)
    }
  })
}

const handleAttendeeSyncToggle = (booking, attendeeIndex, checked) => {
  const syncKey = getAttendeeSyncKey(attendeeIndex)

  if (!checked) {
    if (isAttendeeSyncSource(booking, attendeeIndex)) {
      const nextSources = { ...attendeeEventSyncSources.value }
      delete nextSources[syncKey]
      attendeeEventSyncSources.value = nextSources
    }

    return
  }

  attendeeEventSyncSources.value = {
    ...attendeeEventSyncSources.value,
    [syncKey]: booking.itemKey
  }

  applyAttendeeToOtherEvents(booking, attendeeIndex)
  clearSyncedAttendeeErrors(attendeeIndex)
}

const handleAttendeeInput = (booking, attendeeIndex) => {
  if (isAttendeeSyncSource(booking, attendeeIndex)) {
    applyAttendeeToOtherEvents(booking, attendeeIndex)
    return
  }

  persistEventAttendees(booking)
}

watch(hasMultipleEventBookings, (canApply) => {
  if (!canApply) {
    attendeeEventSyncSources.value = {}
  }
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

const isAdultWorkshopCartItem = (item) => {
  return item.categoryLayout === 'adult_workshop' ||
    item.category_layout === 'adult_workshop' ||
    item.layout_key === 'adult_workshop'
}

const getSiblingEligibleLineTotal = (item) => {
  if (item.type !== 'event' || isAdultWorkshopCartItem(item)) {
    return 0
  }

  const quantity = Number(item.quantity || 0)

  if (quantity < 2) {
    return 0
  }

  if (Array.isArray(item.items) && item.items.length > 0) {
    return item.items.reduce((sum, session) => {
      return sum + Number(session.price || 0)
    }, 0) * quantity
  }

  return Number(item.price || 0) * quantity
}

const siblingDiscountEstimate = computed(() => {
  const eligibleSubtotal = cartStore.items.reduce((sum, item) => {
    return sum + getSiblingEligibleLineTotal(item)
  }, 0)

  return Math.round(eligibleSubtotal * 10) / 100
})

// VAT calculation (20% included in prices)
const vat = computed(() => {
  return total.value * 0.2 / 1.2
})

// Total calculation
const total = computed(() => {
  return Math.max(0, cartStore.subtotal + shipping.value - siblingDiscountEstimate.value)
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

  applyActiveAttendeeSyncs()

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
      if (isSyncedAttendeeField(booking, attendeeIndex)) {
        return
      }

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

  if (eventBookings.value.length > 0 && !form.value.healthSafetyAccepted) {
    errors.value.healthSafetyAccepted = 'Please accept the health and safety agreement'
  }

  if (!form.value.privacyPolicyAccepted) {
    errors.value.privacyPolicyAccepted = 'Please agree to the Privacy Policy'
  }

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

const buildExpandedEventItems = (item, attendees) => {
  return item.items.map((session) => ({
    id: session.offering_id || session.id,
    productId: session.event_id || session.offering_event_id || session.id,
    offering_id: session.offering_id || item.offering_id || null,
    event_id: session.event_id || session.offering_event_id || session.id,
    type: 'event',
    title: session.title || item.title,
    event_title: item.title,
    price: Number(session.price || 0),
    quantity: item.quantity,
    image: session.image || item.image,
    slug: session.slug || item.slug,
    eventDate: session.eventDate || session.event_date,
    eventTime: session.eventTime || session.event_start_time,
    categoryLayout: session.categoryLayout || session.category_layout || item.categoryLayout || item.category_layout || null,
    categorySlug: session.categorySlug || session.category_slug || item.categorySlug || item.category_slug || null,
    categoryName: session.categoryName || session.category_name || item.categoryName || item.category_name || null,
    attendees
  }))
}

const buildCheckoutItems = () => {
  applyActiveAttendeeSyncs()

  return cartStore.items.flatMap((item) => {
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
        allergies: attendee.allergies?.trim().slice(0, 240) || '',
        notes: attendee.notes?.trim() || ''
      }))

    cartStore.updateItemAttendees(item.productId || item.id, attendees, item.variantId)

    if (Array.isArray(item.items) && item.items.length > 0) {
      return buildExpandedEventItems(item, attendees)
    }

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
        consents: {
          healthSafetyAccepted: Boolean(form.value.healthSafetyAccepted),
          privacyPolicyAccepted: Boolean(form.value.privacyPolicyAccepted),
          newsletterOptIn: Boolean(form.value.newsletterOptIn)
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
