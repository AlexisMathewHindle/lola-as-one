<template>
  <div class="c-adult">
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
        <v-row class="mt-4">
          <v-col cols="12">
            <h1 class="text-center">Adult Art Workshops</h1>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-img
              src="/img/adw01_thurs_19_30/adult_header.jpg"
              alt="Lola Adult Art Workshops"
              height="300px"
              contain
            ></v-img>
          </v-col>
          <v-col cols="12" md="6">
            <div class="workshop-details pa-4">
              <v-divider></v-divider>
              <v-list>
                <v-list-item>
                  <v-list-item-content
                    >A chance to get freely creative with friends while enjoying
                    delicious drinks and nibbles! Each adult class is focused on
                    one open-ended project and is a perfect evening out - be
                    inspired and let your creative juices flow!
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    ><strong>Who's it for</strong></v-list-item-title
                  >
                  <v-list-item-content
                    >Anyone over the age of 18.</v-list-item-content
                  >
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    ><strong>What's provided</strong></v-list-item-title
                  >
                  <v-list-item-content
                    >All art materials, a themed cocktail, non-alcoholic
                    mocktails, soft drinks and nibbles</v-list-item-content
                  >
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    ><strong>What to wear</strong></v-list-item-title
                  >
                  <v-list-item-content
                    >Dress for mess! We'll provide art aprons for those who
                    would like them</v-list-item-content
                  >
                </v-list-item>
              </v-list>
              <v-divider></v-divider>
            </div>
          </v-col>
        </v-row>
      </v-card>
      <div class="c-single-list pa-10 mt-10">
        <v-row>
          <v-col cols="12">
            <h1 class="text-center">Adult Workshops Coming Up</h1>
          </v-col>
        </v-row>
        <v-row>
          <template v-for="(th, index) in eventThemes" :key="index">
            <v-col cols="12" v-if="!th.passed">
              <v-card
                flat
                :class="{
                  'c-single-list__card--solo': th.length <= 2 && !th?.passed,
                }"
                class="mb-4 py-1 px-4 c-single-list__card"
                outlined
              >
                <div class="c-single-list__wrapper">
                  <div class="d-flex c-single-list__inner">
                    <img
                      class="c-single-list__image"
                      :src="th.image"
                      alt="Lola - Adult Art Workshop"
                    />
                    <div class="c-single-list__item">
                      <div>
                        <h4 class="mr-2 font-weight-bold">
                          {{ th.theme_title }}
                        </h4>
                        <p>{{ th.description }}</p>
                        <p>{{ th.details }}</p>
                      </div>
                      <div class="font-weight-bold c-single-list__details">
                        <span class="mr-2">{{ formatDate(th.date) }}</span>
                        <span class="mr-2">
                          {{ stripSeconds(th.start_time) }} -
                          {{ stripSeconds(th.end_time) }}</span
                        >
                        <StockComponent
                          :stock="parseFloat(th.stock)"
                          :category="th.category"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    class="c-single-list__button-wrapper"
                    v-show="th.stock > 0"
                  >
                    <div class="c-single-list__buttons">
                      <v-icon
                        size="16"
                        color="#404040"
                        @click="subtractQuantity(th)"
                        >mdi-minus</v-icon
                      >
                      <v-text-field
                        v-model="th.quantity"
                        type="number"
                        class="c-single-list__quantity-input"
                        min="0"
                        outline
                        max="10"
                        readonly
                      ></v-text-field>
                      <v-icon size="16" color="#404040" @click="addQuantity(th)"
                        >mdi-plus</v-icon
                      >
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </template>
        </v-row>
      </div>
    </v-container>
    <v-snackbar v-model="snackbar" :color="snackbarColor" top>
      <p class="ma-0 white--text">Item added to basket</p>
    </v-snackbar>
  </div>
</template>
<script>
import { defineComponent, onMounted, ref, computed } from "vue";
import { useStore } from "vuex";
import { db, getDocs, collection } from "@/main"; // Ensure the correct import of your Firestore instance

