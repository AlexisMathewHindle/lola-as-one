<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import Toast from './components/Toast.vue'
import WorkshopTopBanner from './components/WorkshopTopBanner.vue'

const route = useRoute()
const showWorkshopTopBanner = computed(() => route.path !== '/' && !route.path.startsWith('/admin'))
</script>

<template>
  <div id="app">
    <WorkshopTopBanner v-if="showWorkshopTopBanner" />
    <Navigation />
    <router-view />
    <Footer />
    <Toast />
  </div>
</template>

<style>
/* Global styles are in style.css */
</style>
