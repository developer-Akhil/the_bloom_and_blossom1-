import express from "express";
import { sendContactEmail, sendOrderConfirmationEmail } from "../services/emailService.js";

const router = express.Router();

router.post("/order-confirmation", async (req, res) => {
  console.log("--- ORDER CONFIRMATION API CALLED ---");
  console.log("Body payload:", JSON.stringify(req.body, null, 2));

  try {
    const { email, orderDetails } = req.body;

    if (!email || !orderDetails) {
      console.error("❌ Missing email or orderDetails in payload", req.body);
      return res.status(400).json({ error: "Email and orderDetails are required" });
    }

    try {
      console.log(`✉️ Attempting to send order email to CUSTOMER: ${email}`);
      await sendOrderConfirmationEmail(email, orderDetails);
      console.log(`✅ Order confirmation sent successfully to CUSTOMER: ${email}`);
      return res.status(200).json({ message: "Order confirmation email request initiated" });
    } catch (err: any) {
      console.error("❌ sendOrderConfirmationEmail error:", err);
      // Return 500 for any email sending error, allowing frontend to inform user.
      return res.status(500).json({ error: err.message || "Failed to send order email" });
    }
  } catch (error: any) {
    console.error("❌ Order confirmation email API Outer error:", error);
    return res.status(500).json({ error: "Failed to process email request" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Name, email, subject, and message are required" });
    }

    // Send email and wait for result
    try {
      await sendContactEmail(name, email, subject, message);
      res.status(200).json({ message: "Contact form submitted successfully" });
    } catch (err: any) {
      if (err.message === "SMTP_AUTH_FAILED") {
        return res.status(500).json({ error: "SMTP Authentication Failed" });
      }
      console.error("Contact email error:", err.message || err);
      return res.status(500).json({ error: "Failed to send message. Please try again later." });
    }
  } catch (error: any) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

export default router;
