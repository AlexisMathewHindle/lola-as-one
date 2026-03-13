<template>
  <div class="c-event-details">
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
            <h1 class="text-center">{{ event.event_title }}</h1>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-img
              :src="eventImage"
              alt="Workshop image"
              height="300px"
              @load="onImageLoad"
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
                  {{  event  }}
                  <v-list-item-content v-html="event.description"></v-list-item-content>
                </v-list-item>
              </v-list>
              <v-divider></v-divider>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <image-slider
              v-if="eventImages.length"
              class="my-8"
              :images="eventImages"
            />
          </v-col>
        </v-row>
      </v-card>
      <TermListComponent
        v-if="event.category === 'term'"
        :themes="eventThemes"
        :category="event.category"
      />
      <SingleListComponentSupabase
        v-if="event.category === 'single' && supabaseEvent"
        :category="event.category"
        :category-id="supabaseEvent.category_id"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import TermListComponent from "@/components/TermListComponent.vue";
import SingleListComponentSupabase from "@/components/SingleListComponentSupabase.vue";
import ImageSlider from "@/components/ImageSlider.vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { Lit } from "@/main";
import {
  fetchEventById,
  transformSupabaseEventToLegacy,
  SupabaseEvent,
} from "@/lib/supabase";

interface Event {
  event_title: string;
  start: string;
  end: string;
  days: any[];
  description: string;
  details: string[];
  instructions: string[];
  price: number;
  term: string;
  category: string;
  quantity: number | null;
  event_id: string;
}

export default defineComponent({
  name: "EventDetailsView",

  components: {
    TermListComponent,
    SingleListComponentSupabase,
    ImageSlider,
  },

  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
    const error = ref<string | null>(null);
    const supabaseEvent = ref<SupabaseEvent | null>(null);
    const eventThemes = ref<any>([]);
    const eventImages = ref<any>([]);
    const imageLoaded = ref(false);
    const headerHeight = 223;
    const cardHeight = computed(() => `${window.innerHeight - headerHeight}px`);

    const event = ref<Event>({
      event_title: "",
      start: "",
      end: "",
      days: [],
      description: "",
      details: [],
      price: 0,
      instructions: [],
      term: "",
      category: "",
      quantity: null,
      event_id: "",
    });

    // Computed properties for display
    const eventImage = computed(() => {
      if (supabaseEvent.value?.offering?.featured_image_url) {
        return supabaseEvent.value.offering.featured_image_url;
      }
      const themeId = route.params.id as string;
      return `/img/${themeId}/main.jpg`;
    });

    const eventTime = computed(() => {
      if (!supabaseEvent.value) return null;
      const start = formatTime(supabaseEvent.value.event_start_time);
      const end = formatTime(supabaseEvent.value.event_end_time);
      return `${start} - ${end}`;
    });

    const eventLocation = computed(() => {
      if (!supabaseEvent.value) return null;
      const parts = [supabaseEvent.value.location_name];
      if (supabaseEvent.value.location_city) {
        parts.push(supabaseEvent.value.location_city);
      }
      if (supabaseEvent.value.location_postcode) {
        parts.push(supabaseEvent.value.location_postcode);
      }
      return parts.join(", ");
    });

    // Helper functions
    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatTime = (timeString: string) => {
      if (!timeString) return "";
      // Handle both "HH:MM:SS" and "HH:MM" formats
      const parts = timeString.split(":");
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    };

    const halfTermPrefixCheck = () => {
      // Get images from Supabase secondary_images only
      if (supabaseEvent.value?.offering?.secondary_images &&
          Array.isArray(supabaseEvent.value.offering.secondary_images) &&
          supabaseEvent.value.offering.secondary_images.length > 0) {
        // Sort by order and extract URLs
        eventImages.value = supabaseEvent.value.offering.secondary_images
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((img: any) => img.url);
      } else {
        // No secondary images - don't show slider
        eventImages.value = [];
      }
    };

    const handleThemesUpdate = (updatedThemes: any) => {
      eventThemes.value = updatedThemes;
    };

    const onImageLoad = () => {
      imageLoaded.value = true;
      if (!store.getters["isLoading"]) {
        store.dispatch("setLoading", false);
      }
    };

    const fetchEvent = async () => {
      const id = router.currentRoute.value.params.id as string;
      try {
        store.dispatch("setLoading", true);
        error.value = null;

        const fetchedEvent = await fetchEventById(id);
        if (fetchedEvent) {
          supabaseEvent.value = fetchedEvent;

          // Transform Supabase event to match expected Event interface
          const transformedEvent = transformSupabaseEventToLegacy(fetchedEvent);

          // Map to the Event interface expected by the template
          event.value = {
            event_title: transformedEvent.event_title || transformedEvent.title,
            start: transformedEvent.date,
            end: transformedEvent.date,
            days: [],
            description: transformedEvent.description || "",
            details: fetchedEvent.offering.metadata?.details || [],
            instructions: fetchedEvent.offering.metadata?.instructions || [],
            price: transformedEvent.price,
            term: fetchedEvent.offering.metadata?.term || "",
            category: transformedEvent.category || fetchedEvent.category?.slug || "single",
            quantity: transformedEvent.quantity,
            event_id: transformedEvent.event_id,
          };

          Lit.event("event_viewed", {
            metadata: {
              event_title: event.value.event_title,
              event_id: event.value.event_id,
            },
          });

          // Load secondary images after event data is fetched
          halfTermPrefixCheck();
        } else {
          error.value = "Workshop not found";
          console.error("No such event!");
        }
        store.dispatch("setLoading", false);
      } catch (err) {
        store.dispatch("setLoading", false);
        error.value = "Failed to load workshop details. Please try again.";
        console.error("Error fetching event:", err);
      }
    };

    onMounted(async () => {
      fetchEvent();
      halfTermPrefixCheck();
    });

    return {
      store,
      cardHeight,
      event,
      error,
      supabaseEvent,
      eventThemes,
      eventImage,
      eventImages,
      eventTime,
      eventLocation,
      formatDate,
      formatTime,
      halfTermPrefixCheck,
      handleThemesUpdate,
      onImageLoad,
    };
  },
});
</script>

<style scoped>
/* Add your styles here */
.workshop-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.workshop-info p {
  margin: 0;
}
.quantity-control {
  display: flex;
  align-items: center;
}
.quantity-control button {
  width: 30px;
  height: 30px;
}
.quantity-control span {
  margin: 0 10px;
}
</style>
