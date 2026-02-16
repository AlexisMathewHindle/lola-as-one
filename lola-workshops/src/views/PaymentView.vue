<template>
  <div>
    <div v-if="siblingDiscountAmount">
      <p class="mb-0">
        Sibling discount of £{{ Number(siblingDiscountAmount).toFixed(2) }}
        applied
      </p>
    </div>
    <h2 class="mb-4">Total to be paid: £{{ total }}</h2>
    <form @submit.prevent="handleSubmit">
      <div class="mb-4" id="payment-request-button"></div>
      <!-- Apple Pay/Google Pay Button -->
      <div id="card-element"></div>
      <!-- Card Payment -->
      <v-btn class="mt-4" type="submit" color="#D8B061" :disabled="loading">
        <template v-if="loading">
          <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
          Processing...
        </template>
        <template v-else> Pay £{{ total }} </template>
      </v-btn>
    </form>
    <p v-if="errorMessage" class="error mt-4 font-weight-bold">
      {{ errorMessage }}
    </p>
    <v-snackbar v-model="snackbar" :timeout="3000" color="#D8B061">{{
      snackbarText
    }}</v-snackbar>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

// import { loadStripe } from "@stripe/stripe-js"; // No longer needed - using Stripe Checkout
// import { getFirestore, collection, addDoc, updateDoc, doc } from "@/main"; // Firebase - deprecated
// import { getFunctions, httpsCallable } from "firebase/functions"; // Firebase - deprecated
import { supabase } from "@/lib/supabase";

export default {
  setup() {
    const store = useStore();
    const router = useRouter();

    // NOTE: Stripe elements no longer needed - using Stripe Checkout instead
    // const stripePromise = loadStripe(import.meta.env.VUE_APP_STRIPE_PUBLISHABLE_KEY);
    // const cardElement = ref(null);
    // const paymentRequest = ref(null);

    const basket = computed(() => store.state.basket);
    const total = computed(() => store.getters.total?.toFixed(2));
    const snackbar = ref(false);
    const snackbarText = ref("");
    const errorMessage = ref("");
    const loading = ref(false);

    const siblingDiscountAmount = computed(() => {
      return store.state.sibling_discount?.amount;
    });

    const handleSubmit = async () => {
      loading.value = true;
      errorMessage.value = "";

      try {
        // Prepare items for checkout
        const items = basket.value.map(item => ({
          id: item.event_id || item.id,
          title: item.event_title || item.title,
          price: item.price,
          quantity: item.quantity || 1,
          type: 'event',
          eventDate: item.event_date,
          eventTime: item.event_time,
          // Include attendee details if available
          attendees: item.attendees || []
        }));

        // Prepare customer data
        const customer = {
          email: store.state.booking.email,
          firstName: store.state.booking.name.split(' ')[0] || store.state.booking.name,
          lastName: store.state.booking.name.split(' ').slice(1).join(' ') || '',
          phone: store.state.booking.phone || ''
        };

        console.log('Creating checkout session with:', { items, customer });

        // Call Supabase Edge Function to create checkout session
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            items,
            customer,
            // No shipping needed for events
            shipping: undefined
          }
        });

        if (error) {
          console.error('Error creating checkout session:', error);
          throw new Error(error.message || 'Failed to create checkout session');
        }

        if (!data || !data.url) {
          throw new Error('Invalid response from checkout service');
        }

        console.log('Checkout session created, redirecting to:', data.url);

        // Redirect to Stripe Checkout
        // The webhook will handle booking creation after successful payment
        window.location.href = data.url;

      } catch (error) {
        console.error('Checkout error:', error);
        errorMessage.value = error.message || 'An error occurred during checkout';
        loading.value = false;
      }
    };

    // NOTE: Payment Request API (Apple Pay/Google Pay) is not needed with Stripe Checkout
    // Stripe Checkout handles all payment methods including Apple Pay and Google Pay
    // Commenting out for now - can be removed entirely later
    /*
    const setupPaymentRequest = async (stripe) => {
      // This function is deprecated - using Stripe Checkout instead
    };
    */

    // NOTE: These Firebase functions are no longer needed
    // The Stripe webhook handles booking creation and capacity updates
    // Keeping them commented for reference during migration
    /*
    const saveBooking = async () => {
      // Deprecated - webhook handles this
    };

    const updateThemeQuantities = async () => {
      // Deprecated - webhook handles this
    };

    const updateAdultWorkshops = async (workshop) => {
      // Deprecated - webhook handles this
    };

    const updateFirestoreTheme = async (theme) => {
      // Deprecated - webhook handles this
    };
    */

    // Check if booking is empty, redirect to registration view if empty
    const emptyBookingState = () => {
      if (Object.keys(store.state.booking).length === 0) {
        router.push({ name: "registration" });
      }
    };

    onMounted(async () => {
      emptyBookingState();
      // NOTE: Card element setup is no longer needed with Stripe Checkout
      // Stripe Checkout provides its own hosted payment form
      // Keeping this commented for reference
      /*
      const stripe = await stripePromise;
      const elements = stripe.elements();
      cardElement.value = elements.create("card", {
        style: {
          base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSize: "16px",
            "::placeholder": {
              color: "#aab7c4",
            },
          },
        },
      });
      cardElement.value.mount("#card-element");
      */
    });

    return {
      handleSubmit,
      errorMessage,
      snackbarText,
      snackbar,
      total,
      siblingDiscountAmount,
      loading,
    };
  },
};
</script>
