<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Dashboard Overview</h1>
        <v-row>
          <v-col cols="12" md="4">
            <h2>Bookings:</h2>
            <div class="d-flex align-center mb-1 justify-space-between">
              <p class="mr-2 mb-0">Total bookings: {{ stats.totalBookings }}</p>
              <v-icon @click="fetchAndFilterBookings('total')" class="view-icon"
                >mdi-eye</v-icon
              >
            </div>
            <div class="d-flex align-center mb-1 justify-space-between">
              <p class="mr-2 mb-0">
                Bookings this month: {{ stats.bookingsThisMonth }}
              </p>
              <v-icon @click="fetchAndFilterBookings('month')" class="view-icon"
                >mdi-eye</v-icon
              >
            </div>
            <div class="d-flex align-center mb-1 justify-space-between">
              <p class="mr-2 mb-0">
                Bookings this week: {{ stats.bookingsThisWeek }}
              </p>
              <v-icon @click="fetchAndFilterBookings('week')" class="view-icon"
                >mdi-eye</v-icon
              >
            </div>
            <div class="d-flex align-center mb-1 justify-space-between">
              <p>Bookings Today: {{ stats.bookingsToday }}</p>
              <v-icon @click="fetchAndFilterBookings('today')" class="view-icon"
                >mdi-eye</v-icon
              >
            </div>
          </v-col>
          <v-col cols="12" md="5">
            <h2>Events:</h2>
            <div class="d-flex align-center mb-1 justify-space-between">
              <p class="mr-2 mb-0">
                Total Events Booked: {{ stats.eventsBooked }}
              </p>
              <v-icon
                @click="fetchAndFilterBookings('totalEvents')"
                class="view-icon"
                >mdi-eye</v-icon
              >
            </div>
            <div class="d-flex align-center mb-1 justify-space-between">
              <p class="mr-2 mb-0">
                Events this month: {{ stats.eventsBookedThisMonth }}
              </p>
              <v-icon
                @click="fetchAndFilterBookings('eventsThisMonth')"
                class="view-icon"
                >mdi-eye</v-icon
              >
            </div>
          </v-col>
          <v-col cols="12" md="3">
            <h2>Attendees</h2>
            <p>Total attendees: {{ stats.totalAttendees }}</p>
            <p>Attendees Today: {{ stats.attendeesToday }}</p>
            <p>Attendees Tomorrow: {{ stats.attendeesTomorrow }}</p>
            <p>Attendees this week: {{ stats.attendeesNext7Days }}</p>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row v-if="filteredBookings.length">
      <v-col cols="12">
        <template v-for="(booking, index) in filteredBookings" :key="index">
          <BookingItemComponent :bookingData="booking" :index="index + 1" />
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent, onMounted, ref } from "vue";
import { getFirestore, collection, getDocs } from "@/main";
import BookingItemComponent from "@/components/BookingItemComponent.vue";

