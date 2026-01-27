/**
 * 管理者系エンドポイント
 */

import speakeasy from 'speakeasy';
import { getRecentAuditLogs } from '../services/auditService.js';
import { getFirestore } from '../config/firebase.js';
import { FIRESTORE } from '../config/constants.js';
import { validateRequired, isValidUserId } from '../utils/validators.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import totpMiddleware from '../middleware/totp.js';
import logger from '../utils/logger.js';

const db = getFirestore();
const SUPER_ADMIN_UID = process.env.SUPER_ADMIN_UID || '1420014044055732327';

/**
 * SuperAdmin権限チェック用ヘルパー
 */
async function checkSuperAdmin(userId) {
    if (!userId) return false;

    // 固定UIDのチェック
    if (userId === SUPER_ADMIN_UID) return true;

    // SuperAdminsコレクションのチェック
    const superAdminDoc = await db.collection('superAdmins').doc(userId).get();
    return superAdminDoc.exists;
}

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

    // GET /admin/super-check - SuperAdmin権限チェック
    fastify.get('/admin/super-check', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId } = request.query;

        if (!userId) {
            return reply.code(400).send({
                error: 'Missing userId query parameter',
                code: 'VALIDATION_ERROR',
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const isSuperAdmin = await checkSuperAdmin(userId);

            return reply.send({
                userId,
                isSuperAdmin,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to check super admin status');
            throw error;
        }
    });

    // POST /admin/request-access - Admin権限リクエスト
    fastify.post('/admin/request-access', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, reason } = request.body;

        const validation = validateRequired(request.body, ['userId', 'reason']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        try {
            // 既に承認待ちまたは承認済みかチェック
            const existingRequests = await db.collection('adminApprovals')
                .where('userId', '==', userId)
                .where('status', 'in', ['pending', 'approved'])
                .limit(1)
                .get();

            if (!existingRequests.empty) {
                const existing = existingRequests.docs[0].data();
                return reply.code(400).send({
                    error: 'Request already exists',
                    code: 'DUPLICATE_REQUEST',
                    status: existing.status,
                    timestamp: new Date().toISOString(),
                });
            }

            // 新しいリクエストを作成
            const requestRef = db.collection('adminApprovals').doc();
            await requestRef.set({
                userId,
                reason,
                status: 'pending',
                requestedAt: new Date(),
            });

            logger.info({ userId, requestId: requestRef.id }, 'Admin access requested');

            return reply.send({
                success: true,
                requestId: requestRef.id,
                message: 'Request submitted for approval',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to create admin request');
            throw error;
        }
    });

    // GET /admin/approvals - 承認待ちリスト取得 (SuperAdmin only)
    fastify.get('/admin/approvals', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId } = request.query;

        if (!userId) {
            return reply.code(400).send({
                error: 'Missing userId query parameter',
                code: 'VALIDATION_ERROR',
                timestamp: new Date().toISOString(),
            });
        }

        // SuperAdminチェック
        const isSuperAdmin = await checkSuperAdmin(userId);
        if (!isSuperAdmin) {
            return reply.code(403).send({
                error: 'Super admin access required',
                code: 'FORBIDDEN',
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const pendingRequests = await db.collection('adminApprovals')
                .where('status', '==', 'pending')
                .orderBy('requestedAt', 'desc')
                .get();

            const requests = pendingRequests.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                requestedAt: doc.data().requestedAt?.toDate().toISOString(),
            }));

            return reply.send({
                requests,
                count: requests.length,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to fetch approval requests');
            throw error;
        }
    });

    //POST /admin/approve - Admin権限承認 (SuperAdmin only, TOTP required)
    fastify.post('/admin/approve', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        const { requestId, userId: requestingUserId, approvedBy } = request.body;

        const validation = validateRequired(request.body, ['requestId', 'userId', 'approvedBy']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        // SuperAdminチェック
        const isSuperAdmin = await checkSuperAdmin(approvedBy);
        if (!isSuperAdmin) {
            return reply.code(403).send({
                error: 'Super admin access required',
                code: 'FORBIDDEN',
                timestamp: new Date().toISOString(),
            });
        }

        try {
            // リクエストの存在確認
            const requestRef = db.collection('adminApprovals').doc(requestId);
            const requestDoc = await requestRef.get();

            if (!requestDoc.exists) {
                return reply.code(404).send({
                    error: 'Request not found',
                    code: 'NOT_FOUND',
                    timestamp: new Date().toISOString(),
                });
            }

            const requestData = requestDoc.data();
            if (requestData.status !== 'pending') {
                return reply.code(400).send({
                    error: 'Request already processed',
                    code: 'ALREADY_PROCESSED',
                    status: requestData.status,
                    timestamp: new Date().toISOString(),
                });
            }

            // Adminsコレクションに追加
            await db.collection('admins').doc(requestingUserId).set({
                userId: requestingUserId,
                totpEnabled: false, // 初回は無効、セットアップ必須
                grantedAt: new Date(),
                grantedBy: approvedBy,
                isSuperAdmin: false,
            });

            // リクエストのステータスを更新
            await requestRef.update({
                status: 'approved',
                approvedBy,
                approvedAt: new Date(),
            });

            logger.info({ requestId, userId: requestingUserId, approvedBy }, 'Admin access approved');

            return reply.send({
                success: true,
                message: 'Admin access granted',
                userId: requestingUserId,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, requestId }, 'Failed to approve admin request');
            throw error;
        }
    });

    // POST /admin/reject - Admin権限却下 (SuperAdmin only, TOTP required)
    fastify.post('/admin/reject', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        const { requestId, rejectedBy, reason } = request.body;

        const validation = validateRequired(request.body, ['requestId', 'rejectedBy']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        // SuperAdminチェック
        const isSuperAdmin = await checkSuperAdmin(rejectedBy);
        if (!isSuperAdmin) {
            return reply.code(403).send({
                error: 'Super admin access required',
                code: 'FORBIDDEN',
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const requestRef = db.collection('adminApprovals').doc(requestId);
            const requestDoc = await requestRef.get();

            if (!requestDoc.exists) {
                return reply.code(404).send({
                    error: 'Request not found',
                    code: 'NOT_FOUND',
                    timestamp: new Date().toISOString(),
                });
            }

            const requestData = requestDoc.data();
            if (requestData.status !== 'pending') {
                return reply.code(400).send({
                    error: 'Request already processed',
                    code: 'ALREADY_PROCESSED',
                    status: requestData.status,
                    timestamp: new Date().toISOString(),
                });
            }

            // リクエストのステータスを更新
            await requestRef.update({
                status: 'rejected',
                rejectedBy,
                rejectedAt: new Date(),
                rejectedReason: reason || 'No reason provided',
            });

            logger.info({ requestId, rejectedBy, reason }, 'Admin request rejected');

            return reply.send({
                success: true,
                message: 'Request rejected',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, requestId }, 'Failed to reject admin request');
            throw error;
        }
    });

    // GET /totp/setup - TOTP設定用QRコード取得 (Admin only)
    fastify.get('/totp/setup', { preHandler: rateLimiter }, async (request, reply) => {
        if (!process.env.TOTP_SECRET) {
            return reply.code(500).send({ error: 'TOTP_SECRET not configured on server' });
        }

        try {
            const secret = process.env.TOTP_SECRET;
            const otpauth_url = speakeasy.otpauthURL({
                secret: secret,
                label: `UnitedNameless (${process.env.NODE_ENV})`,
                algorithm: 'sha1',
                encoding: 'base32'
            });

            return reply.send({
                secret: secret,
                otpauth_url,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to generate TOTP setup');
            throw error;
        }
    });

    // POST /totp/verify - TOTPコード検証 (Setup完了確認用)
    fastify.post('/totp/verify', { preHandler: rateLimiter }, async (request, reply) => {
        const { code } = request.body;
        if (!code) return reply.code(400).send({ error: 'Missing code' });

        const verified = speakeasy.totp.verify({
            secret: process.env.TOTP_SECRET,
            encoding: 'base32',
            token: code,
            window: 2,
        });

        if (verified) {
            return reply.send({ success: true, message: 'Verified' });
        } else {
            return reply.code(403).send({ success: false, error: 'Invalid Code' });
        }
    });

    // POST /lockdown - Lockdown発動（TOTP必須）
    fastify.post('/lockdown', { preHandler: [rateLimiter, totpMiddleware] }, async (request, reply) => {
        const { reason, initiatedBy } = request.body;

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
            logger.warn({ reason, initiatedBy }, 'EMERGENCY LOCKDOWN INITIATED');

            // Lockdownフラグを設定
            await db.collection('systemStatus').doc('lockdown').set({
                active: true,
                reason,
                initiatedBy,
                initiatedAt: new Date(),
            });

            return reply.send({
                success: true,
                message: 'Lockdown activated',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to activate lockdown');
            throw error;
        }
    });

    // GET /audit - 監査ログ取得
    fastify.get('/audit', { preHandler: rateLimiter }, async (request, reply) => {
        const { limit = 50, offset = 0 } = request.query;

        try {
            const logs = await getRecentAuditLogs(parseInt(limit), parseInt(offset));
            return reply.send({
                logs,
                count: logs.length,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to fetch audit logs');
            throw error;
        }
    });
}
