/* eslint-disable max-len */
/* eslint-disable prettier/prettier */
/* eslint-disable object-curly-spacing */
const functions = require("firebase-functions");
const { onCall } = require("firebase-functions/v2/https");
require("dotenv").config();

/**
 * Subscribe a user to the Mailchimp newsletter
 * This function adds a subscriber to Mailchimp with a custom tag to distinguish
 * it from signups from other sites (e.g., the main lotsoflovelyart.org site)
 */
exports.subscribeToNewsletter = onCall(async (data) => {
  const email = data.data?.email || data.email;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  try {
    // Get Mailchimp credentials from Firebase config (production) or .env (local)
    const apiKey = functions.config().mailchimp?.api_key || process.env.MAILCHIMP_API_KEY;
    const listId = functions.config().mailchimp?.list_id || process.env.MAILCHIMP_LIST_ID;
    const serverPrefix = functions.config().mailchimp?.server_prefix || process.env.MAILCHIMP_SERVER_PREFIX || "us21"; // e.g., us21, us1, etc.

    if (!apiKey || !listId) {
      console.error("Mailchimp credentials not configured");
      return {
        success: false,
        message: "Newsletter service is not configured. Please contact support.",
      };
    }

    // Mailchimp API endpoint
    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;

    // Create subscriber hash (MD5 of lowercase email)
    const crypto = require("crypto");
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    // Prepare the request body
    const requestBody = {
      email_address: email.toLowerCase(),
      status: "subscribed", // or "pending" if you want double opt-in
      tags: ["lola-workshops"], // Custom tag to distinguish from other site signups
      merge_fields: {
        SOURCE: "LOLA Workshops Site",
      },
    };

    // Make the API request to Mailchimp
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    // Handle different response scenarios
    if (response.ok) {
      console.log(`Successfully subscribed ${email} to newsletter`);
      return {
        success: true,
        message: "Successfully subscribed to newsletter!",
      };
    } else if (response.status === 400 && responseData.title === "Member Exists") {
      // User is already subscribed - update their tags
      const updateUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
      
      const updateResponse = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
        },
        body: JSON.stringify({
          tags: [{ name: "lola-workshops", status: "active" }],
        }),
      });

      if (updateResponse.ok) {
        console.log(`Updated tags for existing subscriber ${email}`);
        return {
          success: true,
          message: "You're already subscribed! We've updated your preferences.",
        };
      } else {
        console.log(`User ${email} is already subscribed`);
        return {
          success: true,
          message: "You're already subscribed to our newsletter!",
        };
      }
    } else {
      console.error("Mailchimp API error:", responseData);
      return {
        success: false,
        message: "Failed to subscribe. Please try again later.",
      };
    }
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return {
      success: false,
      message: "An error occurred. Please try again later.",
    };
  }
});

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @return {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

