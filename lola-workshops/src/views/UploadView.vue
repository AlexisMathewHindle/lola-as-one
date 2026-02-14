<template>
  <v-container>
    <h1>Upload</h1>
    <v-row>
      <v-col cols="12" md="5">
        <UploadEventsComponent class="mr-6" />
      </v-col>
      <v-col cols="12" md="5">
        <UploadThemesComponent />
      </v-col>
      <v-col cols="12" md="5">
        <UploadAdultWorkshopsComponent />
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import { defineComponent } from "vue";
import UploadEventsComponent from "../components/UploadEventsComponent.vue";
import UploadThemesComponent from "../components/UploadThemesComponent.vue";
import UploadAdultWorkshopsComponent from "@/components/UploadAdultWorkshopsComponent.vue";

export default defineComponent({
  name: "UploadView",
  components: {
    UploadEventsComponent,
    UploadThemesComponent,
    UploadAdultWorkshopsComponent,
  },
});
</script>
