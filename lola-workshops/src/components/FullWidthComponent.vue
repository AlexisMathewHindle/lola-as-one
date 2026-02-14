<template>
  <div class="banner" :style="backgroundStyle"></div>
</template>

<script>
export default {
  name: "FullWidthBanner",
  props: {
    imageSrc: {
      type: String,
      required: true,
    },
  },
  computed: {
    backgroundStyle() {
      return {
        backgroundImage: `url(${this.imageSrc})`,
      };
    },
  },
};
</script>

<style scoped>
.banner {
  width: 100%;
  height: 100vh;
  max-height: 564px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
</style>
