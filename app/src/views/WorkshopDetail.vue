<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="p-8">
          <h1 class="text-3xl font-display font-bold text-gray-900 mb-4">
            Workshop: {{ slug }}
          </h1>
          
          <div class="prose max-w-none">
            <p class="text-gray-600">
              This page will display detailed information about a specific workshop:
            </p>
            <ul class="mt-4 space-y-2 text-gray-600">
              <li>• Workshop title and description</li>
              <li>• Date, time, and duration</li>
              <li>• Instructor information</li>
              <li>• Available spaces</li>
              <li>• Pricing and booking form</li>
              <li>• Attendee details collection</li>
              <li>• What to bring / materials included</li>
            </ul>
          </div>
          
          <div class="mt-8">
            <router-link 
              to="/workshops" 
              class="text-primary-600 hover:text-primary-700"
            >
              ← Back to Workshops
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = route.params.slug
</script>

