<template>
  <div class="c-single-list pa-10 mt-10">
    <v-row>
      <v-col cols="12">
        <h1 class="text-center">
          <span v-if="!isHalfTerm">Book your workshops below</span>
          <span v-else>All Half Term Art Classes</span>
        </h1>
      </v-col>

      <!-- Loading State -->
      <v-col cols="12" v-if="loading" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
        <p class="mt-4">Loading workshops...</p>
      </v-col>

      <!-- Error State -->
      <v-col cols="12" v-if="error" class="text-center">
        <v-alert type="error">{{ error }}</v-alert>
      </v-col>

      <!-- Events grouped by category -->
      <v-col
        cols="12"
        v-for="(events, categoryTitle) in groupedEvents"
        :key="categoryTitle"
      >
        <h2 class="mb-4">{{ categoryTitle }}</h2>
        <v-card
          flat
          class="mb-4 py-1 px-4 c-single-list__card"
          outlined
          v-for="event in events"
          :key="event.id"
          :class="{
            'c-single-list__card--solo': events.length <= 2,
          }"
        >
          <div class="c-single-list__wrapper">
            <div class="c-single-list__item">
              <span class="mr-2">{{ formatDate(event.event_date) }}</span>
              <span class="mr-2">
                {{ stripSeconds(event.event_start_time) }} -
                {{ stripSeconds(event.event_end_time) }}</span
              >
              <span class="mr-2 font-weight-bold">{{
                event.offering.title
              }}</span>
              <StockComponent :stock="event.stock" :category="event.category" />
            </div>

            <div class="c-single-list__button-wrapper" v-show="event.stock > 0">
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
                <v-icon size="16" color="#404040" @click="addQuantity(event)"
                  >mdi-plus</v-icon
                >
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top">
      <p class="ma-0 text-white">Item added to basket</p>
    </v-snackbar>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { logEvent, getAnalytics } from "firebase/analytics";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import StockComponent from "@/components/StockComponent.vue";
import { Lit } from "@/main";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/stores/cart";

