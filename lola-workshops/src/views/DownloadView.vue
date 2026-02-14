<template>
  <div>
    <div class="d-flex ga-4 mb-6">
      <v-btn class="btn" @click="downloadEvents">Download Events</v-btn>
      <v-btn class="btn" @click="downloadThemes">Download Themes</v-btn>
    </div>

    <h3 class="mb-2">Download booking by duration range</h3>
    <h3 v-if="bookings.length">
      Bookings from {{ startDate }} to {{ endDate }}:
    </h3>
    <form @submit.prevent="fetchBookings">
      <label>
        Start Date:
        <input type="date" v-model="startDate" required />
      </label>
      <label>
        End Date:
        <input type="date" v-model="endDate" required />
      </label>
      <div class="d-flex align-center mt-4">
        <v-btn class="mr-4" type="submit">Search</v-btn>
        <v-btn @click="downloadReport" v-if="bookings.length"
          >Download Event Summary</v-btn
        >
      </div>
    </form>
    <div class="mt-8">
      <div v-if="!bookings.length">No bookings found in this date range.</div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { getFirestore, collection, getDocs, query, where } from "@/main";
import { Timestamp } from "firebase/firestore";
import * as XLSX from "xlsx";
import { HelperFunctions } from "@/helpers/helpers";

export default {
  setup() {
    const helpers = new HelperFunctions();
    const startDate = ref("");
    const endDate = ref("");
    const bookings = ref([]);
    const eventSummaryData = ref({});

    const localEnv = helpers.getEnvironment() === "development" ? "_dev" : "";

    const eventSummary = (events) => {
      const summary = {};
      events.forEach((event) => {
        event.basket.forEach((item) => {
          const eventTitle = item.event_title;
          const price = parseFloat(item.price) || 0;

          if (!summary[eventTitle]) {
            summary[eventTitle] = { count: 0, total: 0 };
          }

          summary[eventTitle].count += 1;
          summary[eventTitle].total += price;
        });
      });
      eventSummaryData.value = summary;
    };

    const downloadThemes = async () => {
      const db = getFirestore();
      const bookingsRef = collection(db, `themes${localEnv}`);
      console.log(localEnv);

      try {
        // Step 1: Fetch data from Firestore
        const querySnapshot = await getDocs(bookingsRef);

        // Transform Firestore data into a structured array
        const spreadsheetData = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const {
            theme_id,
            term,
            event_id,
            theme_title,
            start_time,
            end_time,
            date,
            event_title,
            stock,
          } = data;

          // Create row entry and convert stock to a string
          const row = [
            theme_id || "",
            term || "",
            event_id || "",
            theme_title || "",
            start_time || "",
            end_time || "",
            date || "",
            event_title || "",
            stock !== undefined ? String(stock) : "", // Convert stock to string
          ];

          // Group rows by 'event_title' to create separate sheets
          let sheetName = event_title || "Sheet";

          // Truncate sheet name if it exceeds 31 characters
          if (sheetName.length > 31) {
            sheetName = sheetName.slice(0, 30);
          }

          if (!spreadsheetData[sheetName]) {
            spreadsheetData[sheetName] = [];
          }
          spreadsheetData[sheetName].push(row);
        });

        // Step 2: Generate Excel Workbook
        const workbook = XLSX.utils.book_new();

        // Headers for the spreadsheet
        const headers = [
          "theme_id",
          "term",
          "event_id",
          "theme_title",
          "start_time",
          "end_time",
          "date",
          "event_title",
          "stock",
        ];

        for (const [sheetName, rows] of Object.entries(spreadsheetData)) {
          // Sort rows by the 'date' column (index 6)
          const sortedRows = rows.sort((a, b) => {
            const dateA = new Date(a[6]); // Index 6 is the 'date' column
            const dateB = new Date(b[6]);
            return dateA - dateB; // Ascending order
          });

          // Add headers to the sorted rows
          const sheetData = [headers, ...sortedRows];

          // Create worksheet
          const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

          // Append sheet to the workbook
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        // Step 3: Save the Excel file
        XLSX.writeFile(workbook, "themes_schedule.xlsx");

        console.log("Spreadsheet created successfully.");
      } catch (error) {
        console.error("Error generating spreadsheet:", error);
      }
    };

    const downloadEvents = async () => {
      const db = getFirestore();
      const eventsRef = collection(db, "events");

      try {
        // Step 1: Fetch data from the Firestore 'events' collection
        const querySnapshot = await getDocs(eventsRef);

        // Step 2: Define headers
        const headers = [
          "event_id",
          "event_title",
          "start_date",
          "end_date",
          "start_time",
          "end_time",
          "day_of_the_week",
          "description",
          "price",
          "details",
          "instructions",
          "term",
          "category",
          "quantity",
        ];

        // Step 3: Prepare spreadsheet rows
        const spreadsheetData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const row = [
            data.event_id || "",
            data.event_title || "",
            data.start_date || "",
            data.end_date || "",
            data.start_time || "",
            data.end_time || "",
            data.day_of_the_week || "",
            data.description || "",
            data.price || "",
            data.details || "",
            data.instructions || "",
            data.term || "",
            data.category || "",
            data.quantity || "",
          ];
          spreadsheetData.push(row);
        });

        // Step 4: Create a workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheetData = [headers, ...spreadsheetData];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Step 5: Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Events");

        // Step 6: Write the Excel file
        XLSX.writeFile(workbook, "events.xlsx");

        console.log("Events spreadsheet generated successfully.");
      } catch (error) {
        console.error("Error generating events spreadsheet:", error);
      }
    };

    const downloadReport = () => {
      if (!Object.keys(eventSummaryData.value).length) {
        alert("No data available for download.");
        return;
      }

      const worksheetData = [["Workshops booked", "Events booked", "Total"]];
      for (const [eventTitle, data] of Object.entries(eventSummaryData.value)) {
        worksheetData.push([eventTitle, data.count, data.total]);
      }

      const priceData = [
        ["Prices", ""],
        ["Termly", 12],
        ["Sat Morn", 15],
        ["Sat Afternoon", 15],
        ["Sunday", 20],
        ["Halfterm", 14],
        ["Open Studio", 10],
      ];

      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.aoa_to_sheet(worksheetData);

      XLSX.utils.sheet_add_aoa(summarySheet, priceData, { origin: "J2" });
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Event Summary");

      XLSX.writeFile(workbook, "EventSummary.xlsx");
    };

    const fetchBookings = async () => {
      if (!startDate.value || !endDate.value) {
        alert("Please select both start and end dates.");
        return;
      }

      try {
        const db = getFirestore();
        const bookingsRef = collection(db, "bookings");
        // const start = new Date(startDate.value).toISOString();
        // const end = new Date(
        //   new Date(endDate.value).setHours(23, 59, 59)
        // ).toISOString();
        const start = Timestamp.fromDate(new Date(startDate.value));
        const end = Timestamp.fromDate(
          new Date(new Date(endDate.value).setHours(23, 59, 59))
        );

        const bookingsQuery = query(
          bookingsRef,
          where("timestamp", ">=", start),
          where("timestamp", "<=", end)
        );

        const querySnapshot = await getDocs(bookingsQuery);
        const results = [];

        querySnapshot.forEach((doc) => results.push(doc.data()));

        bookings.value = results;
        eventSummary(results);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    return {
      startDate,
      endDate,
      bookings,
      fetchBookings,
      downloadReport,
      downloadThemes,
      downloadEvents,
    };
  },
};
</script>
