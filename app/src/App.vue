<script setup>
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import Toast from './components/Toast.vue'
</script>

<template>
  <div id="app">
    <Navigation />
    <router-view />
    <Footer />
    <Toast />
  </div>
</template>

<style>
/* Global styles are in style.css */
</style>
