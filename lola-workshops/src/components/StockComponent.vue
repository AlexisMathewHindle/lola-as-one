<template>
  <div class="c-stock">
    <p class="mb-0" v-if="stock <= 0">
      This event is currently sold out. Please check back later for more
      availability.
    </p>
    <p class="mb-0" v-else-if="stock < 5">
      Only {{ stock }} space<template v-if="stock > 1">s</template> left!
    </p>
    <p class="mb-0" v-else>{{ stock }} spaces left!</p>
  </div>
</template>

<script setup>
import { defineProps } from "vue";

// Define the props with their types
defineProps({
  stock: Number,
  category: String,
});
</script>

<style scoped>
.c-stock {
  color: var(--tan);
}
</style>
