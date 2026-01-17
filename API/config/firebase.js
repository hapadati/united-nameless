/**
 * Firebase Admin SDK 初期化
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let db = null;

/**
 * Firebase Admin SDKを初期化
 * @returns {admin.firestore.Firestore} Firestoreインスタンス
 */
export function initializeFirebase() {
    if (db) {
        return db;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is required');
    }

    try {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        db = admin.firestore();

        // Firestoreタイムスタンプ設定
        db.settings({
            ignoreUndefinedProperties: true,
        });

        console.log('✅ Firebase initialized successfully');
        return db;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        throw error;
    }
}

/**
 * Firestoreインスタンスを取得
 * @returns {admin.firestore.Firestore}
 */
export function getFirestore() {
    if (!db) {
        return initializeFirebase();
    }
    return db;
}

export default {
    initializeFirebase,
    getFirestore,
};
