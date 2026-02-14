<template>
  <div class="split-container py-10">
    <v-container class="pa-0" :style="max ? 'max-width: 100%' : null">
      <div class="split-container__bg">
        <v-row no-gutters>
          <v-col
            :class="{
              'order-md-2': reverseLayout,
              'order-md-1': !reverseLayout,
            }"
            cols="12"
            md="6"
            class="image-container"
          >
            <img
              :src="imageSrc"
              :style="`min-height: ${minHeight}`"
              alt="Art Club Image"
            />
          </v-col>
          <v-col
            :class="{
              'order-md-1': reverseLayout,
              'order-md-2': !reverseLayout,
              'pr-4': reverseLayout,
              'pl-4': !reverseLayout,
            }"
            cols="12"
            md="6"
            class="text-container"
          >
            <div class="px-sm-4 px-md-0">
              <h2 class="mt-md-0 mt-sm-4 mt-4">{{ title }}</h2>
              <p>{{ description }}</p>
              <p v-for="item in infoList" :key="item">
                {{ item }}
              </p>
              <div class="button-container mt-8">
                <template v-for="(button, index) in buttons" :key="index">
                  <v-btn
                    v-if="button.type !== 'click'"
                    :color="button.color"
                    class="schedule-button white--text"
                  >
                    <router-link
                      class="no-decoration white--text font-weight-bold"
                      :to="button.link"
                      >{{ button.text }}</router-link
                    >
                  </v-btn>
                  <v-btn
                    v-else
                    :color="button.color"
                    class="schedule-button white--text font-weight-bold"
                    @click="scrollTo"
                    >{{ button.text }}
                  </v-btn>
                </template>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SplitComponent",
  props: {
    imageSrc: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    infoList: {
      type: Array as () => string[],
      required: false,
    },
    buttons: {
      type: Array(Object),
      required: false,
    },
    reverseLayout: {
      type: Boolean,
      default: false,
    },
    max: {
      type: Boolean,
      default: false,
    },
    minHeight: {
      type: String,
      default: "570px",
    },
  },
  setup() {
    const scrollTo = () => {
      const calendarElement = document.getElementById("calendar");
      if (calendarElement) {
        window.scrollTo({
          top: calendarElement.offsetTop, // Scroll to the top position of the element
          behavior: "smooth",
        });
      }
    };

    return {
      scrollTo,
    };
  },
});
</script>

<style lang="scss">
.split-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &__bg {
    background-color: var(--white);
    padding: 56px 44px;
  }

  .image-container {
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      height: 100%;
      object-fit: cover;
      min-height: 570px;

      @media screen and (max-width: 960px) {
        max-height: 100%;
        padding-right: 0;
      }
    }
  }

  .text-container {
    display: flex;
    flex-direction: column;
    padding: 20px;
    text-align: left;

    h2 {
      color: #333;
    }

    p {
      margin: 20px 0;
    }

    ul {
      list-style-type: none;
      padding: 0;

      li {
        margin: 5px 0;
      }
    }

    .button-container {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      gap: 10px;
      max-width: 25vw;

      @media screen and (max-width: 960px) {
        max-width: 100%;
      }
    }

    .schedule-button {
      color: var(--white) !important;
    }
  }

  // @media (max-width: 1200px) {
  //   .text-container h2 {
  //     // font-size: 2rem;
  //   }

  //   .text-container p {
  //     // font-size: 1.1rem;
  //   }

  //   .text-container ul li {
  //     // font-size: 0.9rem;
  //   }
  // }

  @media (max-width: 992px) {
    .text-container h2 {
      font-size: 1.75rem;
    }

    .text-container p {
      font-size: 1rem;
    }

    .text-container ul li {
      font-size: 0.85rem;
    }
  }

  @media (max-width: 768px) {
    .text-container h2 {
      font-size: 1.5rem;
    }

    .text-container p {
      font-size: 0.9rem;
    }

    .text-container ul li {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 576px) {
    .text-container h2 {
      font-size: 1.25rem;
    }

    .text-container p {
      font-size: 0.8rem;
    }

    .text-container ul li {
      font-size: 0.75rem;
    }
  }
}
</style>
