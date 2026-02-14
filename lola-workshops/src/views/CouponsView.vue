<template>
  <CouponComponent />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import CouponComponent from "@/components/CouponComponent.vue";

export default defineComponent({
  name: "CouponsView",

  components: {
    CouponComponent,
  },
});
</script>
<style scoped></style>
