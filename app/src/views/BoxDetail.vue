<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="p-8">
          <h1 class="text-3xl font-display font-bold text-gray-900 mb-4">
            Box: {{ slug }}
          </h1>
          
          <div class="prose max-w-none">
            <p class="text-gray-600">
              This page will display detailed information about a specific art box:
            </p>
            <ul class="mt-4 space-y-2 text-gray-600">
              <li>• Product images gallery</li>
              <li>• Product description and details</li>
              <li>• What's included in the box</li>
              <li>• Pricing (one-time or subscription)</li>
              <li>• Product variants selector</li>
              <li>• Add to cart button</li>
              <li>• Customer reviews</li>
              <li>• Related products</li>
            </ul>
          </div>
          
          <div class="mt-8 flex gap-4">
            <router-link 
              to="/boxes" 
              class="text-secondary-600 hover:text-secondary-700"
            >
              ← Back to Boxes
            </router-link>
            
            <button class="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700">
              Add to Cart
            </button>
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

