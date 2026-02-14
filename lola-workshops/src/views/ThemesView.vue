<template>
  <h1>Themes List</h1>
  <div class="search-container mb-4">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search by event title or event ID"
      class="search-input"
    />
  </div>
  <div
    class="d-flex justify-space-between my-2 px-4"
    v-for="event in filteredEvents"
    :key="event.event_id"
  >
    <p>{{ event.event_title }} - {{ event.event_id }}</p>
    <svg
      @click="editEvent(event.event_id)"
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#000"
    >
      <path
        d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
      />
    </svg>
  </div>

  <!-- Pagination Controls -->
  <div class="pagination-controls">
    <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
    <span>Page {{ currentPage }} of {{ totalPages }}</span>
    <button @click="nextPage" :disabled="currentPage === totalPages">
      Next
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import { db, collection, getDocs } from "../main";
import { useRouter } from "vue-router";

interface Event {
  event_id: string;
  event_title: string;
  start: any;
  end: any;
  date: any;
}

export default defineComponent({
  setup() {
    const events = ref<Event[]>([]);
    const currentPage = ref(1);
    const pageSize = ref(10); // Number of events per page
    const router = useRouter();
    const searchQuery = ref("");

    const orderEventAlphabetically = (events: Event[]) => {
      return events.sort((a: Event, b: Event) => {
        return a.event_title.localeCompare(b.event_title);
      });
    };

    const orderAndFilterEventsByDate = (events: Event[]) => {
      const today = new Date();
      return events
        .filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate >= today; // Keep events with dates today or in the future
        })
        .sort((a: Event, b: Event) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });
    };

    // Computed property to filter events based on search query
    const filteredEvents = computed(() => {
      if (!searchQuery.value) {
        return paginatedEvents.value; // If no search query, return paginated results
      }

      // Filter based on event_title or event_id
      const filtered = events.value.filter(
        (event) =>
          event.event_title
            .toLowerCase()
            .includes(searchQuery.value.toLowerCase()) ||
          event.event_id.toLowerCase().includes(searchQuery.value.toLowerCase())
      );

      // Apply pagination to filtered results
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filtered.slice(start, end);
    });

    const fetchThemes = async () => {
      const eventsRef = collection(db, "themes");
      const querySnapshot = await getDocs(eventsRef);
      events.value = querySnapshot.docs.map((doc: any) => {
        const eventData = doc.data();
        eventData.event_id = doc.id;
        return eventData;
      });

      events.value = orderAndFilterEventsByDate(events.value);
    };

    const paginatedEvents = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return events.value.slice(start, end);
    });

    const totalPages = computed(() => {
      return Math.ceil(events.value.length / pageSize.value);
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

    const editEvent = (id: string) => {
      router.push({ name: "theme-edit", params: { id: id } });
    };

    onMounted(() => {
      fetchThemes();
    });

    return {
      events,
      paginatedEvents,
      currentPage,
      totalPages,
      pageSize,
      nextPage,
      prevPage,
      editEvent,
      filteredEvents,
      searchQuery,
      fetchThemes,
    };
  },
});
</script>

<style lang="scss" scoped>
svg {
  cursor: pointer;
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
