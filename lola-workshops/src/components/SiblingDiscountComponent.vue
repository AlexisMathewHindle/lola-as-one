<template>
  <div class="c-sibling">
    <v-btn class="btn" @click="applySiblingDiscount"
      >Apply sibling discount</v-btn
    >

    <!-- Show snackbar when the discount has been successfully applied -->
    <v-snackbar
      v-model="showDiscountAppliedSnackbar"
      :color="snackbarColor"
      top
    >
      <p class="ma-0 white--text">Discount Applied</p>
    </v-snackbar>

    <!-- Show snackbar when the discount was already applied -->
    <v-snackbar
      v-model="showDiscountAlreadyAppliedSnackbar"
      color="warning"
      top
    >
      <p class="ma-0 white--text">Discount already applied</p>
    </v-snackbar>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useStore } from "vuex";

export default defineComponent({
  name: "SiblingDiscountComponent",

  setup() {
    const store = useStore();
    const siblingDiscountAmount = ref(0);
    const siblingDiscountPercentage = ref(10); // 10% discount for siblings
    const discountApplied = ref(false);
    const discountAlreadyApplied = ref(false);

    // New refs to control snackbar visibility
    const showDiscountAppliedSnackbar = ref(false);
    const showDiscountAlreadyAppliedSnackbar = ref(false);

    const snackbarColor = computed(() => {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue("--yellow")
          .trim() || "success"
      );
    });

    const applySiblingDiscount = () => {
      const currentTotal = store.getters.total;

      if (discountApplied.value) {
        // If the discount is already applied, show the warning snackbar
        showDiscountAlreadyAppliedSnackbar.value = true;
        return;
      }

      // Apply the discount
      siblingDiscountAmount.value =
        (currentTotal * siblingDiscountPercentage.value) / 100;
      const newTotal = currentTotal - siblingDiscountAmount.value;
      store.commit("SET_TOTAL", newTotal);

      store.commit("SET_SIBLING_DISCOUNT", {
        amount: siblingDiscountAmount.value,
        percentage: siblingDiscountPercentage.value,
        discountTotal: newTotal,
      });

      // Mark discount as applied to show the success snackbar
      discountApplied.value = true;
      showDiscountAppliedSnackbar.value = true;
    };

    return {
      discountApplied,
      discountAlreadyApplied,
      showDiscountAppliedSnackbar,
      showDiscountAlreadyAppliedSnackbar,
      applySiblingDiscount,
      snackbarColor,
      siblingDiscountPercentage,
      siblingDiscountAmount,
    };
  },
});
</script>
