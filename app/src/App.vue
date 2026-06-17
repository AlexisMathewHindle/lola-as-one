<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import Toast from './components/Toast.vue'
import WorkshopTopBanner from './components/WorkshopTopBanner.vue'
import { useCartStore } from './stores/cart'
import { clearCartForCompletedPendingCheckout } from './utils/pendingCheckoutSession'

const route = useRoute()
const cartStore = useCartStore()
const isAdminRoute = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'))
const showWorkshopTopBanner = computed(() => route.path !== '/' && !isAdminRoute.value)

onMounted(() => {
  clearCartForCompletedPendingCheckout(cartStore)
})
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
