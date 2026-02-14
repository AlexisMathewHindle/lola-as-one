<template>
  <div class="c-calendar">
    <h1 class="text-center pt-6 mt-0">LoLA Art Classes</h1>
    <p class="text-center">
      Click on the schedule below and scroll down for more information on
      classes
    </p>
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
        <v-col>
          <!-- Use calendarKey to force re-render of FullCalendar when resizing -->
          <FullCalendar
            :options="fullCalendarOptions"
            :key="calendarKey"
            id="calendar"
          >
            <template #eventContent="{ event }">
              <div
                class="c-calendar__event"
                :class="{ 'c-calendar__past-event': isPastEvent(event) }"
              >
                <b>
                  {{ formatTime(event.start) }} - {{ formatTime(event.end) }}</b
                >
                <p class="mb-0 text-caption">{{ event.title }}</p>
              </div>
            </template>
          </FullCalendar>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { db, collection, getDocs } from "@/main";
import { HelperFunctions } from "@/helpers/helpers";

export default defineComponent({
  components: {
    FullCalendar,
  },
  setup() {
    const events = ref([]);
    const helpers = new HelperFunctions();
    const router = useRouter();
    const store = useStore();
    const isMobileView = ref(window.innerWidth < 768);
    const calendarKey = ref(0); // Key to force re-rendering the FullCalendar component
    const cardHeight = computed(() => "694px");

    const localEnv = helpers.getEnvironment() === "development" ? "_dev" : "";

    // Helper to debounce resize events
    const debounce = (func, delay) => {
      let debounceTimer;
      return function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, arguments), delay);
      };
    };

    const isPastEvent = (event) => {
      return new Date(event.end) < new Date();
    };

    const formatTime = (date) => {
      if (!date) return "";
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const updateView = debounce(() => {
      isMobileView.value = window.innerWidth < 768;
      calendarKey.value += 1; // Force re-render of FullCalendar
    }, 250); // 250ms delay for debouncing

    const isHoliday = (string) => {
      return string.toLowerCase().includes("holiday");
    };

    const handleEventClick = (info) => {
      // if (isPastEvent(info.event)) return; // Prevent clicks for past events
      if (info.event.id) {
        store.dispatch("setInitialDate", info.event.start);
        router.push({ name: "event-details", params: { id: info.event.id } });
      } else {
        console.error("Event ID is missing");
      }

      if (info.event.title === "Private Party") {
        router.push("/private-parties");
        return;
      }

      if (info.event.id.toLowerCase().includes("hp")) {
        router.push("/summer-workshops");
        return;
      }
    };

    const fetchEvents = async () => {
      try {
        store.dispatch("setLoading", true);
        const eventsRef = collection(db, `events${localEnv}`);
        const querySnapshot = await getDocs(eventsRef);

        const isHalfTerm = (string) => {
          return string.toLowerCase().includes("half term");
        };

        const eventColors = {
          "Open Studio (all ages)": "#7196a2",
          "Little Ones Tues (ages 2-4)": "#c6a390",
          "Little Ones Fri (ages 2-4)": "#c6a390",
          "Little Ones Wed (ages 2-4)": "#c6a390",
          "Little Ones Saturday Workshop (ages 2-4)": "#c6a390",
          "Kids Art Club Tues (ages 4-7)": "#6d7b5e",
          "Kids Art Club Thurs (ages 4-7)": "#6d7b5e",
          "Kids Art Club Thurs (ages 8-11)": "#eb9938",
          "Kids Art Club Fri (ages 4-7)": "#6d7b5e",
          "Kids Art Club Wed (ages 8-11)": "#eb9938",
          "Young Adults Creative Club (ages 12+)": "#a7a963",
          "Themed Workshop Sat Morning": "#d8b061",
          "Themed Workshop Sat Morning (ages 5+)": "#d8b061",
          "Themed Workshop Sat Afternoon (ages 5+)": "#d8b061",
          "Home Education (ages 4-7)": "#c07c6c",
          "Home Education (ages 8-11)": "#c07c6c",
          "Family Workshop (all ages)": "#f36e21",
          "Half Term – Open Studio (all ages)": "#e9a944",
          "Half Term – Little Ones (ages 2-4)": "#e9a944",
          "Half Term – Little Ones (ages 8-11)": "#e9a944",
          "Half Term – Little Ones (ages 4-7)": "#e9a944",
          "Half Term – Themed Workshop (ages 5+)": "#e9a944",
          "Half Term – Kids Art Club (Young Adults ages 12+)": "#e9a944",
          "Half Term – Kids Art Club (ages 8-11)": "#e9a944",
          "Half Term – Kids Art Club (ages 4-7)": "#e9a944",
          "Half Term (ages 2-4)": "#e9a944",
          "Half Term  (ages 2-4)": "#e9a944",
          "Half Term (ages 4-7)": "#e9a944",
          "Half Term (ages 8-11)": "#e9a944",
          "Half Term (ages 12+)": "#e9a944",
          "Holiday Little Ones (ages 2-4)": "#e9a944",
          "Holidays (ages 5+)": "#e9a944",
          "Holiday (ages 5+)": "#e9a944",
          "Holiday Family Workshop (all ages)": "#93A27D",
          "Holiday Workshop (ages 4-7)": "#93A27D",
          "Holiday Workshop (ages 5+)": "#93A27D",
          "Holiday Workshop (ages 2-4)": "#93A27D",
          "Holiday – Open Studio (all ages)": "#93A27D",
          "Holiday Workshop (ages 12+)": "#93A27D",
          "Holiday Workshop (ages 8-11)": "#93A27D",
          "Kids Art Club Wed (all ages 4+)": "#93A27D",
          "Santa Sack Painting": "#93A27D",
          "Christmas fabric napkins and festive table decorations": "#93A27D",
          "Candleholders to bring joy over the holidays": "#93A27D",
          "Make a gift before its too late!": "#93A27D",
          "Painted ceramic baubles for the last-minute tree": "#93A27D",
          "Open Studio (all ages) Easter Fun": "#e9a944",
          "Clay Egg-cups and Multi-media Bunny Cards (ages 5+)": "#e9a944",
          "Bunny Bags and Egg Garlands (ages 2-4)": "#e9a944",
          "Easter Bunting and Bunny Head-dresses (ages 5+)": "#e9a944",
          "Egg-carton Flower Wreath (ages 5+)": "#e9a944",
          "Painted Eggs (ages 5+)": "#e9a944",
          "Family Workshop ‘Ostereierbaum” or Spring Trees": "#e9a944",
          "Open Studio (all ages) Artists to Know": "#e9a944",
          "Little Ones (ages 2-4) Sonia Delaunay": "#e9a944",
          "Holiday Workshop (ages 5+)  Helen Frankenthaler and Colour Fields":
            "#e9a944",
          "Little Ones (ages 2-4) Kandinsky and Circles": "#e9a944",
          "Holiday Workshop (ages 5+) Pablo Picasso and Portraits": "#e9a944",
          "Private Party": "#e9a944",
          "Little Ones Saturday Workshop (ages 2-5)": "#c0a493",
          "Little Ones (ages 2-4) Yayoi Kusama": "#e9a944",
          "Little Ones (ages 2-4) Henri Matisse": "#e9a944",
          "Holiday Workshop (ages 5+) Georgia O’Keeffe and the Sky": "#e9a944",
          "Holiday Workshop (ages 5+) David Hockney and Hills": "#e9a944",
          "Holiday Workshop (ages 5+) Vincent van Gogh and Flowers": "#e9a944",
          "The Story of Art Club (ages 4-8)": "#696b4a",
          "The Story of Art Club (ages 9-13)": "#a8d5c4",
          "Art Club (ages 4+)": "#a7a963",
          "Home Education (ages 5+)": "#c07c6c",
          "Littles Ones Sat (ages 2-5)": "#c6a390",
        };

        events.value = querySnapshot.docs.map((doc) => {
          const eventData = doc.data();
          // #2d2a26
          const eventColor =
            eventColors[eventData.event_title.trim()] || "#e9a944"; // Default to black if type not found

          return {
            id: doc.id,
            title: eventData.event_title,
            // need this to be at the beginning of the day
            startRecur: new Date(eventData.start_date).setHours(0, 0, 0),
            // need this to be at the end of the day
            endRecur: new Date(eventData.end_date).setHours(23, 59, 59),
            daysOfWeek: eventData.daysOfWeek,
            startTime: eventData.start_time,
            endTime: eventData.end_time,
            backgroundColor: eventColor,
            borderColor: eventColor,
            opacity: isPastEvent({ end: eventData.end_date }) ? 0.5 : 1,
          };
        });
        store.dispatch("setLoading", false);
      } catch (error) {
        store.dispatch("setLoading", false);
        console.error("Error fetching events in calendar view", error);
      }
    };

    const applyMondayStyles = () => {
      const mondayIndex = 1; // Monday is index 1 (0 is Sunday)

      // Find all the time grid columns that correspond to Monday
      const timeGridCols = document.querySelectorAll(".fc-timegrid-col-frame");

      if (timeGridCols.length > mondayIndex) {
        const mondayColumn = timeGridCols[mondayIndex];
        mondayColumn.style.backgroundColor = "#DBDBDB"; // Light grey background
      }
    };

    onMounted(() => {
      fetchEvents();
      window.addEventListener("resize", updateView);
    });

    return {
      localEnv,
      events,
      applyMondayStyles,
      handleEventClick,
      updateView,
      isHoliday,
      formatDate,
      formatTime,
      isPastEvent,
      isMobileView,
      calendarKey, // Used to re-render FullCalendar
      store,
      cardHeight,
    };
  },

  computed: {
    currentView() {
      return this.isMobileView ? "listWeek" : "timeGridWeek";
    },
    pluginsToUse() {
      return this.isMobileView
        ? [listPlugin, interactionPlugin] // Ensure listPlugin for mobile
        : [dayGridPlugin, timeGridPlugin, interactionPlugin]; // Ensure timeGridPlugin for desktop
    },
    fullCalendarOptions() {
      return {
        headerToolbar: {
          left: "prev,next,today",
          right: this.isMobileView ? "" : "timeGridWeek,timeGridDay", // Switch views dynamically
        },
        dayHeaderFormat: (date) => {
          return date.date.marker.toLocaleString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          });
        },
        height: "auto", // Automatically adjust the height
        contentHeight: "auto", // Ensure content height adapts
        // initialDate: Date.now(), // Set initial date to today
        initialDate: "2025-09-01",
        initialView: this.isMobileView ? "listWeek" : "timeGridWeek", // Set initial view based on screen size
        events: this.events,
        eventClick: this.handleEventClick,
        eventShortHeight: 20, // Shorten the height of events
        eventTimeFormat: {
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        },
        allDaySlot: false, // Hide all-day slot
        slotDuration: "00:15:00", // each slot is 15 minutes
        slotLabelInterval: "00:30", // labels are shown every hour
        firstDay: 1, // start the week on Monday
        slotMinTime: "09:00:00", // start the calendar at 9 AM
        slotMaxTime: "18:15:00", // end the calendar at 7 PM
        plugins: this.pluginsToUse, // Dynamically apply plugins
        datesSet: this.applyMondayStyles, // Apply styles for Monday
      };
    },
  },
  watch: {
    events: {
      handler(newEvents) {
        this.calendarOptions = {
          ...this.calendarOptions,
          events: newEvents,
        };
      },
      deep: true,
    },
  },
});
</script>

<style lang="scss">
/* .fc-timegrid-event-harness:not(.fc-event-past) {
  cursor: pointer;
} */

.c-calendar {
  &__event {
    cursor: pointer;
  }
  // &__past-event {
  //   cursor: not-allowed;
  // }
}

.fc-v-event {
  padding: 5px;
}

.fc-v-event .fc-event-main {
  font-weight: var(--weight-medium);
}
.fc-col-header {
  background-color: var(--yellow) !important;
  color: var(--white) !important;
}

.fc-col-header-cell-cushion {
  font-weight: var(--weight-medium);
}

.fc-button,
.fc-today-button,
.fc-timeGridWeek-button,
.fc-timeGridDay-button {
  background-color: var(--yellow) !important;
  color: var(--white) !important;
  border: 1px solid var(--yellow) !important;
}

.fc-timegrid-col-frame:nth-child(2) {
  background-color: red !important; /* Light yellow for Monday */
}

.fc-event-past {
  pointer-events: none;
  opacity: 0.6;
}
</style>
