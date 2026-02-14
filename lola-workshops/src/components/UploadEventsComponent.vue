<template>
  <div>
    <label for="file" class="font-weight-bold">Upload Events</label>
    <div class="d-flex align-center" v-if="isLoading">
      <p class="mb-0 mr-4">Upload in progress...</p>
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>
    <input
      v-else
      class="mt-4"
      type="file"
      @change="handleFileUpload"
      ref="fileInput"
    />
  </div>
  <v-snackbar
    v-model="snackbarVisible"
    bottom
    :timeout="3000"
    :color="message.type"
  >
    {{ message.message }}
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import * as XLSX from "xlsx";
import { db, doc, setDoc, collection, getDocs } from "../main"; // Ensure the correct import of your Firestore instance
import { useStore } from "vuex";
import { HelperFunctions } from "@/helpers/helpers";

export default defineComponent({
  name: "UploadEventsComponent",

  setup(_, { emit }) {
    const helpers = new HelperFunctions();
    const env = helpers.getEnvironment() === "development" ? "_dev" : "";
    const fileInput = ref<HTMLInputElement | null>(null); // Reference for the file input element
    const isLoading = ref(false);
    const snackbarVisible = ref(false);
    const message = ref({
      type: "",
      message: "",
    });

    const handleFileUpload = (ev: Event) => {
      const inputElement = ev.target as HTMLInputElement;
      const file = inputElement.files![0];
      const reader = new FileReader();
      isLoading.value = true;

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        let allProcessedData: any[] = [];

        // Loop through all sheets in the workbook
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const json: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Extract headers from the first row and filter out empty headers
          const headers = (json[0] as string[]).filter(
            (header) => header !== undefined && header !== null && header !== ""
          );

          const processedData = json
            .slice(1) // Skip the header row
            .map((row: any, rowIndex: number) => {
              if (
                row.every(
                  (cell: any) =>
                    cell === undefined || cell === null || cell === ""
                )
              )
                return; // Ignore entirely empty rows

              // Validate the row
              if (!validateRow(row, headers, sheetName, rowIndex + 2, json[0]))
                return; // Skip this row if validation fails

              // Map each row to an object using the filtered headers
              const rowData = headers.reduce((acc: any, header: string) => {
                const headerIndex = json[0].indexOf(header); // Get the original index of the header
                acc[header] =
                  row[headerIndex] !== undefined ? row[headerIndex] : null;
                return acc;
              }, {});

              rowData.daysOfWeek = convertDaysOfTheWeekToNumber(
                row[6].split(",").map((day: any) => day.trim())
              );

              return rowData;
            })
            .filter((row: any) => row !== undefined);

          allProcessedData = allProcessedData.concat(processedData);
        });

        try {
          await updateFirestore(allProcessedData);
          inputElement.value = "";
          emit("upload-complete", "Events");
        } catch (error) {
          console.error("Error updating Firestore:", error);
          message.value = {
            type: "error",
            message: "Error during upload process. Check logs for details.",
          };
        } finally {
          snackbarVisible.value = true;
        }
      };

      reader.readAsArrayBuffer(file);
    };

    const validateRow = (
      row: any[],
      headers: string[],
      sheetName: string,
      excelRowIndex: number,
      originalHeaders: string[]
    ): boolean => {
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const headerIndex = originalHeaders.indexOf(headers[colIndex]); // Use original headers to find correct index
        const cellValue = row[headerIndex];

        if (cellValue === undefined || cellValue === null || cellValue === "") {
          alert(
            `Error: Missing value in sheet "${sheetName}", row ${excelRowIndex}, column "${headers[colIndex]}".`
          );
          console.error(
            `Missing value in sheet "${sheetName}", row ${excelRowIndex}, column "${headers[colIndex]}".`
          );
          return false; // Validation failed
        } else if (
          typeof cellValue !== "string" &&
          typeof cellValue !== "number"
        ) {
          alert(
            `Error: Invalid data type in sheet "${sheetName}", row ${excelRowIndex}, column "${
              headers[colIndex]
            }". Expected a string or number but got ${typeof cellValue}.`
          );
          console.error(
            `Invalid data type in sheet "${sheetName}", row ${excelRowIndex}, column "${
              headers[colIndex]
            }". Expected a string or number but got ${typeof cellValue}.`
          );
          return false; // Validation failed
        }
      }
      return true; // Validation passed
    };

    const updateFirestore = async (data: any[]) => {
      try {
        // Fetch all existing documents from Firestore
        const existingEntriesSnapshot = await getDocs(
          collection(db, `events${env}`)
        );
        const existingEntries = existingEntriesSnapshot.docs.reduce(
          (acc: any, doc: any) => {
            acc[doc.id] = doc.data();
            return acc;
          },
          {}
        );

        for (const event of data) {
          const eventId = event.event_id.toLowerCase();
          event.event_id = event.event_id.toLowerCase();

          if (!eventId) {
            console.error("Missing ID for event, skipping:", event);
            continue;
          }

          await checkAndUpdateFirestoreEntry(eventId, event, existingEntries);
        }
      } catch (error) {
        console.error("Error updating Firestore:", error);
        message.value = {
          type: "error",
          message: "Error updating Firestore:" + error,
        };
      } finally {
        snackbarVisible.value = true;
      }
    };

    // New function to check and update Firestore entries
    const checkAndUpdateFirestoreEntry = async (
      eventId: string,
      event: any,
      existingEntries: any
    ) => {
      try {
        if (existingEntries[eventId]) {
          // Entry exists, check if it needs updating
          const existingEntry = existingEntries[eventId];

          // Check if the event data has changed
          const needsUpdate = Object.keys(event).some(
            (key) => event[key] !== existingEntry[key]
          );

          if (needsUpdate) {
            const eventRef = doc(db, `events${env}`, eventId);
            await setDoc(eventRef, event);
            message.value = {
              type: "success",
              message: "Events updated successfully",
            };
          } else {
            console.warn(`No update needed for event: ${eventId}`);
            message.value = {
              type: "info",
              message: "No updates needed",
            };
          }
        } else {
          // New entry, add to Firestore
          const eventRef = doc(db, `events${env}`, eventId);
          await setDoc(eventRef, event);
          message.value = {
            type: "success",
            message: "Events uploaded successfully",
          };
        }
      } catch (error) {
        console.error(`Error updating event with ID ${eventId}:`, error);
        message.value = {
          type: "error",
          message: "Error updating events. Check logs for details.",
        };
      } finally {
        snackbarVisible.value = true;
        isLoading.value = false;
      }
    };

    const convertDaysOfTheWeekToNumber = (days: string[]) => {
      const dayMapping: { [key: string]: number } = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      return days.map((day) => {
        const normalizedDay =
          day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
        if (normalizedDay in dayMapping) {
          return dayMapping[normalizedDay];
        } else {
          console.error(`Invalid day: ${day}`);
          return -1;
        }
      });
    };

    return {
      env,
      handleFileUpload,
      snackbarVisible,
      isLoading,
      message,
      fileInput, // Return ref for file input
    };
  },
});
</script>
