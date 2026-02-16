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
import { useCartStore } from "@/stores/cart";

export default defineComponent({
  name: "ExtraPurchaseComponent",
  setup() {
    const store = useStore();
    const cartStore = useCartStore();
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
      // Use cart store's subtotal
      const totalPrice = cartStore.subtotal;
      store.commit("SET_TOTAL", totalPrice);
      return Number(totalPrice.toFixed(2));
    };

    const addToBasket = (theme) => {
      // Add to cart using cart store
      cartStore.addItem(theme, 1);
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
        const basket = cartStore.items; // Get basket from cart store

        const availableThemes = allThemes
          .filter((th) => (th.passed ? null : th))
          .filter((th) => {
            return getCategory(th.event_id) === "single" ? th : null;
          })
          .filter((theme) => !basket.some(item => item.event_id === theme.event_id))
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
