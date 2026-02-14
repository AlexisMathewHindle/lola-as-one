<template>
  <v-app>
    <!-- Modal Dialog -->
    <v-dialog v-model="showModal" max-width="900" v-if="env !== 'development'">
      <v-card>
        <v-container>
          <v-icon large class="close-icon" @click="closeModal">
            mdi-close
          </v-icon>

          <v-row>
            <v-col cols="12" md="6">
              <img
                src="/img/images/lola_homepage_family_workshops.png"
                class="white--text align-end"
                width="100%"
                style="padding: 20px"
              />
            </v-col>
            <v-col cols="12" md="6">
              <div class="m-holiday-modal__content">
                <h3 class="text-h4 title">
                  Christmas Workshops at the LoLA Creative Space!
                </h3>
                <v-card-text style="margin: 0 auto; width: 336px">
                  <p class="mb-0">
                    From painting wreaths to creating your own advent calendars,
                  </p>
                  <p class="mb-0">
                    from recycled reindeer decorations to painting stockings
                  </p>
                  <p class="mb-0">– there are workshops for all ages!</p>
                </v-card-text>
                <v-card-actions class="d-flex flex-column">
                  <v-btn
                    class="btn white--text m-modal-holiday__btn"
                    @click="register('Saturday Morning')"
                    >Click here for Saturday mornings</v-btn
                  >
                  <v-btn
                    class="btn white--text m-modal-holiday__btn"
                    @click="register('Saturday Afternoon')"
                    >Click here for Saturday afternoons</v-btn
                  >
                  <v-btn
                    class="btn white--text m-modal-holiday__btn"
                    @click="register('Sunday')"
                    >Click here for Sundays</v-btn
                  >
                </v-card-actions>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { HelperFunctions } from "@/helpers/helpers";
import { useRouter } from "vue-router";

export default {
  setup() {
    const showModal = ref(false);
    const router = useRouter();
    const helpers = new HelperFunctions();

    const env = computed(() => helpers.getEnvironment());

    const closeModal = () => {
      showModal.value = false;
    };

    const register = (time) => {
      console.log(`Registered for ${time}`);
      if (time === "Saturday Morning") {
        // Redirect to the Saturday Morning registration page
        router.push("/event-details/aw02_sat_10_30");
      } else if (time === "Saturday Afternoon") {
        // Redirect to the Saturday Afternoon registration page
        router.push("/event-details/aw02_sat_1_30");
      } else if (time === "Sunday") {
        // Redirect to the Sunday registration page
        router.push("/event-details/aw02_fam_sun");
      }
      closeModal();
    };

    onMounted(() => {
      // Show the modal 2 seconds after the app loads
      setTimeout(() => {
        showModal.value = true;
      }, 2000); // Adjust the delay as needed
    });

    return {
      env,
      showModal,
      closeModal,
      register,
    };
  },
};
</script>

<style scoped>
.m-holiday-modal__content {
  padding: 40px 0;

  @media screen and (max-width: 959px) {
    padding: 0;
  }
}

.m-modal-holiday__btn {
  min-width: 300px;
}

img {
  max-width: 100%;

  @media screen and (max-width: 959px) {
    max-width: 80%;
  }
}
/* Adjust styles as needed */
.title {
  font-size: 35px !important;
  /* width: 218px; */
  text-align: center;
  font-weight: 300;
}
.v-card {
  text-align: center;
}

.v-card-actions {
  flex-direction: column;
}

.close-icon {
  position: fixed;
  top: 10px;
  right: 20px;
  cursor: pointer;
  font-size: 40px;
  color: var(--grey);
}
</style>
