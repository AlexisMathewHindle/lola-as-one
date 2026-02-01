<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-display font-bold text-gray-900 mb-8">
        My Account
      </h1>
      
      <div v-if="authStore.user" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Sidebar Navigation -->
        <div class="md:col-span-1">
          <nav class="bg-white rounded-lg shadow-md p-4 space-y-2">
            <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Profile
            </a>
            <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Orders
            </a>
            <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Subscriptions
            </a>
            <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Bookings
            </a>
            <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              Addresses
            </a>
            <button 
              @click="handleSignOut"
              class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              Sign Out
            </button>
          </nav>
        </div>
        
        <!-- Main Content -->
        <div class="md:col-span-2">
          <div class="bg-white rounded-lg shadow-md p-8">
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">
              Profile Information
            </h2>
            
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-600">Email</p>
                <p class="text-gray-900">{{ authStore.user.email }}</p>
              </div>
              
              <div class="mt-6">
                <p class="text-gray-600">
                  This page will include:
                </p>
                <ul class="mt-4 space-y-2 text-gray-600">
                  <li>• Profile management</li>
                  <li>• Order history</li>
                  <li>• Active subscriptions (pause/resume/cancel)</li>
                  <li>• Workshop bookings</li>
                  <li>• Saved addresses</li>
                  <li>• Payment methods</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-600 mb-4">Please sign in to view your account</p>
        <router-link 
          to="/login"
          class="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Sign In
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function handleSignOut() {
  await authStore.signOut()
  router.push('/')
}
</script>

