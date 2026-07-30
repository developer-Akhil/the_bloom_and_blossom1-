import nodemailer from "nodemailer";
import { config } from "../config/config.js";

// Transporter for contact & customer communication (info@)
const contactTransporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  // Add pooling and higher timeouts for reliability
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Use contactTransporter for automated system emails as well to avoid SPF/DKIM/deliverability issues with noreply@
const noreplyTransporter = contactTransporter;

export const sendVerificationEmail = async (email: string, token: string, frontendUrl: string = config.app.url) => {
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Bloom & Blossom" <${config.smtp.user}>`,
    to: email,
    subject: "Verify your email address - Bloom & Blossom",
    html: `
      <h2>Welcome to Bloom & Blossom!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}" style="display:inline-block;padding:10px 20px;color:#fff;background-color:#FFB6C1;text-decoration:none;border-radius:5px;">Verify Email</a>
      <p>Or paste this link in your browser: <br/> ${verificationLink}</p>
      <p>This verification link will expire in 30 minutes.</p>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log("--------------------------------------------------------------------------------");
    console.log("SMTP Password not set for verification! In a real environment, an email would be sent.");
    console.log(`[TESTING] VERIFICATION LINK FOR ${email}:`);
    console.log(`[TESTING] ${verificationLink}`);
    console.log("--------------------------------------------------------------------------------");
    return;
  }

  try {
    await noreplyTransporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error: any) {
    console.warn(`⚠️ Could not send verification email (SMTP error): ${error?.message || 'Unknown error'}`);
    console.log("--------------------------------------------------------------------------------");
    console.log(`[FALLBACK LOG] VERIFICATION LINK FOR ${email}:`);
    console.log(`${verificationLink}`);
    console.log("--------------------------------------------------------------------------------");
  }
};

export const sendOrderConfirmationEmail = async (email: string, orderDetails: any) => {
  const { orderId, cart = [], shippingData = {}, total, productNames, productCodes } = orderDetails;
  
  const itemsHtml = (Array.isArray(cart) ? cart : []).map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price || 0) * (item.quantity || 1)}</td>
    </tr>
  `).join('');

  const customerMailOptions = {
    from: `"Bloom & Blossom" <${config.smtp.user}>`,
    to: email,
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FFB6C1;">Thank you for your order!</h2>
        <p>Dear ${shippingData.name},</p>
        <p>Your order <strong>${orderId}</strong> has been successfully placed. We'll send you another email when it ships.</p>
        
        <h3 style="margin-top: 30px;">Order Summary</h3>
        ${productNames ? `<p><strong>Products:</strong> ${productNames}</p>` : ''}
        ${productCodes ? `<p><strong>Product Codes:</strong> ${productCodes}</p>` : ''}
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9f9f9;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #FFB6C1;">₹${total !== undefined && total !== null ? total : (Array.isArray(cart) ? cart.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0) : 0)}</td>
            </tr>
          </tfoot>
        </table>

        <h3 style="margin-top: 30px;">Shipping Details</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
          ${shippingData?.name || 'Customer'}<br/>
          ${shippingData?.email || email || ''}<br/>
          ${shippingData?.phone || ''}<br/>
          ${shippingData?.address || ''}<br/>
          ${shippingData?.city || ''}, ${shippingData?.state || ''} ${shippingData?.pincode || shippingData?.zip || ''}
        </p>
        
        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
          If you have any questions, please contact us at ${config.smtp.user}.
        </p>
      </div>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log("--------------------------------------------------------------------------------");
    console.log("SMTP Password not set for order confirmation! In a real environment, an email would be sent.");
    console.log(`[TESTING] ORDER CONFIRMATION FOR ${email}:`);
    console.log(`[TESTING] Order ID: ${orderId}`);
    console.log("--------------------------------------------------------------------------------");
    return;
  }

  try {
    // Send to customer
    await noreplyTransporter.sendMail(customerMailOptions);
    console.log(`Order confirmation email sent to CUSTOMER: ${email}`);
    
    // Send alert to Admin
    const adminAlertOptions = {
      from: `"Bloom & Blossom System" <${config.smtp.user}>`,
      to: config.smtp.adminEmail,
      subject: `New Order Received - ${orderId}`,
      html: `
        <h2>New Order Alert!</h2>
        <p>A new order has been placed on the website.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer Name:</strong> ${shippingData.name || 'N/A'}</p>
        <p><strong>Customer Email:</strong> ${email || 'N/A'}</p>
        <p><strong>Customer Phone:</strong> ${shippingData.phone || 'N/A'}</p>
        <p><strong>Order Total:</strong> ₹${total !== undefined && total !== null ? total : (Array.isArray(cart) ? cart.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0) : 0)}</p>
        <br/>
        <p>Please check the admin dashboard for full order details.</p>
      `,
    };
    await noreplyTransporter.sendMail(adminAlertOptions);
    console.log(`Order alert email sent to ADMIN: ${config.smtp.adminEmail}`);
  } catch (error: any) {
    console.warn(`⚠️ Could not send order confirmation email (SMTP error): ${error?.message || 'Unknown error'}`);
    console.log("--------------------------------------------------------------------------------");
    console.log(`[FALLBACK LOG] ORDER CONFIRMATION FOR ${email}`);
    console.log(`Order ID: ${orderId}`);
    console.log("--------------------------------------------------------------------------------");
    throw new Error(error?.message || "SMTP_SEND_FAILED");
  }
};

