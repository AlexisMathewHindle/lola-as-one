<template>
  <div class="c-order-success">
    <v-container>
      <!-- Success Message -->
      <v-card class="pa-7 text-center my-10 v-card v-theme--light v-card--density-default v-card--variant-elevated px-10">
        <!-- <v-icon size="100" class="mb-4 success-icon">mdi-check-circle</v-icon> -->
        <h1 class="mb-4">Thank You for Your Order!</h1>
        <p class="mb-6">Your order has been successfully placed and confirmed.</p>

        <v-alert type="info" variant="tonal" class="text-left mb-6 info-alert">
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

        <v-alert type="success" variant="tonal" class="text-left mb-6 success-alert">
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
        <div class="mt-8 button-container">
          <!-- <v-btn class="btn white--text" size="large" to="/">
            <v-icon class="mr-2">mdi-home</v-icon>
            Return Home
          </v-btn> -->
          <v-btn class="btn white--text" size="large" to="/">
            <v-icon class="mr-2">mdi-calendar</v-icon>
            View More Workshops
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </div>
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
  font-family: 'Source Sans Pro', sans-serif;
}

.c-order-success .v-container {
  max-width: 800px;
  margin: 0 auto;
}

.c-order-success h1 {
  font-family: 'Source Sans Pro', sans-serif;
  font-weight: 300;
  color: var(--dark-grey);
  font-size: 1.9em;
  line-height: 1.4;
}

.c-order-success p {
  font-size: 16px;
  color: var(--dark-grey);
  line-height: 24px;
}

.success-icon {
  color: #4caf50;
}

.info-alert {
  border-left: 4px solid #2196f3;
}

.success-alert {
  border-left: 4px solid #4caf50;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

@media screen and (min-width: 600px) {
  .button-container {
    flex-direction: row;
    justify-content: center;
  }
}

.c-order-success .btn {
  background-color: var(--yellow);
  color: var(--white);
  font-weight: 500;
}

.c-order-success .btn:hover {
  background-color: var(--tan);
}

.c-order-success .v-card {
  background-color: var(--white);
  border: 1px solid var(--light-grey);
}
</style>

