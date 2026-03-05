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
            <h1 class="text-center">Summer</h1>
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
            <v-select
              v-model="selectedWeek"
              :items="weekRanges"
              label="Select a Week"
              outlined
            ></v-select>
          </v-col>
          <v-col cols="12">
            <h1 class="text-center">{{ subTitle }}</h1>
          </v-col>
          <v-row v-if="selectedWeek">
            <v-col cols="12">
              <h2>{{ selectedWeek }}</h2>
            </v-col>
            <template
              v-for="(event, index) in groupedEvents[selectedWeek]"
              :key="index"
            >
              <v-col cols="12">
                <v-card
                  flat
                  class="mb-4 py-1 px-4 c-single-list__card"
                  outlined
                >
                  <div class="c-single-list__wrapper">
                    <div class="c-single-list__item">
                      <span class="mr-2">{{ formatDate(event.date) }}</span>
                      <span class="mr-2">
                        {{ stripSeconds(event.start_time) }} -
                        {{ stripSeconds(event.end_time) }}
                      </span>
                      <span class="mr-2 font-weight-bold">{{
                        event.theme_title
                      }}</span>
                      <StockComponent
                        :stock="event.stock"
                        :category="event.category"
                      />
                    </div>
                    <div
                      class="c-single-list__button-wrapper"
                      v-show="event.stock > 0"
                    >
                      <div class="c-single-list__buttons">
                        <v-icon
                          size="16"
                          color="#404040"
                          @click="subtractQuantity(event)"
                          >mdi-minus</v-icon
                        >
                        <v-text-field
                          v-model="event.quantity"
                          class="c-single-list__quantity-input"
                          type="number"
                          min="0"
                          outline
                          max="10"
                          width="50"
                          readonly
                        ></v-text-field>
                        <v-icon
                          size="16"
                          color="#404040"
                          @click="addQuantity(event)"
                          >mdi-plus</v-icon
                        >
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </template>
          </v-row>
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
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

import StockComponent from "@/components/StockComponent.vue";
import { useStore } from "vuex";
import { db, getDocs, collection, query, where } from "@/main"; // Ensure the correct import of your Firestore instance
import { useRoute } from "vue-router";
import { HelperFunctions } from "@/helpers/helpers";

export default defineComponent({
  name: "SummerView",

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
    const groupedEvents = ref({});
    const selectedWeek = ref(null);
    const weekRanges = ref([]);

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

    const getMondayOfWeek = (dateStr) => {
      const date = dayjs(dateStr);
      const monday = date.startOf("week").add(1, "day"); // Start on Monday
      return monday.format("YYYY-MM-DD");
    };

    const getWeekRange = (mondayDate) => {
      const start = dayjs(mondayDate);
      const end = start.add(6, "day");
      const startFormatted = start.format("dddd Do MMMM");
      const endFormatted = end.format("dddd Do MMMM");
      return `${startFormatted} - ${endFormatted}`;
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

    const filterEventsByWeek = (events) => {
      const now = dayjs();
      const currentDate = now.format("YYYY-MM-DD");
      const currentTime = now.valueOf();

      // Step 1: Filter out past events
      const upcomingEvents = events
        .filter(async (event) => {
          const eventDate = dayjs(event.date);

          if (eventDate.isBefore(currentDate)) {
            return false; // Event is in the past
          }
          if (eventDate.isSame(currentDate)) {
            const eventEndTime = dayjs(
              `1970-01-01T${event.end_time}`
            ).valueOf();
            return eventEndTime > currentTime;
          }
          return true;
        })
        .filter((ev) => {
          const eventDate = dayjs(ev.date);
          return isSummerHoliday(eventDate);
        });
      // Step 2: Sort by date and start time
      const sortedEvents = upcomingEvents
        .map((event) => {
          return {
            ...event,
            quantity: 0,
          };
        })
        .sort((a, b) => {
          const dateA = dayjs(a.date).valueOf();
          const dateB = dayjs(b.date).valueOf();
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          const timeA = dayjs(`1970-01-01T${a.start_time}`).valueOf();
          const timeB = dayjs(`1970-01-01T${b.start_time}`).valueOf();
          return timeA - timeB;
        });

      // Step 3: Group by week
      const eventsByWeek = sortedEvents.reduce((acc, event) => {
        const weekStart = getMondayOfWeek(event.date);
        const weekRange = getWeekRange(weekStart);

        if (!acc[weekRange]) {
          acc[weekRange] = [];
        }
        acc[weekRange].push(event);
        return acc;
      }, {});

      const currentWeekStart = getMondayOfWeek(dayjs().format("YYYY-MM-DD"));
      const futureWeekRanges = Object.keys(eventsByWeek).filter((weekRange) => {
        // Get the first event from this week to determine the week's Monday
        const firstEvent = eventsByWeek[weekRange][0];
        const weekStart = getMondayOfWeek(firstEvent.date);
        return dayjs(weekStart).isSameOrAfter(dayjs(currentWeekStart));
      });

      // Populate the week ranges for the dropdown
      weekRanges.value = futureWeekRanges;
      selectedWeek.value = weekRanges.value[0] ?? null;

      groupedEvents.value = Object.assign({}, eventsByWeek);
    };

    const isSummerHoliday = (date) => {
      const summerStart = dayjs("2025-07-14");
      const summerEnd = dayjs("2025-09-10");
      return date.isBetween(summerStart, summerEnd, null, "[]");
    };

    const getSummerThemes = async () => {
      mainTitle.value = "Holiday Workshops";
      mainDescription.value =
        "Below are 5 weeks of Summer Holiday Art Workshops. During the holidays, the LoLA studio offers a wide range of fun art classes for all ages! Check out the list below for themes and ages. Whilst teaching workshops are not being held, why not come along to an Open Studio session where you can enjoy a hot drink whilst your child gets freely creative at the art table!";
      mainInstructions.value =
        "Please view workshops grouped by week below to book";
      mainImage.value = "/img/images/lola_holiday_main.jpg";
      subTitle.value = "All Holiday Classes";

      try {
        const querySnapshot = await getDocs(
          collection(db, `themes${env.value}`)
        );

        const events = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredEvents = events
          .filter((event) => {
            const eventDate = dayjs(event.date);
            return isSummerHoliday(eventDate);
          })
          .sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
              return dateA - dateB;
            }
            const timeA = new Date(`1970-01-01T${a.start_time}`).getTime();
            const timeB = new Date(`1970-01-01T${b.start_time}`).getTime();
            return timeA - timeB;
          });

        // Use Promise.all to await all price fetches
        eventThemes.value = await Promise.all(
          filteredEvents.map(async (event) => {
            const theme = await fetchThemeByEventId(event.event_id);
            return {
              ...event,
              quantity: 0,
              price: theme.price,
            };
          })
        );

        filterEventsByWeek(eventThemes.value);
        store.dispatch("setLoading", false);

        return eventThemes.value;
      } catch (error) {
        console.error("Error getting summer themes:", error);
      }
    };

    onMounted(() => {
      getSummerThemes();
    });

    return {
      mainTitle,
      mainDescription,
      mainInstructions,
      mainImage,
      subTitle,
      env,
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
      groupedEvents,
      weekRanges,
      selectedWeek,
    };
  },
});
</script>

<style scoped>
/* Add styles if necessary */
</style>
