<template>
  <v-container class="c-order-success">
    <!-- Success Message -->
    <v-card class="pa-8 text-center my-10">
      <v-icon size="100" color="success" class="mb-4">mdi-check-circle</v-icon>
      <h1 class="text-h3 mb-4">Thank You for Your Order!</h1>
      <p class="text-h6 mb-6">Your order has been successfully placed and confirmed.</p>

      <v-alert type="info" variant="tonal" class="text-left mb-6">
        <div class="d-flex align-start">
          <v-icon class="mr-3">mdi-email</v-icon>
          <div>
            <strong class="d-block mb-2">Confirmation Email Sent</strong>
            <p class="mb-0">
              We've sent a confirmation email with your order details, booking information, and receipt.
              Please check your inbox (and spam folder just in case).
            </p>
          </div>
        </div>
      </v-alert>

      <v-alert type="success" variant="tonal" class="text-left mb-6">
        <div class="d-flex align-start">
          <v-icon class="mr-3">mdi-calendar-check</v-icon>
          <div>
            <strong class="d-block mb-2">Workshop Booking Confirmed</strong>
            <p class="mb-0">
              Your workshop booking is confirmed! We'll send you a reminder email before the event with all the details you need.
            </p>
          </div>
        </div>
      </v-alert>

      <!-- Actions -->
      <div class="mt-8">
        <v-btn color="primary" size="large" to="/" class="mr-4">
          <v-icon left>mdi-home</v-icon>
          Return Home
        </v-btn>
        <v-btn color="secondary" size="large" to="/calendar">
          <v-icon left>mdi-calendar</v-icon>
          View More Workshops
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'

export default defineComponent({
  name: 'OrderSuccessView',

  setup() {
    const cartStore = useCartStore()

    onMounted(() => {
      // Clear cart after successful order
      cartStore.clearCart()
    })

    return {}
  }
})
</script>

<style scoped>
.c-order-success {
  max-width: 800px;
  margin: 0 auto;
}
</style>

