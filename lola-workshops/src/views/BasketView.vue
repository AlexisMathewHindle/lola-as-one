<template>
  <div class="c-basket-view">
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
    <template v-else>
      <v-container>
        <h1 class="my-10 text-center">Your Basket</h1>
        <v-card class="my-10 pa-7">
          <template v-if="basket.length">
            <v-row>
              <v-col cols="12" md="7">
                <div
                  class="c-basket-view__event"
                  v-for="(theme, index) in groupedItems"
                  :key="index"
                >
                  <div class="c-basket-view__themes" v-if="theme.length">
                    {{ theme[0].quantity }} x {{ theme[0].event_title }}
                    <span class="ml-3"
                      >£{{ theme[0].price * theme[0].items?.length }}</span
                    >
                    <div style="position: relative">
                      <template v-for="(th, i) in theme[0].items" :key="i">
                        <div
                          v-if="!th?.passed"
                          :class="{
                            'c-basket-view__theme': i === theme[0].length - 1,
                          }"
                        >
                          {{ th.theme_title }}
                        </div>
                        <v-icon
                          color="#b77f6e"
                          v-if="i === theme.length - 1"
                          xw
                          @click="removeFromBasket(theme, index)"
                          >mdi-delete</v-icon
                        >
                      </template>
                    </div>
                  </div>
                  <div class="c-basket-view__single" v-else>
                    <p class="mb-0">
                      <span class="mr-2">{{ theme.quantity }} </span>
                      <span class="mr-2">x</span>
                      <span>{{ theme.theme_title }}</span>
                      <span v-if="theme?.passed">- {{ theme?.passed }}</span>
                      <span class="ml-3">£{{ theme.price }}</span>
                    </p>
                    <v-icon
                      color="#b77f6e"
                      @click="removeFromBasket(theme, index)"
                      >mdi-delete</v-icon
                    >
                  </div>
                </div>
                <v-btn class="mt-4" @click="clearBasket">Clear basket</v-btn>
              </v-col>
              <!-- Need to add sibling discount -->
              <!-- Discount will be varible set on mount -->
              <!-- Discount button will only appear if more than one attendee -->
              <!-- On click of button discount total from price before the coupon code -->
              <v-col cols="12" md="5">
                <h2 v-if="store.state.discount > 0">
                  Discounted amount: £{{ store.state.discount.toFixed(2) }}
                </h2>
                <h2 class="mb-4" v-if="total">
                  Total: £{{ total.toFixed(2) }}
                </h2>
                <div class="form-group mt-4">
                  <!-- <SiblingDiscountComponent class="mb-4" /> -->
                  <p for="coupon" class="ma-0 pr-2 mb-2">
                    Have a coupon? Add your code here.
                  </p>
                  <div class="d-flex align-center">
                    <input type="text" v-model="couponCode" />
                    <v-btn color="white" @click="applyCoupon" class="ml-2"
                      >Apply Coupon</v-btn
                    >
                  </div>
                  <p class="error font-weight-bold pt-4" v-if="couponError">
                    {{ couponError }}
                  </p>
                </div>
                <v-btn class="btn" @click="checkout">Register and Pay</v-btn>
              </v-col>
            </v-row>

            <ExtraPurchaseComponent />
          </template>
          <v-row v-else>
            <v-col>
              <p>Your basket is empty</p>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </template>
  </div>
</template>

<script>
import {
  defineComponent,
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
} from "vue";
import { logEvent, getAnalytics } from "firebase/analytics";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
// import { db, collection, query, where, getDocs } from "@/main"; // Firebase - deprecated
import { useCartStore } from "@/stores/cart";
import {
  fetchEventsWithCapacity,
  fetchOfferingsWithEvents,
  validateCoupon,
  applyCouponDiscount
} from "@/lib/supabase";

// import SiblingDiscountComponent from "@/components/SiblingDiscountComponent.vue";
import ExtraPurchaseComponent from "../components/ExtraPurchaseComponet.vue";

