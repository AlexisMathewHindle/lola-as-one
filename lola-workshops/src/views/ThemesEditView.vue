<template>
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
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <h2 class="mb-4">Update event</h2>
        </div>
      </v-col>
    </v-row>
    <!-- <v-snackbar
        v-model="snackbarVisible"
        bottom
        :timeout="3000"
        :color="message.type"
      >
        {{ message.message }}
      </v-snackbar> -->
  </v-container>
</template>
<script>
import { defineComponent, onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import {
  db,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  where,
  query,
} from "@/main";
import { HelperFunctions } from "@/helpers/helpers";

export default defineComponent({
  setup() {
    const helpers = new HelperFunctions();
    const store = useStore();
    const router = useRouter();
    const id = router.currentRoute.value.params.id;

    const cardHeight = "calc(100vh - 64px)";
    const snackbarVisible = ref(false);
    const message = ref({ message: "", type: "" });

    const env = computed(() => {
      return helpers.getEnvironment();
    });

    const fetchTheme = () => {
      console.log("fetching theme", id.value);
    };

    onMounted(async () => {
      const docRef = doc(db, `themes_${env.value}`, id);
      const docSnap = await getDoc(docRef);
    });

    return {
      store,
      env,
      event,
      cardHeight,
      snackbarVisible,
      message,
    };
  },
});
</script>
