<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h1 class="text-3xl font-display font-bold text-gray-900 text-center mb-8">
          {{ isSignUp ? 'Sign Up' : 'Sign In' }}
        </h1>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Name field (only for sign up) -->
          <div v-if="isSignUp">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              v-model="fullName"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your name"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your@email.com"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              v-model="password"
              type="password"
              required
              :minlength="isSignUp ? 6 : undefined"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            >
            <p v-if="isSignUp" class="text-xs text-gray-500 mt-1">
              Minimum 6 characters
            </p>
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div v-if="success" class="text-green-600 text-sm">
            {{ success }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {{ loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
            <button
              @click="toggleMode"
              class="text-primary-600 hover:text-primary-700 font-medium"
            >
              {{ isSignUp ? 'Sign in' : 'Sign up' }}
            </button>
          </p>
          <p v-if="!isSignUp" class="text-sm text-gray-600 mt-2">
            <button
              @click="showPasswordReset = true"
              class="text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPasswordReset = ref(false)

function toggleMode() {
  isSignUp.value = !isSignUp.value
  error.value = ''
  success.value = ''
}

async function handleSubmit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    if (isSignUp.value) {
      // Sign up
      await authStore.signUp(email.value, password.value, {
        full_name: fullName.value
      })

      success.value = 'Account created! Please check your email to verify your account.'

      // Optionally auto-sign in after signup
      // await authStore.signIn(email.value, password.value)
      // const redirect = route.query.redirect || '/'
      // router.push(redirect)
    } else {
      // Sign in
      await authStore.signIn(email.value, password.value)

      // Redirect to original page or home
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    }
  } catch (err) {
    error.value = err.message || (isSignUp.value ? 'Failed to create account' : 'Failed to sign in')
  } finally {
    loading.value = false
  }
}
</script>

