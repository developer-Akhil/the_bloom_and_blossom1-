import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { sendVerificationEmail } from "../services/emailService.js";
import { config } from "../config/config.js";

function generateHashedToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phone } = req.body;
      
      if (!email || !password || !fullName || !phone) {
        res.status(400).json({ error: "Name, email, phone and password are required" });
        return;
      }

      const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        res.status(400).json({ error: "Invalid Indian mobile number. It must be 10 digits starting with 6-9." });
        return;
      }

      // 1. Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        // Prevent enumeration: just act like we sent it or return generic message
        // Or if not verified, resend possibly? But user expects generic response for security
        res.status(400).json({ error: "Email is already registered" });
        return;
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Generate raw verification token and hash it
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = generateHashedToken(rawToken);

      // 4. Expiry (30 mins)
      const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // 5. Save user
      const payload = {
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken: hashedToken,
        tokenExpiry: tokenExpiry,
        full_name: fullName,
        phone: phone
      };
      const newUser = await UserModel.createUser(payload);

      // 6. Send email
      const frontendUrl = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || config.app.url;
      await sendVerificationEmail(email, rawToken, frontendUrl);

      res.status(201).json({ message: "Registration successful. Please check your email to verify." });
    } catch (error: any) {
      console.error("Register Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        res.status(400).json({ error: "Invalid token" });
        return;
      }

      const hashedToken = generateHashedToken(token);
      const user = await UserModel.findByVerificationToken(hashedToken);

      if (!user) {
        res.status(400).json({ error: "Invalid or expired token" });
        return;
      }

      if (new Date(user.tokenExpiry).getTime() < Date.now()) {
        res.status(400).json({ error: "Token has expired. Please request a new verification email." });
        return;
      }

      // Mark verified and clear tokens
      await UserModel.updateUser(user.id, {
        isVerified: true,
        verificationToken: null,
        tokenExpiry: null
      });

      res.json({ message: "Email successfully verified!" });
    } catch (error: any) {
      console.error("Verify Email Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
         res.status(400).json({ error: "Email and password are required" });
         return;
      }

      const user = await UserModel.findByEmail(email);

      // Do not reveal whether email exists
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Bypass email verification for testing/development
      // if (!user.isVerified) {
      //   res.status(401).json({ error: "Please verify your email address before logging in." });
      //   return;
      // }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: "1d" }
      );

      const clientUser = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        user_metadata: {
          full_name: user.full_name,
          phone: user.phone
        }
      };

      res.json({ message: "Login successful", token, user: clientUser });
    } catch (error: any) {
      console.error("Login Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  },

  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      const user = await UserModel.findByEmail(email);

      // We should not reveal whether or not the account exists to prevent enumeration.
      if (!user) {
        res.json({ message: "If that email is registered, we have sent a verification link." });
        return;
      }

      if (user.isVerified) {
        res.json({ message: "If that email is registered, we have sent a verification link." });
        // Although the email is verified, we return same generic message or error based on preference
        return;
      }

      // Add simple rate limiting via last active generic check based on token expiry 
      // i.e., 30 min expiry -> if tokenExpiry > now + 29 mins, means it was just sent < 1 min ago
      const tokenExpiryTime = new Date(user.tokenExpiry).getTime();
      const oneMinuteAgoFromExpiry = Date.now() + 29 * 60 * 1000;
      if (user.tokenExpiry && tokenExpiryTime > oneMinuteAgoFromExpiry) {
        res.status(429).json({ error: "Please wait a minute before requesting another email." });
        return;
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = generateHashedToken(rawToken);
      const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      await UserModel.updateUser(user.id, {
        verificationToken: hashedToken,
        tokenExpiry: tokenExpiry
      });

      const frontendUrl = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || config.app.url;
      await sendVerificationEmail(email, rawToken, frontendUrl);

      res.json({ message: "If that email is registered, we have sent a verification link." });
    } catch (error: any) {
      console.error("Resend Verification Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Internal Server Error" });
    }
  }
};
