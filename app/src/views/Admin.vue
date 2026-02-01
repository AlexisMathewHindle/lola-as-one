<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-display font-bold text-gray-900 mb-8">
        Admin Dashboard
      </h1>
      
      <div v-if="authStore.isAdmin" class="space-y-8">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-sm font-medium text-gray-600 mb-2">Total Orders</h3>
            <p class="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-sm font-medium text-gray-600 mb-2">Active Subscriptions</h3>
            <p class="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-sm font-medium text-gray-600 mb-2">Upcoming Workshops</h3>
            <p class="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-sm font-medium text-gray-600 mb-2">Low Stock Items</h3>
            <p class="text-3xl font-bold text-red-600">-</p>
          </div>
        </div>
        
        <!-- Admin Navigation -->
        <div class="bg-white rounded-lg shadow-md p-8">
          <h2 class="text-2xl font-semibold text-gray-900 mb-6">
            Management
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Workshops
              </h3>
              <p class="text-sm text-gray-600">
                Manage events, capacity, and bookings
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Products
              </h3>
              <p class="text-sm text-gray-600">
                Manage boxes, inventory, and variants
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Orders
              </h3>
              <p class="text-sm text-gray-600">
                View and manage customer orders
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Subscriptions
              </h3>
              <p class="text-sm text-gray-600">
                Manage recurring subscriptions
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Blog Posts
              </h3>
              <p class="text-sm text-gray-600">
                Create and edit blog content
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Content Pages
              </h3>
              <p class="text-sm text-gray-600">
                Manage static pages and FAQs
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Customers
              </h3>
              <p class="text-sm text-gray-600">
                View customer accounts and history
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Reviews
              </h3>
              <p class="text-sm text-gray-600">
                Moderate product reviews
              </p>
            </a>
            
            <a href="#" class="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                Settings
              </h3>
              <p class="text-sm text-gray-600">
                Site configuration and preferences
              </p>
            </a>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-red-600 text-lg">
          Access Denied: Admin privileges required
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

