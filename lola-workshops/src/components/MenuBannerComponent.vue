<template>
  <div class="c-menu-banner">
    <div class="c-menu-banner__wrapper">
      <p class="mb-0 white--text">Browse workshops</p>
      <v-btn class="ml-4" @click="goToSchedule">Schedule</v-btn>
    </div>
  </div>
</template>
<script>
import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "MenuBannerComponent",

  setup() {
    const router = useRouter();
    const goToSchedule = () => {
      const timeout = 10;
      if (router.currentRoute.value.name !== "home") {
        router.push({ name: "home" });
        setTimeout(() => {
          scrollIntoView();
        }, timeout);
      } else {
        scrollIntoView();
      }
    };

    const scrollIntoView = () => {
      // scroll calendar into view that has id of calendar
      const calendar = document.getElementById("calendar");
      calendar?.scrollIntoView({ behavior: "smooth" });
    };

    return {
      goToSchedule,
      scrollIntoView,
    };
  },
});
</script>
<style lang="scss">
.c-menu-banner {
  width: 100%;
  background-color: var(--yellow);
  padding: 16px 0;
  display: flex;
  justify-content: center;
  font-weight: var(--weight-medium);

  p {
    font-weight: var(--weight-bold);
  }
}
.c-menu-banner__wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* media queries for mobike */
@media (max-width: 768px) {
  .c-menu-banner__wrapper {
    width: 90%;
  }
}
</style>
