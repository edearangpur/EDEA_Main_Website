import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// We'll try to find a service account file or use default credentials
const configPath = path.join(__dirname, "firebase-applet-config.json");
let firebaseConfig = { projectId: "" };
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Memory store for OTPs (In-memory for simplicity, use Firestore for production)
  const otpStore = new Map<string, { code: string; expires: number; data: any }>();

  // API Routes
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { code: otp, expires, data: { email, password, name } });

    console.log(`[OTP] For ${email}: ${otp}`); // For debugging

    // Try to send email if configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"EDEA Rangpur" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Your Registration OTP - EDEA Rangpur",
          text: `Your OTP for registration is: ${otp}. It will expire in 5 minutes.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb;">EDEA Rangpur Registration</h2>
              <p>Your OTP for registration is:</p>
              <h1 style="font-size: 48px; letter-spacing: 5px; color: #1e293b;">${otp}</h1>
              <p>This code will expire in 5 minutes.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">If you did not request this code, please ignore this email.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Email sending failed:", err);
        // We still return success so the user can use the console-logged OTP in dev
        return res.json({ success: true, message: "OTP generated (Failed to send real email, check console for code)" });
      }
    }

    res.json({ success: true, message: "OTP sent successfully" });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(400).json({ error: "No OTP request found for this email" });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (stored.code !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    try {
      otpStore.delete(email);
      res.json({ success: true, message: "OTP Verified" });
    } catch (err: any) {
      console.error("Verification failed:", err);
      res.status(500).json({ error: "Verification process failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
