/**
 * 通報管理エンドポイント
 */

import { getFirestore } from '../config/firebase.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * 通報管理ルートを登録
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function reportsRoutes(fastify) {
    const rateLimiter = createRateLimiter('reports');

    // GET /reports - 通報一覧取得 (Admin only)
    fastify.get('/reports', { preHandler: rateLimiter }, async (request, reply) => {
        const { status, limit = 50, offset = 0 } = request.query;

        try {
            let query = db.collection('reports').orderBy('reportedAt', 'desc');

            if (status && status !== 'all') {
                query = query.where('status', '==', status);
            }

            const snapshot = await query
                .limit(parseInt(limit))
                .offset(parseInt(offset))
                .get();

            const reports = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                reportedAt: doc.data().reportedAt?.toDate().toISOString(),
                reviewedAt: doc.data().reviewedAt?.toDate().toISOString()
            }));

            return reply.send({
                reports,
                count: reports.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to fetch reports');
            throw error;
        }
    });

    // GET /reports/:id - 通報詳細取得
    fastify.get('/reports/:id', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;

        try {
            const reportRef = db.collection('reports').doc(id);
            const reportDoc = await reportRef.get();

            if (!reportDoc.exists) {
                return reply.code(404).send({
                    error: 'Report not found',
                    code: 'NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            const data = reportDoc.data();
            return reply.send({
                id: reportDoc.id,
                ...data,
                reportedAt: data.reportedAt?.toDate().toISOString(),
                reviewedAt: data.reviewedAt?.toDate().toISOString(),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, reportId: id }, 'Failed to fetch report');
            throw error;
        }
    });

    // PATCH /reports/:id - 通報ステータス更新
    fastify.patch('/reports/:id', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;
        const { status, action, notes, reviewedBy } = request.body;

        try {
            const reportRef = db.collection('reports').doc(id);
            const reportDoc = await reportRef.get();

            if (!reportDoc.exists) {
                return reply.code(404).send({
                    error: 'Report not found',
                    code: 'NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            const updateData = {
                reviewedAt: new Date()
            };

            if (status) updateData.status = status;
            if (action) updateData.action = action;
            if (notes) updateData.notes = notes;
            if (reviewedBy) updateData.reviewedBy = reviewedBy;

            await reportRef.update(updateData);

            logger.info({
                reportId: id,
                status,
                action,
                reviewedBy
            }, 'Report updated');

            return reply.send({
                success: true,
                reportId: id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, reportId: id }, 'Failed to update report');
            throw error;
        }
    });

    // DELETE /reports/:id - 通報削除 (Admin only, SuperAdmin recommended)
    fastify.delete('/reports/:id', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;
        const { deletedBy } = request.body;

        try {
            const reportRef = db.collection('reports').doc(id);
            const reportDoc = await reportRef.get();

            if (!reportDoc.exists) {
                return reply.code(404).send({
                    error: 'Report not found',
                    code: 'NOT_FOUND',
                    timestamp: new Date().toISOString()
                });
            }

            await reportRef.delete();

            logger.warn({
                reportId: id,
                deletedBy
            }, 'Report deleted');

            return reply.send({
                success: true,
                message: 'Report deleted',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, reportId: id }, 'Failed to delete report');
            throw error;
        }
    });

    // GET /reports/stats - 通報統計
    fastify.get('/reports/stats', { preHandler: rateLimiter }, async (request, reply) => {
        try {
            const [pendingSnapshot, reviewingSnapshot, resolvedSnapshot, dismissedSnapshot] = await Promise.all([
                db.collection('reports').where('status', '==', 'pending').get(),
                db.collection('reports').where('status', '==', 'reviewing').get(),
                db.collection('reports').where('status', '==', 'resolved').get(),
                db.collection('reports').where('status', '==', 'dismissed').get()
            ]);

            return reply.send({
                stats: {
                    pending: pendingSnapshot.size,
                    reviewing: reviewingSnapshot.size,
                    resolved: resolvedSnapshot.size,
                    dismissed: dismissedSnapshot.size,
                    total: pendingSnapshot.size + reviewingSnapshot.size + resolvedSnapshot.size + dismissedSnapshot.size
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to fetch report stats');
            throw error;
        }
    });
}
