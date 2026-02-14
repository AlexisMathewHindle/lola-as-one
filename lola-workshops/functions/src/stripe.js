/* eslint-disable max-len */
/* eslint-disable prettier/prettier */
/* eslint-disable object-curly-spacing */
// const functions = require("firebase-functions");
require("dotenv").config();
const { onCall} = require("firebase-functions/v2/https");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


exports.createPaymentIntent = onCall(async (data) => {
  try {
    const amount = (data.data?.amount || data.amount) * 100;

    if (!amount || amount <= 0) {
      return { error: "Invalid amount provided" };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "gbp",
      description: "LOLA Booking",
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating paymentIntent", error);
    return { error: "Failed to create payment intent" };
  }
});
