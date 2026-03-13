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
            <h1 class="text-center">{{ category?.name || 'Workshops' }}</h1>
          </v-col>
        </v-row>

        <v-row v-if="category">
          <v-col cols="12" md="6">
            <v-img
              v-if="categoryImage"
              :src="categoryImage"
              alt="Category image"
              height="300px"
              contain
            ></v-img>
            <div
              v-else
              class="d-flex align-center justify-center"
            >
              <v-icon size="100" :color="category.color_hex || '#D8B061'">
                {{ category.icon || 'mdi-palette' }}
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
      </v-card>

      <!-- Events List -->
      <SingleListComponentSupabase
        :category="'single'"
        :category-id="categoryId"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import SingleListComponentSupabase from "@/components/SingleListComponentSupabase.vue";
import { supabase } from "@/lib/supabase";

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

export default defineComponent({
  name: "CategoryListingView",
  components: {
    SingleListComponentSupabase,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const loading = ref(true);
    const error = ref<string | null>(null);
    const category = ref<Category | null>(null);
    const categoryImage = ref<string | null>(null);

    // Use computed to make it reactive to route changes
    const categorySlug = computed(() => route.params.categorySlug as string);
    const categoryId = computed(() => category.value?.id || '');

    const cardHeight = computed(() => `${window.innerHeight - 223}px`);

    const goBack = () => {
      router.push('/');
    };

    // Fetch category details
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
      goBack,
    };
  },
});
</script>

<style scoped>
.c-category-listing {
  min-height: 100vh;
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

