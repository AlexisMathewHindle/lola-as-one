<template>
  <h1>Settings</h1>
  <p>Current Environment: {{ environment }}</p>
  <button @click="toggleEnvironment">Toggle Environment</button>
</template>
<script>
import { ref, defineComponent, onMounted } from "vue";
import { HelperFunctions } from "@/helpers/helpers";
// We need to look at implementing a download button for the admin to download the data
// the data would need to include all the bookings in date they where booked and cost

export default defineComponent({
  setup() {
    const helpers = new HelperFunctions();
    const environment = ref("");

    const isDev = () => process.env.NODE_ENV === "development";

    const toggleEnvironment = () => {
      environment.value =
        environment.value === "development" ? "production" : "development";
      localStorage.setItem("appEnvironment", environment.value);
    };

    onMounted(() => {
      environment.value = helpers.getEnvironment();
    });

    return {
      isDev,
      toggleEnvironment,
      environment,
    };

    // On load get the environment and store it in local storage
    // Where is env necessary
    // Calendar, UploadThemes, UploadEvents, Admin views...
    // What are the admin views?
  },
});
</script>
