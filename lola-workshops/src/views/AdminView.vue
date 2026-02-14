<template>
  <div style="position: relative">
    <AdminMenuComponent />
    <v-card
      class="my-10 pa-7"
      style="width: calc(100% - 120px); margin-left: 90px"
    >
      <router-view />
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";

// Components
import BookingsView from "../views/BookingsView.vue";
import AddEventComponent from "../components/AddEventComponent.vue";
import EventsView from "./EventsView.vue";
import UploadEventsComponent from "../components/UploadEventsComponent.vue";
import UploadThemesComponent from "../components/UploadThemesComponent.vue";
import CouponComponent from "../components/CouponComponent.vue";
import AdminMenuComponent from "../components/AdminMenuComponent.vue";

export default defineComponent({
  name: "AdminView",

  components: {
    AdminMenuComponent,
    // AddEventComponent,
    // EventsView,
    // BookingsListComponent,
    // BookingsView,
    // UploadEventsComponent,
    // UploadThemesComponent,
    // CouponComponent,
  },

  setup() {
    const visibleComponent = ref<string | null>(null);
    const isMobileView = ref<boolean>(false);
    const isDeveloping = ref<boolean>(false);

    const snackbar = ref<boolean>(false);
    const text = ref<string>("");
    const timeout = ref<number>(3000);

    const uploadComplete = (type: string) => {
      snackbar.value = true;
      text.value = `${type} Upload complete`;
    };

    const toggleComponent = (component: string) => {
      visibleComponent.value =
        visibleComponent.value === component ? null : component;
    };

    const toggleDevMode = () => {
      // need to store this in local storage and update the state
      // Store the development mode state in local storage
      localStorage.setItem("isDeveloping", JSON.stringify(isDeveloping.value));
      // Update the state from local storage
      isDeveloping.value = JSON.parse(
        localStorage.getItem("isDeveloping") || "false"
      );
    };

    const checkMobileView = () => {
      isMobileView.value = window.innerWidth <= 768;
    };

    onMounted(() => {
      checkMobileView();
      window.addEventListener("resize", checkMobileView);
      localStorage.setItem("isDeveloping", JSON.stringify(isDeveloping.value));
    });

    return {
      visibleComponent,
      toggleComponent,
      isMobileView,
      snackbar,
      text,
      timeout,
      uploadComplete,
      isDeveloping,
      toggleDevMode,
    };
  },
});
</script>

<style scoped>
/* Basic Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Layout */
#dashboard {
  display: flex;
  flex-direction: row;
  height: 100vh;
}

/* Main Content Styling */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-content.full-width {
  width: 100%;
}

.header {
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* Responsive Styles */
@media (max-width: 768px) {
  /* #dashboard {
    flex-direction: column;
  } */

  /* .sidebar {
    width: 100%;
    display: block;
  } */

  .main-content {
    width: 100%;
  }
}

/* File Input */
input[type="file"] {
  margin-top: 20px;
  display: block;
}
</style>
