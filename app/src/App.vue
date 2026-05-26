<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import Toast from './components/Toast.vue'
import WorkshopTopBanner from './components/WorkshopTopBanner.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'))
const showWorkshopTopBanner = computed(() => route.path !== '/' && !isAdminRoute.value)
</script>

<template>
  <div id="app">
    <WorkshopTopBanner v-if="showWorkshopTopBanner" />
    <Navigation v-if="!isAdminRoute" />
    <router-view />
    <Footer v-if="!isAdminRoute" />
    <Toast />
  </div>
</template>

<style>
/* Global styles are in style.css */
</style>
