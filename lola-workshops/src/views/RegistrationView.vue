<template>
  <div class="c-registration">
    <v-container>
      <h1 class="my-10 text-center">Registration</h1>
      <v-card class="my-10 pa-7">
        <div class="mb-4">
          <h2>Attendee Details</h2>
          <div
            v-for="(attendee, index) in attendees"
            :key="index"
            class="attendee-section"
          >
            <div class="form-group">
              <label>Name</label>
              <div class="name-fields">
                <input
                  type="text"
                  placeholder="First Name"
                  v-model="attendee.firstName"
                  @input="validateAttendee(index)"
                  @blur="validateAttendee(index)"
                />
                <input
                  type="text"
                  placeholder="Surname"
                  v-model="attendee.lastName"
                  @input="validateAttendee(index)"
                  @blur="validateAttendee(index)"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Date of Birth</label>
              <div class="dob-fields">
                <input
                  type="number"
                  placeholder="DD"
                  v-model="attendee.dob.day"
                  @input="validateAttendee(index)"
                  @blur="validateAttendee(index)"
                />
                <input
                  type="number"
                  placeholder="MM"
                  v-model="attendee.dob.month"
                  @input="validateAttendee(index)"
                  @blur="validateAttendee(index)"
                />
                <input
                  type="number"
                  placeholder="YYYY"
                  v-model="attendee.dob.year"
                  @input="validateAttendee(index)"
                  @blur="validateAttendee(index)"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Any Allergies?</label>
              <input
                type="text"
                placeholder="Write allergies here"
                v-model="attendee.allergies"
              />
            </div>
            <div class="form-group">
              <label>Attending workshop</label>
              <div class="workshop-fields">
                <v-select
                  :items="outputArray"
                  item-title="workshop_title"
                  return-object
                  label="Select workshop"
                  multiple
                  v-model="attendee.workshop"
                  @update:model-value="() => validateAttendee(index)"
                ></v-select>
              </div>
            </div>
            <v-btn
              v-if="attendees.length > 1"
              class="mb-4 btn"
              @click="removeAttendee(index)"
            >
              <v-icon>mdi-delete</v-icon> Remove Attendee
            </v-btn>
          </div>
          <v-btn
            class="btn"
            @click="addAttendee"
            v-if="basketTotalQuantity > 1"
          >
            <v-icon>mdi-plus</v-icon>Add Attendee
          </v-btn>
          <SiblingDiscountComponent
            v-if="attendees.length > 1 && canApplySiblingDiscount"
            class="mt-4"
          />
        </div>

        <p class="error">{{ errorMessage }}</p>
        <h2>Parent/Carer Details</h2>
        <div class="form-group">
          <label>Name</label>
          <div class="name-fields">
            <input
              type="text"
              placeholder="First Name"
              v-model="parent.firstName"
              @input="validateParent"
            />
            <input
              type="text"
              placeholder="Surname"
              v-model="parent.lastName"
              @input="validateParent"
            />
          </div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Email address"
            v-model="parent.email"
            @input="validateParent"
          />
        </div>
        <div class="form-group">
          <label>Telephone</label>
          <input
            type="tel"
            placeholder="Telephone No"
            v-model="parent.telephone"
            @input="validateParent"
          />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="agreements.healthSafety"
              @click.stop
            />
            <span @click.prevent="toggleAgreement('healthSafety')">
              Health and Safety - The children attend the art classes (although
              overseen by the art teacher) at their own risk. I hereby agree,
              that while the person/s in charge of the art class will oversee my
              child to the best of their ability, neither they nor any person
              connected with Lots of Lovely Art will accept any liability for
              any claims arising from any accident or injury happening to the
              child whilst in the session or which may arise as a result of the
              venue. Lots of Lovely Art undertakes that all reasonable
              precautions will be taken to ensure the safety and welfare of my
              child.
            </span>
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="agreements.privacyPolicy"
              @click.stop
            />
            <span @click.prevent="toggleAgreement('privacyPolicy')">
              Agree to our</span
            >
            <a
              href="https://www.lotsoflovelyart.org/privacy-policy/"
              class="no-decoration font-weight-bold ml-1"
              target="_blank"
              >Privacy Policy</a
            >
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              v-model="agreements.newsletter"
              @click.stop
            />
            <span @click.prevent="toggleAgreement('newsletter')">
              Newsletters and updates
            </span>
          </label>
        </div>
        <v-btn class="mt-4 btn" @click="checkout" :disabled="!isFormValid">
          <v-icon>mdi-basket</v-icon>Checkout
        </v-btn>
      </v-card>
    </v-container>
    <v-dialog v-model="showModal" color="warning" max-width="500">
      <v-card>
        <h2 class="font-weight-bold text-center mt-4">Just a heads up.</h2>
        <div class="pa-4">
          <p class="mb-0">You are about to register.</p>
          <p class="mb-0">There are multiple items in your basket.</p>
          <p class="mb-0">
            Please could you add the names of everyone attending the workshops.
          </p>
        </div>
        <v-card-actions>
          <v-btn
            class="white--text"
            style="background-color: #d8b061"
            @click="showModal = false"
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch } from "vue";
import { logEvent, getAnalytics } from "firebase/analytics";
// import { getFirestore, collection, updateDoc, doc, getDocs } from "@/main"; // Firebase - deprecated
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  fetchEventsWithCapacity,
  fetchOfferingsWithEvents,
  decrementEventCapacity
} from "@/lib/supabase";

