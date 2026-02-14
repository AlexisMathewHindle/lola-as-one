/* eslint-disable max-len */
/* eslint-disable prettier/prettier */
/* eslint-disable object-curly-spacing */
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");

const readHTMLFile = (path, callback) => {
  fs.readFile(path, { encoding: "utf-8" }, (err, html) => {
    if (err) {
      callback(err);
      throw err;
    } else {
      callback(null, html);
    }
  });
};

// TODO: NEED TO GET LOLA DETAILS HERE
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "hello@lotsoflovelyart.com",
    pass: "vhmhyxwcddpdbsbj",
  },
});

const flattenArray = (arr) =>
  arr.reduce(
      (acc, val) =>
        acc.concat(Array.isArray(val) ? flattenArray(val) : val),
      [],
  );


const sortedArray = (arr) => arr.sort((a, b) => {
  if (a.event_id < b.event_id) {
    return -1;
  }
  if (a.event_id > b.event_id) {
    return 1;
  }
  return 0;
});


const formatDate = (timeInput) => {
  let formattedTimeString;

  if (timeInput && typeof timeInput === "object" && timeInput._seconds) {
    // Handle Firestore Timestamp object
    const date = new Date(timeInput._seconds * 1000);
    formattedTimeString = formatAttendeeDate(date);
  } else if (typeof timeInput === "string") {
    // Handle string input
    formattedTimeString = timeInput.replace(" at ", ", ");
  } else {
    // Handle other cases or invalid input
    formattedTimeString = formatAttendeeDate(new Date());
  }

  const date = formattedTimeString.split("U")[0].trim();
  console.log(date);
  return date;
};

const formatAttendeeDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
    // hour12: false,
  });
};

const formatAttendeeWorkshopEventDate = (attendee) => {
  const { workshop } = attendee;

  const formattedWorkshops = workshop.map((workshopItem) => {
    const date = formatAttendeeDate(workshopItem.event_date) + " at " + workshopItem.event_start_time;
    return { ...workshopItem, date };
  });

  return { ...attendee, workshop: formattedWorkshops };
};

// Update the attendeesWithAge function to use the new formatAttendeeWorkshopEventDate
const attendeesWithAge = (attendees) => {
  return attendees.map((attendee) => {
    const { dob } = attendee;

    const today = new Date();
    const birthDate = new Date(`${dob.year.toString()}-${dob.month.toString().padStart(2, "0")}-${dob.day.toString().padStart(2, "0")}`);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return { ...formatAttendeeWorkshopEventDate(attendee), age };
  });
};

const isAChildWorkshop = (booking) => {
  console.log(booking);
  return booking?.basket.findIndex((item) => item.category === "adult_workshop") !== -1;
};

const adminTemplatePath = __dirname + "/templates/admin_receipt.html";
const userTemplatePath = __dirname + "/templates/user_receipt.html";
const adminSubject = "New Booking";
const userSubject = "Your Booking Receipt";

/**
 * Manually sends an email by booking ID.
 * @param {string} bookingId - The ID of the booking document in Firestore.
 */
const sendEmailByBookingId = async (bookingId) => {
  const db = require("firebase-admin").firestore(); // Make sure firebase-admin is initialized in your project

  try {
    // Fetch booking document from Firestore
    const bookingSnapshot = await db.collection("bookings").doc(bookingId).get();
    // const bookingSnapshot = await bookingRef.get();

    if (!bookingSnapshot.exists) {
      console.log(`No booking found for ID: ${bookingId}`);
      return;
    }

    console.log(bookingSnapshot.data(), "bookingSnapshot");

    const bookingData = bookingSnapshot.data();

    // Prepare admin and user booking data
    const adminBookingData = { ...adminDetails, ...bookingData };

    // Send email to admin
    sendCustomEmail(adminBookingData, adminTemplatePath, adminSubject);

    // Send email to user
    sendCustomEmail(bookingData, userTemplatePath, userSubject);

    console.log(`Emails sent for booking ID: ${bookingId}`);
  } catch (error) {
    console.error(`Error sending emails for booking ID ${bookingId}:`, error);
  }
};


