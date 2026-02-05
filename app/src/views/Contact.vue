<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
            Get in <span class="text-primary-600">Touch</span>
          </h1>
          <p class="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
            Have questions about workshops or art boxes? We'd love to hear from you!
          </p>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary-200 rounded-full opacity-20 blur-3xl"></div>
    </section>

    <!-- Contact Content Section -->
    <section class="py-16 sm:py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Contact Information -->
          <div>
            <h2 class="text-3xl font-display font-bold text-gray-900 mb-6">
              Contact Information
            </h2>
            <p class="text-lg text-gray-600 mb-8">
              We're here to help! Reach out to us through any of the following channels, or use the contact form to send us a message.
            </p>

            <div class="space-y-6">
              <!-- Email -->
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="envelope" class="text-xl text-primary-600" />
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                  <a href="mailto:hello@lolaasone.com" class="text-primary-600 hover:text-primary-700">
                    hello@lolaasone.com
                  </a>
                  <p class="text-sm text-gray-500 mt-1">We'll respond within 24 hours</p>
                </div>
              </div>

              <!-- Phone -->
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="phone" class="text-xl text-secondary-600" />
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">Phone</h3>
                  <a href="tel:+441234567890" class="text-primary-600 hover:text-primary-700">
                    +44 (0) 123 456 7890
                  </a>
                  <p class="text-sm text-gray-500 mt-1">Mon-Fri, 9am-5pm GMT</p>
                </div>
              </div>

              <!-- Address -->
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="location-dot" class="text-xl text-success-600" />
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">Address</h3>
                  <p class="text-gray-600">
                    Lola Creative Space<br>
                    123 Creative Street<br>
                    London, UK<br>
                    SW1A 1AA
                  </p>
                </div>
              </div>

              <!-- Social Media -->
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-br from-warning-100 to-warning-200 rounded-lg flex items-center justify-center">
                    <font-awesome-icon icon="share-nodes" class="text-xl text-warning-600" />
                  </div>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Follow Us</h3>
                  <div class="flex gap-3">
                    <a href="#" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                      <font-awesome-icon :icon="['fab', 'instagram']" />
                    </a>
                    <a href="#" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                      <font-awesome-icon :icon="['fab', 'facebook']" />
                    </a>
                    <a href="#" class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                      <font-awesome-icon :icon="['fab', 'pinterest']" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Opening Hours -->
            <div class="mt-8 bg-white rounded-xl shadow-md p-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">Opening Hours</h3>
              <div class="space-y-2 text-gray-600">
                <div class="flex justify-between">
                  <span>Monday - Friday</span>
                  <span class="font-semibold">9:00 AM - 5:00 PM</span>
                </div>
                <div class="flex justify-between">
                  <span>Saturday</span>
                  <span class="font-semibold">10:00 AM - 4:00 PM</span>
                </div>
                <div class="flex justify-between">
                  <span>Sunday</span>
                  <span class="font-semibold">Closed</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div>
            <div class="bg-white rounded-xl shadow-md p-8">
              <h2 class="text-3xl font-display font-bold text-gray-900 mb-6">
                Send a Message
              </h2>

              <!-- Success Message -->
              <div v-if="formSuccess" class="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg">
                <div class="flex items-center">
                  <font-awesome-icon icon="check-circle" class="text-success-600 text-xl mr-3" />
                  <div>
                    <p class="font-semibold text-success-900">Message sent successfully!</p>
                    <p class="text-sm text-success-700">We'll get back to you as soon as possible.</p>
                  </div>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="formError" class="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <div class="flex items-center">
                  <font-awesome-icon icon="exclamation-circle" class="text-danger-600 text-xl mr-3" />
                  <div>
                    <p class="font-semibold text-danger-900">Failed to send message</p>
                    <p class="text-sm text-danger-700">{{ formError }}</p>
                  </div>
                </div>
              </div>

              <form @submit.prevent="handleSubmit" class="space-y-6">
                <!-- Name -->
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                    Name <span class="text-danger-600">*</span>
                  </label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    :class="{ 'border-danger-500': errors.name }"
                    placeholder="Your name"
                    :disabled="formSubmitting"
                  >
                  <p v-if="errors.name" class="mt-1 text-sm text-danger-600">{{ errors.name }}</p>
                </div>

                <!-- Email -->
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    Email <span class="text-danger-600">*</span>
                  </label>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    :class="{ 'border-danger-500': errors.email }"
                    placeholder="your@email.com"
                    :disabled="formSubmitting"
                  >
                  <p v-if="errors.email" class="mt-1 text-sm text-danger-600">{{ errors.email }}</p>
                </div>

                <!-- Subject -->
                <div>
                  <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    id="subject"
                    v-model="form.subject"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="What is this about?"
                    :disabled="formSubmitting"
                  >
                </div>

                <!-- Message -->
                <div>
                  <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                    Message <span class="text-danger-600">*</span>
                  </label>
                  <textarea
                    id="message"
                    v-model="form.message"
                    rows="5"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                    :class="{ 'border-danger-500': errors.message }"
                    placeholder="How can we help you?"
                    :disabled="formSubmitting"
                  ></textarea>
                  <p v-if="errors.message" class="mt-1 text-sm text-danger-600">{{ errors.message }}</p>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  class="w-full px-6 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  :disabled="formSubmitting"
                >
                  <span v-if="!formSubmitting" class="flex items-center justify-center">
                    <font-awesome-icon icon="paper-plane" class="mr-2" />
                    Send Message
                  </span>
                  <span v-else class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

// Form data
const form = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

// Form state
const formSubmitting = ref(false)
const formSuccess = ref(false)
const formError = ref(null)
const errors = ref({})

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate form
const validateForm = () => {
  errors.value = {}
  let isValid = true

  // Validate name
  if (!form.value.name || form.value.name.trim().length < 2) {
    errors.value.name = 'Please enter your name (at least 2 characters)'
    isValid = false
  }

  // Validate email
  if (!form.value.email || !emailRegex.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    isValid = false
  }

  // Validate message
  if (!form.value.message || form.value.message.trim().length < 10) {
    errors.value.message = 'Please enter a message (at least 10 characters)'
    isValid = false
  }

  return isValid
}

// Handle form submission
const handleSubmit = async () => {
  // Reset states
  formSuccess.value = false
  formError.value = null

  // Validate form
  if (!validateForm()) {
    return
  }

  try {
    formSubmitting.value = true

    // TODO: For v1, store in database. For v2, create Edge Function to send email
    // Insert into contact_submissions table
    const { error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          name: form.value.name.trim(),
          email: form.value.email.trim(),
          subject: form.value.subject.trim() || null,
          message: form.value.message.trim(),
          status: 'new'
        }
      ])

    if (error) throw error

    // Show success message
    formSuccess.value = true

    // Reset form
    form.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    }

    // Hide success message after 5 seconds
    setTimeout(() => {
      formSuccess.value = false
    }, 5000)
  } catch (err) {
    console.error('Contact form submission error:', err)
    formError.value = 'Failed to send message. Please try again or email us directly.'
  } finally {
    formSubmitting.value = false
  }
}
</script>

