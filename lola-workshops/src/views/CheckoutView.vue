<template>
  <div class="c-checkout">
    <v-container>
      <!-- Empty Basket Redirect -->
      <v-card v-if="basket.length === 0" class="my-10 pa-7 text-center">
        <v-icon size="80" color="grey-lighten-1" class="mb-6">
          mdi-basket-outline
        </v-icon>
        <h2 class="mb-3">Your basket is empty</h2>
        <p class="mb-6">
          Add some workshops to your basket before checking out.
        </p>
        <v-btn class="btn" to="/">
          <v-icon>mdi-home</v-icon>
          Browse Workshops
        </v-btn>
      </v-card>

      <!-- Checkout Form -->
      <v-form v-else @submit.prevent="handleCheckout" ref="formRef">
        <h1 class="my-10 text-center">Checkout</h1>
        <v-row>
          <!-- Left Column - Customer & Attendee Info -->
          <v-col cols="12" md="7">
            <v-card class="pa-7">
              <!-- Parent/Carer Information -->
              <div class="mb-6">
                <h2>Parent/Carer Information</h2>
                <div class="form-group">
                  <label>Name</label>
                  <div class="name-fields">
                    <input
                      type="text"
                      placeholder="First Name"
                      v-model="form.parent.firstName"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      v-model="form.parent.lastName"
                      required
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Email address"
                    v-model="form.parent.email"
                    required
                  />
                  <p class="text-caption mt-1">
                    Booking confirmation will be sent to this email
                  </p>
                </div>
                <div class="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    v-model="form.parent.telephone"
                    required
                  />
                  <p class="text-caption mt-1">For contact during workshops</p>
                </div>
              </div>

              <!-- Attendee Details -->
              <div class="mb-6">
                <h2>Attendee Details</h2>
                <div
                  v-for="(attendee, index) in attendees"
                  :key="index"
                  class="attendee-section"
                >
                  <div class="d-flex justify-space-between align-center mb-3">
                    <h3>Attendee {{ index + 1 }}</h3>
                    <v-btn
                      v-if="attendees.length > 1"
                      class="btn"
                      @click="removeAttendee(index)"
                    >
                      <v-icon>mdi-delete</v-icon> Remove
                    </v-btn>
                  </div>

                  <div class="form-group">
                    <label>Name</label>
                    <div class="name-fields">
                      <input
                        type="text"
                        placeholder="First Name"
                        v-model="attendee.firstName"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        v-model="attendee.lastName"
                        required
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Email (optional)</label>
                    <input
                      type="email"
                      placeholder="Email address"
                      v-model="attendee.email"
                    />
                  </div>

                  <div class="form-group">
                    <label>Phone (optional)</label>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      v-model="attendee.phone"
                    />
                  </div>

                  <div class="form-group">
                    <label>Allergies or Special Requirements</label>
                    <input
                      type="text"
                      placeholder="Please let us know about any allergies or special requirements"
                      v-model="attendee.notes"
                    />
                  </div>
                </div>

                <v-btn
                  v-if="basketTotalQuantity > attendees.length"
                  class="btn"
                  @click="addAttendee"
                >
                  <v-icon>mdi-plus</v-icon>Add Another Attendee
                </v-btn>

                <!-- Sibling Discount -->
                <SiblingDiscountComponent
                  v-if="attendees.length > 1"
                  class="mt-4"
                />
              </div>

              <!-- Agreements -->
              <div class="mb-6">
                <h2>Terms & Conditions</h2>
                <div class="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      v-model="agreements.healthSafety"
                      required
                      @click.stop
                    />
                    <span @click.prevent="toggleAgreement('healthSafety')">
                      Health and Safety - The children attend the art classes
                      (although overseen by the art teacher) at their own risk.
                      I hereby agree, that while the person/s in charge of the
                      art class will oversee my child to the best of their
                      ability, neither they nor any person connected with Lots
                      of Lovely Art will accept any liability for any claims
                      arising from any accident or injury happening to the child
                      whilst in the session or which may arise as a result of
                      the venue. Lots of Lovely Art undertakes that all
                      reasonable precautions will be taken to ensure the safety
                      and welfare of my child.
                    </span>
                  </label>
                </div>
                <div class="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      v-model="agreements.privacyPolicy"
                      required
                      @click.stop
                    />
                    <span @click.prevent="toggleAgreement('privacyPolicy')">
                      Agree to our</span
                    >
                    <a
                      href="https://www.lotsoflovelyart.org/privacy-policy/"
                      class="no-decoration font-weight-bold ml-1"
                      target="_blank"
                      >Privacy Policy</a
                    >
                  </label>
                </div>
                <div class="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      v-model="agreements.newsletter"
                      @click.stop
                    />
                    <span @click.prevent="toggleAgreement('newsletter')">
                      Newsletters and updates
                    </span>
                  </label>
                </div>
              </div>
            </v-card>
          </v-col>

          <!-- Right Column - Order Summary -->
          <v-col cols="12" md="5">
            <v-card class="order-summary pa-6">
              <h2 class="mb-4">Order Summary</h2>

              <!-- Basket Items -->
              <div class="mb-4">
                <div v-for="(item, index) in basket" :key="index" class="mb-3">
                  <p class="mb-0">
                    <span class="mr-2">{{ item.quantity || 1 }}</span>
                    <span class="mr-2">x</span>
                    <span>{{ getSummaryTitle(item) }}</span>
                    <span class="ml-3"
                      >£{{ getSummaryLineTotal(item).toFixed(2) }}</span
                    >
                  </p>
                </div>
              </div>

              <hr class="my-4" />

              <!-- Subtotal -->
              <div class="d-flex justify-space-between mb-2">
                <span>Subtotal</span>
                <span>£{{ total.toFixed(2) }}</span>
              </div>

              <!-- Sibling Discount -->
              <div
                v-if="attendees.length > 1 && siblingDiscount > 0"
                class="d-flex justify-space-between mb-2"
                style="color: #22c55e"
              >
                <span>Sibling Discount</span>
                <span>-£{{ siblingDiscount.toFixed(2) }}</span>
              </div>

              <hr class="my-4" />

              <!-- Total -->
              <div class="d-flex justify-space-between mb-4">
                <h2>Total</h2>
                <h2>£{{ finalTotal.toFixed(2) }}</h2>
              </div>

              <!-- Submit Button -->
              <v-btn
                type="submit"
                class="btn"
                block
                :loading="processing"
                :disabled="processing"
              >
                <v-icon class="mr-2">mdi-lock</v-icon>
                Proceed to Payment
              </v-btn>

              <p
                class="text-caption text-center mt-3 mb-0"
                style="color: #707070"
              >
                Secure payment powered by Stripe
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
    </v-container>

    <!-- Error Snackbar -->
    <v-snackbar v-model="showError" :color="snackbarColor" :timeout="5000">
      <span class="text-white">{{ errorMessage }}</span>
      <template v-slot:actions>
        <v-btn variant="text" color="white" @click="showError = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script>
