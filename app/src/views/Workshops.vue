<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <div class="mb-6 sm:mb-8">
        <h1 class="mb-2 text-3xl font-display font-bold text-gray-900 sm:mb-4 sm:text-4xl">
          Creative Workshops
        </h1>
        <p class="text-base text-gray-600 sm:text-lg">
          Discover hands-on creative experiences at Lola Creative Space
        </p>
      </div>

      <WorkshopCalendar />
    </div>
  </div>
</template>

<script setup>
import WorkshopCalendar from '../components/workshops/WorkshopCalendar.vue'
</script>
