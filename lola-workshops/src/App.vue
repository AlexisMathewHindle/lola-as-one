<template>
  <v-app>
    <v-main class="section">
      <MenuBannerComponent />
      <MainMenuComponent />
      <router-view />
      <FooterComponent />
      <CookieBannerComponent />
      <NewsletterModal />
      <v-snackbar
        v-model="updateAvailable"
        :timeout="6000"
        location="top right"
        color="#B26758"
      >
        <div class="d-flex align-center justify-space-between">
          <p class="text-white font-weight-bold mb-0">
            A new version is available.
          </p>
          <v-btn color="white" class="mr-4" @click="refreshApp">Refresh</v-btn>
        </div>
      </v-snackbar>
    </v-main>
    <!-- <HolidayModal /> -->
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useStore } from "vuex";
import { HelperFunctions } from "./helpers/helpers";
import eventBus from "@/eventBus";
import MainMenuComponent from "./components/MainMenuComponent.vue";
import MenuBannerComponent from "./components/MenuBannerComponent.vue";
import FooterComponent from "./components/FooterComponent.vue";
import CookieBannerComponent from "./components/CookieBannerComponent.vue";
import NewsletterModal from "./modals/NewsletterModal.vue";
// import HolidayModal from "./modals/HolidayModal.vue";

export default defineComponent({
  name: "App",

  components: {
    MainMenuComponent,
    MenuBannerComponent,
    FooterComponent,
    CookieBannerComponent,
    NewsletterModal,
    // HolidayModal,
  },

  setup() {
    const helpers = new HelperFunctions();
    const store = useStore();
    const response = ref("");
    const isSending = ref(false);
    const updateAvailable = ref(false);

    const showUpdateSnackbar = () => {
      updateAvailable.value = true;
    };

    const refreshApp = () => {
      window.location.reload();
      updateAvailable.value = false;
    };

    // create a method in a vue3 component that checks if its dev or prod environment
    // the check should be based on what process.env is and url
    // if localhost then dev or dev url then dev else prod
    // should be able to store this in localStorage
    // but also need to create a toggle to be able switch between the two options

    onMounted(() => {
      // Listen for the service worker update event
      eventBus.on("sw-update-available", showUpdateSnackbar);
      helpers.setEnvironment(process.env.NODE_ENV);
    });

    return {
      response,
      isSending,
      updateAvailable,
      showUpdateSnackbar,
      refreshApp,
    };
  },
});
</script>
