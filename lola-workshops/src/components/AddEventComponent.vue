<template>
  <v-container>
    <v-form @submit.prevent="addEvent">
      <v-text-field v-model="title" label="Title" required></v-text-field>

      <v-menu
        ref="menuStartRef"
        v-model="menuStart"
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="startFormatted"
            label="Start"
            prepend-icon="mdi-calendar"
            readonly
            v-bind="attrs"
            v-on="on"
            @click="menuStart = true"
          ></v-text-field>
        </template>
        <v-date-picker v-model="start" @input="updateStartDate"></v-date-picker>
      </v-menu>

      <v-menu
        ref="menuEndRef"
        v-model="menuEnd"
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            v-model="endFormatted"
            label="End"
            prepend-icon="mdi-calendar"
            readonly
            v-bind="attrs"
            v-on="on"
            @click="menuEnd = true"
          ></v-text-field>
        </template>
        <v-date-picker v-model="end" @input="updateEndDate"></v-date-picker>
      </v-menu>

      <v-btn type="submit">Add event</v-btn>
    </v-form>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { db, collection, addDoc } from "@/main";

export default defineComponent({
  name: "AddEventComponent",

  setup() {
    const title = ref("");
    const start = ref<Date | null>(null);
    const end = ref<Date | null>(null);
    const menuStart = ref(false);
    const menuEnd = ref(false);

    const startFormatted = ref("");
    const endFormatted = ref("");

    const updateStartDate = (date: Date) => {
      start.value = date;
      startFormatted.value = date.toLocaleDateString();
      menuStart.value = false;
    };

    const updateEndDate = (date: Date) => {
      end.value = date;
      endFormatted.value = date.toLocaleDateString();
      menuEnd.value = false;
    };

    watch(start, (newVal) => {
      if (newVal) startFormatted.value = newVal.toLocaleDateString();
    });

    watch(end, (newVal) => {
      if (newVal) endFormatted.value = newVal.toLocaleDateString();
    });

    const addEvent = async () => {
      try {
        const docRef = await addDoc(collection(db, "events"), {
          title: title.value,
          start: start.value,
          end: end.value,
          createdAt: new Date(),
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    };

    return {
      title,
      start,
      end,
      startFormatted,
      endFormatted,
      menuStart,
      menuEnd,
      updateStartDate,
      updateEndDate,
      addEvent,
    };
  },
});
</script>
