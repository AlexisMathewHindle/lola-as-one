<template>
  <div class="about">
    <FullWidthComponent imageSrc="/img/images/about_page_01.png" />
    <v-container>
      <v-row>
        <v-col cols="12">
          <div class="my-10">
            <p class="text-center">
              The LoLA Creative Space and Cafe in Newbury offers a wide variety
              of art classes to support creativity for the whole family. All
              ages are welcome, from explorative art sessions for Little Ones
              (aged 2-4), after-school classes and home-education options for
              school-aged children, educational workshops for young adults, or
              even sessions for the whole family on the weekend.
            </p>
          </div>
          <v-card class="about__card d-flex my-10 pa-7">
            <v-row class="align-center">
              <!-- Image Column -->
              <v-col cols="12" md="6">
                <img
                  class="about__image"
                  src="/img/images/about_02.png"
                  alt="Art Club Image"
                />
              </v-col>

              <!-- Text Column -->
              <v-col cols="12" md="6">
                <p>
                  The founders of LoLA, Alara and Selina, both feel passionate
                  about the arts and art education. They want to reach as many
                  children as possible in the belief that process-based,
                  artist-inspired experiences are an important way to help
                  children develop problem-solving skills, analytical thinking,
                  self-confidence, and to have fun!
                </p>
                <p>
                  Over the past five years they have built up LoLA (Lots of
                  Lovely Art) into a successful company that creates magical
                  educational art boxes, sketchbooks and art-activity booklets
                  to support children of all ages in being creative at home.
                </p>
                <p>
                  LoLA boxes and sketchbooks are sold in a variety of retail
                  spaces such as Harrods, Molly Meg, Conscious Craft, the
                  Science Museum and online.
                </p>
                <p>
                  Altug Kilicarslan has had 30 years experience in the Food and
                  Beverage business, from managing restaurants, bars and coffee
                  shops, to organising events and concerts. He will bring his
                  magic touch to the LoLA Cafe space where families can enjoy
                  coffee from the fabulous Redemption Coffee, pastries from
                  Hobbs House Bakery and much more!
                </p>
              </v-col>
            </v-row>
          </v-card>
          <p class="text-center">
            Any queries, please email hello@lotsoflovelyart.com
          </p>
        </v-col>
      </v-row>
    </v-container>
    <FullWidthComponent imageSrc="/img/images/about_page_02.png" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FullWidthComponent from "@/components/FullWidthComponent.vue";

export default defineComponent({
  name: "AboutView",

  components: {
    FullWidthComponent,
  },
});
</script>
<style lang="scss">
.about {
  &__image {
    width: 100%;
  }
}
</style>
