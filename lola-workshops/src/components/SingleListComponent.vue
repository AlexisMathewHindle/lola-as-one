<template>
  <div class="c-single-list pa-10 mt-10">
    <v-row>
      <v-col cols="12">
        <h1 class="text-center">
          <span v-if="!isHalfTerm">Book your workshops below</span>
          <span v-else>All Half Term Art Classes</span>
        </h1>
      </v-col>
      <v-col cols="12" v-for="(theme, index) in th" :key="index">
        <template v-for="(th, index) in theme" :key="index">
          <v-card
            flat
            class="mb-4 py-1 px-4 c-single-list__card"
            outlined
            v-if="!th.passed"
            :class="{
              'c-single-list__card--solo': theme.length <= 2 && !th?.passed,
            }"
          >
            <div class="c-single-list__wrapper">
              <div class="c-single-list__item">
                <span class="mr-2">{{ formatDate(th.date) }}</span>
                <span class="mr-2">
                  {{ stripSeconds(th.start_time) }} -
                  {{ stripSeconds(th.end_time) }}</span
                >
                <span class="mr-2 font-weight-bold">{{ th.theme_title }}</span>
                <StockComponent :stock="th.stock" :category="th.category" />
              </div>

              <div class="c-single-list__button-wrapper" v-show="th.stock > 0">
                <div class="c-single-list__buttons">
                  <v-icon
                    size="16"
                    color="#404040"
                    @click="subtractQuantity(th)"
                    >mdi-minus</v-icon
                  >
                  <v-text-field
                    v-model="th.quantity"
                    class="c-single-list__quantity-input"
                    type="number"
                    min="0"
                    outline
                    max="10"
                    width="50"
                    readonly
                  ></v-text-field>
                  <v-icon size="16" color="#404040" @click="addQuantity(th)"
                    >mdi-plus</v-icon
                  >
                </div>
              </div>
            </div>
          </v-card>
        </template>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar" :color="snackbarColor" top>
      <p class="ma-0 white--text">Item added to basket</p>
    </v-snackbar>
  </div>
</template>

<script>
import { defineComponent, computed, ref } from "vue";
import { logEvent, getAnalytics } from "firebase/analytics";
import { useStore } from "vuex";
import StockComponent from "@/components/StockComponent.vue";
import { Lit } from "@/main";
import { useRoute } from "vue-router";

