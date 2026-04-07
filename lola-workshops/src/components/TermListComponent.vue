<template>
  <div class="c-term-list pa-10 mt-10" v-if="orderedTermSections.length">
    <v-row>
      <v-col cols="12">
        <h1 class="text-center">Book your workshops below</h1>
      </v-col>

      <template
        v-for="termSection in orderedTermSections"
        :key="termSection.key"
      >
        <v-col cols="12" class="pb-0 pt-6">
          <h2 class="c-term-list__section-title">
            {{ termSection.label }}
          </h2>
        </v-col>

        <template
          v-for="themeGroup in termSection.bundleGroups"
          :key="themeGroup.key"
        >
          <v-col cols="12" v-if="themeGroup.events.length > 0">
            <div class="d-flex py-4 align-center flex-wrap">
              <p class="mr-2 font-weight-bold">
                {{ themeGroup.events[0]?.event_title }}
              </p>
              <StockComponent
                :stock="themeGroup.events[0]?.stock"
                :category="themeGroup.events[0]?.category"
              />
            </div>

            <template v-for="(th, index) in themeGroup.events" :key="index">
              <v-card
                v-if="!th.passed"
                flat
                class="mb-4 py-1 px-4 c-single-list__card"
                outlined
              >
                <div class="d-flex">
                  <p class="mr-2">{{ formatDate(th.date) }}</p>
                  <p class="mr-2 font-weight-medium">
                    {{ th.theme_title || th.title }}
                  </p>
                </div>
              </v-card>
            </template>

            <v-btn
              style="background-color: var(--yellow); color: var(--white)"
              class="mt-4"
              :disabled="themeGroup.events[0]?.stock <= 0"
              @click="handleAddToBasket(themeGroup.events, themeGroup.key)"
            >
              {{ basketButtonText[themeGroup.key] || "Add to basket" }}
            </v-btn>
          </v-col>
        </template>
      </template>
    </v-row>
  </div>
</template>

<script>
import { computed, defineComponent, ref, watch } from "vue";
import { logEvent, getAnalytics } from "firebase/analytics";
import { useStore } from "vuex";
import { Lit } from "@/main";
import { useCartStore } from "@/stores/cart";
import { generateLegacyTerm } from "@/utils/termFormatters";

import StockComponent from "@/components/StockComponent.vue";

