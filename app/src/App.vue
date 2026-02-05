<script setup>
import Navigation from './components/Navigation.vue'
import Toast from './components/Toast.vue'
</script>

<template>
  <div id="app">
    <Navigation />
    <router-view />
    <Toast />
  </div>
</template>

<style>
/* Global styles are in style.css */
</style>
