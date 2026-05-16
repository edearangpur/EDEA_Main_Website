import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const getFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return { app: getApp(), db: getFirestore() };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle private key newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  const dbId = process.env.FIREBASE_DATABASE_ID || "(default)";
return { app, db: getFirestore(app, dbId) };
};

export { getFirebaseAdmin };