export default defineComponent({
  name: "TermListComponent",
  components: {
    StockComponent,
  },
  props: {
    themes: {
      required: true,
      type: Object,
    },
    category: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const store = useStore();
    const cartStore = useCartStore();
    const sortedThemes = ref({});
    const basketButtonText = ref({}); // Map button text by term key

    watch(
      () => props.themes,
      (newThemes) => {
        const nextThemes = {};
        Object.keys(newThemes).forEach((key) => {
          nextThemes[key] = newThemes[key].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
        });
        sortedThemes.value = nextThemes;

        const nextButtonText = {};
        Object.keys(nextThemes).forEach((key) => {
          nextButtonText[key] = basketButtonText.value[key] || "Add to basket";
        });
        basketButtonText.value = nextButtonText;
      },
      { immediate: true }
    );

    const termStringConvert = (term) => {
      return term
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    const formatTermLabel = (event) => {
      if (event.term) {
        return termStringConvert(event.term);
      }

      if (event.term_season && event.term_half) {
        return termStringConvert(
          generateLegacyTerm(event.term_season, event.term_half)
        );
      }

      return "";
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const getSeasonOrder = (season) => {
      const seasonOrder = {
        spring: 0,
        summer: 1,
        autumn: 2,
        winter: 3,
      };

      return seasonOrder[season] ?? Number.POSITIVE_INFINITY;
    };

    const getHalfOrder = (half) => {
      const halfOrder = {
        first: 0,
        second: 1,
        full: 2,
      };

      return halfOrder[half] ?? Number.POSITIVE_INFINITY;
    };

    const sortThemeGroups = (firstGroup, secondGroup) => {
      const firstEvent = firstGroup.events[0] || {};
      const secondEvent = secondGroup.events[0] || {};

      const firstTitle = firstEvent.event_title || "";
      const secondTitle = secondEvent.event_title || "";
      if (firstTitle !== secondTitle) {
        return firstTitle.localeCompare(secondTitle);
      }

      const firstCategory = firstEvent.category_name || "";
      const secondCategory = secondEvent.category_name || "";
      if (firstCategory !== secondCategory) {
        return firstCategory.localeCompare(secondCategory);
      }

      const firstDate = firstEvent.date || "";
      const secondDate = secondEvent.date || "";
      return new Date(firstDate) - new Date(secondDate);
    };

    const compareTermPeriods = (firstEvent, secondEvent) => {
      const firstYear = Number(firstEvent.term_year || 0);
      const secondYear = Number(secondEvent.term_year || 0);
      if (firstYear !== secondYear) {
        return firstYear - secondYear;
      }

      const firstSeasonOrder = getSeasonOrder(firstEvent.term_season);
      const secondSeasonOrder = getSeasonOrder(secondEvent.term_season);
      if (firstSeasonOrder !== secondSeasonOrder) {
        return firstSeasonOrder - secondSeasonOrder;
      }

      const firstHalfOrder = getHalfOrder(firstEvent.term_half);
      const secondHalfOrder = getHalfOrder(secondEvent.term_half);
      if (firstHalfOrder !== secondHalfOrder) {
        return firstHalfOrder - secondHalfOrder;
      }

      const firstDate = firstEvent.date || "";
      const secondDate = secondEvent.date || "";
      return new Date(firstDate) - new Date(secondDate);
    };

    const buildTermSectionKey = (event) => {
      return [
        event.term_year || "unknown",
        event.term_season || "unknown",
        event.term_half || "unknown",
      ].join("__");
    };

    const orderedThemes = computed(() => {
      return Object.entries(sortedThemes.value)
        .map(([key, events]) => ({
          key,
          events,
        }))
        .sort((firstGroup, secondGroup) => {
          const periodComparison = compareTermPeriods(
            firstGroup.events[0] || {},
            secondGroup.events[0] || {}
          );

          if (periodComparison !== 0) {
            return periodComparison;
          }

          return sortThemeGroups(firstGroup, secondGroup);
        });
    });

    const orderedTermSections = computed(() => {
      const sections = orderedThemes.value.reduce(
        (groupedSections, themeGroup) => {
          const firstEvent = themeGroup.events[0];
          if (!firstEvent) {
            return groupedSections;
          }

          const sectionKey = buildTermSectionKey(firstEvent);

          if (!groupedSections[sectionKey]) {
            groupedSections[sectionKey] = {
              key: sectionKey,
              label: formatTermLabel(firstEvent),
              firstEvent,
              bundleGroups: [],
            };
          }

          groupedSections[sectionKey].bundleGroups.push(themeGroup);
          return groupedSections;
        },
        {}
      );

      return Object.values(sections)
        .sort((firstSection, secondSection) =>
          compareTermPeriods(firstSection.firstEvent, secondSection.firstEvent)
        )
        .map((section) => ({
          ...section,
          bundleGroups: [...section.bundleGroups].sort(sortThemeGroups),
        }));
    });

    const addToBasket = (theme) => {
      const bundleKey = theme[0].term_group_key || theme[0].event_id;

      // Prepare the event object for the cart store
      let eventToAdd = {
        ...theme[0],
        id: bundleKey,
        event_id: bundleKey,
        quantity: 1,
        term_group_key: bundleKey,
      };

      // If it's a term event, add the items array
      if (theme[0].category === "term") {
        eventToAdd = { ...eventToAdd, items: theme };
      }

      // Add to cart using cart store
      cartStore.addItem(eventToAdd);

      // Analytics tracking
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
          theme_title: theme[0].theme_title,
          theme_id: theme[0].theme_id,
          type: theme[0].category,
        },
      });
    };

    const handleAddToBasket = (theme, themeKey) => {
      addToBasket(theme);
      basketButtonText.value[themeKey] = "Item added to basket!";
      setTimeout(() => {
        basketButtonText.value[themeKey] = "Add to basket";
      }, 5000); // Reset message after 5 seconds
    };

    return {
      formatDate,
      addToBasket,
      handleAddToBasket,
      basketButtonText,
      termStringConvert,
      formatTermLabel,
      orderedThemes,
      orderedTermSections,
      sortedThemes,
    };
  },
});
</script>

<style>
.c-term-list {
  background-color: var(--white);
}

.c-term-list__section-title {
  font-size: 1.25rem;
  font-weight: 600;
}
</style>