export default defineComponent({
  name: "BasketView",

  components: {
    // SiblingDiscountComponent,
    ExtraPurchaseComponent,
  },

  setup() {
    const store = useStore();
    const cartStore = useCartStore();
    const router = useRouter();
    const couponCode = ref("");
    const couponError = ref("");
    const discountAmount = ref(0);
    const basket = computed(() => cartStore.items);
    const total = computed(() => store.getters.total);
    const category = computed(() => store.getters.category);
    const headerHeight = 223;
    const cardHeight = computed(() => `${window.innerHeight - headerHeight}px`);

    const loadBasketFromLocalStorage = () => {
      // Cart store automatically loads from localStorage
      // This function is kept for compatibility but is no longer needed
    };

    const clearBasket = () => {
      store.commit("SET_DISCOUNT_APPLIED", false);
      cartStore.clearCart();
    };

    const getTotalPrice = () => {
      const totalPrice = basket.value.reduce((total, item) => {
        // Convert price to a number and multiply by quantity
        let itemTotal = parseFloat(item.price) * item.quantity;

        // If the item has a nested items array, add those items' totals as well
        if (item.items && Array.isArray(item.items)) {
          item.items.forEach((subItem) => {
            // For each sub-item, multiply its price by its quantity and add to itemTotal
            itemTotal =
              parseFloat(subItem.price) * item.items.length * item.quantity;
          });
        }
        // Add the item's total to the overall total
        return total + itemTotal;
      }, 0);

      store.commit(
        "SET_TOTAL",
        store.state.discount ? totalPrice - store.state.discount : totalPrice
      );

      return Number(totalPrice.toFixed(2)); // Ensure result is a number with 2 decimal places
    };

    const hasHpWorkshopInBasket = (basket) => {
      return basket.some((item) => {
        return item.event_id.includes("hp");
      });
    };

    const countWorkshops = (basket) => {
      return basket.length;
    };

    const applyCoupon = async () => {
      if (couponCode.value === "") {
        couponError.value = "Please enter a coupon code.";
        return;
      }

      // Use Supabase to validate coupon
      const { data: coupon, error } = await validateCoupon(couponCode.value);

      if (error || !coupon) {
        console.error("Invalid coupon code:", error);
        couponError.value = "Invalid coupon code.";
        return;
      }

      const now = new Date();
      const basket = store.state.basket;
      let discount = 0;

      // Handle special coupon codes (legacy logic)
      if (coupon.code === "SUMMER25") {
        const isMay = now.getMonth() === 4; // May is month index 4
        const hasHp = hasHpWorkshopInBasket(basket);

        if (!isMay) {
          couponError.value = "This code is only valid during May.";
          return;
        }
        if (!hasHp) {
          couponError.value = "This code only applies to holiday workshops.";
          return;
        }
        discount = (getTotalPrice(basket) * 20) / 100;
      } else if (coupon.code === "ARTCLASS25") {
        const hpCount = countWorkshops(basket);
        if (hpCount < 4) {
          couponError.value = "You must book at least 4 holiday workshops for this code.";
          return;
        }
        discount = (getTotalPrice(basket) * 25) / 100;
      } else {
        // Handle general coupons using Supabase discount logic
        const totalPrice = getTotalPrice(basket);
        discount = totalPrice - applyCouponDiscount(totalPrice, coupon);
      }

      if (store.state.discountApplied) {
        couponError.value = "You have already applied a discount.";
        return;
      }

      const finalTotal = getTotalPrice(basket) - discount;
      discountAmount.value = parseFloat(discount.toFixed(2));
      store.commit("SET_TOTAL", finalTotal);
      store.commit("SET_DISCOUNT_APPLIED", true);
      store.commit("SET_DISCOUNT", discount);
      couponError.value = "";
    };

    const groupedItems = computed(() => {
      const grouped = [];

      cartStore.items.forEach((item) => {
        // If category is 'term', group by event_id in nested arrays
        if (item.category === "term") {
          // Find if the event_id already exists in the grouped array
          let eventGroup = grouped.find(
            (group) =>
              Array.isArray(group) && group[0].event_id === item.event_id
          );

          if (!eventGroup) {
            // If no group exists for this event_id, create a new array
            eventGroup = [];
            grouped.push(eventGroup);
          }

          // Push the item into the existing or newly created group
          eventGroup.push(item);
        } else {
          // If not 'term', simply push the object directly into the grouped array
          grouped.push(item);
        }
      });

      return grouped;
    });

    const themedBaskets = computed(() => {
      const themes = {};
      basket.value.forEach((item) => {
        if (!themes[item.event_id]) {
          themes[item.event_id] = { count: 0, items: [] };
        }
        // Increment count for all items
        themes[item.event_id].count++;

        // Push items directly for 'term' category
        themes[item.event_id].items.push(item);
      });

      // Filter duplicates for 'single' categories and count them individually
      Object.values(themes).forEach((theme) => {
        if (theme.items.length > 0 && theme.items[0].category === "single") {
          const uniqueThemeIds = new Set();
          const uniqueItems = [];

          theme.items.forEach((i) => {
            if (!uniqueThemeIds.has(i.theme_id)) {
              uniqueThemeIds.add(i.theme_id);
              uniqueItems.push(i);
            }
          });

          // Set the unique items and their count
          theme.items = uniqueItems;
          theme.count = uniqueItems.reduce(
            (acc, item) => acc + (item.quantity || 0),
            0
          ); // Ensure item.count is a number
        }
      });

      return themes;
    });

    const removeFromBasket = (theme) => {
      // Handle term events (array)
      if (theme.length) {
        cartStore.removeItem(theme[0]);
      } else {
        // Handle single events (object)
        cartStore.removeItem(theme);
      }
      getTotalPrice(cartStore.items);
    };

    const checkout = () => {
      // const analytics = getAnalytics();
      // logEvent(analytics, "register_and_pay_click", {
      //   total_price: total.value,
      //   items_in_basket: basket.value.length,
      //   added_at: new Date().toISOString(),
      //   environment: store.state.environment,
      // });
      router.push("/checkout");
    };

    // Fetch events from Supabase instead of Firebase
    const getEventsFromSupabase = async () => {
      try {
        const events = await fetchEventsWithCapacity();
        // Transform to legacy format for compatibility with existing store
        const legacyEvents = events.map(event => ({
          event_id: event.id,
          event_title: event.offering.title,
          title: event.offering.title,
          description: event.offering.description_long || event.offering.description_short || "",
          date: event.event_date,
          start_time: event.event_start_time,
          end_time: event.event_end_time,
          location: event.location_name,
          address: event.location_address,
          city: event.location_city,
          postcode: event.location_postcode,
          quantity: event.max_capacity - event.current_bookings, // Available spaces
          max_capacity: event.max_capacity,
          current_bookings: event.current_bookings,
          price: event.price_gbp,
          image: event.offering.featured_image_url,
          slug: event.offering.slug,
        }));
        store.commit("SET_EVENTS", legacyEvents);
      } catch (error) {
        console.error("Error fetching events from Supabase:", error);
      }
    };

    // Fetch themes/offerings from Supabase instead of Firebase
    const getThemesFromSupabase = async () => {
      try {
        const offerings = await fetchOfferingsWithEvents();
        // Transform to legacy format for compatibility with existing store
        const legacyThemes = offerings.map(offering => ({
          id: offering.id,
          title: offering.title,
          description: offering.description_long || offering.description_short || "",
          price: offering.events?.[0]?.price_gbp || 0, // Use first event's price
          image: offering.featured_image_url,
          slug: offering.slug,
          events: offering.events || [],
        }));
        store.commit("SET_THEMES", legacyThemes);
        return legacyThemes;
      } catch (error) {
        console.error("Error fetching themes from Supabase:", error);
        return [];
      }
    };

    onMounted(() => {
      const fetchData = async () => {
        try {
          store.dispatch("setLoading", true);
          // Use Supabase instead of Firebase
          await getThemesFromSupabase();
          await getEventsFromSupabase();
          loadBasketFromLocalStorage();
          if (!store.state.discountApplied) {
            getTotalPrice(store.state.basket);
          }
        } catch (error) {
          // handle error
          console.error("Error in basket", error);
          store.dispatch("setLoading", false);
        } finally {
          store.dispatch("setLoading", false);
        }
      };
      fetchData();
    });

    onBeforeUnmount(() => {
      store.commit("SET_DISCOUNT_APPLIED", false);
      store.commit("SET_DISCOUNT", null);
    });

    return {
      store,
      basket,
      cardHeight,
      total,
      category,
      themedBaskets, // Expose the themed baskets
      getThemesFromSupabase,
      getEventsFromSupabase,
      removeFromBasket,
      getTotalPrice,
      checkout,
      clearBasket,
      applyCoupon,
      couponCode,
      discountAmount,
      couponError,
      groupedItems,
    };
  },
});
</script>

<style lang="scss">
.c-basket-view {
  input[type="text"] {
    width: 50%;
    padding: 10px;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    height: 36px;
  }
}
.c-basket .c-basket-view__themes,
.c-basket-view__single {
  width: 100%;
  position: relative;

  div {
    @media screen and (max-width: 1023px) {
      width: 90%;
      display: flex;
      flex-wrap: wrap;
    }
  }
}

.c-basket-view__themes:first-child {
  margin-top: 10px;
}

.c-basket-view__themes .v-icon,
.c-basket-view__single .v-icon {
  position: absolute;
  right: 0;
  top: 0;
}

.c-basket-view__theme {
  margin-bottom: 10px;
}
</style>
