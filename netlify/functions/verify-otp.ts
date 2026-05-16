import { Handler } from "@netlify/functions";
import { getFirebaseAdmin } from "./lib/firebase-admin";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, otp } = JSON.parse(event.body || "{}");
    if (!email || !otp) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email and OTP are required" }) };
    }

    const { db } = getFirebaseAdmin();
    const docRef = db.collection("otpStore").doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { statusCode: 400, body: JSON.stringify({ error: "No OTP request found for this email" }) };
    }

    const stored = doc.data();
    if (!stored) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid data" }) };
    }

    if (Date.now() > stored.expires) {
      await docRef.delete();
      return { statusCode: 400, body: JSON.stringify({ error: "OTP has expired" }) };
    }

    if (stored.code !== otp) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid OTP code" }) };
    }

    // Success - delete OTP
    await docRef.delete();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: "OTP Verified" }),
    };
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
    };
  }
};

export { handler };
