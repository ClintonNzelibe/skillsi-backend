import admin from "firebase-admin";
import * as dotenv from "dotenv";
dotenv.config();
const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;
if (!admin.apps.length && hasFirebaseConfig) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
    console.log("✅ Firebase initialized");
}
else {
    console.log("⚠️ Firebase not configured — skipping initialization");
}
export default admin;
