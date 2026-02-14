<template>
  <div class="c-booking-item">
    <div v-for="(attendees, date) in groupedAttendees" :key="date">
      <div v-for="(attendee, i) in attendees" :key="i">
        <p class="mb-0 font-weight-bold">
          {{ index }} - {{ attendee.theme_title }}
        </p>
        <p class="mb-0">
          {{ formatDate(date) }} -
          {{ attendee.start_time }}
        </p>
        <p>{{ attendee.name }}</p>
      </div>
    </div>
  </div>
</template>
<script>
import { onMounted, ref } from "vue";
export default {
  name: "BookingItemComponent",
  props: {
    // props
    bookingData: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const groupedAttendees = ref(null);
    // const data = toRefs(props);

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    function groupAttendeesByEventDate() {
      const grouped = {};

      // Step 1: Iterate over the attendees
      props.bookingData.attendees.forEach((attendee) => {
        const fullName = `${attendee.firstName} ${attendee.lastName}`;
        attendee.workshop.forEach((workshop) => {
          const eventDate = workshop.event_date;
          const themeTitle = workshop.workshop_title;
          const startTime = workshop.event_start_time;

          // Step 2: Group by event_date
          if (!grouped[eventDate]) {
            grouped[eventDate] = [];
          }

          // Add the attendee and their theme title to the correct date group
          grouped[eventDate].push({
            name: fullName,
            theme_title: themeTitle,
            start_time: startTime,
          });
        });
      });

      // Step 3: Set the grouped attendees
      groupedAttendees.value = grouped;
    }

    onMounted(() => {
      groupAttendeesByEventDate();
    });

    return {
      //   data,
      booking: props.bookingData,
      groupedAttendees,
      groupAttendeesByEventDate,
      formatDate,
    };
  },
};
</script>
