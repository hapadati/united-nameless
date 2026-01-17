/**
 * Anti-Nuke監査サービス
 */

import { getFirestore } from '../config/firebase.js';
import { ANTI_NUKE, FIRESTORE } from '../config/constants.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * 監査ログを記録
 * @param {object} logData
 */
export async function recordAuditLog(logData) {
    const logRef = db.collection(FIRESTORE.COLLECTIONS.AUDIT_LOGS).doc();
    await logRef.set({
        ...logData,
        timestamp: new Date(),
    });
}

/**
 * サーバーのLockdown状態を取得
 * @returns {Promise<{ active: boolean, reason: string|null }>}
 */
export async function getLockdownStatus() {
    const configRef = db.collection(FIRESTORE.COLLECTIONS.SERVER_CONFIG).doc('lockdown');
    const doc = await configRef.get();

    if (!doc.exists) {
        return { active: false, reason: null };
    }

    return {
        active: doc.data().lockdownActive || false,
        reason: doc.data().lockdownReason || null,
    };
}

/**
 * Anti-Nuke判定
 * @param {string} userId - 実行者のID
 * @param {string} action - 操作種別
 * @param {object} details - 詳細情報
 * @returns {Promise<{ shouldLockdown: boolean, actionCount: number }>}
 */
export async function checkAntiNuke(userId, action, details = {}) {
    // すでにLockdown中なら何もしない
    const currentStatus = await getLockdownStatus();
    if (currentStatus.active) {
        return { shouldLockdown: true, actionCount: 0 };
    }

    // 危険な操作かチェック
    if (!ANTI_NUKE.DANGEROUS_ACTIONS.includes(action)) {
        await recordAuditLog({ userId, action, details, dangerous: false });
        return { shouldLockdown: false, actionCount: 0 };
    }

    // 監査ログを記録
    await recordAuditLog({ userId, action, details, dangerous: true });

    // 過去30秒以内の同ユーザーの危険操作を取得
    const now = new Date();
    const timeThreshold = new Date(now.getTime() - ANTI_NUKE.TIME_WINDOW * 1000);

    const recentLogs = await db.collection(FIRESTORE.COLLECTIONS.AUDIT_LOGS)
        .where('userId', '==', userId)
        .where('dangerous', '==', true)
        .where('timestamp', '>=', timeThreshold)
        .get();

    const actionCount = recentLogs.size;

    logger.warn({
        userId,
        action,
        actionCount,
        threshold: ANTI_NUKE.MAX_ACTIONS,
    }, 'Anti-Nuke check');

    // 閾値を超えた場合はLockdown
    if (actionCount >= ANTI_NUKE.MAX_ACTIONS) {
        logger.error({ userId, actionCount }, 'ANTI-NUKE TRIGGERED: Lockdown required');

        // 自動Lockdown実行
        const configRef = db.collection(FIRESTORE.COLLECTIONS.SERVER_CONFIG).doc('lockdown');
        await configRef.set({
            lockdownActive: true,
            lockdownReason: `Anti-Nuke Triggered by User ${userId}`,
            lockdownAt: new Date(),
            initiatedBy: 'SYSTEM',
        });

        return { shouldLockdown: true, actionCount };
    }

    return { shouldLockdown: false, actionCount };
}

/**
 * 最新の監査ログを取得
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentAuditLogs(limit = 50) {
    const logs = await db.collection(FIRESTORE.COLLECTIONS.AUDIT_LOGS)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

    return logs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

export default {
    recordAuditLog,
    checkAntiNuke,
    getRecentAuditLogs,
};
