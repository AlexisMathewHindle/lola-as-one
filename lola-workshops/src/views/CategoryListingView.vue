<template>
  <div class="c-category-listing">
    <!-- Loading State -->
    <v-container v-if="loading">
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

    <!-- Error State -->
    <v-container v-else-if="error">
      <v-card class="pa-6">
        <v-alert type="error" class="mb-4">{{ error }}</v-alert>
        <v-btn @click="goBack" variant="outlined">Back to Calendar</v-btn>
      </v-card>
    </v-container>

    <!-- Category Details -->
    <v-container v-else>
      <v-card class="px-10">
        <v-row class="mt-10">
          <v-col cols="12">
            <v-btn
              @click="goBack"
              variant="text"
              prepend-icon="mdi-arrow-left"
              class="mb-4"
            >
              Back to Calendar
            </v-btn>
            <h1 class="text-center">{{ pageTitle }}</h1>
          </v-col>
        </v-row>

        <v-row v-if="showWorkshopHero">
          <v-col cols="12" md="6">
            <v-img
              v-if="heroImage"
              :src="heroImage"
              alt="Workshop image"
              height="300px"
              contain
            ></v-img>
            <div v-else class="d-flex align-center justify-center">
              <v-icon size="100" :color="category?.color_hex || '#D8B061'">
                {{ category?.icon || "mdi-palette" }}
              </v-icon>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="workshop-details pa-4">
              <v-divider></v-divider>
              <v-list>
                <v-list-item v-if="heroDescription">
                  <v-list-item-title>
                    <strong>Description</strong>
                  </v-list-item-title>
                  <v-list-item-content
                    v-html="heroDescription"
                  ></v-list-item-content>
                </v-list-item>
                <v-list-item v-if="heroInstructions">
                  <v-list-item-title>
                    <strong>Instructions</strong>
                  </v-list-item-title>
                  <v-list-item-content
                    v-html="heroInstructions"
                  ></v-list-item-content>
                </v-list-item>
              </v-list>
              <v-divider></v-divider>
            </div>
          </v-col>
        </v-row>

        <v-row v-else-if="category">
          <v-col cols="12" md="6">
            <v-img
              v-if="categoryImage"
              :src="categoryImage"
              alt="Category image"
              height="300px"
              contain
            ></v-img>
            <div v-else class="d-flex align-center justify-center">
              <v-icon size="100" :color="category.color_hex || '#D8B061'">
                {{ category.icon || "mdi-palette" }}
              </v-icon>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="workshop-details pa-4">
              <v-divider></v-divider>
              <v-list>
                <v-list-item v-if="category.description">
                  <p><strong>Description</strong></p>
                  <p>{{ category.description }}</p>
                </v-list-item>
              </v-list>
              <v-divider></v-divider>
            </div>
          </v-col>
        </v-row>

        <v-row v-if="heroImages.length > 0">
          <v-col cols="12">
            <ImageSlider class="my-8" :images="heroImages" />
          </v-col>
        </v-row>
      </v-card>

      <div
        v-if="orderedTermSections.length > 0"
        class="c-category-listing__term-list pa-10 mt-10"
      >
        <v-row>
          <v-col cols="12">
            <h1 class="text-center">Book your workshops below</h1>
          </v-col>

          <template
            v-for="termSection in orderedTermSections"
            :key="termSection.key"
          >
            <v-col cols="12" class="pb-0 pt-6">
              <h2 class="c-category-listing__term-title">
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

                <template
                  v-for="(event, index) in themeGroup.events"
                  :key="index"
                >
                  <v-card
                    v-if="!event.passed"
                    flat
                    class="mb-4 py-1 px-4 c-single-list__card"
                    outlined
                  >
                    <div class="d-flex">
                      <p class="mr-2">
                        {{ formatDate(event.date || event.event_date) }}
                      </p>
                      <p class="mr-2 font-weight-medium">
                        {{ event.event_title }}
                      </p>
                    </div>
                  </v-card>
                </template>

                <v-btn
                  style="background-color: var(--yellow); color: var(--white)"
                  class="mt-4"
                  :disabled="themeGroup.events[0]?.stock <= 0"
                  @click="
                    handleAddTermBundleToBasket(
                      themeGroup.events,
                      themeGroup.key
                    )
                  "
                >
                  {{ basketButtonText[themeGroup.key] || "Add to basket" }}
                </v-btn>
              </v-col>
            </template>
          </template>
        </v-row>
      </div>

      <!-- Show single events if there are any -->
      <SingleEventsList v-if="singleEvents.length > 0" :events="singleEvents" />
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SingleEventsList from "@/components/SingleEventsList.vue";
import ImageSlider from "@/components/ImageSlider.vue";
import StockComponent from "@/components/StockComponent.vue";
import { useCartStore } from "@/stores/cart";
import { supabase, fetchEventsByCategoryGroupedByTerm } from "@/lib/supabase";
import { generateLegacyTerm } from "@/utils/termFormatters";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color_hex?: string;
  icon?: string;
  parent_id?: string;
  featured_image_url?: string;
}

