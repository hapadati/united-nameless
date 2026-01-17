// firebase.js - Firebase Admin Initialization
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

let db = null;

/**
 * Initialize Firebase Admin
 */
function initializeFirebase() {
  if (admin.apps.length > 0) {
    // Already initialized
    db = admin.firestore();
    return db;
  }

  try {
    // Try multiple paths for service account file
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      '/etc/secrets/firebase-account.json',
      './firebase-account.json'
    ].filter(Boolean);

    let serviceAccount = null;
    let usedPath = null;

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        try {
          serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
          usedPath = path;
          break;
        } catch (err) {
          console.warn(`Failed to read service account from ${path}:`, err.message);
        }
      }
    }

    // Fallback: Use environment variables
    if (!serviceAccount && process.env.FIREBASE_PROJECT_ID) {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      };
      console.log("✅ Using Firebase credentials from environment variables");
    }

    if (!serviceAccount) {
      throw new Error('No Firebase service account found. Please provide credentials via file or environment variables.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();

    console.log("✅ Firestore initialized with project:", serviceAccount.project_id);
    if (usedPath) {
      console.log("   Service account loaded from:", usedPath);
    }

    // Test write (async, don't block)
    testFirestoreConnection();

    return db;
  } catch (err) {
    console.error("❌ Failed to initialize Firebase:", err.message);
    console.warn("⚠️ Firestore will not be available. API mode only.");
    return null;
  }
}

/**
 * Test Firestore connection
 */
async function testFirestoreConnection() {
  if (!db) return;

  try {
    await db.collection("_health").doc("ping").set({
      ok: true,
      time: Date.now(),
      timestamp: new Date().toISOString()
    });
    console.log("✅ Firestore write test succeeded");
  } catch (err) {
    console.error("❌ Firestore write test failed:", err.message);
  }
}

// Initialize on module load
db = initializeFirebase();

export { db };
