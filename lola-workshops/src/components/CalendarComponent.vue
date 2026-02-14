<template>
  <div class="c-calendar">
    <h1 class="text-center pt-6 mt-0">LoLA Art Classes</h1>
    <p class="text-center mb-6">
      Click on the schedule below and scroll down for more information on
      classes
    </p>

    <!-- Calendar Controls -->
    <v-container>
      <v-card class="mb-4 pa-3">
        <v-row align="center" justify="space-between">
          <!-- Navigation -->
          <v-col cols="auto">
            <v-btn-group>
              <v-btn
                @click="previousWeek"
                icon
                variant="text"
                :title="viewMode === 'week' ? 'Previous week' : 'Previous day'"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              <v-btn @click="goToToday" variant="tonal">Today</v-btn>
              <v-btn
                @click="nextWeek"
                icon
                variant="text"
                :title="viewMode === 'week' ? 'Next week' : 'Next day'"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </v-btn-group>
          </v-col>

          <!-- View Toggle - Hidden on mobile -->
          <v-col cols="auto" class="d-none d-sm-flex">
            <v-btn-group>
              <v-btn
                @click="viewMode = 'week'"
                :variant="viewMode === 'week' ? 'flat' : 'outlined'"
                :color="viewMode === 'week' ? '#d8b061' : ''"
              >
                Week
              </v-btn>
              <v-btn
                @click="viewMode = 'day'"
                :variant="viewMode === 'day' ? 'flat' : 'outlined'"
                :color="viewMode === 'day' ? '#d8b061' : ''"
              >
                Day
              </v-btn>
            </v-btn-group>
          </v-col>
        </v-row>
      </v-card>

      <!-- Loading State -->
      <v-card v-if="loading" class="pa-12 text-center">
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        ></v-progress-circular>
        <p class="mt-4">Loading workshops...</p>
      </v-card>

      <!-- Error State -->
      <v-card v-else-if="error" class="pa-6 text-center" color="error">
        <v-icon size="48" class="mb-4">mdi-alert-circle</v-icon>
        <p class="font-weight-medium mb-2">Failed to load workshops</p>
        <p class="text-caption mb-4">{{ error }}</p>
        <v-btn @click="fetchWorkshops" color="white" variant="outlined">
          Try Again
        </v-btn>
      </v-card>

      <!-- Calendar View -->
      <v-card v-else class="overflow-hidden">
        <!-- Week View (Desktop only) -->
        <div v-if="viewMode === 'week' && !isMobileView" class="week-view">
          <!-- Date Headers -->
          <div class="week-header">
            <div class="time-column-header"></div>
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="day-header"
              :class="{ 'is-today': isToday(day.date) }"
            >
              <div class="day-name">{{ day.dayName }}</div>
              <div class="day-date">{{ day.dateLabel }}</div>
            </div>
          </div>

          <!-- Time Grid -->
          <div class="week-grid">
            <!-- Time Labels Column -->
            <div class="time-column">
              <div
                v-for="time in timeSlots"
                :key="time"
                class="time-slot-label"
              >
                {{ time }}
              </div>
            </div>

            <!-- Day Columns -->
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="day-column"
              :class="{ 'is-today': isToday(day.date) }"
            >
              <!-- Time Slot Backgrounds -->
              <div
                v-for="time in timeSlots"
                :key="time"
                class="time-slot-bg"
              ></div>

              <!-- Workshop Blocks -->
              <div
                v-for="workshop in getWorkshopsForDay(day.date)"
                :key="workshop.id"
                :style="{ ...getWorkshopStyle(workshop), ...getWorkshopColorStyle(workshop) }"
                @click="goToWorkshop(workshop)"
                class="workshop-block"
                :class="[
                  isPastEvent(workshop) ? 'is-past' : '',
                  getWorkshopColorClass(workshop),
                ]"
              >
                <div class="workshop-time">
                  {{
                    formatTimeRange(
                      workshop.event_start_time,
                      workshop.event_end_time
                    )
                  }}
                </div>
                <div class="workshop-title">{{ workshop.offering.title }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Day View (Mobile - always shown, Desktop - when day mode) -->
        <div v-if="viewMode === 'day'" class="day-view">
          <!-- Date Header -->
          <div class="day-view-header">
            <div class="day-view-name">{{ currentDayName }}</div>
            <div class="day-view-date">{{ currentDateLabel }}</div>
          </div>

          <!-- Time Grid -->
          <div class="day-view-grid">
            <!-- Time Labels Column -->
            <div class="time-column">
              <div
                v-for="time in timeSlots"
                :key="time"
                class="time-slot-label-day"
              >
                {{ time }}
              </div>
            </div>

            <!-- Day Column -->
            <div class="day-column-single">
              <!-- Time Slot Backgrounds -->
              <div
                v-for="time in timeSlots"
                :key="time"
                class="time-slot-bg-day"
              ></div>

              <!-- Workshop Blocks -->
              <div
                v-for="workshop in getWorkshopsForDay(currentDateString)"
                :key="workshop.id"
                :style="{ ...getWorkshopStyleDay(workshop), ...getWorkshopColorStyle(workshop) }"
                @click="goToWorkshop(workshop)"
                class="workshop-block-day"
                :class="[
                  isPastEvent(workshop) ? 'is-past' : '',
                  getWorkshopColorClass(workshop),
                ]"
              >
                <div class="workshop-time-day">
                  {{
                    formatTimeRange(
                      workshop.event_start_time,
                      workshop.event_end_time
                    )
                  }}
                </div>
                <div class="workshop-title-day">
                  {{ workshop.offering.title }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View (Mobile only when in week mode) -->
        <div v-if="viewMode === 'week' && isMobileView" class="list-view">
          <div v-for="day in weekDays" :key="day.date" class="list-day">
            <!-- Date Header -->
            <div
              class="list-day-header"
              :class="{ 'is-today': isToday(day.date) }"
            >
              <div>
                <div class="list-day-name">{{ day.dayName }}</div>
                <div class="list-day-date">{{ day.dateLabel }}</div>
              </div>
              <v-chip v-if="isToday(day.date)" color="primary" size="small">
                Today
              </v-chip>
            </div>

            <!-- Workshops for this day -->
            <div
              v-if="getWorkshopsForDay(day.date).length > 0"
              class="list-workshops"
            >
              <div
                v-for="workshop in getWorkshopsForDay(day.date)"
                :key="workshop.id"
                @click="goToWorkshop(workshop)"
                class="list-workshop-item"
                :class="{ 'is-past': isPastEvent(workshop) }"
              >
                <v-chip
                  :color="
                    isPastEvent(workshop)
                      ? 'grey'
                      : getWorkshopChipColor(workshop)
                  "
                  size="small"
                  class="workshop-time-chip"
                >
                  {{ formatTime(workshop.event_start_time) }}
                </v-chip>

                <div class="workshop-info">
                  <div class="workshop-info-title">
                    {{ workshop.offering.title }}
                  </div>
                  <div class="workshop-info-meta">
                    <span v-if="workshop.event_end_time">
                      {{
                        formatTimeRange(
                          workshop.event_start_time,
                          workshop.event_end_time
                        )
                      }}
                    </span>
                  </div>
                </div>

                <v-icon v-if="!isPastEvent(workshop)" size="small">
                  mdi-chevron-right
                </v-icon>
              </div>
            </div>

            <!-- No workshops message -->
            <div v-else class="list-no-workshops">No workshops scheduled</div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="workshops.length === 0" class="empty-state">
          <v-icon size="64" color="grey-lighten-1">mdi-calendar</v-icon>
          <h3 class="text-h6 mt-4 mb-2">No workshops scheduled</h3>
          <p class="text-body-2">Check back soon for upcoming workshops!</p>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

// SUPABASE IMPORT - Using Supabase instead of Firebase
import { fetchEventsFromSupabase } from "@/lib/supabase";

export default defineComponent({
  name: "CalendarComponent",
  setup() {
    const router = useRouter();
    const store = useStore();

    // State
    const workshops = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const currentDate = ref(new Date());
    const viewMode = ref("week");
    const windowWidth = ref(window.innerWidth);

    // Mobile detection (using 850px as breakpoint)
    const isMobileView = computed(() => windowWidth.value < 850);

    // Handle window resize
    const handleResize = () => {
      windowWidth.value = window.innerWidth;
    };

    // Time slots (9am - 6pm in 30-minute increments)
    const timeSlots = [
      "9am",
      "9:30am",
      "10am",
      "10:30am",
      "11am",
      "11:30am",
      "12pm",
      "12:30pm",
      "1pm",
      "1:30pm",
      "2pm",
      "2:30pm",
      "3pm",
      "3:30pm",
      "4pm",
      "4:30pm",
      "5pm",
      "5:30pm",
      "6pm",
    ];

    // Get start of week (Monday)
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      return new Date(d.setDate(diff));
    };

    // Get week days
    const weekDays = computed(() => {
      const start = getStartOfWeek(currentDate.value);
      const days = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        days.push({
          date: date.toISOString().split("T")[0],
          dayName: date.toLocaleDateString("en-GB", { weekday: "short" }),
          dateLabel: date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
        });
      }

      return days;
    });

    // Current day info (for day view)
    const currentDateString = computed(() => {
      return currentDate.value.toISOString().split("T")[0];
    });

    const currentDayName = computed(() => {
      return currentDate.value.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    });

    const currentDateLabel = computed(() => {
      return currentDate.value.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    });

    // Check if date is today
    const isToday = (dateString) => {
      const today = new Date().toISOString().split("T")[0];
      return dateString === today;
    };

    // Check if event is in the past
    const isPastEvent = (workshop) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day

      const eventDate = new Date(workshop.event_date);
      eventDate.setHours(0, 0, 0, 0);

      // If event is on a past date, it's definitely past
      if (eventDate < today) {
        return true;
      }

      // If event is today, check the time
      if (
        eventDate.getTime() === today.getTime() &&
        workshop.event_start_time
      ) {
        const now = new Date();
        const [hours, minutes] = workshop.event_start_time
          .split(":")
          .map(Number);
        const eventDateTime = new Date();
        eventDateTime.setHours(hours, minutes, 0, 0);

        return eventDateTime < now;
      }

      return false;
    };

    // Fetch workshops
    const fetchWorkshops = async () => {
      try {
        loading.value = true;
        error.value = null;

        // Get date range based on view mode
        let startDate, endDate;

        if (viewMode.value === "week") {
          const start = getStartOfWeek(currentDate.value);
          startDate = start.toISOString().split("T")[0];
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          endDate = end.toISOString().split("T")[0];
        } else {
          startDate = currentDate.value.toISOString().split("T")[0];
          endDate = startDate;
        }

        // Fetch from Supabase
        const supabaseEvents = await fetchEventsFromSupabase();

        // Filter events by date range
        workshops.value = supabaseEvents.filter((event) => {
          return event.event_date >= startDate && event.event_date <= endDate;
        });

        loading.value = false;
      } catch (err) {
        console.error("Error fetching workshops:", err);
        error.value = "Failed to load workshops. Please try again.";
        loading.value = false;
      }
    };

    // Get workshops for a specific day
    const getWorkshopsForDay = (dateString) => {
      return workshops.value.filter((w) => w.event_date === dateString);
    };

    // Get workshop color class based on category color
    const getWorkshopColorClass = (workshop) => {
      // Use category color if available
      if (workshop.category && workshop.category.color_hex) {
        return `color-custom`;
      }

      // Fallback to title-based colors for backwards compatibility
      const title = workshop.offering.title.toLowerCase();

      // Open Studio - Blue/Teal
      if (title.includes("open studio")) {
        return "color-blue";
      }

      // Little Ones classes (ages 2-4) - Brown/Tan
      if (title.includes("little ones") || title.includes("ages 2-4")) {
        return "color-tan";
      }

      // Kids Art Club (ages 4-7) - Green
      if (title.includes("kids art club") && title.includes("ages 4-7")) {
        return "color-green";
      }

      // Kids Art Club (ages 8-11) - Orange
      if (title.includes("kids art club") && title.includes("ages 8-11")) {
        return "color-orange";
      }

      // Young Adults - Olive
      if (title.includes("young adults") || title.includes("ages 12+")) {
        return "color-olive";
      }

      // Themed Workshop - Gold
      if (title.includes("themed workshop")) {
        return "color-gold";
      }

      // Home Education - Brown
      if (title.includes("home education")) {
        return "color-brown";
      }

      // Family Workshop - Orange
      if (title.includes("family workshop")) {
        return "color-family";
      }

      // Half Term / Holiday - Yellow
      if (title.includes("half term") || title.includes("holiday")) {
        return "color-yellow";
      }

      // Default - Primary color
      return "color-primary";
    };

    // Get inline style for custom category colors
    const getWorkshopColorStyle = (workshop) => {
      if (workshop.category && workshop.category.color_hex) {
        return {
          backgroundColor: workshop.category.color_hex,
          borderColor: workshop.category.color_hex,
        };
      }
      return {};
    };

    // Get chip color for list view
    const getWorkshopChipColor = (workshop) => {
      // Use category color if available
      if (workshop.category && workshop.category.color_hex) {
        return workshop.category.color_hex;
      }

      // Fallback to title-based colors
      const title = workshop.offering.title.toLowerCase();

      if (title.includes("open studio")) return "blue";
      if (title.includes("little ones")) return "brown";
      if (title.includes("kids art club")) return "green";
      if (title.includes("themed workshop")) return "amber";
      if (title.includes("half term") || title.includes("holiday"))
        return "yellow";

      return "primary";
    };

    // Calculate workshop position and height
    const getWorkshopStyle = (workshop) => {
      const startTime = workshop.event_start_time;
      const endTime = workshop.event_end_time || workshop.event_start_time;

      // Convert time to minutes from 9am
      const startMinutes = timeToMinutes(startTime) - 9 * 60;
      const endMinutes = timeToMinutes(endTime) - 9 * 60;
      const duration = endMinutes - startMinutes;

      // Each 30-minute slot is 64px
      const pixelsPerMinute = 64 / 30;
      const top = startMinutes * pixelsPerMinute;
      const height = duration * pixelsPerMinute;

      return {
        top: `${top}px`,
        height: `${Math.max(height, 40)}px`, // Minimum height
      };
    };

    // Calculate workshop position and height for day view
    const getWorkshopStyleDay = (workshop) => {
      const startTime = workshop.event_start_time;
      const endTime = workshop.event_end_time || workshop.event_start_time;

      // Convert time to minutes from 9am
      const startMinutes = timeToMinutes(startTime) - 9 * 60;
      const endMinutes = timeToMinutes(endTime) - 9 * 60;
      const duration = endMinutes - startMinutes;

      // Each 30-minute slot is 80px on desktop, 64px on mobile
      const pixelsPerMinute = isMobileView.value ? 64 / 30 : 80 / 30;
      const top = startMinutes * pixelsPerMinute;
      const height = duration * pixelsPerMinute;
      const minHeight = isMobileView.value ? 48 : 60;

      return {
        top: `${top}px`,
        height: `${Math.max(height, minHeight)}px`,
      };
    };

    // Convert time string to minutes
    const timeToMinutes = (timeString) => {
      const [hours, minutes] = timeString.split(":").map(Number);
      return hours * 60 + minutes;
    };

    // Format single time (e.g., "14:30" -> "2:30pm")
    const formatTime = (timeString) => {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const period = hour >= 12 ? "pm" : "am";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes}${period}`;
    };

    // Format time range
    const formatTimeRange = (startTime, endTime) => {
      if (!endTime) return formatTime(startTime);
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    };

    // Navigation
    const previousWeek = () => {
      const newDate = new Date(currentDate.value);
      newDate.setDate(newDate.getDate() - 7);
      currentDate.value = newDate;
      fetchWorkshops();
    };

    const nextWeek = () => {
      const newDate = new Date(currentDate.value);
      newDate.setDate(newDate.getDate() + 7);
      currentDate.value = newDate;
      fetchWorkshops();
    };

    const goToToday = () => {
      currentDate.value = new Date();
      fetchWorkshops();
    };

    // Navigate to workshop detail
    const goToWorkshop = (workshop) => {
      // Don't navigate if event is in the past
      if (isPastEvent(workshop)) {
        return;
      }
      store.dispatch("setInitialDate", new Date(workshop.event_date));
      router.push({ name: "event-details", params: { id: workshop.id } });
    };

    // Initialize
    onMounted(() => {
      viewMode.value = "week";
      window.addEventListener("resize", handleResize);
      fetchWorkshops();
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
    });

    return {
      workshops,
      loading,
      error,
      currentDate,
      viewMode,
      isMobileView,
      timeSlots,
      weekDays,
      currentDateString,
      currentDayName,
      currentDateLabel,
      isToday,
      isPastEvent,
      fetchWorkshops,
      getWorkshopsForDay,
      getWorkshopColorClass,
      getWorkshopColorStyle,
      getWorkshopChipColor,
      getWorkshopStyle,
      getWorkshopStyleDay,
      formatTime,
      formatTimeRange,
      previousWeek,
      nextWeek,
      goToToday,
      goToWorkshop,
      store,
    };
  },
});
</script>

<style lang="scss" scoped>
/* Calendar container */
.c-calendar {
  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
}

/* Week View */
.week-view {
  overflow-x: auto;
}

.week-header {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 2px solid #e5e7eb;
}

.time-column-header {
  background-color: #f9fafb;
  border-right: 1px solid #e5e7eb;
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background-color: var(--yellow, #f59e0b);
  color: white;
  font-weight: 600;
  border-right: 1px solid rgba(255, 255, 255, 0.2);

  &:last-child {
    border-right: none;
  }

  &.is-today {
    background-color: #d97706;
  }
}

.day-name {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-date {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}

.week-grid {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  position: relative;
}

.time-column {
  border-right: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.time-slot-label {
  height: 64px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
}

.day-column {
  position: relative;
  border-right: 1px solid #e5e7eb;

  &:last-child {
    border-right: none;
  }

  &.is-today {
    background-color: #fffbeb;
  }
}

.time-slot-bg {
  height: 64px;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
}

.workshop-block {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 13px;
  line-height: 1.3;

  &:hover:not(.is-past) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &.is-past {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.workshop-time, 
.workshop-title {
  color: #fff;
}

.workshop-time {
  font-size: 11px;
  opacity: 0.9;
  margin-bottom: 2px;
}

.workshop-title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Day View */
.day-view {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.day-view-header {
  background-color: var(--yellow, #f59e0b);
  color: white;
  padding: 16px;
  text-align: center;
}

.day-view-name {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 4px;
}

.day-view-date {
  font-size: 14px;
  opacity: 0.9;
}

.day-view-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0;
}

.time-slot-label-day {
  height: 80px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  background-color: #f9fafb;

  &:last-child {
    border-bottom: none;
  }
}

.day-column-single {
  position: relative;
}

.time-slot-bg-day {
  height: 80px;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
}

.workshop-block-day {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 14px;
  line-height: 1.4;

  &:hover:not(.is-past) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &.is-past {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.workshop-time-day {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.workshop-title-day {
  font-weight: 600;
}

/* List View (Mobile) */
.list-view {
  padding: 0;
}

.list-day {
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
}

.list-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;

  &.is-today {
    background-color: #fffbeb;
  }
}

.list-day-name {
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.list-day-date {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.list-workshops {
  padding: 0;
}

.list-workshop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(.is-past) {
    background-color: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }

  &.is-past {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.workshop-time-chip {
  flex-shrink: 0;
}

.workshop-info {
  flex: 1;
  min-width: 0;
}

.workshop-info-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workshop-info-meta {
  font-size: 12px;
  color: #6b7280;
}

.list-no-workshops {
  padding: 24px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #6b7280;
}

/* Workshop colors */
.color-blue {
  background-color: #7196a2;
  color: white;
}

.color-tan {
  background-color: #c6a390;
  color: white;
}

.color-green {
  background-color: #6d7b5e;
  color: white;
}

.color-orange {
  background-color: #eb9938;
  color: white;
}

.color-olive {
  background-color: #a7a963;
  color: white;
}

.color-gold {
  background-color: #d8b061;
  color: white;
}

.color-brown {
  background-color: #c07c6c;
  color: white;
}

.color-family {
  background-color: #f36e21;
  color: white;
}

.color-yellow {
  background-color: #e9a944;
  color: white;
}

.color-primary {
  background-color: var(--yellow);
  color: white;
}

/* Day view */
.day-view {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.day-view-header {
  background-color: var(--yellow);
  color: white;
  padding: 16px;
  font-weight: 600;
  font-size: 18px;
  text-align: center;
}

.day-view-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 0;
}

/* Mobile responsive */
@media (max-width: 850px) {
  .calendar-grid {
    display: none;
  }

  .view-toggle {
    display: none;
  }

  .day-view-grid {
    grid-template-columns: 60px 1fr;
  }

  .time-slot {
    font-size: 11px;
  }

  .workshop-card {
    font-size: 12px;
  }
}

/* List view for mobile */
.workshop-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workshop-list-item {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;

  &:hover:not(.past) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.past {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.workshop-list-date {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.workshop-list-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.workshop-list-time {
  font-size: 14px;
  color: #6b7280;
}
</style>
