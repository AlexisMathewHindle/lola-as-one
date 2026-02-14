<template>
  <v-container>
    <h2 class="mt-10 text-center">Thank you for booking a LOLA workshop</h2>
    <v-card class="my-10 pa-7">
      <h2>Your booking id is #{{ bookingId }}</h2>
      <p>Check your email for confirmation</p>
      <p>See you soon!</p>
    </v-card>
  </v-container>
</template>
<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "ThankYouComponent",
  props: {
    bookingId: {
      required: true,
      type: String,
    },
  },
});
</script>
