<template>
  <BookingsListComponent />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import BookingsListComponent from "@/components/BookingsListComponent.vue";

export default defineComponent({
  name: "BookingsView",

  components: {
    BookingsListComponent,
  },
});
</script>
<style scoped></style>
