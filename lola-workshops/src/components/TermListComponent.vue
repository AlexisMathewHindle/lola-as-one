<template>
  <div class="c-term-list pa-10 mt-10" v-if="Object.values(themes).length">
    <v-row>
      <v-col cols="12">
        <h1 class="text-center">Book your workshops below</h1>
      </v-col>
      <template v-for="(theme, themeIndex) in themes" :key="themeIndex">
        <v-col cols="12" v-if="theme.length > 0">
          <div class="d-flex py-4">
            <p class="mr-2 font-weight-bold">{{ theme[0]?.event_title }}</p>
            <p class="font-weight-bold mr-2">
              {{ termStringConvert(theme[0]?.term) }}
            </p>
            <StockComponent
              :stock="theme[0]?.stock"
              :category="theme[0]?.category"
            />
          </div>
          <template v-for="(th, index) in theme" :key="index">
            <v-card
              flat
              class="mb-4 py-1 px-4 c-single-list__card"
              outlined
              v-if="!th.passed"
            >
              <div class="d-flex">
                <p class="mr-2">{{ formatDate(th.date) }}</p>
                <p class="mr-2 font-weight-medium">{{ th.theme_title }}</p>
                <p class="mr-2">{{ th.theme_description }}</p>
                <p class="" v-if="th.passed">Passed</p>
              </div>
            </v-card>
          </template>
          <v-btn
            style="background-color: var(--yellow); color: var(--white)"
            class="mt-4"
            @click="
              handleAddToBasket(theme, Number(stripIndex(themeIndex)) - 1)
            "
          >
            {{ basketButtonText[Number(stripIndex(themeIndex)) - 1] }}
          </v-btn>
        </v-col>
      </template>
    </v-row>
  </div>
</template>

<script>
import { defineComponent, ref, watch } from "vue";
import { logEvent, getAnalytics } from "firebase/analytics";
import { useStore } from "vuex";
import { Lit } from "@/main";

import StockComponent from "@/components/StockComponent.vue";

export default defineComponent({
  name: "TermListComponent",
  components: {
    StockComponent,
  },
  props: {
    themes: {
      required: true,
      type: Array,
    },
    category: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const store = useStore();
    const themes = ref([]);
    const basketButtonText = ref([]); // Array to store button text for each item

    watch(
      () => props.themes,
      (newThemes) => {
        const sortedThemes = {};
        Object.keys(newThemes).forEach((key) => {
          sortedThemes[key] = newThemes[key].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
        });
        themes.value = sortedThemes;

        // Initialize button text for each theme
        basketButtonText.value = new Array(
          Object.values(newThemes).length
        ).fill("Add to basket");
      },
      { immediate: true }
    );

    const stripIndex = (index) => {
      return index.replace(/\D/g, "");
    };

    const termStringConvert = (term) => {
      return term
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const addToBasket = (theme) => {
      const currentBasket = store.state.basket || [];
      const themeId = theme[0].theme_id; // Assuming theme_id is unique for each theme

      // Check if the theme already exists in the basket
      const existingItemIndex = currentBasket.findIndex(
        (item) => item.theme_id === themeId
      );

      if (existingItemIndex !== -1) {
        // If it exists, update the quantity
        currentBasket[existingItemIndex].quantity += 1;
      } else {
        let newItem = { ...theme[0], quantity: 1 }; // Add quantity property
        if (theme[0].category === "term") {
          newItem = { ...newItem, items: theme };
        }

        // If it doesn't exist, add it to the basket with quantity 1
        currentBasket.push(newItem);
      }

      // Commit the updated basket to the store
      store.commit("SET_BASKET", currentBasket);
      const analytics = getAnalytics();
      logEvent(analytics, "add_to_cart", {
        theme_title: theme[0].theme_title,
        theme_id: theme[0].theme_id,
        category: theme[0].category,
        quantity: theme.length,
        added_at: new Date().toISOString(),
        environment: store.state.environment,
      });

      Lit.event("added_to_cart", {
        created_at: new Date(),
        metadata: {
          theme_title: theme.theme_title,
          theme_id: theme.theme_id,
          type: theme.category,
        },
      });

      // const currentBasket = store.state.basket || [];
      // const updatedBasket = [...currentBasket, theme];

      // const filteredBasketIfPassed = updatedBasket
      //   .map((innerArray) => {
      //     // Ensure innerArray is an array before filtering
      //     if (Array.isArray(innerArray)) {
      //       return innerArray.filter((item) => !item.passed);
      //     }
      //     return innerArray; // Return as is if not an array
      //   })
      //   .flat();

      // store.commit("SET_BASKET", filteredBasketIfPassed);
    };

    const handleAddToBasket = (theme, index) => {
      addToBasket(theme);
      basketButtonText.value[index] = "Item added to basket!";
      setTimeout(() => {
        basketButtonText.value[index] = "Add to basket";
      }, 5000); // Reset message after 5 seconds
    };

    return {
      formatDate,
      addToBasket,
      handleAddToBasket,
      basketButtonText,
      termStringConvert,
      stripIndex,
    };
  },
});
</script>

<style>
.c-term-list {
  background-color: var(--white);
}
</style>
