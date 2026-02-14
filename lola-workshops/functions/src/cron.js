/* eslint-disable max-len */
/* eslint-disable prettier/prettier */
/* eslint-disable indent */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");

const db = admin.firestore();

/**
 * Formats a date string into a localized string.
 * @param {string} dateString - The date string to format.
 * @return {string} The formatted date string.
 */
function formatAttendeeDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

exports.updateActiveThemes = functions.pubsub
  .schedule("0 */2 * * *") // This runs every 2 hours at the top of the hour
  .timeZone("Europe/London")
  .onRun(async () => {
    console.log("Running updateActiveThemes function");
    await updateThemes();
  });

exports.manualUpdateActiveThemes = functions.https.onRequest(
  async (req, res) => {
    await updateThemes();
    res.send("Manual update completed");
  },
);

/**
 * Parses a date string in the format YYYY-MM-DD and returns a Date object.
 * @param {string} dateString - The date string to parse.
 * @return {Date} The corresponding Date object.
 */
function parseEventDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Updates themes based on their date.
 * @return {Promise<"">} A promise that resolves to null.
 */
async function updateThemes() {
  console.log("Starting updateThemes function");
  const db = admin.firestore();
  const today = new Date();

  const collections = ["themes", "adult_workshop", "themes_dev"];

  try {
    console.log("Firebase config:", JSON.stringify(admin.app().options));

    for (const collectionName of collections) {
      console.log(`Processing collection: ${collectionName}`);

      const collectionSnapshot = await db.collection(collectionName).get();
      console.log(`Found ${collectionSnapshot.size} documents in ${collectionName}`);

      const batch = db.batch();

      collectionSnapshot.forEach((doc) => {
        const themeData = doc.data();
        const eventDate = parseEventDate(themeData.date);
        const eventDateTime = new Date(eventDate);
        const [hours, minutes, seconds] = themeData.start_time.split(":");
        eventDateTime.setHours(hours, minutes, seconds);

        if (eventDateTime < today && !themeData.passed) {
          batch.update(doc.ref, {passed: true});
        }
      });

      await batch.commit();
      console.log(`Updated documents in ${collectionName} successfully`);
    }

    console.log("All collections updated successfully");
    return "All collections updated successfully";
  } catch (error) {
    console.error("Error updating collections:", error);
    return `Error updating collections: ${error.message}`;
  }
}


exports.sendEventReminder = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("Europe/London")
  .onRun(async (context) => {
    await eventReminder();
  });

exports.manualSendEventReminder = functions.https.onRequest(async (req, res) => {
  await eventReminder();
  res.status(200).send("Event Reminder triggered successfully!");
});

/**
 * Updates themes based on their date.
 * @return {Promise<"">} A promise that resolves to null.
 */
async function eventReminder() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "hello@lotsoflovelyart.com",
      pass: "vhmhyxwcddpdbsbj",
    },
});

const today = new Date();
// Format date to YYYY-MM-DD
const todayFormatted = today.toISOString().split("T")[0];


try {
    // Get all bookings from Firestore
    const bookingsSnapshot = await db.collection("bookings").get();

    // Iterate through bookings
    bookingsSnapshot.forEach(async (doc) => {
        const booking = doc.data();
        const parentEmail = booking.parent.email;

        // Check if there are any attendees and workshops that match today's date
        const attendeesWithTodayWorkshops = booking.attendees.filter((attendee) => {
            return attendee.workshop.some((ws) => ws.event_date === todayFormatted);
        });

        // Get details of today's workshops from the attendees
        const todaysWorkshopDetails = attendeesWithTodayWorkshops.flatMap((attendee) =>
            attendee.workshop.filter((ws) => ws.event_date === todayFormatted),
        );

        // Extract the workshop titles for today's workshops
        const workshopTitles = todaysWorkshopDetails.map((workshop) => workshop.workshop_title);

        console.log("Today's workshop titles:", workshopTitles);

        // If attendees with workshops matching today's date are found
        if (attendeesWithTodayWorkshops.length > 0 && parentEmail) {
            console.log("Sending email to:", parentEmail);

            let emailHtml = "<p>Reminder template not found.</p>"; // Default if template not found

            const templatePath = __dirname + "/templates/reminder.html";
            if (fs.existsSync(templatePath)) {
                const templateSource = fs.readFileSync(templatePath, "utf8");
                handlebars.registerHelper("formatDate", (dateString) => {
                  const date = new Date(dateString);
                  return date.toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                });
                const compiledTemplate = handlebars.compile(templateSource); // Compile the template
                emailHtml = compiledTemplate({
                    bookingId: booking.id.toUpperCase(),
                    username: booking.parent.firstName + " " + booking.parent.lastName,
                    attendees: attendeesWithTodayWorkshops,
                    workshopTitles: workshopTitles.join(", "),
                    date: formatAttendeeDate(todayFormatted),
                    address: "50B Northbrook Street, Newbury RG14 1DT",
                    location: "The LOLA Workshop & Cafe",
                    admin_email: "hello@lotsoflovelyart.com",
                });
            }

            // Prepare email details
            const mailOptions = {
                to: parentEmail,
                subject: "Reminder for Today’s Workshop!",
                html: emailHtml,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${parentEmail}`);
        }
    });
} catch (error) {
    console.error("Error sending emails:", error);
}

return null;
}