export default defineComponent({
  name: "SingleListComponentSupabase",
  components: {
    StockComponent,
  },
  props: {
    category: {
      required: false,
      type: String,
      default: "single",
    },
    categoryId: {
      required: false,
      type: String,
      default: null,
    },
  },
  setup(props) {
    const store = useStore();
    const cartStore = useCartStore();
    const route = useRoute();
    const loading = ref(true);
    const error = ref(null);
    const events = ref([]);
    const snackbar = ref(false);

    console.log("Component setup - props:", props);
    console.log("Component setup - categoryId:", props.categoryId);

    const isHalfTerm = computed(() => {
      return route.path.includes("ht");
    });

    // Fetch all events from Supabase with category information
    const fetchEvents = async () => {
      try {
        loading.value = true;
        error.value = null;

        const now = new Date();
        const today = now.toISOString().split("T")[0];

        console.log("Props categoryId:", props.categoryId);

        // First, determine the parent category ID to filter by
        let parentCategoryId = props.categoryId;

        // If we have a category ID, check if it's a child category and get the parent
        if (props.categoryId) {
          const { data: categoryData } = await supabase
            .from("event_categories")
            .select("id, parent_id")
            .eq("id", props.categoryId)
            .single();

          console.log("Category data:", categoryData);

          // If this category has a parent, use the parent ID; otherwise use this category ID
          parentCategoryId = categoryData?.parent_id || props.categoryId;
          console.log("Parent category ID:", parentCategoryId);
        }

        // Build the query
        let query = supabase
          .from("offering_events")
          .select(
            `
            *,
            offering:offerings!inner(*),
            capacity:event_capacity(*),
            event_category:event_categories(
              id,
              name,
              slug,
              parent_id,
              display_order,
              parent:event_categories!parent_id(
                id,
                name,
                slug,
                display_order
              )
            )
          `
          )
          .gte("event_date", today)
          .eq("offering.status", "published");

        // If we have a parent category ID, filter by it
        // We need to filter events where category_id = parentCategoryId OR parent_id = parentCategoryId
        if (parentCategoryId) {
          // Get all category IDs that belong to this parent (including the parent itself)
          const { data: childCategories } = await supabase
            .from("event_categories")
            .select("id")
            .or(`id.eq.${parentCategoryId},parent_id.eq.${parentCategoryId}`);

          console.log("Child categories:", childCategories);

          const categoryIds = childCategories?.map((c) => c.id) || [];
          console.log("Category IDs to filter by:", categoryIds);

          if (categoryIds.length > 0) {
            query = query.in("category_id", categoryIds);
          }
        } else {
          console.log("No parent category ID - showing all events");
        }

        const { data, error: fetchError } = await query
          .order("event_date", { ascending: true })
          .order("event_start_time", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // Process events and add quantity field
        events.value = (data || []).map((event) => ({
          ...event,
          quantity: 0,
          stock: event.max_capacity - event.current_bookings,
          category: props.category,
        }));

        // Debug: Log first event to see category structure
        if (events.value.length > 0) {
          console.log("Sample event data:", events.value[0]);
          console.log("Event category data:", events.value[0].event_category);
          console.log("Is array?", Array.isArray(events.value[0].event_category));
          if (Array.isArray(events.value[0].event_category)) {
            console.log("First category:", events.value[0].event_category[0]);
            console.log("Parent:", events.value[0].event_category[0]?.parent);
          }
          console.log("Category ID:", events.value[0].category_id);
        }

        loading.value = false;
      } catch (err) {
        console.error("Error fetching events:", err);
        error.value = "Failed to load workshops. Please try again.";
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchEvents();
    });

    // Watch for changes in categoryId and re-fetch events
    watch(
      () => props.categoryId,
      (newCategoryId) => {
        console.log("CategoryId changed to:", newCategoryId);
        if (newCategoryId) {
          fetchEvents();
        }
      }
    );

    // Group events by parent category
    const groupedEvents = computed(() => {
      const grouped = {};

      events.value.forEach((event) => {
        // Determine the parent category name
        let categoryName = "Uncategorized";

        // event_category might be an array or object from Supabase
        const eventCategory = Array.isArray(event.event_category)
          ? event.event_category[0]
          : event.event_category;

        if (eventCategory) {
          // If event has a parent category, use that; otherwise use the category itself
          const parentCategory = Array.isArray(eventCategory.parent)
            ? eventCategory.parent[0]
            : eventCategory.parent;

          if (parentCategory && parentCategory.name) {
            categoryName = parentCategory.name;
          } else if (eventCategory.name) {
            categoryName = eventCategory.name;
          }
        } else {
          // Fallback to offering title if no category
          categoryName = event.offering.title;
        }

        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }

        grouped[categoryName].push(event);
      });

      // Sort categories by display_order if available
      const sortedGrouped = {};
      Object.keys(grouped)
        .sort((a, b) => {
          const aEvent = grouped[a][0];
          const bEvent = grouped[b][0];

          const aCategory = Array.isArray(aEvent.event_category)
            ? aEvent.event_category[0]
            : aEvent.event_category;
          const bCategory = Array.isArray(bEvent.event_category)
            ? bEvent.event_category[0]
            : bEvent.event_category;

          const aParent = Array.isArray(aCategory?.parent)
            ? aCategory.parent[0]
            : aCategory?.parent;
          const bParent = Array.isArray(bCategory?.parent)
            ? bCategory.parent[0]
            : bCategory?.parent;

          const aOrder =
            aParent?.display_order || aCategory?.display_order || 999;
          const bOrder =
            bParent?.display_order || bCategory?.display_order || 999;

          return aOrder - bOrder;
        })
        .forEach((key) => {
          sortedGrouped[key] = grouped[key];
        });

      return sortedGrouped;
    });

    const stripSeconds = (timeString) => {
      if (!timeString) return "";
      return timeString.slice(0, 5); // "13:00:00" -> "13:00"
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

    const updateBasket = (event) => {
      // Debug: Log the event object to see its structure
      console.log('Event object in updateBasket:', event);
      console.log('Event offering:', event.offering);

      // Prepare event data for cart store
      const eventData = {
        id: event.offering.id, // Use offering_id as the main ID for Edge Function lookup
        offering_id: event.offering.id, // The offering ID for database lookup
        event_id: event.id, // The specific event instance ID
        theme_id: event.id, // Keep for backward compatibility
        theme_title: event.offering.title,
        date: event.event_date,
        start_time: event.event_start_time,
        end_time: event.event_end_time,
        price: event.price_gbp,
        quantity: event.quantity,
        stock: event.stock,
        category: event.category || 'single',
      };

      console.log('Event data being added to cart:', eventData);

      // Check if item already exists in cart
      const existingItem = cartStore.items.find(
        (item) => item.theme_id === event.id && item.category === 'single'
      );

      if (existingItem) {
        // Update quantity of existing item directly
        existingItem.quantity = event.quantity;
        // Manually save to localStorage since we're modifying directly
        localStorage.setItem('basket', JSON.stringify(cartStore.items));
      } else if (event.quantity > 0) {
        // Add new item to cart only if quantity > 0
        cartStore.addItem(eventData, event.quantity);
      }
    };

    const addQuantity = (event) => {
      snackbar.value = true;
      event.quantity += 1;
      updateBasket(event);

      const analytics = getAnalytics();
      logEvent(analytics, "add_to_cart", {
        theme_title: event.offering.title,
        theme_id: event.id,
        category: event.category,
        quantity: event.quantity,
        added_at: new Date().toISOString(),
        environment: store.state.environment,
      });

      Lit.event("added_to_cart", {
        created_at: new Date(),
        metadata: {
          theme_title: event.offering.title,
          theme_id: event.id,
          type: event.category,
        },
      });
    };

    const subtractQuantity = (event) => {
      if (event.quantity > 0) {
        event.quantity -= 1;

        // If quantity reaches 0, remove from cart
        if (event.quantity === 0) {
          const existingItem = cartStore.items.find(
            (item) => item.theme_id === event.id && item.category === 'single'
          );
          if (existingItem) {
            cartStore.removeItem(existingItem);
          }
        } else {
          updateBasket(event);
        }
      }
    };

    return {
      loading,
      error,
      events,
      groupedEvents,
      isHalfTerm,
      snackbar,
      snackbarColor,
      addQuantity,
      subtractQuantity,
      stripSeconds,
      formatDate,
    };
  },
});
</script>

<style scoped>
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

.c-single-list__quantity-input :deep(input) {
  background-color: var(--white);
  text-align: center;
  border-radius: unset;
  border: 1px solid transparent;
  font-size: 16px;
  color: var(--dark-grey);
  padding: 0 10px;
  height: 20px;
}

.c-single-list__quantity-input :deep(.v-input__details) {
  display: none;
}

.c-single-list :deep(.v-field__outline) {
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
</style>
