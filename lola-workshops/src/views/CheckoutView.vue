<template>
  <div class="c-checkout">
    <div class="c-checkout-view">
      <v-container>
        <div v-if="!success">
          <h1 class="my-10 text-center">Checkout</h1>
          <v-card class="my-10 pa-7">
            <v-row v-if="basket.length">
              <v-col cols="12" md="7">
                <div
                  class="c-basket-view__event"
                  v-for="(theme, index) in basket"
                  :key="index"
                >
                  <!-- Check if the item is an array -->
                  <div
                    v-if="Array.isArray(theme)"
                    class="c-basket-view__themes mt-4"
                  >
                    <!-- Loop through the array items -->
                    <template v-for="(th, i) in theme" :key="i">
                      <div
                        :class="{
                          'c-basket-view__theme': i === theme.length - 1,
                        }"
                      >
                        <p class="mb-0">
                          <span class="mr-2">{{ th.quantity }}</span>
                          <span class="mr-2">x</span>
                          <span>{{ th.theme_title }}</span>
                          <span class="ml-3">£{{ th.price }}</span>
                        </p>
                      </div>
                    </template>
                  </div>

                  <!-- Handle single objects directly -->
                  <div v-else class="c-basket-view__single">
                    <p class="mb-0">
                      <span class="mr-2">{{ theme.quantity }}</span>
                      <span class="mr-2">x</span>
                      <span>{{ theme.theme_title }}</span>
                      <span class="ml-3">£{{ theme.price }}</span>
                    </p>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="5">
                <PaymentView @success="paymentSuccess" />
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col>
                <p>Your basket is empty</p>
              </v-col>
            </v-row>
          </v-card>
        </div>
        <ThankYouComponent :bookingId="bookingId" v-else />
      </v-container>
    </div>
  </div>
</template>
<script>
import { computed, defineComponent, ref } from "vue";
import { useStore } from "vuex";

import PaymentView from "@/views/PaymentView.vue";
import ThankYouComponent from "@/components/ThankYouComponent.vue";

export default defineComponent({
  name: "CheckoutView",

  components: {
    PaymentView,
    ThankYouComponent,
  },
  setup() {
    const store = useStore();
    const basket = computed(() => store.state.basket);
    const success = ref(false);
    const bookingId = ref("");

    const paymentSuccess = (id) => {
      success.value = true;
      bookingId.value = id.toUpperCase();
    };

    return {
      basket,
      paymentSuccess,
      success,
      bookingId,
    };
  },
});
</script>
