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
                  v-for="theme in groupedItems"
                  :key="theme.key || getBasketItemKey(theme)"
                >
                  <div
                    class="c-basket-view__single-group"
                    v-if="theme.displayType === 'single-group'"
                  >
                    <div class="c-basket-view__group-header">
                      <span>
                        {{ theme.quantity }} x {{ getSingleGroupTitle(theme) }}
                      </span>
                      <span class="ml-3"
                        >£{{ getSingleGroupLineTotal(theme).toFixed(2) }}</span
                      >
                    </div>

                    <div class="c-basket-view__group-list">
                      <div
                        class="c-basket-view__group-item"
                        v-for="item in theme.items"
                        :key="getBasketItemKey(item)"
                      >
                        <div class="c-basket-view__group-item-copy">
                          <div class="c-basket-view__group-item-title">
                            {{ formatBasketDate(item.date || item.event_date) }}
                          </div>
                          <div class="c-basket-view__group-item-meta">
                            {{ formatBasketTimeRange(item) }}
                            <span v-if="item.quantity > 1" class="ml-2">
                              {{ item.quantity }} places
                            </span>
                          </div>
                        </div>
                        <v-icon color="#b77f6e" @click="removeFromBasket(item)"
                          >mdi-delete</v-icon
                        >
                      </div>
                    </div>
                  </div>
                  <div
                    class="c-basket-view__themes"
                    v-else-if="theme.items?.length"
                  >
                    {{ theme.quantity }} x {{ getTermGroupTitle(theme) }}
                    <span class="ml-3"
                      >£{{ getBundleLineTotal(theme).toFixed(2) }}</span
                    >
                    <div style="position: relative">
                      <template v-for="(th, i) in theme.items" :key="i">
                        <div
                          v-if="!th?.passed"
                          :class="{
                            'c-basket-view__theme':
                              i === theme.items.length - 1,
                          }"
                        >
                          {{ getTermSessionTitle(th) }}
                        </div>
                        <v-icon
                          color="#b77f6e"
                          v-if="i === theme.items.length - 1"
                          xw
                          @click="removeFromBasket(theme)"
                          >mdi-delete</v-icon
                        >
                      </template>
                    </div>
                  </div>
                  <div class="c-basket-view__single" v-else>
                    <p class="mb-0">
                      <span class="mr-2">{{ theme.quantity }} </span>
                      <span class="mr-2">x</span>
                      <span>{{ getBasketItemTitle(theme) }}</span>
                      <span v-if="theme?.passed">- {{ theme?.passed }}</span>
                      <span class="ml-3"
                        >£{{ getBundleLineTotal(theme).toFixed(2) }}</span
                      >
                    </p>
                    <v-icon color="#b77f6e" @click="removeFromBasket(theme)"
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
import { useStore } from "vuex";
import { useRouter } from "vue-router";
// import { db, collection, query, where, getDocs } from "@/main"; // Firebase - deprecated
import { useCartStore } from "@/stores/cart";
import {
  fetchEventsWithCapacity,
  fetchOfferingsWithEvents,
  validateCoupon,
  applyCouponDiscount,
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
          itemTotal =
            item.items.reduce(
              (sum, subItem) => sum + parseFloat(subItem.price || item.price),
              0
            ) * item.quantity;
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

    const getBundleLineTotal = (item) => {
      if (item.items && Array.isArray(item.items)) {
        return (
          item.items.reduce(
            (sum, subItem) => sum + parseFloat(subItem.price || item.price),
            0
          ) * item.quantity
        );
      }

      return parseFloat(item.price) * item.quantity;
    };

    const getTermGroupTitle = (item) => {
      return item.category_name || item.title || item.event_title;
    };

    const getTermSessionTitle = (item) => {
      return item.event_title;
    };

    const getBasketItemTitle = (item) => {
      return (
        item.category_name || item.theme_title || item.event_title || item.title
      );
    };

    const getSingleEventGroupLabel = (item) => {
      return (
        item.event_title || item.category_name || item.theme_title || item.title
      );
    };

    const normalizeGroupKeyPart = (value) => {
      return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
    };

    const getBasketItemKey = (item) => {
      return (
        item.offering_event_id || item.event_id || item.theme_id || item.id
      );
    };

    const getSingleGroupKey = (item) => {
      return [
        item.type || "event",
        item.category || "",
        normalizeGroupKeyPart(item.category_slug),
        normalizeGroupKeyPart(
          item.event_title ||
            item.legacy_event_id ||
            item.theme_title ||
            item.title
        ),
      ].join("::");
    };

    const sortGroupedBasketItems = (items) => {
      return [...items].sort((firstItem, secondItem) => {
        const firstDate = new Date(
          firstItem.date || firstItem.event_date || 0
        ).getTime();
        const secondDate = new Date(
          secondItem.date || secondItem.event_date || 0
        ).getTime();

        if (firstDate !== secondDate) {
          return firstDate - secondDate;
        }

        const firstTime =
          firstItem.start_time || firstItem.event_start_time || "";
        const secondTime =
          secondItem.start_time || secondItem.event_start_time || "";

        if (firstTime !== secondTime) {
          return firstTime.localeCompare(secondTime);
        }

        return getBasketItemTitle(firstItem).localeCompare(
          getBasketItemTitle(secondItem)
        );
      });
    };

    const formatBasketDate = (date) => {
      if (!date) {
        return "Date to be confirmed";
      }

      return new Date(date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const formatBasketTime = (time) => {
      return time ? time.slice(0, 5) : "";
    };

    const formatBasketTimeRange = (item) => {
      const start = formatBasketTime(item.start_time || item.event_start_time);
      const end = formatBasketTime(item.end_time || item.event_end_time);

      if (start && end) {
        return `${start} - ${end}`;
      }

      return start || end || "Time to be confirmed";
    };

    const getSingleGroupTitle = (group) => {
      return group.title || getSingleEventGroupLabel(group.items?.[0] || group);
    };

    const getSingleGroupLineTotal = (group) => {
      return group.lineTotal || 0;
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
          couponError.value =
            "You must book at least 4 holiday workshops for this code.";
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
      const displayItems = [];
      const singleEventGroups = new Map();

      basket.value.forEach((item) => {
        if (item.items?.length) {
          displayItems.push(item);
          return;
        }

        const groupKey = getSingleGroupKey(item);
        const existingGroup = singleEventGroups.get(groupKey);

        if (existingGroup) {
          existingGroup.items.push(item);
          existingGroup.quantity += item.quantity || 1;
          existingGroup.lineTotal += getBundleLineTotal(item);
          return;
        }

        const nextGroup = {
          displayType: "single-group",
          key: groupKey,
          title: getSingleEventGroupLabel(item),
          quantity: item.quantity || 1,
          lineTotal: getBundleLineTotal(item),
          items: [item],
        };

        singleEventGroups.set(groupKey, nextGroup);
        displayItems.push(nextGroup);
      });

      return displayItems.map((item) => {
        if (item.displayType !== "single-group") {
          return item;
        }

        const sortedItems = sortGroupedBasketItems(item.items);

        if (sortedItems.length <= 1) {
          return sortedItems[0];
        }

        return {
          ...item,
          items: sortedItems,
        };
      });
    });

    const removeFromBasket = (theme) => {
      cartStore.removeItem(theme);
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
        const legacyEvents = events.map((event) => ({
          event_id: event.id,
          event_title: event.offering.title,
          title: event.offering.title,
          description:
            event.offering.description_long ||
            event.offering.description_short ||
            "",
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
        const legacyThemes = offerings.map((offering) => ({
          id: offering.id,
          title: offering.title,
          description:
            offering.description_long || offering.description_short || "",
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
      getThemesFromSupabase,
      getEventsFromSupabase,
      removeFromBasket,
      getTotalPrice,
      checkout,
      clearBasket,
      applyCoupon,
      getBasketItemKey,
      getBasketItemTitle,
      getBundleLineTotal,
      getSingleEventGroupLabel,
      getSingleGroupLineTotal,
      getSingleGroupTitle,
      getTermGroupTitle,
      getTermSessionTitle,
      formatBasketDate,
      formatBasketTimeRange,
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

.c-basket-view__themes,
.c-basket-view__single,
.c-basket-view__single-group {
  width: 100%;
  position: relative;
}

.c-basket-view__event + .c-basket-view__event {
  margin-top: 18px;
}

.c-basket-view__themes .v-icon,
.c-basket-view__single .v-icon {
  position: absolute;
  right: 0;
  top: 0;
}

.c-basket-view__group-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 10px;
}

.c-basket-view__group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.c-basket-view__group-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.c-basket-view__group-item-copy {
  min-width: 0;
}

.c-basket-view__group-item-title {
  font-weight: 500;
}

.c-basket-view__group-item-meta {
  color: #6b7280;
  margin-top: 2px;
}

.c-basket-view__theme {
  margin-bottom: 10px;
}

@media screen and (max-width: 1023px) {
  .c-basket-view__themes,
  .c-basket-view__single,
  .c-basket-view__single-group {
    width: 100%;
  }

  .c-basket-view__group-item {
    gap: 12px;
  }

  .c-basket-view__group-item-copy {
    width: calc(100% - 36px);
  }
}
</style>
