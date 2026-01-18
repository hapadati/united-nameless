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

    let serviceAccount;

    // 1. Try JSON content from Environment Variable (Render/Cloud)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log('✅ Firebase initialized using FIREBASE_SERVICE_ACCOUNT (JSON content)');
        } catch (e) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
            throw new Error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT');
        }
    }
    // 2. Try File Path (Local/Legacy)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        try {
            serviceAccount = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
            console.log('✅ Firebase initialized using FIREBASE_SERVICE_ACCOUNT_PATH');
        } catch (error) {
            console.error('❌ Failed to read Firebase key file:', error.message);
            throw error;
        }
    } else {
        throw new Error('Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_SERVICE_ACCOUNT_PATH.');
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        db = admin.firestore();

        // Firestoreタイムスタンプ設定
        db.settings({
            ignoreUndefinedProperties: true,
        });

        return db;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase App:', error.message);
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