export const sendDispatchConfirmationEmail = async (email: string, orderDetails: any) => {
  const { orderId, shippingData = {}, productNames } = orderDetails;
  
  const customerMailOptions = {
    from: `"Bloom & Blossom" <${config.smtp.user}>`,
    to: email,
    bcc: config.smtp.adminEmail,
    subject: `Order Dispatched - ${orderId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FFB6C1;">Your Order is on the way!</h2>
        <p>Dear ${shippingData.name || 'Customer'},</p>
        <p>Great news! Your order <strong>${orderId}</strong> has been dispatched.</p>
        
        <h3 style="margin-top: 30px;">Order Summary</h3>
        ${productNames ? `<p><strong>Products:</strong> ${productNames}</p>` : ''}

        <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
          If you have any questions, please contact us at ${config.smtp.user}.
        </p>
      </div>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log("SMTP Password not set. [TESTING] DISPATCH CONFIRMATION FOR ", email);
    return;
  }

  try {
    await noreplyTransporter.sendMail(customerMailOptions);
    console.log(`Dispatch confirmation email sent to CUSTOMER: ${email}`);
  } catch (error: any) {
    console.warn(`⚠️ Could not send dispatch email: ${error?.message || 'Unknown error'}`);
    throw new Error("SMTP_AUTH_FAILED");
  }
};

export const sendContactEmail = async (name: string, senderEmail: string, subject: string, message: string) => {
  const mailOptions = {
    from: `"Bloom & Blossom Contact" <${config.smtp.user}>`,
    to: config.smtp.adminEmail,
    replyTo: senderEmail,
    subject: `New Contact Form Submission: ${subject}`,
    text: `Name: ${name}\nEmail: ${senderEmail}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr/>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${message}</p>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log("--------------------------------------------------------------------------------");
    console.log("SMTP Password not set for contact! In a real environment, an email would be sent.");
    console.log(`[TESTING] CONTACT FORM SUBMISSION FROM ${senderEmail}:`);
    console.log(`[TESTING] SUBJECT: ${subject}`);
    console.log(`[TESTING] MESSAGE: ${message}`);
    console.log("--------------------------------------------------------------------------------");
    return;
  }

  try {
    await contactTransporter.sendMail(mailOptions);
    console.log(`Contact email sent from ${senderEmail}`);
    
    // Send auto-reply to the user
    const autoReplyOptions = {
      from: `"Bloom & Blossom" <${config.smtp.user}>`,
      to: senderEmail,
      bcc: config.smtp.adminEmail,
      subject: `We've received your message: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFB6C1;">Thank you for contacting us!</h2>
          <p>Hi ${name},</p>
          <p>We've successfully received your inquiry about "<strong>${subject}</strong>".</p>
          <p>Our team will get back to you at <strong>${senderEmail}</strong> within 24 hours.</p>
          <br/>
          <p>Best regards,<br/>The Bloom & Blossom Team</p>
        </div>
      `,
    };
    await contactTransporter.sendMail(autoReplyOptions);
    console.log(`Auto-reply sent to ${senderEmail}`);
  } catch (error: any) {
    console.warn(`⚠️ Could not send contact email (SMTP error): ${error?.message || 'Unknown error'}`);
    console.log("--------------------------------------------------------------------------------");
    console.log(`[FALLBACK LOG] CONTACT FORM SUBMISSION FROM ${senderEmail}:`);
    `SUBJECT: ${subject}`;
    `MESSAGE: ${message}`;
    console.log("--------------------------------------------------------------------------------");
    throw new Error("SMTP_AUTH_FAILED");
  }
};