const sendCustomEmail = (user, templatePath, subject, retries = 3) => {
  readHTMLFile(templatePath, (err, html) => {
    if (err) {
      console.log("error reading file", err);
      return;
    }

    // Register the multiply helper
    handlebars.registerHelper("multiply", (a, b) => {
      return a * b;
    });
    const template = handlebars.compile(html);


    const replacements = {
      // eslint-disable-next-line max-len
      username: user.firstName || user.parent.firstName + " " + user.parent.lastName,
      email: user.email || user.parent.email,
      phone: user.telephone || user.parent.telephone,
      bookingId: user.id.toUpperCase(),
      amount: user.price,
      date: formatDate(user.timestamp),
      basket: sortedArray(flattenArray(user.basket)),
      customer_email: user.parent.email,
      customer_name: user.parent.firstName + " " + user.parent.lastName,
      category: isAChildWorkshop(user),
      attendees: attendeesWithAge(user.attendees),
      address: "50B Northbrook Street, Newbury RG14 1DT",
      location: "The LOLA Workshop & Cafe",
      admin_email: "hello@lotsoflovelyart.com",
    };

    console.log(replacements.category, "category");

    const htmlToSend = template(replacements);
    const customEmail = {
      to: replacements.email,
      subject: subject,
      html: htmlToSend,
    };

    const attemptToSend = (remainingRetries) => {
      transporter.sendMail(customEmail, (error) => {
        if (error) {
          console.error(`Failed to send email: ${error.message}`);
          if (remainingRetries > 0) {
            console.log(`Retrying email send (${remainingRetries} retries left)`);
            setTimeout(() => attemptToSend(remainingRetries - 1), 2000); // wait 2 seconds before retry
          } else {
            console.error("Failed to send email after multiple attempts.");
          }
        } else {
          console.log("Email sent successfully");
        }
      });
    };

    attemptToSend(retries);
  });
};

const adminDetails = {
  email: ["alexishindle@gmail.com", "hello@lotsoflovelyart.com,"],
  // email: "alexishindle@gmail.com",
  firstName: "Admin",
};

exports.manualEmailTrigger = functions.https.onRequest(async (req, res) => {
  const { bookingId } = req.query;

  if (!bookingId) {
    res.status(400).send("Please provide a bookingId as a query parameter.");
    return;
  }

  try {
    await sendEmailByBookingId(bookingId);
    res.status(200).send(`Emails sent successfully for booking ID: ${bookingId}`);
  } catch (error) {
    res.status(500).send(`Error sending email for booking ID ${bookingId}: ${error.message}`);
  }
});

// https://lola-workshops.cloudfunctions.net/manualEmailTrigger?bookingId=hv70tffk0


// curl -X GET \
//   'https://lola-workshops.cloudfunctions.net/emails-manualEmailTrigger?bookingId=hv70tffk0' \
//   -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkYzBmMTcyZThkNmVmMzgyZDZkM2EyMzFmNmMxOTdkZDY4Y2U1ZWYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzMjU1NTk0MDU1OS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjMyNTU1OTQwNTU5LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE4MzI4NjU3MTc5ODI0NTY3OTIxIiwiZW1haWwiOiJhbGV4aXNoaW5kbGVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJPT0JKYWRuamhTMkppRW5EYWxmYXZRIiwiaWF0IjoxNzMxNDMzMTIwLCJleHAiOjE3MzE0MzY3MjB9.M2sVC6PUKFV1NznHnpXszNwHsz4iqkpaRraBhxtrID67QcyM-wsWvij_DWx3MdOBODtoPGDWvLJKxDP3bX6aR4cs8_d86kwA7vRHVsERZsSl-c2ISHRCcsev8QMQ-ewTqhfb7v012L9SM3a-WEq2U9Tlze4DkXf7zGQCaFiVaujf1lMj8juHRnkeMgWbNYK9a7S2Q555uVnH1K3yjuupa0Yl4WMoF8u1WXDk6LU9VYVhrd1LLs9B2UUAhpiDynPyCF0bAf-3AEoYPkko1fdyAoFcwPHROSoyAsX_3hKBmoH8Ti6QaCegdkJAYBL_D_A4gFJSIcIm3h0MOOpU7Vpogg"

// http:// localhost:5001/lola-workshops/us-central1/emails-manualEmailTrigger?bookingId=hv70tffk0

exports.receiptEmail = functions.firestore
    .document("bookings/{bookingId}")
    .onCreate((snap) => {
      const booking = snap.data();

      const adminBooking = {
        ...adminDetails,
        ...booking,
      };

      const adminTemplate = __dirname + "/templates/admin_receipt.html";
      const userTemplate = __dirname + "/templates/user_receipt.html";
      const adminSubject = "New Booking";
      const userSubject = "Your Booking Receipt";

      sendCustomEmail(adminBooking, adminTemplate, adminSubject);
      sendCustomEmail(booking, userTemplate, userSubject);
    });

exports.sendEmail = functions.https.onRequest((req, res) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  // Set CORS headers for the main request
  res.set("Access-Control-Allow-Origin", "*");

  // Rest of the function remains the same
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: "hello@lotsoflovelyart.com",
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      res.status(500).send(error.message);
    } else {
      res.status(200).send("Email sent successfully");
    }
  });
});
