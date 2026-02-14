<template>
  <div class="c-section__background" :style="backgroundStyle">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1>{{ mainTitle }}</h1>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "BackgroundSection",
  props: {
    title: {
      type: String,
      required: true,
    },
    backgroundImage: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const backgroundStyle: any = computed(() => ({
      backgroundImage: `url(${props.backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      height: "400px",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    }));
    const mainTitle = computed(() => props.title);
    return {
      backgroundStyle,
      mainTitle,
    };
  },
});
</script>

<style lang="scss">
.c-section__background {
  h1 {
    color: white;
    margin: 0;
    // font-weight: var(--weight-medium);
    font-size: 4.5rem;
  }

  // @media (max-width: 1200px) {
  //   height: 600px;
  //   h1 {
  //     font-size: 2.5rem;
  //   }
  // }

  // @media (max-width: 992px) {
  //   height: 500px;
  //   h1 {
  //     font-size: rem;
  //   }
  // }

  // @media (max-width: 768px) {
  //   height: 400px;
  //   h1 {
  //     font-size: 1.75rem;
  //   }
  // }

  // @media (max-width: 576px) {
  //   height: 300px;
  //   h1 {
  //     font-size: 1.5rem;
  //   }
  // }
}
</style>