import SiblingDiscountComponent from "@/components/SiblingDiscountComponent.vue";
export default defineComponent({
  name: "RegistrationView",

  components: {
    SiblingDiscountComponent,
  },

  setup() {
    const store = useStore();
    const router = useRouter();
    const showModal = ref(false);
    const snackbar = ref(false);
    const snackbarText = ref("");
    // Get the transformed array
    const isValid = ref(false);
    // create a computed property to get basket from store
    const basket = computed(() => store.state.basket);
    // Initialize attendees as an array with one new attendee
    const errors = ref({
      attendees: [],
      parent: {
        firstName: "",
        lastName: "",
        email: "",
        telephone: "",
      },
    });

    const attendeesCount = computed(() => {
      return attendees.value.length;
    });

    const errorMessage = ref("");

    const agreements = ref({
      healthSafety: false,
      privacyPolicy: false,
      newsletter: false,
    });

    const parent = ref({
      firstName: "",
      lastName: "",
      email: "",
      telephone: "",
    });

    // Function to create a new attendee object
    const createNewAttendee = () => ({
      firstName: "",
      lastName: "",
      isValid: false,
      dob: {
        day: "",
        month: "",
        year: "",
      },
      allergies: "",
      workshop: [],
    });

    const attendees = ref([createNewAttendee()]);

    const basketTotalQuantity = computed(() => {
      return store.state.basket_quantity;
    });

    const canApplySiblingDiscount = computed(() => {
      return (
        attendees.value.length > 1 &&
        attendees.value.every((attendee) => attendee.isValid)
      );
    });

    const isFormValid = computed(() => {
      // Check if all attendees are valid
      const allAttendeesValid = attendees.value.every(
        (attendee) => attendee.isValid
      );
      // Check if parent details are valid
      const parentValid = parent.value.isValid;
      // Check if required agreements are checked
      const requiredAgreementsChecked =
        agreements.value.healthSafety && agreements.value.privacyPolicy;

      return allAttendeesValid && parentValid && requiredAgreementsChecked;
    });

    watch(
      [basketTotalQuantity, attendeesCount],
      ([newBasketCount, newAttendeeCount]) => {
        if (newBasketCount > newAttendeeCount) {
          showModal.value = true;
        }
      }
    );

    const checkBasketAndAttendees = () => {
      if (basketTotalQuantity.value > attendeesCount.value) {
        showModal.value = true;
      }
    };

    // Function to transform the array
    const transformArray = (input) => {
      // Initialize an empty array to store the result
      const result = [];

      // Iterate over each element in the input array
      input.forEach((item) => {
        if (Array.isArray(item)) {
          // If the item is an array, add the first object of the array to the result
          if (item.length > 0) {
            result.push({
              theme_id: item[0].theme_id,
              workshop_title: item[0].event_title,
              event_date: item[0].date,
              event_start_time: item[0].start_time,
              event_id: item[0].event_id,
            });
          }
        } else if (typeof item === "object" && item !== null) {
          // If the item is an object, add it directly to the result
          result.push({
            theme_id: item.theme_id,
            workshop_title: item.theme_title,
            event_date: item.date,
            event_start_time: item.start_time,
            event_id: item.event_id,
          });
        }
      });

      const deduplicatedData = Array.from(
        new Map(result.map((item) => [item["theme_id"], item])).values()
      );

      return deduplicatedData;
    };

    const outputArray = transformArray(store.state.basket);

    // TODO: NEED TO ADD CHECKS FOR ATTENDEE ARRAY. MAKE SURE THEY HAVE A WORKSHOP SELECTED.
    // IF NOT THEN YOU CAN NOT PROCEED WITH CHECKOUT.

    // if more than 2 in item quantity then show modal
    // if more than 2 items in basket then show modal

    const addAttendee = () => {
      // Add a new attendee using the createNewAttendee function
      attendees.value.push(createNewAttendee());
      validateAllAttendees();
    };

    const removeAttendee = (index) => {
      // Remove an attendee by its index
      attendees.value.splice(index, 1);
      validateAllAttendees();
    };

    const toggleAgreement = (key) => {
      agreements.value[key] = !agreements.value[key];
    };

    const generateUniqueId = () => {
      return Math.random().toString(36).substr(2, 9);
    };

    const validateAttendee = (index) => {
      const attendee = attendees.value[index];
      const attendeeErrors = {};

      // Check if all required fields are filled
      const hasName =
        attendee.firstName.trim() !== "" && attendee.lastName.trim() !== "";

      if (!hasName) {
        errorMessage.value = "Both first and last name are required";
        return;
      }

      const hasValidDOB =
        attendee.dob.day !== "" &&
        attendee.dob.month !== "" &&
        attendee.dob.year !== "" &&
        Number.isInteger(Number(attendee.dob.day)) &&
        Number.isInteger(Number(attendee.dob.month)) &&
        Number.isInteger(Number(attendee.dob.year)) &&
        Number(attendee.dob.day) > 0 &&
        Number(attendee.dob.day) <= 31 &&
        Number(attendee.dob.month) > 0 &&
        Number(attendee.dob.month) <= 12 &&
        Number(attendee.dob.year) > 1900 &&
        Number(attendee.dob.year) <= new Date().getFullYear();

      if (!hasValidDOB) {
        errorMessage.value = "Please make sure to add a valid date of birth";
        return;
      }

      const hasSelectedWorkshop = attendee.workshop.length > 0;

      if (!hasSelectedWorkshop) {
        errorMessage.value = "Please select a workshop";
        return;
      }

      // Update the errors for this attendee
      errors.value.attendees[index] = attendeeErrors;

      // Update the isValid field for this attendee
      attendee.isValid = hasName && hasValidDOB && hasSelectedWorkshop;
      if (attendee.isValid) {
        errorMessage.value = "";
      }
      // Check all attendees
      validateAllAttendees();
    };

    // Function to validate parent/carer information
    const validateParent = () => {
      // Basic validation checks for parent details
      const hasName =
        parent.value.firstName.trim() !== "" &&
        parent.value.lastName.trim() !== "";
      const hasValidEmail = /^\S+@\S+\.\S+$/.test(parent.value.email); // Simple email regex
      const hasTelephone = parent.value.telephone.trim() !== "";

      parent.value.isValid = hasName && hasValidEmail && hasTelephone;
    };

    const validateAllAttendees = () => {
      isValid.value = attendees.value.every((attendee) => attendee.isValid);
    };

    // Fetch events from Supabase with capacity information
    const fetchEventSpaces = async () => {
      try {
        const events = await fetchEventsWithCapacity();
        // Transform to legacy format for compatibility with existing store
        const legacyEvents = events.map(event => ({
          event_id: event.id,
          event_title: event.offering.title,
          title: event.offering.title,
          description: event.offering.description_long || event.offering.description_short || "",
          date: event.event_date,
          start_time: event.event_start_time,
          end_time: event.event_end_time,
          location: event.location_name,
          address: event.location_address,
          city: event.location_city,
          postcode: event.location_postcode,
          quantity: event.max_capacity - event.current_bookings, // Available spaces
          max_capacity: event.max_capacity,
          current_bookings: event.current_bookings,
          price: event.price_gbp,
          image: event.offering.featured_image_url,
          slug: event.offering.slug,
        }));
        store.commit("SET_EVENTS", legacyEvents);
        return legacyEvents;
      } catch (error) {
        console.error("Error fetching events from Supabase:", error);
        return [];
      }
    };

    // Fetch themes/offerings from Supabase
    const fetchThemesFromSupabase = async () => {
      try {
        const offerings = await fetchOfferingsWithEvents();
        // Transform to legacy format for compatibility with existing store
        const legacyThemes = offerings.map(offering => ({
          theme_id: offering.id,
          id: offering.id,
          title: offering.title,
          description: offering.description_long || offering.description_short || "",
          price: offering.events?.[0]?.price_gbp || 0,
          image: offering.featured_image_url,
          slug: offering.slug,
          events: offering.events || [],
        }));
        store.commit("SET_THEMES", legacyThemes);
        return legacyThemes;
      } catch (error) {
        console.error("Error fetching themes from Supabase:", error);
        return [];
      }
    };

    // Update event capacity in Supabase (replaces updateFirestoreEvent)
    const updateSupabaseEvent = async (event, attendeeCount) => {
      try {
        // Use the RPC function to decrement capacity
        await decrementEventCapacity(event.event_id, attendeeCount);
      } catch (error) {
        console.error("Error updating event capacity in Supabase:", error);
      }
    };

    // Update theme capacity in Supabase (replaces updateFirestoreTheme)
    // Note: In Supabase, themes are offerings, and capacity is tracked per event
    const updateSupabaseTheme = async (theme, attendeeCount) => {
      try {
        // For themes, we need to update capacity for all events in the theme
        if (theme.events && theme.events.length > 0) {
          for (const event of theme.events) {
            await decrementEventCapacity(event.id, attendeeCount);
          }
        }
      } catch (error) {
        console.error("Error updating theme capacity in Supabase:", error);
      }
    };

    const updateEventQuantities = async () => {
      // Note: In Supabase, capacity is managed via the decrement_event_capacity RPC function
      // This function is now simplified - actual capacity updates happen in PaymentView after successful payment

      // We still update the local store for UI purposes
      store.state.events.forEach((event) => {
        event.quantity = Number(event.quantity);
      });

      // Create a map for quick lookup of events by event_id
      const eventsMap = new Map();
      store.state.events.forEach((event) => {
        eventsMap.set(event.event_id, {
          ...event,
          originalQuantity: event.quantity,
        });
      });

      // Update local quantities for UI display (not persisted to database yet)
      basket.value.forEach((item) => {
        const itemsToProcess = Array.isArray(item) ? item : [item];

        itemsToProcess.forEach((basketItem) => {
          const eventId = basketItem.event_id;
          const basketQuantity = basketItem.quantity;

          if (eventsMap.has(eventId)) {
            const event = eventsMap.get(eventId);
            const newQuantity = event.originalQuantity - basketQuantity;
            event.quantity = newQuantity < 0 ? 0 : newQuantity;

            // Note: Actual capacity update happens in PaymentView after successful payment
            // This prevents capacity from being decremented before payment is confirmed
          }
        });
      });
    };

    const checkout = async () => {
      const flattenArray = (arr) =>
        arr.reduce(
          (acc, val) =>
            acc.concat(Array.isArray(val) ? flattenArray(val) : val),
          []
        );
      // Ensure there are no nested arrays in attendees, agreements, and basket
      const safeAttendees = Array.isArray(attendees.value)
        ? flattenArray(attendees.value)
        : attendees.value;
      const safeAgreements = Array.isArray(agreements.value)
        ? flattenArray(agreements.value)
        : agreements.value;
      const safeBasket = Array.isArray(basket.value)
        ? flattenArray(basket.value)
        : basket.value;

      safeBasket.forEach((item) => {
        if (item.date) {
          const dateParts = item.date.split("-"); // Split the date string
          item.eu_date = `${dateParts[1]}-${dateParts[2]}-${dateParts[0]}`; // Format to MM-DD-YYYY
        }
      });
      // Create bookingData object without ID first
      const bookingData = {
        id: generateUniqueId(),
        attendees: safeAttendees, // Use the flattened attendees array
        parent: parent.value,
        agreements: safeAgreements, // Use the flattened agreements array
        timestamp: new Date(),
        price: store.state.total,
        basket: safeBasket, // Use the flattened basket array
      };

      const analytics = getAnalytics();
      logEvent(analytics, "checkout_click", {
        total_price: store.state.total,
        items_in_basket: safeBasket.length,
        added_at: new Date().toISOString(),
        environment: store.state.environment,
      });

      store.commit("SET_BOOKING", bookingData);
      router.push("/checkout");
    };

    onMounted(() => {
      // find the number of items in the basket
      // find the number of attendees
      // if there are more items than attendees show modal

      checkBasketAndAttendees();

      // Use Supabase instead of Firebase
      fetchEventSpaces();
      fetchThemesFromSupabase();
      if (!store.state.total) {
        router.push("/basket");
      }
    });

    return {
      errorMessage,
      showModal,
      snackbar,
      snackbarText,
      isValid,
      isFormValid,
      parent,
      attendees,
      addAttendee,
      removeAttendee,
      checkBasketAndAttendees,
      agreements,
      checkout,
      generateUniqueId,
      toggleAgreement,
      basket,
      outputArray,
      fetchEventSpaces,
      updateSupabaseEvent,
      updateSupabaseTheme,
      updateEventQuantities,
      fetchThemesFromSupabase,
      validateAttendee,
      validateParent,
      canApplySiblingDiscount,
      basketTotalQuantity,
    };
  },
});
</script>

<style>
.name-fields {
  display: flex;
  gap: 10px;
}
.dob-fields {
  display: flex;
  gap: 10px;
}

.v-field__input input {
  border: 1px solid transparent;
}
</style>