export default defineComponent({
  name: "DashboardOverview",
  components: { BookingItemComponent },

  setup() {
    const stats = ref({
      totalBookings: 0,
      eventsBooked: 0,
      bookingsThisMonth: 0,
      eventsBookedThisMonth: 0,
      bookingsThisWeek: 0,
      bookingsToday: 0,
      totalAttendees: 0,
      attendeesToday: 0,
      attendeesTomorrow: 0,
      attendeesNext7Days: 0,
    });

    const filteredBookings = ref([]);

    const fetchAndFilterBookings = async (type) => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const todayRange = getUTCDateRange(0, 1);
        const tomorrowRange = getUTCDateRange(1, 1);
        const weekRange = getWeekRange();
        const monthRange = getMonthRange();
        const next7DaysRange = getUTCDateRange(0, 7);

        let relevantBookings = [];
        let bookingsToday = [];
        let bookingsThisWeek = [];
        let bookingsThisMonth = [];
        let eventsBooked = [];
        let eventsThisMonth = [];

        bookings.forEach((booking) => {
          const timestamp = firestoreTimestampToDate(booking.timestamp);

          // Filter bookings by type
          if (type === "total" || type === "totalEvents") {
            relevantBookings.push(booking);
          }

          if (timestamp >= todayRange.start && timestamp <= todayRange.end) {
            bookingsToday.push(booking);
            if (type === "today") relevantBookings.push(booking);
          }

          if (timestamp >= weekRange.start && timestamp <= weekRange.end) {
            bookingsThisWeek.push(booking);
            if (type === "week") relevantBookings.push(booking);
          }

          if (timestamp >= monthRange.start && timestamp <= monthRange.end) {
            bookingsThisMonth.push(booking);
            if (type === "month") relevantBookings.push(booking);
          }

          booking.basket.forEach((item) => {
            eventsBooked.push(item);
            const eventDateTime = parseEventDateTime(
              item.date,
              item.start_time
            );
            if (
              eventDateTime >= monthRange.start &&
              eventDateTime <= monthRange.end
            ) {
              eventsThisMonth.push(booking);
              if (type === "eventsThisMonth") relevantBookings.push(booking);
            }
          });
        });

        // Update stats based on the filtered data
        stats.value.totalBookings = bookings.length;
        stats.value.bookingsToday = bookingsToday.length;
        stats.value.bookingsThisWeek = bookingsThisWeek.length;
        stats.value.bookingsThisMonth = bookingsThisMonth.length;
        stats.value.eventsBooked = eventsBooked.length;
        stats.value.eventsBookedThisMonth = eventsThisMonth.length;

        filteredBookings.value = relevantBookings;
      } catch (error) {
        console.error("Error fetching bookings: ", error);
      }
    };

    const fetchStatsOnly = async () => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const todayRange = getUTCDateRange(0, 1);
        const tomorrowRange = getUTCDateRange(1, 1);
        const weekRange = getWeekRange();
        const monthRange = getMonthRange();
        const next7DaysRange = getUTCDateRange(0, 7);

        let bookingsToday = [];
        let bookingsThisWeek = [];
        let bookingsThisMonth = [];
        let eventsBooked = [];
        let eventsThisMonth = [];
        let attendeesToday = 0;
        let attendeesTomorrow = 0;
        let attendeesNext7Days = 0;
        let totalAttendees = 0;

        bookings.forEach((booking) => {
          totalAttendees += booking.attendees?.length || 0;

          const timestamp = firestoreTimestampToDate(booking.timestamp);

          if (timestamp >= todayRange.start && timestamp <= todayRange.end) {
            bookingsToday.push(booking);
            if (booking.attendees) {
              totalAttendees += booking.attendees.length;
              attendeesToday += booking.attendees.length;
            }
          }

          if (
            timestamp >= tomorrowRange.start &&
            timestamp <= tomorrowRange.end
          ) {
            if (booking.attendees) {
              attendeesTomorrow += booking.attendees.length;
            }
          }

          if (
            timestamp >= todayRange.start &&
            timestamp <= next7DaysRange.end
          ) {
            if (booking.attendees) {
              attendeesNext7Days += booking.attendees.length;
            }
          }

          if (timestamp >= weekRange.start && timestamp <= weekRange.end) {
            bookingsThisWeek.push(booking);
          }

          if (timestamp >= monthRange.start && timestamp <= monthRange.end) {
            bookingsThisMonth.push(booking);
          }

          booking.basket.forEach((item) => {
            eventsBooked.push(item);
            const eventDateTime = parseEventDateTime(
              item.date,
              item.start_time
            );
            if (
              eventDateTime >= monthRange.start &&
              eventDateTime <= monthRange.end
            ) {
              eventsThisMonth.push(booking);
            }
          });
        });

        // Update stats
        stats.value.totalBookings = bookings.length;
        stats.value.bookingsToday = bookingsToday.length;
        stats.value.bookingsThisWeek = bookingsThisWeek.length;
        stats.value.bookingsThisMonth = bookingsThisMonth.length;
        stats.value.eventsBooked = eventsBooked.length;
        stats.value.eventsBookedThisMonth = eventsThisMonth.length;
        stats.value.totalAttendees = totalAttendees;
        stats.value.attendeesToday = attendeesToday;
        stats.value.attendeesTomorrow = attendeesTomorrow;
        stats.value.attendeesNext7Days = attendeesNext7Days;
      } catch (error) {
        console.error("Error fetching stats: ", error);
      }
    };
    const getUTCDateRange = (daysOffset = 0, duration = 1) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + daysOffset);
      const start = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0,
          0,
          0
        )
      );
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + duration);
      end.setUTCHours(23, 59, 59, 999);
      return { start, end };
    };

    const getWeekRange = () => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date.setDate(diff));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return {
        start: new Date(weekStart.setHours(0, 0, 0, 0)),
        end: new Date(weekEnd.setHours(23, 59, 59, 999)),
      };
    };

    const getMonthRange = () => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: firstDay, end: lastDay };
    };

    const firestoreTimestampToDate = (timestamp) => {
      return new Date(
        timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
      );
    };

    const parseEventDateTime = (dateString, timeString) => {
      const [year, month, day] = dateString.split("-");
      const [hours, minutes, seconds] = timeString.split(":");
      const date = new Date(
        Date.UTC(year, month - 1, day, hours, minutes, seconds)
      );
      return date;
    };

    onMounted(() => {
      fetchStatsOnly();
    });

    return {
      stats,
      filteredBookings,
      fetchAndFilterBookings,
    };
  },
});
</script>
