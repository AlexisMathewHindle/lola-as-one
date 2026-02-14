<template>
  <div>
    <label class="font-weight-bold" for="file">Upload Theme</label>
    <div class="d-flex align-center" v-if="isLoading">
      <p class="mb-0 mr-4">Upload in progress...</p>
      <v-progress-circular color="primary" indeterminate></v-progress-circular>
    </div>
    <input
      v-else
      class="mt-4"
      type="file"
      @change="handleThemeUpload"
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
import { defineComponent, onMounted, ref } from "vue";
import * as XLSX from "xlsx";
import { db, doc, setDoc, getDocs, collection } from "../main"; // Ensure correct Firestore instance import
import { HelperFunctions } from "@/helpers/helpers";
export default defineComponent({
  name: "UploadThemesComponent",
  setup(_, { emit }) {
    const helpers = new HelperFunctions();
    const env = helpers.getEnvironment() === "development" ? "_dev" : "";
    const snackbarVisible = ref(false);
    const message = ref({
      type: "",
      message: "",
    });
    const isLoading = ref(false);

    // Handle file upload
    const handleThemeUpload = (ev: Event) => {
      isLoading.value = true;
      const fileInput = ev.target as HTMLInputElement;
      const file = fileInput.files![0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        let allProcessedData: any[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const json: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const headers = (json[0] as string[]).filter(
            (header) => header !== undefined && header !== null && header !== ""
          );

          const processedData = json
            .slice(1)
            .map((row: any, rowIndex: number) => {
              if (
                row.every(
                  (cell: any) =>
                    cell === undefined || cell === null || cell === ""
                )
              )
                return;

              if (!validateRow(row, headers, sheetName, rowIndex + 2, json[0]))
                return;

              const rowData = headers.reduce((acc: any, header: string) => {
                const headerIndex = json[0].indexOf(header);
                acc[header] =
                  row[headerIndex] !== undefined ? row[headerIndex] : null;
                return acc;
              }, {});

              return rowData;
            })
            .filter((row: any) => row !== undefined);

          allProcessedData = allProcessedData.concat(processedData);
        });

        try {
          await updateFirestore(allProcessedData);
          fileInput.value = "";
          emit("upload-complete", "Themes");
          // message.value = {
          //   type: "success",
          //   message: "Themes uploaded successfully",
          // };
        } catch (error) {
          message.value = {
            type: "error",
            message: "Error during upload process. Check logs for details.",
          };

          console.error("Upload Error:", error);
        } finally {
          snackbarVisible.value = true;
        }
      };

      reader.readAsArrayBuffer(file);
    };

    // Validation function
    const validateRow = (
      row: any[],
      headers: string[],
      sheetName: string,
      excelRowIndex: number,
      originalHeaders: string[]
    ): boolean => {
      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const headerIndex = originalHeaders.indexOf(headers[colIndex]);
        const cellValue = row[headerIndex];

        if (cellValue === undefined || cellValue === null || cellValue === "") {
          alert(
            `Error: Missing value in sheet "${sheetName}", row ${excelRowIndex}, column "${headers[colIndex]}".`
          );
          console.error(
            `Missing value in sheet "${sheetName}", row ${excelRowIndex}, column "${headers[colIndex]}".`
          );
          return false;
        } else if (typeof cellValue !== "string") {
          alert(
            `Error: Invalid data type in sheet "${sheetName}", row ${excelRowIndex}, column "${
              headers[colIndex]
            }". Expected a string but got ${typeof cellValue}.`
          );
          console.error(
            `Invalid data type in sheet "${sheetName}", row ${excelRowIndex}, column "${
              headers[colIndex]
            }". Expected a string but got ${typeof cellValue}.`
          );
          return false;
        }
      }
      return true;
    };

    // Update Firestore function
    const updateFirestore = async (data: any[]) => {
      try {
        // Retrieve all existing entries from Firestore
        const existingEntriesSnapshot = await getDocs(
          collection(db, `themes${env}`)
        );
        const existingEntries = existingEntriesSnapshot.docs.reduce(
          (acc: any, doc: any) => {
            acc[doc.data().event_id] = { ...doc.data(), id: doc.id }; // Use event_id to map existing documents
            return acc;
          },
          {}
        );

        for (const event of data) {
          // Check if the event exists by its event_id in existing entries
          const eventExists = existingEntries[event.event_id.toLowerCase()];

          // Update existing entry or create a new one
          if (eventExists) {
            await updateExistingEntry(eventExists.id, event);
          } else {
            await createNewEntry(event);
          }
        }
        isLoading.value = false;
        message.value = {
          type: "success",
          message: "Themes uploaded successfully",
        };
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

    // Function to update existing entry in Firestore
    const updateExistingEntry = async (docId: string, event: any) => {
      try {
        const eventRef = doc(db, `themes${env}`, docId);
        await setDoc(eventRef, event, { merge: true }); // Merge updates to avoid overwriting non-updated fields
        message.value = {
          type: "success",
          message: "Themes updating...",
        };
      } catch (error) {
        console.error(`Error updating event with ID ${docId}:`, error);
        message.value = {
          type: "error",
          message: "Error updating themes. Check logs for details.",
        };
      } finally {
        snackbarVisible.value = true;
      }
    };

    // Function to create a new entry in Firestore
    const createNewEntry = async (event: any) => {
      try {
        const eventRef = doc(collection(db, `themes${env}`));
        event.event_id = event.event_id.toLowerCase();
        event.stock = Number(event.stock);
        const eventData = {
          ...event,
          id: eventRef.id,
        };
        await setDoc(eventRef, eventData);
        message.value = {
          type: "success",
          message: "New theme added successfully",
        };
      } catch (error) {
        console.error("Error adding new event:", error);
        message.value = {
          type: "error",
          message: "Error adding new theme. Check logs for details.",
        };
      } finally {
        snackbarVisible.value = true;
      }
    };

    onMounted(async () => {
      const existingEntriesSnapshot = await getDocs(
        collection(db, `themes${env}`)
      );
      const numberOfItems = existingEntriesSnapshot.size;
      console.log("Number of themes:", numberOfItems);
    });

    return {
      env,
      handleThemeUpload,
      snackbarVisible,
      isLoading,
      message,
      updateFirestore,
    };
  },
});
</script>
