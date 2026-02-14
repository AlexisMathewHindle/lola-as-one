<template>
  <div>
    <h1>Coupon Management</h1>
    <form @submit.prevent="addCoupon" class="mb-4">
      <div class="form-group">
        <label for="code">Coupon Code</label>
        <input v-model="newCoupon.code" type="text" placeholder="Code" />
      </div>
      <div class="form-group">
        <label for="discountType">Discount Type</label>
        <input
          v-model="newCoupon.discountType"
          type="text"
          placeholder="Perecentage or Fixed"
        />
      </div>
      <div class="form-group">
        <label for="discountValue">Discount Value</label>
        <input
          v-model="newCoupon.discountValue"
          type="number"
          placeholder="Discount Value"
        />
      </div>
      <div class="form-group">
        <label for="expiration">Expiration Date</label>
        <input v-model="newCoupon.expiration" type="date" />
      </div>
      <div class="form-group d-flex align-center">
        <label for="isActive" class="ma-0 pr-2">Is Active</label>
        <input v-model="newCoupon.isActive" type="checkbox" />
      </div>
      <v-btn type="submit">Add Coupon</v-btn>
    </form>

    <!-- <ul> -->

    <v-card class="pa-4 mb-4" v-for="coupon in coupons" :key="coupon.id">
      <div class="d-flex justify-space-between">
        <div>
          <h3>{{ coupon.code }}</h3>
          <p>
            Discount value:
            {{ coupon.discountType === "fixed" ? "£" : "" }}
            {{ coupon.discountValue }}
            {{ coupon.discountType !== "fixed" ? "%" : "" }}
          </p>
          <p>{{ coupon.discountType }}</p>
        </div>
        <div>
          <v-btn @click="editCoupon(coupon.id)">Edit</v-btn>
          <v-btn class="ml-2" @click="deleteCoupon(coupon.id)">Delete</v-btn>
        </div>
      </div>
      <!-- {{ coupon.code }} - {{ coupon.discountValue }} {{ coupon.discountType }} -->
    </v-card>
    <!-- </ul> -->
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import {
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  getFirestore,
  collection,
  addDoc,
} from "@/main"; // Ensure the correct import of your Firestore instance

export default {
  setup() {
    const db = getFirestore();
    const coupons = ref([]);
    const newCoupon = ref({
      code: "",
      discountType: "",
      discountValue: 0,
      expiration: "",
      isActive: true,
    });

    // Fetch all existing coupons
    const fetchCoupons = async () => {
      const querySnapshot = await getDocs(collection(db, "coupons"));
      coupons.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    };

    // Add a new coupon
    const addCoupon = async () => {
      await addDoc(collection(db, "coupons"), newCoupon.value);
      fetchCoupons(); // Refresh the list after adding
    };

    // Edit an existing coupon
    const editCoupon = async (id) => {
      const couponDoc = doc(db, "coupons", id);
      await updateDoc(couponDoc, newCoupon.value);
      fetchCoupons(); // Refresh the list after editing
    };

    // Delete a coupon
    const deleteCoupon = async (id) => {
      const couponDoc = doc(db, "coupons", id);
      await deleteDoc(couponDoc);
      fetchCoupons(); // Refresh the list after deleting
    };

    onMounted(() => {
      fetchCoupons(); // Load coupons when component is mounted
    });

    return { coupons, newCoupon, addCoupon, editCoupon, deleteCoupon };
  },
};
</script>
