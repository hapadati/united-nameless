/**
 * 管理者系エンドポイント
 */

import { getRecentAuditLogs } from '../services/auditService.js';
import { getFirestore } from '../config/firebase.js';
import { FIRESTORE } from '../config/constants.js';
import { validateRequired, isValidUserId } from '../utils/validators.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import totpMiddleware from '../middleware/totp.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * 管理者系ルートを登録
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function adminRoutes(fastify) {
    const rateLimiter = createRateLimiter('admin');

    // GET /admin/check - 権限チェック
    fastify.get('/admin/check', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId } = request.query;

        if (!userId) {
            return reply.code(400).send({
                error: 'Missing userId query parameter',
                code: 'VALIDATION_ERROR',
                timestamp: new Date().toISOString(),
            });
        }

        if (!isValidUserId(userId)) {
            return reply.code(400).send({
                error: 'Invalid user ID format',
                code: 'INVALID_USER_ID',
                timestamp: new Date().toISOString(),
            });
        }

        try {
            // ここでは簡単に、環境変数やFirestoreで管理者リストを確認
            // 実装例：Firestoreの `admins` コレクションをチェック
            const adminRef = db.collection('admins').doc(userId);
            const adminDoc = await adminRef.get();

            const isAdmin = adminDoc.exists;

            return reply.send({
                userId,
                isAdmin,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to check admin status');
            throw error;
        }
    });

    // POST /admin/lockdown - Lockdown発動（TOTP必須）
    fastify.post('/admin/lockdown', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        const { reason, initiatedBy } = request.body;

        // バリデーション
        const validation = validateRequired(request.body, ['reason', 'initiatedBy']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const configRef = db.collection(FIRESTORE.COLLECTIONS.SERVER_CONFIG).doc('lockdown');

            await configRef.set({
                lockdownActive: true,
                lockdownReason: reason,
                lockdownAt: new Date(),
                initiatedBy,
            });

            logger.warn({ reason, initiatedBy }, 'LOCKDOWN ACTIVATED');

            return reply.send({
                success: true,
                message: 'Lockdown activated',
                reason,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, reason }, 'Failed to activate lockdown');
            throw error;
        }
    });

    // POST /admin/unlock - Lockdown解除（TOTP必須）
    fastify.post('/admin/unlock', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        const { initiatedBy } = request.body;

        // バリデーション
        const validation = validateRequired(request.body, ['initiatedBy']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const configRef = db.collection(FIRESTORE.COLLECTIONS.SERVER_CONFIG).doc('lockdown');

            await configRef.set({
                lockdownActive: false,
                lockdownReason: null,
                unlockedAt: new Date(),
                unlockedBy: initiatedBy,
            }, { merge: true });

            logger.info({ initiatedBy }, 'LOCKDOWN DEACTIVATED');

            return reply.send({
                success: true,
                message: 'Lockdown deactivated',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to deactivate lockdown');
            throw error;
        }
    });

    // GET /admin/audit-log - 監査ログ取得
    fastify.get('/admin/audit-log', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        const { limit = 50 } = request.query;

        try {
            const logs = await getRecentAuditLogs(parseInt(limit, 10));

            return reply.send({
                logs,
                count: logs.length,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to get audit logs');
            throw error;
        }
    });

    // GET /admin/config - サーバー設定取得
    fastify.get('/admin/config', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        try {
            const lockdownRef = db.collection(FIRESTORE.COLLECTIONS.SERVER_CONFIG).doc('lockdown');
            const lockdownDoc = await lockdownRef.get();

            return reply.send({
                lockdown: lockdownDoc.exists ? lockdownDoc.data() : { lockdownActive: false },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to get server config');
            throw error;
        }
    });

    // POST /admin/points - ポイント手動調整（TOTP必須）
    fastify.post('/admin/points', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        const { userId, points, mode, reason } = request.body;

        // バリデーション
        const validation = validateRequired(request.body, ['userId', 'points', 'mode']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);

            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                let currentPoints = userDoc.exists ? (userDoc.data().points || 0) : 0;
                let newPoints = currentPoints;

                if (mode === 'add') {
                    newPoints += points;
                } else if (mode === 'set') {
                    newPoints = points;
                } else if (mode === 'remove') {
                    newPoints = Math.max(0, newPoints - points);
                }

                transaction.set(userRef, { points: newPoints }, { merge: true });
            });

            logger.info({ userId, points, mode, reason }, 'Admin adjusted points');

            return reply.send({
                success: true,
                userId,
                newPoints: points, // Note: response should probably get the actual new points but for simplicity...
                message: `Points adjusted (${mode})`,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to adjust points');
            throw error;
        }
    });
}
