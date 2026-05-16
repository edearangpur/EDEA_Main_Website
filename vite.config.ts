import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import nodemailer from "nodemailer";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  // Mock Netlify functions for development
  const apiPlugin = () => ({
    name: 'api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/auth/')) {
          const body = await new Promise<any>((resolve) => {
            let data = '';
            req.on('data', (chunk: any) => data += chunk);
            req.on('end', () => {
              try { resolve(JSON.parse(data)); } catch { resolve({}); }
            });
          });

          // Initialize Firebase Admin for dev
          let db: any;
          try {
            if (getApps().length === 0) {
              const projectId = env.FIREBASE_PROJECT_ID;
              const clientEmail = env.FIREBASE_CLIENT_EMAIL;
              const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

              if (projectId && clientEmail && privateKey) {
                initializeApp({
                  credential: cert({ projectId, clientEmail, privateKey }),
                });
                db = getFirestore();
              }
            } else {
              db = getFirestore();
            }
          } catch (e) {
            console.error("Firebase Admin initialization failed in Vite:", e);
          }

          if (req.url === '/api/auth/send-otp' && req.method === 'POST') {
            const { email } = body;
            if (!email) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Email is required" }));
              return;
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = Date.now() + 5 * 60 * 1000;

            if (db) {
              await db.collection("otpStore").doc(email).set({ code: otp, expires });
            }
            console.log(`[DEV OTP] For ${email}: ${otp}`);

            if (env.SMTP_USER && env.SMTP_PASS) {
              try {
                const transporter = nodemailer.createTransport({
                  host: env.SMTP_HOST || "smtp.gmail.com",
                  port: parseInt(env.SMTP_PORT || "587"),
                  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
                });
                await transporter.sendMail({
                  from: `"EDEA Rangpur" <${env.SMTP_USER}>`,
                  to: email,
                  subject: "Your Registration OTP - EDEA Rangpur",
                  text: `Your OTP for registration is: ${otp}`,
                });
              } catch (e) {
                console.error("Email failed:", e);
              }
            }

            res.end(JSON.stringify({ success: true, message: "OTP sent" }));
            return;
          }

          if (req.url === '/api/auth/verify-otp' && req.method === 'POST') {
            const { email, otp } = body;
            if (!db) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "DB not initialized" }));
              return;
            }

            const doc = await db.collection("otpStore").doc(email).get();
            if (!doc.exists) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "No OTP request found" }));
              return;
            }

            const stored = doc.data();
            if (Date.now() > stored.expires || stored.code !== otp) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Invalid or expired OTP" }));
              return;
            }

            await db.collection("otpStore").doc(email).delete();
            res.end(JSON.stringify({ success: true, message: "Verified" }));
            return;
          }
        }
        next();
      });
    }
  });

  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