import StockComponent from "@/components/StockComponent.vue";

export default defineComponent({
  name: "AdultWorkshopView",

  components: {
    StockComponent,
  },

  setup() {
    const eventThemes = ref([]);
    const store = useStore();
    const snackbar = ref(false);
    const snackbarColor = computed(() => {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue("--yellow")
          .trim() || "success"
      );
    });
    const headerHeight = 223;
    const cardHeight = computed(() => `${window.innerHeight - headerHeight}px`);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const stripSeconds = (timeString) => {
      return timeString?.slice(0, -3);
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
    };

    const subtractQuantity = (theme) => {
      const currentBasket = store.state.basket || [];
      const existingItemIndex = currentBasket.findIndex(
        (item) => item.theme_id === theme.theme_id
      );

      if (existingItemIndex > -1) {
        // If the item exists in the basket, check the stock
        if (theme.stock > 0) {
          theme.stock -= 1;
          currentBasket[existingItemIndex].quantity = theme.stock;

          // Remove the item from the basket if the stock is 0
          if (theme.stock === 0) {
            currentBasket.splice(existingItemIndex, 1);
          }
        }
      }
    };

    const addQuantity = (theme) => {
      snackbar.value = true;
      theme.quantity += 1;
      updateBasket(theme, theme.stock);
    };

    const fetchThemes = async () => {
      try {
        store.dispatch("setLoading", true);
        const querySnapshot = await getDocs(collection(db, "adult_workshops"));
        eventThemes.value = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            //   ...doc.data(),
            stock: doc.data().stock,
            date: doc.data().start_date,
            start_time: doc.data().start_time,
            end_time: doc.data().end_time,
            theme_title: `${doc.data().theme_title}`,
            details: doc.data().details,
            event_title: doc.data().event_title,
            theme_id: doc.data().event_id,
            event_id: doc.data().event_id,
            price: parseFloat(doc.data().price),
            quantity: 0,
            description: doc.data().description,
            category: "adult_workshop",
            image: doc.data().image,
          }))
          .filter((event) => {
            const eventDate = new Date(event.date);
            const now = new Date();
            // Check if the event date is today or in the future
            return eventDate >= now.setHours(0, 0, 0, 0);
          });

        // eventThemes.value = {
        //   ...events,
        // };
        store.dispatch("setLoading", false);
        // .sort((a, b) => {
        //   const dateA = new Date(a.date).getTime();
        //   const dateB = new Date(b.date).getTime();
        //   if (dateA !== dateB) {
        //     return dateA - dateB;
        //   }
        //   // If dates are the same, sort by start time
        //   const timeA = new Date(`1970-01-01T${a.start_time}`).getTime();
        //   const timeB = new Date(`1970-01-01T${b.start_time}`).getTime();
        //   return timeA - timeB;
        // });
      } catch (error) {
        store.dispatch("setLoading", false);
        console.error(error);
      }
    };

    onMounted(() => {
      fetchThemes();
    });

    return {
      fetchThemes,
      snackbarColor,
      snackbar,
      stripSeconds,
      addQuantity,
      subtractQuantity,
      formatDate,
      eventThemes,
      cardHeight,
      store,
    };
  },
});
</script>
<style lang="scss" scoped>
.c-adult {
  .c-single-list__wrapper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 0 40px 0;
    flex-wrap: wrap;

    @media screen and (max-width: 1279px) {
      padding: 20px 0 20px 0;
    }
  }

  .c-single-list__item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    // height: 200px;
    padding: 20px 0 20px 0;

    @media screen and (max-width: 442px) {
      height: unset;
    }

    p {
      max-width: 560px;
    }
  }

  .c-single-list__inner {
    @media screen and (max-width: 867px) {
      flex-direction: column;
    }
  }

  .c-single-list__button-wrapper {
    width: unset;
  }

  .c-single-list__details {
    display: flex;
    flex-direction: column;

    @media screen and (max-width: 442px) {
      flex-direction: column;
    }
  }
}
</style>
