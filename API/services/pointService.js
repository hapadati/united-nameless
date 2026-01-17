/**
 * ポイント計算サービス
 */

import { getFirestore } from '../config/firebase.js';
import { POINTS, FIRESTORE } from '../config/constants.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * メッセージポイントを計算・付与
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<{ points: number, total: number, cooldown: boolean }>}
 */
export async function calculateMessagePoints(userId, guildId) {
    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);
    const now = new Date();
    let earnedPoints = 0;
    let totalPoints = 0;
    let onCooldown = false;

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        let userData = userDoc.exists ? userDoc.data() : {
            userId,
            points: 0,
            xp: 0,
            level: 0,
            lastMessage: null,
        };

        // クールダウンチェック
        if (userData.lastMessage) {
            const lastMessageTime = userData.lastMessage.toDate();
            const timeDiff = (now - lastMessageTime) / 1000; // 秒

            if (timeDiff < POINTS.MESSAGE_COOLDOWN) {
                earnedPoints = 0;
                totalPoints = userData.points;
                onCooldown = true;
                return;
            }
        }

        // ランダムポイント付与
        earnedPoints = Math.floor(Math.random() * (POINTS.MESSAGE_MAX - POINTS.MESSAGE_MIN + 1)) + POINTS.MESSAGE_MIN;
        userData.points += earnedPoints;
        userData.lastMessage = now;
        totalPoints = userData.points;

        transaction.set(userRef, userData, { merge: true });
    });

    if (!onCooldown) {
        logger.info({ userId, earnedPoints, total: totalPoints }, 'Message points awarded via transaction');
    }

    return {
        points: earnedPoints,
        total: totalPoints,
        cooldown: onCooldown,
    };
}

/**
 * VC滞在ポイントを計算・付与
 * @param {string} userId
 * @param {number} durationSeconds - VC滞在時間（秒）
 * @returns {Promise<{ points: number, total: number }>}
 */
export async function calculateVoicePoints(userId, durationSeconds) {
    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);
    let earnedPoints = 0;
    let totalPoints = 0;

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        let userData = userDoc.exists ? userDoc.data() : {
            userId,
            points: 0,
            xp: 0,
            level: 0,
            totalVoiceTime: 0,
        };

        // 10分ごとにポイント付与
        const intervals = Math.floor(durationSeconds / (POINTS.VOICE_INTERVAL * 60));
        earnedPoints = intervals * POINTS.VOICE_POINTS;

        userData.points += earnedPoints;
        userData.totalVoiceTime = (userData.totalVoiceTime || 0) + durationSeconds;
        totalPoints = userData.points;

        transaction.set(userRef, userData, { merge: true });
    });

    logger.info({ userId, durationSeconds, earnedPoints, total: totalPoints }, 'Voice points awarded via transaction');

    return {
        points: earnedPoints,
        total: totalPoints,
    };
}

export default {
    calculateMessagePoints,
    calculateVoicePoints,
};
