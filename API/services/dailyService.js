/**
 * デイリーボーナスサービス
 */

import { getFirestore } from '../config/firebase.js';
import { POINTS, FIRESTORE } from '../config/constants.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * デイリーボーナスを取得
 * @param {string} userId
 * @returns {Promise<{ claimed: boolean, points: number, streak: number, nextClaimTime: Date|null }>}
 */
export async function claimDailyBonus(userId) {
    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);
    const now = new Date();
    let result = null;

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        let userData = userDoc.exists ? userDoc.data() : {
            userId,
            points: 0,
            xp: 0,
            level: 0,
            lastDaily: null,
            dailyStreak: 0,
        };

        // 最後のデイリー取得時刻をチェック
        if (userData.lastDaily) {
            const lastDailyTime = userData.lastDaily.toDate();
            const timeDiff = (now - lastDailyTime) / 1000 / 60 / 60; // 時間

            // 24時間以内の場合はクールダウン
            if (timeDiff < 24) {
                const nextClaimTime = new Date(lastDailyTime.getTime() + 24 * 60 * 60 * 1000);
                result = {
                    claimed: false,
                    points: 0,
                    streak: userData.dailyStreak || 0,
                    nextClaimTime,
                };
                return;
            }

            // 48時間以上経過している場合はストリークリセット
            if (timeDiff > 48) {
                userData.dailyStreak = 0;
            }
        }

        // ストリーク増加
        userData.dailyStreak = (userData.dailyStreak || 0) + 1;

        // ポイント計算（ベース + ストリークボーナス）
        const bonusPoints = POINTS.DAILY_BASE + (userData.dailyStreak - 1) * POINTS.DAILY_STREAK_BONUS;

        userData.points += bonusPoints;
        userData.lastDaily = now;

        transaction.set(userRef, userData, { merge: true });

        result = {
            claimed: true,
            points: bonusPoints,
            streak: userData.dailyStreak,
            nextClaimTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        };
    });

    if (result.claimed) {
        logger.info({
            userId,
            bonusPoints: result.points,
            streak: result.streak,
        }, 'Daily bonus claimed via transaction');
    }

    return result;
}

export default {
    claimDailyBonus,
};
