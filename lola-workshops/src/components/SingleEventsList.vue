<template>
  <div class="c-single-list pa-10 mt-10">
    <v-row>
      <!-- Events grouped by offering title -->
      <v-col
        cols="12"
        v-for="(eventGroup, offeringTitle) in groupedEvents"
        :key="offeringTitle"
      >
        <h2 class="mb-4">{{ offeringTitle }}</h2>
        <v-card
          flat
          class="mb-4 py-1 px-4 c-single-list__card"
          outlined
          v-for="event in eventGroup"
          :key="event.event_id"
          :class="{
            'c-single-list__card--solo': eventGroup.length <= 2,
          }"
        >
          <div class="c-single-list__wrapper">
            <div class="c-single-list__item">
              <span class="mr-2">{{ formatDate(event.event_date) }}</span>
              <span class="mr-2">
                {{ stripSeconds(event.event_start_time) }} -
                {{ stripSeconds(event.event_end_time) }}</span
              >
              <span class="mr-2 font-weight-bold">{{ event.event_title }}</span>
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
                  :model-value="getEventQuantity(event)"
                  :value="getEventQuantity(event)"
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
      <p class="ma-0 text-white">{{ snackbarMessage }}</p>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue";
import { useCartStore } from "@/stores/cart";
import StockComponent from "@/components/StockComponent.vue";

export default defineComponent({
  name: "SingleEventsList",
  components: {
    StockComponent,
  },
  props: {
    events: {
      type: Array as PropType<any[]>,
      required: true,
      default: () => [],
    },
  },
  setup(props) {
    const cartStore = useCartStore();
    const snackbar = ref(false);
    const snackbarMessage = ref("Item added to basket");
    const snackbarColor = ref("success");

    const getSingleCartKey = (event: any) => {
      return (
        event.offering_event_id || event.event_id || event.id || event.theme_id
      );
    };

    const getCartQuantity = (eventKey: string) => {
      const existingItem = cartStore.items.find(
        (item) =>
          item.category === "single" &&
          (item.theme_id === eventKey ||
            item.event_id === eventKey ||
            item.offering_event_id === eventKey)
      );
      return existingItem?.quantity || 0;
    };

    const getEventQuantity = (event: any) => {
      return getCartQuantity(getSingleCartKey(event));
    };

    // Group events by offering title
    const groupedEvents = computed(() => {
      const groups: Record<string, any[]> = {};

      props.events.forEach((event) => {
        // Normalize field names (handle both formats)
        const basketItemId = getSingleCartKey(event);
        const normalizedEvent = {
          ...event,
          offering_id: event.offering_id || event.offering?.id,
          offering_event_id: event.offering_event_id || event.id,
          theme_id: event.theme_id || event.id,
          basket_item_id: basketItemId,
          legacy_event_id: event.legacy_event_id || event.event_id,
          event_id: event.event_id || event.id,
          event_title: event.event_title || event.title,
          theme_title: event.theme_title || event.event_title || event.title,
          event_date: event.event_date || event.date,
          event_start_time: event.event_start_time || event.start_time,
          event_end_time: event.event_end_time || event.end_time,
          quantity: getCartQuantity(basketItemId),
          // Calculate stock if not present
          stock: event.stock !== undefined ? event.stock : event.quantity || 0,
        };

        const title = normalizedEvent.event_title || "Untitled";
        if (!groups[title]) {
          groups[title] = [];
        }
        groups[title].push(normalizedEvent);
      });

      return groups;
    });

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const stripSeconds = (time: string) => {
      if (!time) return "";
      return time.substring(0, 5);
    };

    const addQuantity = (event: any) => {
      const currentQuantity = getEventQuantity(event);

      if (currentQuantity < 10 && currentQuantity < event.stock) {
        addToBasket(event);
      }
    };

    const subtractQuantity = (event: any) => {
      if (getEventQuantity(event) > 0) {
        removeFromBasket(event);
      }
    };

    const addToBasket = (event: any) => {
      const basketItemId = getSingleCartKey(event);
      const eventData = {
        id: event.offering_id || basketItemId,
        offering_id: event.offering_id || event.id,
        offering_event_id: basketItemId,
        event_id: basketItemId,
        theme_id: basketItemId,
        theme_title: event.theme_title || event.event_title,
        event_title: event.event_title,
        title: event.theme_title || event.event_title,
        price: event.price,
        date: event.event_date,
        start_time: event.event_start_time,
        end_time: event.event_end_time,
        category: "single",
        category_slug: event.category,
        type: "event",
        stock: event.stock,
        legacy_event_id: event.legacy_event_id || event.event_id,
      };

      cartStore.addItem(eventData, 1);

      snackbarMessage.value = "Item added to basket";
      snackbarColor.value = "success";
      snackbar.value = true;
    };

    const removeFromBasket = (event: any) => {
      const basketItemId = getSingleCartKey(event);
      const existingItem = cartStore.items.find(
        (item) =>
          item.category === "single" &&
          (item.theme_id === basketItemId ||
            item.event_id === basketItemId ||
            item.offering_event_id === basketItemId)
      );

      if (existingItem) {
        cartStore.removeItem(existingItem);
      }

      snackbarMessage.value = "Item removed from basket";
      snackbarColor.value = "info";
      snackbar.value = true;
    };

    return {
      groupedEvents,
      formatDate,
      stripSeconds,
      getEventQuantity,
      addQuantity,
      subtractQuantity,
      snackbar,
      snackbarMessage,
      snackbarColor,
    };
  },
});
</script>

<style scoped lang="scss">
.c-single-list {
  &__card {
    border: 1px solid #e0e0e0;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  &__wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  &__item {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__button-wrapper {
    display: flex;
    align-items: center;
  }

  &__buttons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__quantity-input {
    width: 60px;
    text-align: center;

    :deep(.v-input__control) {
      min-height: 32px;
    }

    :deep(.v-field__input) {
      text-align: center;
      padding: 4px 8px;
      min-height: 32px;
    }
  }
}
</style>
