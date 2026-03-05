<template>
  <div class="c-half-term">
    <v-container v-if="store.getters['isLoading']">
      <v-card :style="{ minHeight: cardHeight }">
        <v-row>
          <v-col cols="12" class="text-center">
            <div
              class="pa-10"
              style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
              "
            >
              <v-progress-circular
                indeterminate
                size="128"
                color="#D8B061"
              ></v-progress-circular>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
    <v-container v-else>
      <v-card class="px-10">
        <v-row class="mt-10">
          <v-col cols="12">
            <h1 class="text-center">{{ mainTitle }}</h1>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-img
              :src="mainImage"
              alt="Lola Half Term Image"
              height="300px"
              contain
            ></v-img>
          </v-col>
          <v-col cols="12" md="6">
            <div class="workshop-details pa-4">
              <v-divider></v-divider>
              <v-list>
                <v-list-item>
                  <v-list-item-title
                    ><strong>Description</strong></v-list-item-title
                  >
                  <v-list-item-content
                    >{{ mainDescription }}
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    ><strong>Instructions</strong></v-list-item-title
                  >
                  <v-list-item-content>{{
                    mainInstructions
                  }}</v-list-item-content>
                </v-list-item>
              </v-list>
              <v-divider></v-divider>
            </div>
          </v-col>
        </v-row>
      </v-card>
      <div class="c-single-list pa-10 mt-10">
        <v-row>
          <v-col cols="12">
            <h1 class="text-center">{{ subTitle }}</h1>
          </v-col>
          <template v-for="(th, index) in eventThemes" :key="index">
            <v-col cols="12" v-if="!th.passed">
              <v-card
                flat
                :class="{
                  'c-single-list__card--solo': th.length <= 2 && !th?.passed,
                }"
                class="mb-4 py-1 px-4 c-single-list__card"
                outlined
              >
                <div class="c-single-list__wrapper">
                  <div class="c-single-list__item">
                    <span class="mr-2">{{ formatDate(th.date) }}</span>
                    <span class="mr-2">
                      {{ stripSeconds(th.start_time) }} -
                      {{ stripSeconds(th.end_time) }}</span
                    >
                    <span class="mr-2 font-weight-bold">{{
                      th.theme_title
                    }}</span>
                    <StockComponent :stock="th.stock" :category="th.category" />
                  </div>
                  <div
                    class="c-single-list__button-wrapper"
                    v-show="th.stock > 0"
                  >
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
            </v-col>
          </template>
        </v-row>
        <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
          <p class="ma-0 text-white">Item added to basket</p>
        </v-snackbar>
      </div>
    </v-container>
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      <p class="ma-0 text-white">Item added to basket</p>
    </v-snackbar>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref, computed } from "vue";
import StockComponent from "@/components/StockComponent.vue";
import { useStore } from "vuex";
import { db, getDocs, collection, query, where } from "@/main"; // Ensure the correct import of your Firestore instance
import { useRoute } from "vue-router";
import { HelperFunctions } from "@/helpers/helpers";

