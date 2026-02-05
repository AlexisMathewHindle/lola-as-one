<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all"
            @click.stop
          >
            <!-- Close Button -->
            <button
              @click="closeModal"
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <font-awesome-icon icon="times" class="w-5 h-5" />
            </button>

            <!-- Header -->
            <div class="mb-6">
              <div class="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                <font-awesome-icon icon="bell" class="w-6 h-6 text-primary-600" />
              </div>
              <h2 class="text-2xl font-display font-bold text-gray-900 mb-2">
                Join Event Waitlist
              </h2>
              <p class="text-gray-600">
                We'll notify you if a space becomes available for this workshop.
              </p>
            </div>

            <!-- Success State -->
            <div v-if="submitted" class="text-center py-8">
              <div class="flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mx-auto mb-4">
                <font-awesome-icon icon="check-circle" class="w-8 h-8 text-success-600" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                You're on the waitlist!
              </h3>
              <p class="text-gray-600 mb-6">
                We'll email you at <strong>{{ form.email }}</strong> if a space becomes available.
              </p>
              <button
                @click="closeModal"
                class="w-full py-3 px-6 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>

            <!-- Form -->
            <form v-else @submit.prevent="handleSubmit" class="space-y-4">
              <!-- First Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.firstName"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="John"
                />
              </div>

              <!-- Last Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.lastName"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Doe"
                />
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Email <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="john@example.com"
                />
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="07123 456789"
                />
              </div>

              <!-- Number of Spots -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Number of Spots Requested <span class="text-red-500">*</span>
                </label>
                <select
                  v-model.number="form.spacesRequested"
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option v-for="n in 10" :key="n" :value="n">{{ n }} {{ n === 1 ? 'spot' : 'spots' }}</option>
                </select>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special requirements or questions..."
                ></textarea>
              </div>

              <!-- Error Message -->
              <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
                <p class="text-sm text-red-700">{{ error }}</p>
              </div>

              <!-- Submit Buttons -->
              <div class="flex gap-3 mt-6">
                <button
                  type="button"
                  @click="closeModal"
                  class="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="submitting"
                  class="flex-1 py-3 px-6 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <font-awesome-icon v-if="submitting" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
                  {{ submitting ? 'Joining...' : 'Join Waitlist' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  eventId: {
    type: String,
    required: true
  },
  eventTitle: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

// State
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  spacesRequested: 1,
  notes: ''
})

const submitting = ref(false)
const submitted = ref(false)
const error = ref(null)

// Close modal
const closeModal = () => {
  if (!submitting.value) {
    emit('update:modelValue', false)
    // Reset form after modal closes
    setTimeout(() => {
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        spacesRequested: 1,
        notes: ''
      }
      submitted.value = false
      error.value = null
    }, 300)
  }
}

// Handle form submission
const handleSubmit = async () => {
  try {
    submitting.value = true
    error.value = null

    // Insert into event_waitlist_entries table
    const { data, error: insertError } = await supabase
      .from('event_waitlist_entries')
      .insert({
        offering_event_id: props.eventId,
        customer_name: `${form.value.firstName} ${form.value.lastName}`,
        customer_email: form.value.email,
        customer_phone: form.value.phone || null,
        spaces_requested: form.value.spacesRequested,
        notes: form.value.notes || null,
        status: 'waiting'
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Show success state
    submitted.value = true

    // Emit success event
    emit('success', data)

    // Auto-close after 3 seconds
    setTimeout(() => {
      closeModal()
    }, 3000)
  } catch (err) {
    console.error('Error joining waitlist:', err)
    error.value = err.message || 'Failed to join waitlist. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>

