// =====================================================
// FootBag Factory — Server
// =====================================================
// This small server does two things:
//   1. Serves your footbag-factory.html file
//   2. Creates a Stripe PaymentIntent when a customer checks out
//
// 🔧 SETUP: Replace the sk_test_... below with your real secret key
//    from: https://dashboard.stripe.com/test/apikeys
// =====================================================

require('dotenv').config();
const express = require("express");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = 3000;

// ── MIDDLEWARE ────────────────────────────────────────
app.use(cors({
  origin: ['https://sack-factory.netlify.app', 'http://localhost:3000']
}));
app.use(express.json());

// Serve your HTML file when someone visits localhost:3000
app.use(express.static(path.join(__dirname)));

// ── PAYMENT INTENT ROUTE ──────────────────────────────
// The browser calls this when the customer clicks "Place order"
// It tells Stripe how much to charge and returns a client_secret
// that the browser uses to complete the payment securely
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, orderDetails } = req.body;

    // amount comes in as dollars (e.g. 23) — Stripe needs cents (e.g. 2300)
    const amountInCents = Math.round(amount * 100);

    // Create the PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountInCents,
      currency: "usd",
      // Store order details so you can see them in your Stripe dashboard
      metadata: {
        color:    orderDetails.color,
        herb:     orderDetails.herb,
        weight:   orderDetails.weight,
        panel:    orderDetails.panel,
        material: orderDetails.material,
      },
    });

    // Send the client_secret back to the browser
    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});
// ── ORDER NOTIFICATION ROUTE ──────────────────────────
app.post("/notify-order", async (req, res) => {
  try {
    console.log("Order received:", JSON.stringify(req.body));
    const response = await fetch('https://script.google.com/macros/s/AKfycbxnC6oYw-B7avyQHRvUiRoxI7VkA-qegpxgh30cl7UrazW55HQ5P6GBuRUrJEp0qLEp/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    console.log("Apps Script response status:", response.status);
    res.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── START SERVER ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ✅ FootBag Factory server running!
  👉 Open your shop at: http://localhost:${PORT}/index.html
  `);
});
