import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "fallback_jwt_secret_do_not_use_in_prod",
  supabase: {
    url: process.env.VITE_SUPABASE_URL || "",
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "", // Must use service role key in actual prod if using RLS
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    user: process.env.SMTP_USER || "info@bloomandblossom.in",
    pass: process.env.SMTP_PASS || "",
    noreplyUser: process.env.SMTP_NOREPLY_USER || process.env.SMTP_USER || "noreply@bloomandblossom.in",
    noreplyPass: process.env.SMTP_NOREPLY_PASS || process.env.SMTP_PASS || "",
    adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || "info@bloomandblossom.in",
    secure: true, // Use TLS for 465
  },
  app: {
    url: process.env.FRONTEND_URL || "https://bloomandblossom.in"
  }
};
