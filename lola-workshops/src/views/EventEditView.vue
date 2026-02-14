<template>
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
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <h2 class="mb-4">Update event</h2>
          <v-switch
            v-model="hideEventUpdate"
            label="Display event data"
          ></v-switch>
        </div>
        <div class="d-flex">
          <v-text-field v-model="eventId" label="Search for event" />
          <v-btn class="ml-4" size="x-large" @click="searchForEventById"
            >Search for event by id</v-btn
          >
        </div>
      </v-col>
    </v-row>
    <v-row v-if="hideEventUpdate">
      <v-col cols="12">
        <form @submit.prevent="upDateEvent">
          <label>Event id:</label>
          <v-text-field v-model="event.event_id" />
          <label>Event title:</label>
          <v-text-field v-model="event.event_title" />
          <label>Event description:</label>
          <v-textarea v-model="event.description" />
          <label>Event instructions:</label>
          <v-textarea v-model="event.instructions" />
          <label>Event details:</label>
          <v-textarea v-model="event.details" />
          <label>Event day:</label>
          <v-text-field v-model="event.day_of_the_week" />
          <label>Event term:</label>
          <v-text-field v-model="event.term" />
          <label>Event price:</label>
          <v-text-field v-model="event.price" />
          <label>Event quantity:</label>
          <v-text-field v-model="event.quantity" />
          <label>Event category:</label>
          <v-text-field v-model="event.category" />
          <div class="d-flex align-center mb-4">
            <div class="mr-4">
              <label>Start time:</label>
              <VueTimepicker
                v-model="event.start_time"
                format="HH:mm:ss"
                :placeholder="event.start_time || 'Select Time'"
              />
            </div>
            <div>
              <label>End time:</label>
              <VueTimepicker
                v-model="event.end_time"
                format="HH:mm:ss"
                :placeholder="event.end_time || 'Select Time'"
              />
            </div>
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <label>Event start date:</label>
              <v-date-picker v-model="formattedStartDate" />
            </v-col>
            <v-col cols="12" md="6">
              <label>Event end date:</label>
              <v-date-picker v-model="formattedEndDate" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-btn type="submit">Update Event</v-btn>
            </v-col>
          </v-row>
        </form>
      </v-col>
    </v-row>

    <!-- TODO: 
     Hide if events passed
     When updating date need to make sure its converted back YYYY-MM-DD  
     -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <h2 class="mb-4">Update themes</h2>
          <v-switch
            v-model="hideThemeUpdate"
            label="Display theme data"
          ></v-switch>
        </div>
        <div class="d-flex">
          <v-text-field v-model="themeId" label="Search for theme" />
          <v-btn class="ml-4" size="x-large" @click="searchByEventId"
            >Search for theme by id</v-btn
          >
        </div>
        <form @submit.prevent="updateTheme" v-if="hideThemeUpdate">
          <label>Event id:</label>
          <v-text-field v-model="theme.event_id" />
          <label>Theme title:</label>
          <v-text-field v-model="theme.theme_title" />
          <label>Event title:</label>
          <v-text-field v-model="theme.event_title" />
          <label>Price:</label>
          <v-text-field v-model="theme.price" />
          <label>Stock:</label>
          <v-text-field type="number" v-model.number="theme.stock" />
          <label>category:</label>
          <v-text-field v-model="theme.category" />
          <div class="d-flex align-center mb-4">
            <div class="mr-4">
              <label>Start time:</label>
              <VueTimepicker
                v-model="theme.start_time"
                format="HH:mm:ss"
                :placeholder="theme.start_time || 'Select Time'"
              />
            </div>
            <div>
              <label>End time:</label>
              <VueTimepicker
                v-model="theme.end_time"
                format="HH:mm:ss"
                :placeholder="theme.end_time || 'Select Time'"
              />
            </div>
          </div>
          <label>Event start date:</label>
          <v-date-picker v-model="theme.iso_date" @change="updateDateValue" />
          <v-btn type="submit">Update Theme</v-btn>
        </form>
        <!-- </div> -->
      </v-col>
    </v-row>
    <v-snackbar
      v-model="snackbarVisible"
      bottom
      :timeout="3000"
      :color="message.type"
    >
      {{ message.message }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { defineComponent, onMounted, ref, computed } from "vue";
import VueTimepicker from "vue3-timepicker/src/VueTimepicker.vue";

import { useRouter } from "vue-router";
import { useStore } from "vuex";
import dayjs from "dayjs";
import {
  db,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  where,
  query,
} from "@/main";

export default defineComponent({
  name: "EventEditView",

  components: {
    VueTimepicker,
  },

  setup() {
    const router = useRouter();
    const store = useStore();
    const cardHeight = computed(() => "694px");
    const showEditTheme = ref(null); // Track the index of the item being edited
    const fileInput = (ref < HTMLInputElement) | (null > null);
    const event = ref({});
    const eventId = ref("");
    const theme = ref({});
    const themes = ref({});
    const hideEventUpdate = ref(false);
    const hideThemeUpdate = ref(false);
    const themeStartDate = ref(null);
    const themeId = ref("");
    const snackbarVisible = ref(false);
    const message = ref({
      type: "",
      message: "",
    });

    const formattedDate = (date) => {
      return dayjs(date).format("MMMM D, YYYY");
    };

    const formattedStartDate = computed({
      get() {
        // Use dayjs to parse and return a JavaScript Date object
        return event.value.start_date
          ? dayjs(event.value.start_date).toDate()
          : null;
      },
      set(value) {
        // Use dayjs to convert the selected date into an ISO string for storage
        event.value.start_date = dayjs(value).toISOString();
      },
    });

    const formattedEndDate = computed({
      get() {
        return event.value.end_date
          ? dayjs(event.value.end_date).toDate()
          : null;
      },
      set(value) {
        event.value.end_date = dayjs(value).toISOString();
      },
    });

    const formattedDatePickerDate = (date) => {
      return date ? dayjs(date).toDate() : null;
    };

    const upDateEvent = async () => {
      const docRef = doc(db, "events", eventId.value);
      try {
        await updateDoc(docRef, event.value);
        message.value = {
          type: "success",
          message: "Event successfully updated",
        };
      } catch (error) {
        console.error("Error updating event", error);
        message.value = {
          type: "error",
          message: "There was an error updating the event",
        };
      } finally {
        snackbarVisible.value = true;
      }
    };

    const updateTheme = async () => {
      const docRef = doc(db, "themes", theme.value.id);

      try {
        await updateDoc(docRef, theme.value);
        message.value = {
          type: "success",
          message: "Theme successfully updated",
        };
      } catch (error) {
        console.error("Error updating theme:", error);
        message.value = {
          type: "error",
          message: "There was an error updating the theme",
        };
      } finally {
        snackbarVisible.value = true;
      }
    };

    const searchForEventById = async () => {
      fetchEvent(eventId.value);
      hideEventUpdate.value = true;
    };

    const searchByEventId = async () => {
      fetchEvent(themeId.value);
      try {
        store.dispatch("setLoading", true);
        const themesRef = collection(db, "themes");
        const themesQuery = query(
          themesRef,
          where("event_id", "==", themeId.value)
        );
        const querySnapshot = await getDocs(themesQuery);

        // Check if there are any matching documents
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            theme.value = {
              ...doc.data(),
              price: event.value.price,
              category: event.value.category,
              iso_date: formattedDatePickerDate(doc.data().date),
            };
          });
          message.value = { type: "success", message: "Theme found!" };
          hideThemeUpdate.value = true;
        } else {
          console.error("No such document!");
          message.value = { type: "error", message: "No such document!" };
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        message.value = { type: "error", message: "Error fetching theme!" };
      } finally {
        store.dispatch("setLoading", false);
        snackbarVisible.value = true;
      }
    };

    const fetchThemesByEventId = async (eventId) => {
      try {
        store.dispatch("setLoading", true); // Set loading to true
        const themesRef = collection(db, "themes"); // Reference to the 'themes' collection
        // Determine the counterpart event ID by switching between '01' and '02'
        let counterpartEventId;
        if (eventId.includes("01_")) {
          counterpartEventId = eventId.replace("01_", "02_");
        } else if (eventId.includes("02_")) {
          counterpartEventId = eventId.replace("02_", "01_");
        } else {
          // If the eventId does not contain '_01' or '_02', return empty results
          console.warn("Event ID does not match expected format:", eventId);

          // find the characters of the event id before the first hyphen
          const prefix = eventId.split("_")[0];

          // Create a query to find documents where 'event_id' starts with the prefix
          const themesQuery = query(
            themesRef,
            where("event_id", ">=", prefix),
            where("event_id", "<", prefix + "\uf8ff") // This ensures we get all IDs starting with the prefix
          );

          // Execute the query
          const querySnapshot = await getDocs(themesQuery);
          const themes = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            price: event.value.price,
            quantity: 0,
            category: event.value.category,
            purchase_id: Math.random().toString(36).substring(2, 15),
          }));

          // // Assign the fetched themes to the reactive themes object
          // themes.value = themes;

          // Split themes into two arrays based on event_id
          const splitThemes = {
            aw01: [],
            aw02: [],
          };

          // Sort themes by date in ascending order
          themes.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          themes.forEach((theme, index) => {
            splitThemes.aw01.push(theme);
          });

          // need to split the themes array inot two arrays strutcured like { aw01: [], aw02: [] }
          // eventThemes.value = splitThemes;
          return themes;
        }

        // Create queries to find documents matching either 'event_id' variation
        const themesQuery01 = query(
          themesRef,
          where("event_id", "==", eventId)
        );
        const themesQuery02 = query(
          themesRef,
          where("event_id", "==", counterpartEventId)
        );

        // Execute both queries
        const [querySnapshot01, querySnapshot02] = await Promise.all([
          getDocs(themesQuery01),
          getDocs(themesQuery02),
        ]);

        // Map the query snapshots to arrays of theme data, including the event price
        const themes01 = querySnapshot01.docs.map((doc) => ({
          ...doc.data(),
          price: event.value.price,
          // quantity: event.value.quantity,
          quantity: 0,
          iso_date: formattedDatePickerDate(doc.data().date),
          category: event.value.category,
          purchase_id: Math.random().toString(36).substring(2, 15),
        }));

        const themes02 = querySnapshot02.docs.map((doc) => ({
          ...doc.data(),
          price: event.value.price,
          // quantity: event.value.quantity,
          quantity: 0,
          iso_date: formattedDatePickerDate(doc.data().date),
          category: event.value.category,
          purchase_id: Math.random().toString(36).substring(2, 15),
        }));

        themes.value = {
          aw01: themes01,
          aw02: themes02,
        };

        store.dispatch("setLoading", false);
        return themes; // Return the object with both arrays
      } catch (error) {
        store.dispatch("setLoading", false);
        return { aw01: [], aw02: [] }; // Return an object with empty arrays in case of an error
      }
    };

    const fetchEvent = async (id) => {
      const docRef = doc(db, "events", id);
      try {
        store.dispatch("setLoading", true);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const eventData = docSnap.data();
          fetchThemesByEventId(eventData.event_id);
          event.value = {
            ...eventData,
            // start: eventData.start,
            // end: eventData.end,
            // days: eventData.days,
          };

          message.value = {
            type: "success",
            message: "Event found!",
          };
          store.dispatch("setLoading", false);
        } else {
          console.error("No such document!");
          store.dispatch("setLoading", false);
          message.value = {
            type: "error",
            message: "No event found!",
          };
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        store.dispatch("setLoading", false);
        message.value = {
          type: "error",
          message: "Error fetching event!",
        };
      } finally {
        snackbarVisible.value = true;
      }
    };

    onMounted(async () => {
      const id = router.currentRoute.value.params.id;
      fetchEvent(id);
    });

    return {
      store,
      event,
      eventId,
      theme,
      themes,
      snackbarVisible,
      message,
      searchForEventById,
      searchByEventId,
      hideEventUpdate,
      hideThemeUpdate,
      fileInput,
      formattedStartDate,
      formattedDatePickerDate,
      themeId,
      formattedEndDate,
      formattedDate,
      fetchEvent,
      showEditTheme,
      fetchThemesByEventId,
      cardHeight,
      themeStartDate,
      upDateEvent,
      updateTheme,
    };
  },
});
</script>