export default defineComponent({
  name: "HalfTermView",

  components: {
    StockComponent,
  },

  setup() {
    const route = useRoute();
    const store = useStore();
    const helpers = new HelperFunctions();
    const headerHeight = 223;
    const snackbar = ref(false);
    const mainTitle = ref("");
    const mainDescription = ref("");
    const mainInstructions = ref("");
    const mainImage = ref("");
    const subTitle = ref("");

    const env = computed(() =>
      helpers.getEnvironment() === "development" ? "_dev" : ""
    );

    const snackbarColor = computed(() => {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue("--yellow")
          .trim() || "success"
      );
    });

    const cardHeight = computed(() => `${window.innerHeight - headerHeight}px`);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const stripSeconds = (timeString) => {
      return timeString?.slice(0, -3);
    };

    const eventThemes = ref([]); // Store the filtered events

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
      theme.quantity += 1;
      updateBasket(theme, theme.quantity);
    };

    const subtractQuantity = (theme) => {
      if (theme.quantity > 0) {
        theme.quantity -= 1;
        updateBasket(theme, theme.quantity);
      }
    };

    const fetchThemeByEventId = async (eventId) => {
      try {
        store.dispatch("setLoading", true);
        // Get a reference to the collection
        const eventsCollectionRef = collection(db, `events${env.value}`);
        // Create a query to filter the events by event_id
        const q = query(eventsCollectionRef, where("event_id", "==", eventId));
        // Execute the query
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        store.dispatch("setLoading", false);
        // Assuming the event has a 'price' field
        if (events.length > 0) {
          return events[0]; // Return the price from the first matching event
        }

        return null; // If no event was found, return null
      } catch (error) {
        store.dispatch("setLoading", false);
        console.error("Error getting themes by event ID:", error);
        return null; // Handle error by returning null
      }
    };

    const getThemes = async () => {
      const workshopType =
        route.name.toLowerCase() === "holiday workshops" ? "hp" : "ht";

      if (workshopType === "hp") {
        // TODO: MAKE CODES ALIGN TO BE HT FOR HALF TERM AND HP FOR HOLIDAY
        // mainTitle.value = "Holiday Workshops";
        // mainDescription.value =
        //   "During the holidays, the LoLA studio offers a wide range of fun art classes for all ages! Check out the list below for themes and ages. Whilst teaching workshops are not being held, why not come along to an Open Studio session where you can enjoy a hot drink whilst your child gets freely creative at the art table!";
        // mainInstructions.value =
        //   "Please scroll through the events below to book";
        // mainImage.value = "/img/images/lola_holiday_main.jpg";
        // subTitle.value = "All Holiday Classes";
        mainTitle.value = "Half Term";
        mainDescription.value =
          "The half term week is full of art classes and workshops for all ages. See the list below for age specific workshops. Whilst teaching workshops are not being held, come along to the cafe for a coffee whilst your child gets freely creative at an Open Studio session. Please scroll through the half term events below to book.";
        mainInstructions.value =
          "Please scroll through the half term events below to book.";
        mainImage.value = "/img/images/lola_half_term_main.jpg";
        subTitle.value = "All Half Term Art Classes";
      } else {
        mainTitle.value = "Half Term";
        mainDescription.value =
          "The half term week is full of art classes and workshops for all ages. See the list below for age specific workshops. Whilst teaching workshops are not being held, come along to the cafe for a coffee whilst your child gets freely creative at an Open Studio session. Please scroll through the half term events below to book.";
        mainInstructions.value =
          "Please scroll through the half term events below to book.";
        mainImage.value = "/img/images/lola_half_term_main.jpg";
        subTitle.value = "All Half Term Art Classes";
      }
      try {
        store.dispatch("setLoading", true);
        const querySnapshot = await getDocs(
          collection(db, `themes${env.value}`)
        );
        const events = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        eventThemes.value = events
          .filter(
            (event) => event.event_id && event.event_id.includes(workshopType)
          )
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
          })
          .map((event) => {
            return {
              ...event,
              quantity: 0,
            };
          });
        store.dispatch("setLoading", false);
        eventThemes.value.forEach(async (event) => {
          const theme = await fetchThemeByEventId(event.event_id);
          event.price = theme.price;
        });

        return eventThemes.value;
      } catch (error) {
        store.dispatch("setLoading", false);
        console.error("Error getting themes in half term view:", error);
      }
    };

    onMounted(() => {
      getThemes();
    });

    return {
      mainTitle,
      mainDescription,
      mainInstructions,
      mainImage,
      subTitle,
      env,
      getThemes,
      eventThemes,
      formatDate,
      stripSeconds,
      store,
      cardHeight,
      subtractQuantity,
      addQuantity,
      snackbar,
      snackbarColor,
      fetchThemeByEventId,
    };
  },
});
</script>

<style scoped>
/* Add styles if necessary */
</style>
