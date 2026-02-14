<template>
  <div class="c-booking">
    <v-container>
      <h2 class="mt-10 text-center">Booking Details</h2>
      <h2 class="text-center">Booking Id - #{{ booking?.id }}</h2>
      <h2>Parent/Carer Details</h2>
      <v-card class="my-10 pa-7">
        <p>
          <span class="font-weight-bold">Name:</span>
          {{ booking?.parent.firstName }}
          {{ booking?.parent.lastName }}
        </p>
        <p>
          <span class="font-weight-bold">Email:</span>
          {{ booking?.parent.email }}
        </p>
        <p>
          <span class="font-weight-bold">Telephone:</span>
          {{ booking?.parent.telephone }}
        </p>
        <p class="font-weight-bold pt-2">Agreements</p>
        <ul>
          <li style="list-style: none">
            <span class="font-weight-bold">Health and Safety:</span>
            {{ booking?.agreements.healthSafety ? "Agreed" : "Not Agreed" }}
          </li>
          <li style="list-style: none">
            <span class="font-weight-bold">Privacy Policy:</span>
            {{ booking?.agreements.privacyPolicy ? "Agreed" : "Not Agreed" }}
          </li>
          <li style="list-style: none">
            <span class="font-weight-bold">Newsletter:</span>
            {{ booking?.newsletter ? "Subscribed" : "Not Subscribed" }}
          </li>
        </ul>
      </v-card>
      <h2>Items booked</h2>
      <v-card class="my-10 pa-7">
        <ul>
          <li
            style="list-style: none"
            v-for="(theme, index) in removeDuplicateByThemeId(booking?.basket)"
            :key="index"
          >
            <p class="font-weight-bold">Event title:</p>
            {{ theme.event_title }}
          </li>
        </ul>
      </v-card>
      <h2>Attendees</h2>
      <v-card
        class="my-10 pa-7"
        v-for="(attendee, index) in booking?.attendees"
        :key="index"
      >
        <p>
          <span class="font-weight-bold">Name:</span> {{ attendee.firstName }}
          {{ attendee.lastName }}
        </p>
        <p>
          <span class="font-weight-bold">Date of Birth:</span>
          {{ attendee.dob.day }}/{{ attendee.dob.month }}/{{
            attendee.dob.year
          }}
        </p>
        <p>
          <span class="font-weight-bold">Age:</span>
          {{ calculateAge(attendee.dob) }}
        </p>
        <p>
          <span class="font-weight-bold">Allergies:</span>
          {{ attendee.allergies }}
        </p>
        <div>
          <p class="font-weight-bold">Sign up to:</p>
          <ul>
            <li
              style="list-style: none"
              v-for="(workshop, i) in attendee.workshop"
              :key="i"
            >
              {{ workshop.workshop_title }}
            </li>
          </ul>
        </div>
      </v-card>
      <!-- TODO: CHECK IF WE NEED THIS -->
      <!-- <div class="button__wrapper">
        <v-btn color="green" @click="updateAttendance(true)"
          >Mark as Attended</v-btn
        >
        <v-btn color="red" @click="updateAttendance(false)"
          >Mark as Not Attended</v-btn
        >
      </div> -->
    </v-container>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import {
  getFirestore,
  doc,
  getDocs,
  collection,
  updateDoc,
} from "firebase/firestore";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "BookingDetailsView",

  setup() {
    const booking = ref(null);
    const route = useRoute();

    const calculateAge = (dob) => {
      const dobDate = new Date(dob.year, dob.month - 1, dob.day);
      const ageDiffMs = Date.now() - dobDate.getTime();
      const ageDate = new Date(ageDiffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const removeDuplicateByThemeId = (arr) => {
      return arr?.filter(
        (thing, index, self) =>
          index === self.findIndex((t) => t.event_id === thing.event_id)
      );
    };

    const fetchBookingDetails = async (id) => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const selectedBooking = bookings.find((booking) => booking.id === id);
        booking.value = selectedBooking;

        if (!booking.value) {
          console.warn(`No booking found with id: ${id}`);
        }
      } catch (error) {
        console.error("Error fetching booking details: ", error);
      }
    };

    const updateAttendance = async (attended) => {
      try {
        const db = getFirestore();

        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const bookingToUpdate = bookings.find((booking) => {
          return route.params.id === booking.id;
        });

        bookingToUpdate.attendance = attended;
        booking.value = bookingToUpdate;

        await updateDoc(doc(db, "bookings", booking.value.doc_id), {
          attendance: attended,
        });

        alert("Booking updated!");
      } catch (error) {
        console.error("Error updating attendance: ", error);
      }
    };

    onMounted(() => {
      const bookingId = route.params.id;
      fetchBookingDetails(bookingId);
    });

    return {
      booking,
      updateAttendance,
      calculateAge,
      removeDuplicateByThemeId,
    };
  },
});
</script>
<style scoped>
.button__wrapper {
  margin-top: 20px;
}
.v-btn:first-of-type {
  margin-right: 10px;
}
</style>
