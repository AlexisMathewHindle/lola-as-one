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

import { loadStripe } from "@stripe/stripe-js";
import { getFirestore, collection, addDoc, updateDoc, doc } from "@/main";
import { getFunctions, httpsCallable } from "firebase/functions";

export default {
  setup(_, { emit }) {
    const store = useStore();
    const router = useRouter();
    const stripePromise = loadStripe("pk_live_6rRGhnrjgOYN9EdPedNqZKYn"); // Use live key for production
    const basket = computed(() => store.state.basket);
    const total = computed(() => store.getters.total?.toFixed(2));
    const snackbar = ref(false);
    const snackbarText = ref("");
    const cardElement = ref(null);
    const paymentRequest = ref(null); // For ApplePay/GooglePay
    const errorMessage = ref("");
    const loading = ref(false);

    const siblingDiscountAmount = computed(() => {
      return store.state.sibling_discount?.amount;
    });

    const handleSubmit = async () => {
      loading.value = true;
      try {
        const stripe = await stripePromise;
        const functions = getFunctions();
        const createPaymentIntent = httpsCallable(
          functions,
          "stripe-createPaymentIntent"
        );
        const { name, email } = store.state.booking;
        // Ensure total is a valid number
        const totalAmount = store.state.total || 0;
        if (totalAmount <= 0) {
          errorMessage.value = "Invalid payment amount";
          loading.value = false;
          return;
        }
        const response = await createPaymentIntent({
          amount: totalAmount,
          name,
          email,
        });

        // Safely destructure the response
        if (!response?.data) {
          errorMessage.value = "Payment setup failed";
          loading.value = false;
          return;
        }

        const { data } = response;
        const { clientSecret } = data;
        if (data.error) {
          errorMessage.value = data.error;
          loading.value = false;
          return;
        }

        const { error } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement.value,
          },
        });

        if (error) {
          loading.value = false;
          errorMessage.value = error.message;
        } else {
          saveBooking();
          updateThemeQuantities();
        }
      } catch (error) {
        errorMessage.value = error.message;
        loading.value = false;
      }
    };

    // Setup Stripe Payment Request for Apple Pay/Google Pay
    const setupPaymentRequest = async (stripe) => {
      try {
        const functions = getFunctions();
        const createPaymentIntent = httpsCallable(
          functions,
          "stripe-createPaymentIntent"
        );

        const { name, email } = store.state.booking;
        const totalAmount = store.state.total || 0;
        if (totalAmount <= 0) {
          errorMessage.value = "Invalid payment amount";
          return;
        }

        const response = await createPaymentIntent({
          amount: totalAmount,
          name,
          email,
        });

        if (!response?.data) {
          errorMessage.value = "Payment setup failed";
          return;
        }

        const { data } = response;
        const clientSecret = data.clientSecret;

        if (data.error) {
          errorMessage.value = data.error;
          return;
        }

        const totalAmountInCents = Number(store.getters.total).toFixed(2) * 100;
        paymentRequest.value = stripe.paymentRequest({
          country: "GB",
          currency: "gbp",
          total: {
            label: "Total",
            amount: totalAmountInCents,
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        const result = await paymentRequest.value.canMakePayment();
        if (result) {
          const elements = stripe.elements();
          const prButton = elements.create("paymentRequestButton", {
            paymentRequest: paymentRequest.value,
          });

          prButton.mount("#payment-request-button");

          paymentRequest.value.on("paymentmethod", async (ev) => {
            try {
              const { error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: ev.paymentMethod.id,
              });

              if (error) {
                ev.complete("fail");
                errorMessage.value = error.message;
              } else {
                ev.complete("success");
                updateThemeQuantities();
                saveBooking(); // Call the saveBooking method on success
              }
            } catch (error) {
              ev.complete("fail");
              errorMessage.value = error.message;
            }
          });
        }
      } catch (error) {
        errorMessage.value = "Failed to create PaymentIntent: " + error.message;
      }
    };

    const saveBooking = async () => {
      try {
        const db = getFirestore();
        const docRef = await addDoc(
          collection(db, "bookings"),
          store.state.booking
        );
        const booking = {
          ...store.state.booking,
          doc_id: docRef.id,
        };
        await updateDoc(doc(db, "bookings", docRef.id), booking);

        snackbar.value = true;
        snackbarText.value = "Registration successful!";
        emit("success", store.state.booking.id);
        store.commit("SET_BASKET", []);
        store.commit("SET_BOOKING", {});
        store.commit("SET_TOTAL", 0);
        loading.value = false;
      } catch (error) {
        console.error("Error adding document: ", error);
        loading.value = false;
        alert("There was an error during registration. Please try again.");
      }
    };

    const updateThemeQuantities = async () => {
      const themes = store.state.themes;
      themes.forEach((theme) => {
        theme.stock = Number(theme.stock);
      });

      const themesMap = new Map();
      themes.forEach((theme) => {
        themesMap.set(theme.id, {
          ...theme,
          originalStock: theme.stock,
        });
      });

      basket.value.forEach((item) => {
        const itemsToProcess = Array.isArray(item) ? item : [item];

        itemsToProcess.forEach((basketItem) => {
          if (basketItem.category === "single") {
            const themeId = basketItem.id;
            const basketQuantity = basketItem.quantity;

            if (themesMap.has(themeId)) {
              const theme = themesMap.get(themeId);
              const newQuantity = theme.originalStock - basketQuantity;
              theme.stock = newQuantity < 0 ? 0 : newQuantity;
              updateFirestoreTheme(theme);
            }
          }

          if (basketItem.category === "adult_workshop") {
            const basketQuantity = basketItem.quantity;
            const item = {
              ...basketItem,
              stock: parseFloat(basketItem.stock) - basketQuantity,
            };
            updateAdultWorkshops(item);
          }
        });
      });
    };

    const updateAdultWorkshops = async (workshop) => {
      const db = getFirestore();
      const themeDoc = doc(db, "adult_workshops", workshop.id);
      await updateDoc(themeDoc, workshop);
    };

    const updateFirestoreTheme = async (theme) => {
      const db = getFirestore();
      const themeDoc = doc(db, "themes", theme.id);
      await updateDoc(themeDoc, theme);
    };

    // Check if booking is empty, redirect to registration view if empty
    const emptyBookingState = () => {
      if (Object.keys(store.state.booking).length === 0) {
        router.push({ name: "registration" });
      }
    };

    onMounted(async () => {
      emptyBookingState();
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

      // Setup PaymentRequest for Apple Pay/Google Pay
      setupPaymentRequest(stripe);
    });

    return {
      handleSubmit,
      errorMessage,
      updateThemeQuantities,
      saveBooking,
      snackbarText,
      snackbar,
      total,
      siblingDiscountAmount,
      loading,
    };
  },
};
</script>