interface TermBundleGroup {
  key: string;
  events: any[];
}

interface TermSection {
  key: string;
  label: string;
  firstEvent: any;
  bundleGroups: TermBundleGroup[];
}

export default defineComponent({
  name: "CategoryListingView",
  components: {
    SingleEventsList,
    ImageSlider,
    StockComponent,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const cartStore = useCartStore();

    const loading = ref(true);
    const error = ref<string | null>(null);
    const category = ref<Category | null>(null);
    const categoryImage = ref<string | null>(null);
    const termGroups = ref<Record<string, any[]>>({});
    const singleEvents = ref<any[]>([]);
    const basketButtonText = ref<Record<string, string>>({});

    // Use computed to make it reactive to route changes
    const categorySlug = computed(() => route.params.categorySlug as string);
    const categoryId = computed(() => category.value?.id || "");

    const cardHeight = computed(() => `${window.innerHeight - 223}px`);

    const termStringConvert = (term: string | null | undefined): string => {
      if (!term) {
        return "";
      }

      return term
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    const formatTermLabel = (event: any): string => {
      if (event.term) {
        return termStringConvert(event.term);
      }

      if (event.term_season && event.term_half) {
        return (
          termStringConvert(
            generateLegacyTerm(event.term_season, event.term_half)
          ) || ""
        );
      }

      return "";
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const getSeasonOrder = (season: string | null | undefined) => {
      const seasonOrder: Record<string, number> = {
        spring: 0,
        summer: 1,
        autumn: 2,
        winter: 3,
      };

      return seasonOrder[season || ""] ?? Number.POSITIVE_INFINITY;
    };

    const getHalfOrder = (half: string | null | undefined) => {
      const halfOrder: Record<string, number> = {
        first: 0,
        second: 1,
        full: 2,
      };

      return halfOrder[half || ""] ?? Number.POSITIVE_INFINITY;
    };

    const compareTermPeriods = (firstEvent: any, secondEvent: any) => {
      const firstYear = Number(firstEvent?.term_year || 0);
      const secondYear = Number(secondEvent?.term_year || 0);
      if (firstYear !== secondYear) {
        return firstYear - secondYear;
      }

      const firstSeasonOrder = getSeasonOrder(firstEvent?.term_season);
      const secondSeasonOrder = getSeasonOrder(secondEvent?.term_season);
      if (firstSeasonOrder !== secondSeasonOrder) {
        return firstSeasonOrder - secondSeasonOrder;
      }

      const firstHalfOrder = getHalfOrder(firstEvent?.term_half);
      const secondHalfOrder = getHalfOrder(secondEvent?.term_half);
      if (firstHalfOrder !== secondHalfOrder) {
        return firstHalfOrder - secondHalfOrder;
      }

      const firstDate = firstEvent?.date || firstEvent?.event_date || "";
      const secondDate = secondEvent?.date || secondEvent?.event_date || "";
      return new Date(firstDate).getTime() - new Date(secondDate).getTime();
    };

    const sortThemeGroups = (
      firstGroup: TermBundleGroup,
      secondGroup: TermBundleGroup
    ) => {
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

      const firstDate = firstEvent.date || firstEvent.event_date || "";
      const secondDate = secondEvent.date || secondEvent.event_date || "";
      return new Date(firstDate).getTime() - new Date(secondDate).getTime();
    };

    const buildTermSectionKey = (event: any) => {
      return [
        event.term_year || "unknown",
        event.term_season || "unknown",
        event.term_half || "unknown",
      ].join("__");
    };

    const orderedTermBundles = computed<TermBundleGroup[]>(() => {
      return Object.entries(termGroups.value)
        .map(([key, events]) => ({
          key,
          events: [...events].sort((firstEvent, secondEvent) => {
            const firstDate = firstEvent.date || firstEvent.event_date || "";
            const secondDate = secondEvent.date || secondEvent.event_date || "";
            return (
              new Date(firstDate).getTime() - new Date(secondDate).getTime()
            );
          }),
        }))
        .filter((group) => group.events.length > 0)
        .sort((firstGroup, secondGroup) => {
          const periodComparison = compareTermPeriods(
            firstGroup.events[0],
            secondGroup.events[0]
          );

          if (periodComparison !== 0) {
            return periodComparison;
          }

          return sortThemeGroups(firstGroup, secondGroup);
        });
    });

    const uniqueTermTitles = computed(() => {
      return [
        ...new Set(
          orderedTermBundles.value
            .map((group) => group.events[0]?.event_title)
            .filter(Boolean)
        ),
      ];
    });

    const orderedTermSections = computed<TermSection[]>(() => {
      const sections = orderedTermBundles.value.reduce<
        Record<string, TermSection>
      >((groupedSections, themeGroup) => {
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
      }, {});

      return Object.values(sections)
        .sort((firstSection, secondSection) =>
          compareTermPeriods(firstSection.firstEvent, secondSection.firstEvent)
        )
        .map((section) => ({
          ...section,
          bundleGroups: [...section.bundleGroups].sort(sortThemeGroups),
        }));
    });

    const heroEvent = computed(
      () => orderedTermBundles.value[0]?.events[0] || null
    );

    const showWorkshopHero = computed(() => {
      return Boolean(heroEvent.value) && uniqueTermTitles.value.length === 1;
    });

    const pageTitle = computed(() => {
      if (uniqueTermTitles.value.length === 1) {
        return uniqueTermTitles.value[0];
      }

      return category.value?.name || "Workshops";
    });

    const heroImage = computed(() => {
      return showWorkshopHero.value
        ? heroEvent.value?.image || categoryImage.value || null
        : categoryImage.value || null;
    });

    const heroImages = computed(() => {
      if (!showWorkshopHero.value) {
        return [];
      }

      if (!Array.isArray(heroEvent.value?.secondary_images)) {
        return [];
      }

      return [...heroEvent.value.secondary_images]
        .sort(
          (firstImage, secondImage) =>
            (firstImage.order || 0) - (secondImage.order || 0)
        )
        .map((image) => image.url)
        .filter(Boolean);
    });

    const heroDescription = computed(() => {
      return showWorkshopHero.value
        ? heroEvent.value?.description || category.value?.description || ""
        : category.value?.description || "";
    });

    const heroInstructions = computed(() => {
      if (!showWorkshopHero.value) {
        return "";
      }

      const instructions = heroEvent.value?.metadata?.instructions;

      if (Array.isArray(instructions)) {
        return instructions.filter(Boolean).join("<br>");
      }

      if (typeof instructions === "string") {
        return instructions;
      }

      return "";
    });

    const goBack = () => {
      router.push("/");
    };

    const handleAddTermBundleToBasket = (theme: any[], themeKey: string) => {
      const bundleKey =
        theme[0]?.term_group_key || theme[0]?.event_id || themeKey;
      const groupTitle =
        theme[0]?.category_name ||
        category.value?.name ||
        pageTitle.value ||
        theme[0]?.event_title ||
        theme[0]?.title;
      const eventToAdd = {
        ...theme[0],
        id: bundleKey,
        event_id: bundleKey,
        category: "term",
        category_slug: theme[0]?.category,
        title: groupTitle,
        event_title: groupTitle,
        quantity: 1,
        term_group_key: bundleKey,
        items: theme,
      };

      cartStore.addItem(eventToAdd);
      basketButtonText.value[themeKey] = "Item added to basket!";
      setTimeout(() => {
        basketButtonText.value[themeKey] = "Add to basket";
      }, 5000);
    };

    // Fetch category details and events
    const fetchCategory = async () => {
      try {
        loading.value = true;
        error.value = null;

        const { data, error: fetchError } = await supabase
          .from("event_categories")
          .select("*")
          .eq("slug", categorySlug.value)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        category.value = data;
        categoryImage.value = data.featured_image_url || null;

        // Fetch events grouped by term
        if (data.id) {
          const {
            termGroups: fetchedTermGroups,
            singleEvents: fetchedSingleEvents,
          } = await fetchEventsByCategoryGroupedByTerm(data.id);

          termGroups.value = fetchedTermGroups;
          singleEvents.value = fetchedSingleEvents;
          basketButtonText.value = Object.keys(fetchedTermGroups).reduce<
            Record<string, string>
          >((buttonText, key) => {
            buttonText[key] = basketButtonText.value[key] || "Add to basket";
            return buttonText;
          }, {});
        }

        loading.value = false;
      } catch (err) {
        console.error("Error fetching category:", err);
        error.value = "Failed to load category details. Please try again.";
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchCategory();
    });

    // Watch for category slug changes
    watch(categorySlug, () => {
      fetchCategory();
    });

    return {
      loading,
      error,
      category,
      categoryImage,
      categoryId,
      cardHeight,
      heroDescription,
      heroImage,
      heroImages,
      heroInstructions,
      formatDate,
      goBack,
      handleAddTermBundleToBasket,
      basketButtonText,
      orderedTermSections,
      pageTitle,
      showWorkshopHero,
      termGroups,
      singleEvents,
    };
  },
});
</script>

<style scoped>
.c-category-listing {
  min-height: 100vh;
}

.c-category-listing__term-list {
  background-color: var(--white);
}

.c-category-listing__term-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.workshop-details .v-list-item {
  padding: 16px 0;
}

.workshop-details .v-list-item-title {
  margin-bottom: 8px;
}

/* Override Vuetify's default line-clamp to allow multi-line descriptions */
.workshop-details .v-list-item-subtitle {
  white-space: normal;
  line-height: 1.6;
  -webkit-line-clamp: unset !important;
  display: block !important;
}
</style>
