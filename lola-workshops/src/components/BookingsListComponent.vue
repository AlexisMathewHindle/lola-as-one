<template>
  <div class="c-bookings-list">
    <h1>Bookings List</h1>
    <div class="d-flex">
      <v-date-input
        v-model="selectedDate"
        label="Select a date"
        @update:modelValue="searchBookingsByDate"
      ></v-date-input>
    </div>
    <ul v-if="paginatedBookings.length > 0">
      <li
        v-for="booking in paginatedBookings"
        :key="booking.id"
        class="booking-item"
      >
        <div class="mb-2">
          <span>{{ booking.workshop_title }}</span>
          <span class="font-weight-bold">
            - {{ dateFormat(booking.date) }} @{{ booking.start_time }}</span
          >
        </div>
        <div
          v-for="(b, index) in booking.bookings"
          :key="index"
          style="width: 100%"
        >
          <div
            v-for="(attendees, i) in b.attendees"
            :key="i"
            class="d-flex justify-space-between"
          >
            <p class="mb-0" v-if="attendees.firstName || attendees.lastName">
              {{ attendees.firstName }} {{ attendees.lastName }}
            </p>
            <v-icon @click="viewBookingDetails(b.id)" class="view-icon"
              >mdi-eye</v-icon
            >
          </div>
        </div>
      </li>
    </ul>
    <p v-else class="font-weight-bold">No bookings found</p>
    <!-- Pagination Controls -->
    <div class="pagination-controls" v-if="totalPages > 1">
      <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { getFirestore, collection, getDocs } from "@/main";
import { useRouter } from "vue-router";
import { VDateInput } from "vuetify/labs/VDateInput";

export default defineComponent({
  name: "BookingsListView",

  components: {
    VDateInput,
  },

  setup() {
    const router = useRouter();
    const allBookings = ref([]);
    const allEvents = ref([]);
    // const isFiltered = ref(false);
    const selectedDate = ref(null);
    const filteredBookings = ref([]);
    const currentPage = ref(1);
    const pageSize = ref(5); // Items per page

    // const bookings = computed(() => {
    //   if (!isFiltered.value) return allBookings.value;
    //   const today = new Date().toISOString().split("T")[0];
    //   return allBookings.value.filter((booking) =>
    //     booking.basket.some((item) => item.date === today)
    //   );
    // });

    const paginatedBookings = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return groupedBookings.value.slice(start, end);
    });

    const totalPages = computed(() => {
      return Math.ceil(groupedBookings.value.length / pageSize.value);
    });

    const dateFormat = (date) => {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(date).toLocaleDateString("en-GB", options);
    };

    const formatDate = (dateString) => {
      const [day, month, year] = dateString.split("/");
      return `${year}-${month}-${day}`;
    };

    const searchBookingsByDate = async () => {
      if (!selectedDate.value) {
        filteredBookings.value = allBookings.value;
        return;
      }
      const date = formatDate(
        new Date(selectedDate.value).toLocaleDateString().split("T")[0]
      );

      filteredBookings.value = allBookings.value.filter((booking) =>
        booking.attendees.some((attendee) =>
          attendee.workshop.some((workshop) => workshop.event_date === date)
        )
      );
    };

    const groupedBookings = computed(() => {
      const groups = {};
      (filteredBookings.value.length > 0
        ? filteredBookings.value
        : allBookings.value
      ).forEach((booking) => {
        booking.attendees.forEach((item) => {
          item?.workshop.forEach((i) => {
            const key = `${i.event_date}-${i.theme_id}`;
            if (!groups[key]) {
              groups[key] = {
                date: i.event_date,
                start_time: i.event_start_time,
                workshop_title: i.workshop_title,
                theme_id: i.theme_id,
                bookings: [],
              };
            }
            if (!groups[key].bookings.some((b) => b.id === booking.id)) {
              groups[key].bookings.push(booking);
            }
          });
        });
      });
      return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
    });

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const fetchEvents = async () => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, "events"));
        allEvents.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return allEvents.value;
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };

    const fetchBookings = async () => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, "bookings"));
        allBookings.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Error fetching bookings: ", error);
      }
    };

    const viewBookingDetails = (id) => {
      router.push({ name: "booking", params: { id } });
    };

    onMounted(() => {
      fetchBookings();
      fetchEvents();
    });

    return {
      groupedBookings,
      paginatedBookings,
      currentPage,
      totalPages,
      pageSize,
      nextPage,
      prevPage,
      fetchEvents,
      fetchBookings,
      viewBookingDetails,
      searchBookingsByDate,
      selectedDate,
      filteredBookings,
      dateFormat,
    };
  },
});
</script>

<style scoped>
.booking-item {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;

  button {
    margin: 0 10px;
  }
}
</style>
