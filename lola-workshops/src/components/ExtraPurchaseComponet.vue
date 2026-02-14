<template>
  <v-row>
    <v-col cols="12">
      <h3>Other people bought</h3>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="4" v-for="(th, index) in themes" :key="index">
      <v-card flat class="mb-4 py-1 px-4 c-single-list__card" outlined>
        <div class="c-single-list__wrapper">
          <div class="c-single-list__item flex-column">
            <p class="mr-2">{{ formatDate(th.date) }}</p>
            <p class="mr-2 font-weight-bold">
              {{ truncateText(th.theme_title) }}
            </p>
            <p class="mr-2">{{ th.start_time }} - {{ th.end_time }}</p>
          </div>
        </div>
        <v-btn
          @click="addToBasket(th)"
          style="background-color: var(--white)"
          class="mb-4 mr-2"
          >Add to basket</v-btn
        >
        <v-btn style="background-color: var(--white)" class="mb-4">
          <router-link
            class="no-decoration"
            :to="`event-details/${th.event_id}`"
            >View more like this</router-link
          >
        </v-btn>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { defineComponent, ref, watch, onMounted } from "vue";
import { useStore } from "vuex";

export default defineComponent({
  name: "ExtraPurchaseComponent",
  setup() {
    const store = useStore();
    const themes = ref([]); // This is the reactive ref for themes
    const innerWidth = ref(0);
    const getCategory = (id) => {
      const events = store.state.events;
      const event = events.find((event) => event.event_id === id);
      return event?.category;
    };

    const getPrice = (id) => {
      const events = store.state.events;
      const event = events.find((event) => event.event_id === id);
      return event?.price;
    };

    const truncateText = (text, maxLength = 26) => {
      if (text.length > maxLength && innerWidth.value > 959) {
        return text.slice(0, maxLength) + "...";
      }
      return text;
    };

    const getTotalPrice = () => {
      const totalPrice = store.state.basket.reduce((total, item) => {
        // Convert price to a number and multiply by quantity
        let itemTotal = parseFloat(item.price) * item.quantity;

        // If the item has a nested items array, add those items' totals as well
        if (item.items && Array.isArray(item.items)) {
          item.items.forEach((subItem) => {
            // For each sub-item, multiply its price by its quantity and add to itemTotal
            itemTotal += parseFloat(subItem.price) * subItem.quantity;
          });
        }
        // Add the item's total to the overall total
        return total + itemTotal;
      }, 0);
      store.commit("SET_TOTAL", totalPrice);

      return Number(totalPrice.toFixed(2)); // Ensure result is a number with 2 decimal places
    };

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

    const addToBasket = (theme) => {
      theme.quantity = (theme.quantity || 0) + 1;
      updateBasket(theme, theme.quantity);
      getTotalPrice();
    };

    const checkViewSize = () => {
      innerWidth.value = window.innerWidth;
    };

    // maybe only with single category
    watch(
      () => [store.state.themes, store.state.events],
      () => {
        const allThemes = store.state.themes; // Get all themes
        const basket = store.state.basket; // Assuming basket is in the store

        const availableThemes = allThemes
          .filter((th) => (th.passed ? null : th))
          .filter((th) => {
            return getCategory(th.event_id) === "single" ? th : null;
          })
          .filter((theme) => !basket.includes(theme.event_id))
          .map((theme) => {
            return {
              ...theme,
              price: getPrice(theme.event_id),
            };
          });

        let randomThemes;
        do {
          randomThemes = availableThemes
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
        } while (
          randomThemes.some(
            (theme) =>
              theme.event_title.toLowerCase().includes("open studio") ||
              theme.event_title.toLowerCase().includes("kids club")
          )
        );

        themes.value = randomThemes; // Update the reactive themes ref
      },
      { immediate: true } // Watcher will trigger immediately on mount
    );

    onMounted(() => {
      window.addEventListener("resize", checkViewSize);
      checkViewSize();
    });

    return {
      getCategory,
      checkViewSize,
      addToBasket,
      truncateText,
      getPrice,
      themes,
      formatDate(date) {
        return new Date(date).toLocaleDateString(); // Simple date formatter
      },
    };
  },
});
</script>
