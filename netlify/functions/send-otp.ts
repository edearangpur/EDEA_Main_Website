import { Handler } from "@netlify/functions";
import nodemailer from "nodemailer";
import { getFirebaseAdmin } from "./lib/firebase-admin";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");
    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
    }

    const { db } = getFirebaseAdmin();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store in Firestore
    await db.collection("otpStore").doc(email).set({
      code: otp,
      expires,
      updatedAt: new Date().toISOString()
    });

    console.log(`[OTP] For ${email}: ${otp}`);

    // Send email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
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
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: "OTP sent successfully" }),
    };
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
    };
  }
};

export { handler };