export const sendReviewApprovedEmail = async (email: string, name: string, productName: string) => {
  const mailOptions = {
    from: `"Bloom & Blossom" <${config.smtp.user}>`,
    to: email,
    subject: "Your review has been approved! - Bloom & Blossom",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #FFB6C1;">Review Approved!</h2>
        <p>Dear ${name},</p>
        <p>We are excited to let you know that your review for <strong>${productName}</strong> has been approved by our moderation team and is now live on our website!</p>
        <p>Thank you so much for taking the time to share your feedback. It helps us and other customers tremendously.</p>
        <br/>
        <p>Warm regards,<br/>The Bloom & Blossom Team</p>
      </div>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log(`[TESTING] Review approved email would be sent to ${email} for ${productName}`);
    return;
  }

  try {
    await noreplyTransporter.sendMail(mailOptions);
    console.log(`Review approved email sent to ${email}`);
  } catch (error: any) {
    console.warn(`Could not send review approved email (SMTP error): ${error?.message}`);
  }
};

export const sendReviewRejectedEmail = async (email: string, name: string, productName: string) => {
  const mailOptions = {
    from: `"Bloom & Blossom" <${config.smtp.user}>`,
    to: email,
    subject: "Update on your product review - Bloom & Blossom",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #666;">Product Review Update</h2>
        <p>Dear ${name},</p>
        <p>Thank you for submitting a review for <strong>${productName}</strong>.</p>
        <p>Unfortunately, your review did not meet our community guidelines and has been rejected by our moderation team. Common reasons include inappropriate language, off-topic content, or including links/promotions.</p>
        <p>If you believe this was an error, please feel free to reach out to our support team.</p>
        <br/>
        <p>Warm regards,<br/>The Bloom & Blossom Team</p>
      </div>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log(`[TESTING] Review rejected email would be sent to ${email} for ${productName}`);
    return;
  }

  try {
    await noreplyTransporter.sendMail(mailOptions);
    console.log(`Review rejected email sent to ${email}`);
  } catch (error: any) {
    console.warn(`Could not send review rejected email (SMTP error): ${error?.message}`);
  }
};

export const sendAdminReplyEmail = async (email: string, name: string, productName: string, replyText: string) => {
  const mailOptions = {
    from: `"Bloom & Blossom" <${config.smtp.user}>`,
    to: email,
    subject: "The Bloom & Blossom team replied to your review!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #FFB6C1;">New Reply to Your Review</h2>
        <p>Dear ${name},</p>
        <p>We've responded to your review for <strong>${productName}</strong>:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FFB6C1; border-radius: 4px; margin: 20px 0; font-style: italic;">
          "${replyText}"
        </div>
        <p>Thank you again for shopping with us!</p>
        <br/>
        <p>Warm regards,<br/>The Bloom & Blossom Team</p>
      </div>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log(`[TESTING] Admin reply email would be sent to ${email} for ${productName}`);
    return;
  }

  try {
    await noreplyTransporter.sendMail(mailOptions);
    console.log(`Admin reply email sent to ${email}`);
  } catch (error: any) {
    console.warn(`Could not send admin reply email (SMTP error): ${error?.message}`);
  }
};

export const sendReviewReminderEmail = async (email: string, name: string, productName: string, productLink: string) => {
  const mailOptions = {
    from: `"Bloom & Blossom" <${config.smtp.user}>`,
    to: email,
    subject: "How do you like your purchase? Leave a review! - Bloom & Blossom",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #FFB6C1;">How was your experience?</h2>
        <p>Dear ${name},</p>
        <p>We hope you are loving your new <strong>${productName}</strong>! We'd love to hear your thoughts on it.</p>
        <p>Could you please take 1 minute to leave a review? Your feedback helps us improve and helps other customers make choices!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${productLink}" style="display:inline-block;padding:12px 24px;color:#fff;background-color:#FFB6C1;text-decoration:none;border-radius:5px;font-weight:bold;box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Leave a Review</a>
        </div>
        <br/>
        <p>Thank you so much!<br/>The Bloom & Blossom Team</p>
      </div>
    `,
  };

  if (!config.smtp.pass || config.smtp.pass === "YOUR_SMTP_PASSWORD") {
    console.log(`[TESTING] Review reminder email would be sent to ${email} for ${productName}`);
    return;
  }

  try {
    await noreplyTransporter.sendMail(mailOptions);
    console.log(`Review reminder email sent to ${email}`);
  } catch (error: any) {
    console.warn(`Could not send review reminder email (SMTP error): ${error?.message}`);
  }
};
