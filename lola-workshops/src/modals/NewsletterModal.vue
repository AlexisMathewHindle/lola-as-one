<template>
  <v-dialog v-model="isOpen" max-width="600">
    <v-card>
      <v-container>
        <v-icon large class="close-icon" @click="closeModal">
          mdi-close
        </v-icon>

        <v-row>
          <v-col cols="12">
            <div class="m-newsletter-modal__content">
              <NewsletterSignupComponent source="menu" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, onMounted } from "vue";
import NewsletterSignupComponent from "@/components/NewsletterSignupComponent.vue";
import eventBus from "@/eventBus";

export default {
  components: {
    NewsletterSignupComponent,
  },
  setup() {
    const isOpen = ref(false);

    const closeModal = () => {
      isOpen.value = false;
    };

    const openModal = () => {
      isOpen.value = true;
    };

    onMounted(() => {
      // Listen for the event to open the newsletter modal
      eventBus.on("open-newsletter-modal", openModal);
    });

    return {
      isOpen,
      closeModal,
      openModal,
    };
  },
};
</script>

<style scoped>
.m-newsletter-modal__content {
  padding: 40px 20px;

  @media screen and (max-width: 959px) {
    padding: 20px 10px;
  }
}

.v-card {
  text-align: center;
}

.close-icon {
  position: absolute;
  top: 10px;
  right: 20px;
  cursor: pointer;
  font-size: 40px;
  color: var(--grey);
  z-index: 10;
}
</style>
