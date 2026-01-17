/**
 * ランク・レベル計算サービス
 */

import { getFirestore } from '../config/firebase.js';
import { XP, FIRESTORE } from '../config/constants.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * XPからレベルを計算
 * @param {number} xp
 * @returns {number}
 */
export function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / XP.BASE_DIVISOR));
}

/**
 * レベルから必要XPを計算
 * @param {number} level
 * @returns {number}
 */
export function calculateRequiredXP(level) {
    return level * level * XP.BASE_DIVISOR;
}

/**
 * ユーザーのランク情報を取得
 * @param {string} userId
 * @returns {Promise<{ rank: number, level: number, xp: number, points: number, nextLevelXP: number }>}
 */
export async function getUserRank(userId) {
    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return {
            rank: 0,
            level: 0,
            xp: 0,
            points: 0,
            nextLevelXP: calculateRequiredXP(1),
        };
    }

    const userData = userDoc.data();
    const level = calculateLevel(userData.xp || 0);
    const nextLevelXP = calculateRequiredXP(level + 1);

    // ランク計算（自分より高いXPを持つユーザー数をカウント）
    const higherXpQuery = db.collection(FIRESTORE.COLLECTIONS.USERS)
        .where('xp', '>', userData.xp || 0);

    const snapshot = await higherXpQuery.count().get();
    const rank = snapshot.data().count + 1;

    return {
        rank,
        level,
        xp: userData.xp || 0,
        points: userData.points || 0,
        nextLevelXP,
    };
}

/**
 * ポイントをXPに変換
 * @param {string} userId
 * @param {number} pointsToConvert
 * @returns {Promise<{ success: boolean, xpGained: number, newXP: number, newLevel: number }>}
 */
export async function convertPointsToXP(userId, pointsToConvert) {
    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);
    let result = null;

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();

        if (userData.points < pointsToConvert) {
            throw new Error('Insufficient points');
        }

        // 1pt = 1XP
        const xpGained = pointsToConvert;
        const newPoints = userData.points - pointsToConvert;
        const newXP = (userData.xp || 0) + xpGained;
        const currentLevel = calculateLevel(userData.xp || 0);
        const newLevel = calculateLevel(newXP);
        const leveledUp = newLevel > currentLevel;

        transaction.update(userRef, {
            points: newPoints,
            xp: newXP,
            level: newLevel,
        });

        result = {
            success: true,
            xpGained,
            newXP,
            oldLevel: currentLevel,
            newLevel,
            leveledUp,
        };
    });

    logger.info({ userId, pointsToConvert, ...result }, 'Points converted to XP via transaction');

    return result;
}

export default {
    calculateLevel,
    calculateRequiredXP,
    getUserRank,
    convertPointsToXP,
};