import { computed, defineComponent, ref, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/stores/cart";
import SiblingDiscountComponent from "@/components/SiblingDiscountComponent.vue";

export default defineComponent({
  name: "CheckoutView",

  components: {
    SiblingDiscountComponent,
  },

  setup() {
    const store = useStore();
    const cartStore = useCartStore();
    const router = useRouter();
    const formRef = ref(null);
    const processing = ref(false);
    const showError = ref(false);
    const errorMessage = ref("");

    const snackbarColor = computed(() => {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue("--yellow")
          .trim() || "#D8B061"
      );
    });

    // Form data
    const form = ref({
      parent: {
        firstName: "",
        lastName: "",
        email: "",
        telephone: "",
      },
    });

    const attendees = ref([
      {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        notes: "",
      },
    ]);

    const agreements = ref({
      healthSafety: false,
      privacyPolicy: false,
      newsletter: false,
    });

    // Validation rules
    const rules = {
      required: (v) => !!v || "This field is required",
      email: (v) => /.+@.+\..+/.test(v) || "Email must be valid",
    };

    // Computed properties - use Pinia cart store
    const basket = computed(() => cartStore.items);

    const total = computed(() => {
      // Calculate total from cart items
      return basket.value.reduce((sum, item) => {
        let itemTotal = parseFloat(item.price) * item.quantity;

        // If the item has nested items (term events), calculate accordingly
        if (item.items && Array.isArray(item.items)) {
          itemTotal =
            item.items.reduce(
              (sessionTotal, session) =>
                sessionTotal + parseFloat(session.price || item.price),
              0
            ) * item.quantity;
        }

        return sum + itemTotal;
      }, 0);
    });

    const basketTotalQuantity = computed(() => {
      return basket.value.reduce((sum, item) => {
        return sum + (item.quantity || 1);
      }, 0);
    });

    // Calculate sibling discount (example: 10% off for multiple attendees)
    const siblingDiscount = computed(() => {
      if (attendees.value.length > 1) {
        return total.value * 0.1; // 10% discount
      }
      return 0;
    });

    const finalTotal = computed(() => {
      return Math.max(0, total.value - siblingDiscount.value);
    });

    // Methods
    const addAttendee = () => {
      attendees.value.push({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        notes: "",
      });
    };

    const removeAttendee = (index) => {
      if (attendees.value.length > 1) {
        attendees.value.splice(index, 1);
      }
    };

    const toggleAgreement = (field) => {
      agreements.value[field] = !agreements.value[field];
    };

    // Calculate total price from basket
    const getTotalPrice = () => {
      const totalPrice = basket.value.reduce((total, item) => {
        // Convert price to a number and multiply by quantity
        let itemTotal = parseFloat(item.price) * item.quantity;

        // If the item has a nested items array, add those items' totals as well
        if (item.items && Array.isArray(item.items)) {
          itemTotal =
            item.items.reduce(
              (sessionTotal, session) =>
                sessionTotal + parseFloat(session.price || item.price),
              0
            ) * item.quantity;
        }
        // Add the item's total to the overall total
        return total + itemTotal;
      }, 0);

      store.commit(
        "SET_TOTAL",
        store.state.discount ? totalPrice - store.state.discount : totalPrice
      );
    };

    const getSummaryTitle = (item) => {
      if (
        item.category === "term" &&
        Array.isArray(item.items) &&
        item.items.length > 0
      ) {
        return `${item.category_name || item.title || item.event_title} (${
          item.items.length
        } sessions)`;
      }

      return item.theme_title || item.event_title || item.title;
    };

    const getSummaryLineTotal = (item) => {
      let lineTotal = parseFloat(item.price) * (item.quantity || 1);

      if (
        item.category === "term" &&
        Array.isArray(item.items) &&
        item.items.length > 0
      ) {
        lineTotal =
          item.items.reduce(
            (sum, session) => sum + parseFloat(session.price || item.price),
            0
          ) * (item.quantity || 1);
      }

      return lineTotal;
    };

    const expandBasketItemsForCheckout = () => {
      return basket.value.flatMap((item) => {
        if (
          item.category === "term" &&
          Array.isArray(item.items) &&
          item.items.length > 0
        ) {
          return item.items.map((session) => ({
            id: session.offering_id || session.id,
            offering_id: session.offering_id || session.id,
            event_id:
              session.offering_event_id || session.theme_id || session.id,
            legacy_event_id: session.legacy_event_id || item.event_id,
            title:
              session.theme_title ||
              session.title ||
              session.event_title ||
              item.category_name ||
              item.title ||
              item.event_title,
            price: session.price || item.price,
            quantity: item.quantity || 1,
            type: item.type || "event",
            category: item.category,
            eventDate: session.date || session.event_date,
            eventTime: session.start_time || session.event_start_time,
          }));
        }

        return [
          {
            id: item.offering_id || item.id,
            offering_id: item.offering_id || item.id,
            event_id: item.offering_event_id || item.theme_id || item.event_id,
            legacy_event_id: item.legacy_event_id || item.event_id,
            title: item.theme_title || item.event_title || item.title,
            price: item.price,
            quantity: item.quantity || 1,
            type: item.type || "event",
            category: item.category,
            eventDate: item.date || item.event_date,
            eventTime: item.start_time || item.event_time,
          },
        ];
      });
    };

    const handleCheckout = async () => {
      // Validate form
      const { valid } = await formRef.value.validate();
      if (!valid) {
        errorMessage.value = "Please fill in all required fields";
        showError.value = true;
        return;
      }

      // Validate agreements
      if (!agreements.value.healthSafety || !agreements.value.privacyPolicy) {
        errorMessage.value = "Please accept the required terms and conditions";
        showError.value = true;
        return;
      }

      try {
        processing.value = true;
        const checkoutItems = expandBasketItemsForCheckout();

        // Pre-validate event capacity before creating checkout session
        for (const item of checkoutItems) {
          if (item.type === "event" && item.event_id) {
            const { data: eventCapacity, error: capacityError } = await supabase
              .from("event_capacity")
              .select("spaces_available")
              .eq("offering_event_id", item.event_id)
              .maybeSingle();

            if (capacityError) {
              console.error("Error checking capacity:", capacityError);
              continue; // Let the backend handle validation
            }

            if (eventCapacity) {
              const available = eventCapacity.spaces_available;
              if (available <= 0) {
                throw new Error(
                  `Sorry, "${
                    item.title || item.theme_title
                  }" is now sold out. Please remove it from your cart.`
                );
              }
              if (available < item.quantity) {
                const plural = available === 1 ? "space" : "spaces";
                throw new Error(
                  `Sorry, "${
                    item.title || item.theme_title
                  }" only has ${available} ${plural} available. You're trying to book ${
                    item.quantity
                  }.`
                );
              }
            }
          }
        }

        // Debug: Log basket items before mapping
        console.log("Basket items before mapping:", basket.value);
        console.log("Expanded checkout items:", checkoutItems);

        const items = checkoutItems.map((item) => {
          console.log("Mapping item:", item);
          return item;
        });

        console.log("Items being sent to Edge Function:", items);

        // Call Supabase Edge Function to create checkout session
        const { data, error } = await supabase.functions.invoke(
          "create-checkout-session",
          {
            body: {
              items,
              customer: {
                email: form.value.parent.email,
                firstName: form.value.parent.firstName,
                lastName: form.value.parent.lastName,
                phone: form.value.parent.telephone,
              },
              metadata: {
                attendees: JSON.stringify(attendees.value),
                agreements: JSON.stringify(agreements.value),
                siblingDiscount: siblingDiscount.value,
              },
            },
          }
        );

        if (error) {
          console.error("Error creating checkout session:", error);
          console.error("Error context:", error.context);
          console.error("Error message:", error.message);
          throw error;
        }

        if (!data || !data.url) {
          throw new Error("Invalid response from checkout service");
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } catch (err) {
        console.error("Checkout error:", err);

        // Extract error message
        let message = "Failed to process checkout. Please try again.";

        if (err.context?.body) {
          try {
            const errorBody =
              typeof err.context.body === "string"
                ? JSON.parse(err.context.body)
                : err.context.body;
            message = errorBody.error || message;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
        } else if (err.message) {
          message = err.message;
        }

        // Show user-friendly error messages
        if (
          message.includes("sold out") ||
          message.includes("Insufficient capacity")
        ) {
          // Capacity error - show prominent message
          errorMessage.value = message;
        } else if (message.includes("Event not found")) {
          errorMessage.value =
            "One or more events in your cart are no longer available. Please refresh the page and try again.";
        } else {
          errorMessage.value = message;
        }

        showError.value = true;
      } finally {
        processing.value = false;
      }
    };

    // Calculate total on mount
    onMounted(() => {
      getTotalPrice();
      // Redirect to basket if no items - use cart store
      if (!cartStore.items || cartStore.items.length === 0) {
        router.push("/basket");
      }
    });

    return {
      formRef,
      form,
      attendees,
      agreements,
      rules,
      basket,
      total,
      basketTotalQuantity,
      siblingDiscount,
      finalTotal,
      processing,
      showError,
      errorMessage,
      snackbarColor,
      addAttendee,
      removeAttendee,
      toggleAgreement,
      getTotalPrice,
      getSummaryTitle,
      getSummaryLineTotal,
      handleCheckout,
    };
  },
});
</script>

<style scoped>
.c-checkout {
  font-family: "Source Sans Pro", sans-serif;
}

.name-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.attendee-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--light-grey);
}

.attendee-section:last-of-type {
  border-bottom: none;
}

.order-summary {
  position: sticky;
  top: 32px;
}

hr {
  border: none;
  border-top: 1px solid var(--light-grey);
}

.text-caption {
  font-size: 0.875rem;
  color: var(--grey);
}
</style>
