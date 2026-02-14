<template>
  <div class="c-party">
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
      <v-card class="px-10">
        <v-row class="mt-4">
          <v-col cols="12">
            <h1 class="text-center">A LoLA Art Party</h1>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-img
              src="/img/private_parties/main.jpg"
              alt="Lola Private Parties"
              height="300px"
              contain
            ></v-img>
          </v-col>
          <v-col cols="12" md="6">
            <div class="workshop-details pa-4">
              <v-divider></v-divider>
              <v-list>
                <v-list-item>
                  <v-list-item-content>
                    <p>
                      Come and enjoy a birthday art workshop at the LoLA
                      Creative Space! LoLA offers birthday pARTies for children
                      ages 5 and over, where they can enjoy getting creative
                      together with their friends to celebrate their big day!
                    </p>
                    <p>
                      The workshop table can host a min. of 6 and a max. of 10
                      children (including the birthday boy/girl).
                    </p>
                    <p>
                      The art workshop lasts for 1 hr 15 mins and the children
                      will all be able to take their artwork home with them (no
                      need for a party bag?!). We supply all the art materials
                      and aprons. If you would like to bring your own birthday
                      cake, there are 15 mins at the end of the party for us to
                      clear the art tables and sing happy birthday (no snacks
                      other than birthday cake to be brought into the cafe area
                      please).
                    </p>
                  </v-list-item-content>
                </v-list-item>
                <!-- <v-list-item>
                  <v-list-item-title
                    ><strong>Party themes are:</strong></v-list-item-title
                  >
                  <v-list-item-content>
                    <p class="mb-0">Themed Canvas Painting.</p>
                    <p class="mb-0">Themed T-shirt Printing.</p>
                    <p class="mb-0">
                      Available weekly workshops from the ongoing schedule.
                    </p>
                  </v-list-item-content>
                </v-list-item> -->
                <v-list-item>
                  <v-list-item-title
                    ><strong> Cost:</strong>
                  </v-list-item-title>
                  <v-list-item-content>
                    <p>
                      £240 (this cost does not change depending on the number of
                      workshop participants).
                    </p>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    ><strong>Available times:</strong>
                  </v-list-item-title>
                  <v-list-item-content>
                    <p class="mb-0">
                      4:00-5:30pm after school on a Friday afternoon
                    </p>
                    <p class="mb-0">10.45am - 12:15pm on Sunday morning</p>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title
                    >Please email us to check availability and to discuss themes
                    - hello@lotsoflovelyart.com
                  </v-list-item-title>
                </v-list-item>
              </v-list>

              <v-divider></v-divider>
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <ImageSlider v-if="images.length" class="pb-8" :images="images" />
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </div>
</template>
<script>
import { defineComponent, onMounted, ref, computed } from "vue";
import ImageSlider from "@/components/ImageSlider.vue";
import { useStore } from "vuex";

export default defineComponent({
  name: "PrivatePartyView",

  components: {
    ImageSlider,
  },

  setup() {
    const store = useStore();
    const headerHeight = 223;
    const cardHeight = computed(() => `${window.innerHeight - headerHeight}px`);
    const images = ref([
      "/img/private_parties/slider-01.jpg",
      "/img/private_parties/slider-02.jpg",
      "/img/private_parties/slider-03.jpg",
      "/img/private_parties/slider-04.jpg",
      "/img/private_parties/slider-05.jpg",
    ]);

    const fetchThemes = async () => {
      try {
        store.dispatch("setLoading", true);
        setTimeout(() => {
          store.dispatch("setLoading", false);
        }, 2000);
      } catch (error) {
        store.dispatch("setLoading", false);
        console.error(error);
      }
    };

    onMounted(() => {
      fetchThemes();
    });

    return {
      fetchThemes,
      images,
      cardHeight,
      store,
    };
  },
});
</script>
<style lang="scss" scoped>
.c-party {
  .c-single-list__wrapper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 0 40px 0;
    flex-wrap: wrap;

    @media screen and (max-width: 1279px) {
      padding: 20px 0 20px 0;
    }
  }

  .c-single-list__item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    // height: 200px;
    padding: 20px 0 20px 0;

    @media screen and (max-width: 442px) {
      height: unset;
    }

    p {
      max-width: 560px;
    }
  }

  .c-single-list__inner {
    @media screen and (max-width: 867px) {
      flex-direction: column;
    }
  }

  .c-single-list__button-wrapper {
    width: unset;
  }

  .c-single-list__details {
    display: flex;
    flex-direction: column;

    @media screen and (max-width: 442px) {
      flex-direction: column;
    }
  }
}
</style>