export default defineComponent({
  // TODO: Need to remove bookings from bookings list if date passed
  // TODO: Need to look at what happens when the quantity is 0. Does it remove the item from the basket?
  // BUG: When adding to basket, the quantity is not updating on the eventDetails page. Need to fix this.
  // DONE: Add checks to health & safety and privacy policy checkbox - if not checked keep button disabled
  // DONE: Look at how are we going to dynamically add button urls to home view buttons
  // DONE: NEED TO ADD ERROR MESSAGES BELOW EACH INPUT --> NOT SURE THIS IS NEEDED AS BUTTON DISABLED UNTIL ALL IS VALID
  // DONE: Add email reminders for events
  // TODO: ADD FEEDBACK EMAILS FOR EVENTS
  // DONE: Sibling discount to basket
  // TODO: ADD OFFLINE FUNCTIONALITY AT LEAST TO VIEW CALENDAR - BOOKING WON'T BE POSSIBLE
  // TODO: Admin - create a list of attendees for each theme - NOT EVENT but associate to one.
  // TODO: ApplePay, GooglePay, PayPal, Stripe, etc. - how will they work?
  // DONE: plus and minus
  // DONE: Test that emails are being sent when new booking is created in live db. Definitely working in dev db.
  // TODO: Admin - Think about image content management. What does that look like? How will it work
  // DONE: DO we need a dropdown for events in mobile calendar view?
  // CANCEL: dropdown for events in mobile view. Click event search all themes by event_id and display by date order. If date passed remove from view.
  // DONE: Create deployment flow and deploy to live site
  // DONE: What would a dev environment look like? How would it work?
  // DONE: Add a loading spinner where necessary. Think about where it would be needed. (EventDetailsView, CalendarView, etc.)
  // DONE: Think about coupon codes and how they will work
  // DONE: Add all relevant discounts on basket view not checkout - make sure discounts update total in store.
  // DONE: Banner above menu for scroll into view on calendar
  // DONE: Mobile view is below tablet view
  // DONE/ TESTING: Look at checking date of theme vs today's date and display true/false flag?? (backend or frontend)
  // DONE/ TESTING: Think
  name: "SingleListComponent",
  components: {
    StockComponent,
  },
  props: {
    themes: {
      required: true,
      type: Object,
    },
    category: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const store = useStore();
    const th = computed(() => {
      const sortedThemes = {};
      const now = new Date().setHours(0, 0, 0, 0); // Get today's date at midnight

      // Loop over each key in props.themes
      Object.keys(props.themes).forEach((key) => {
        // Filter out past events and sort the array by date in descending order for each key
        sortedThemes[key] = [...props.themes[key]]
          .filter((event) => {
            const eventDate = new Date(event.date).getTime();
            return eventDate >= now; // Keep only today's and future events
          })
          .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
              return dateA - dateB;
            }
            // If dates are the same, sort by start time
            const timeA = new Date(`1970-01-01T${a.start_time}`).getTime();
            const timeB = new Date(`1970-01-01T${b.start_time}`).getTime();
            return timeA - timeB;
          });
      });

      // Return the sorted object with the same structure
      return sortedThemes;
    });

    const snackbar = ref(false);
    const route = useRoute();

    const isHalfTerm = computed(() => {
      return route.path.includes("ht");
    });

    const stripSeconds = (timeString) => {
      return timeString?.slice(0, -3);
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const snackbarColor = computed(() => {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue("--yellow")
          .trim() || "success"
      );
    });

    const updateBasket = (theme, newQuantity) => {
      const currentBasket = store.state.basket || [];

      if (Array.isArray(currentBasket)) {
        // Handle the case where the basket is an array
        const existingItemIndex = currentBasket.findIndex(
          (item) => item.theme_id === theme.theme_id
        );

        if (existingItemIndex > -1) {
          // If the item exists, update its quantity
          currentBasket[existingItemIndex].quantity = theme.quantity;
        } else {
          // If it doesn't exist, add it to the basket
          currentBasket.push({ ...theme, quantity: theme.quantity });
        }
        // Update the store with the new basket
      } else if (typeof currentBasket === "object") {
        // Handle the case where the basket is an object (category single)
        currentBasket.quantity = newQuantity;
      }

      store.commit("SET_BASKET", currentBasket);
      // need to update props.themes with the new quantity
    };

    const addQuantity = (theme) => {
      snackbar.value = true;
      if (theme.category === "single") {
        theme.quantity += 1;
        updateBasket(theme, theme.quantity);
      } else if (Array.isArray(th.value)) {
        theme.quantity += 1;
        updateBasket(theme, theme.quantity);
      }

      const analytics = getAnalytics();
      logEvent(analytics, "add_to_cart", {
        theme_title: theme.theme_title,
        theme_id: theme.theme_id,
        category: theme.category,
        quantity: theme.quantity,
        added_at: new Date().toISOString(),
        environment: store.state.environment,
      });

      Lit.event("added_to_cart", {
        created_at: new Date(),
        metadata: {
          theme_title: theme.theme_title,
          theme_id: theme.theme_id,
          type: theme.category,
        },
      });
    };

    const subtractQuantity = (theme) => {
      if (theme.quantity > 0) {
        if (theme.category === "single") {
          theme.quantity -= 1;
          updateBasket(theme, theme.quantity);
        } else if (Array.isArray(th.value)) {
          theme.quantity -= 1;
          updateBasket(theme, theme.quantity);
        }
      }
    };

    return {
      isHalfTerm,
      snackbar,
      snackbarColor,
      addQuantity,
      subtractQuantity,
      stripSeconds,
      formatDate,
      th,
    };
  },
});
</script>

<!-- <style>
.c-single-list {
  background-color: #fff;
  width: 100%;
}

.c-single-list__card {
  border: 1px solid var(--light-grey);
}

.c-single-list__wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.c-single-list__button-wrapper {
  width: 200px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.c-single-list__buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.c-single-list__quantity-input input {
  background-color: var(--white);
  text-align: center;
  border-radius: unset;
  border: 1px solid transparent;
  font-size: 16px;
  color: var(--dark-grey);
  padding: 0 10px;
  height: 20px;
}

.c-single-list__quantity-input .v-input__details {
  display: none;
}

.c-single-list .v-field__outline {
  border-width: 0;
  --v-field-border-width: 0;
  border: 1px solid var(--light-grey);
}

.c-single-list__item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex-wrap: wrap;
}
</style> -->
