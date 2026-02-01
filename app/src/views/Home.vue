<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-display font-bold text-gray-900 mb-4">
        Welcome to Lola As One
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Discover creative workshops and art boxes
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <router-link 
          to="/workshops" 
          class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 class="text-2xl font-display font-semibold text-primary-600 mb-2">
            Creative Workshops
          </h2>
          <p class="text-gray-600">
            Join our hands-on creative experiences
          </p>
        </router-link>
        
        <router-link 
          to="/boxes" 
          class="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 class="text-2xl font-display font-semibold text-secondary-600 mb-2">
            Art Boxes
          </h2>
          <p class="text-gray-600">
            Curated art supplies delivered to your door
          </p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Home page component
</script>

