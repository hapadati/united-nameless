import { getUserRank, convertPointsToXP } from '../services/rankService.js';
import { claimDailyBonus } from '../services/dailyService.js';
import { getShopItems, buyItem, getUserInventory, useItem } from '../services/shopService.js';
import { getLockdownStatus } from '../services/auditService.js';
import { getFirestore } from '../config/firebase.js';
import { FIRESTORE } from '../config/constants.js';
import { validateRequired, isValidUserId, isValidPoints } from '../utils/validators.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * Economy系ルートを登録
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function economyRoutes(fastify) {
    const rateLimiter = createRateLimiter('economy');

    // GET /economy/balance - 残高取得
    fastify.get('/balance', { preHandler: rateLimiter }, async (request, reply) => {
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
            const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                const lockdownStatus = await getLockdownStatus();
                return reply.send({
                    userId,
                    points: 0,
                    xp: 0,
                    level: 0,
                    lockdownActive: lockdownStatus.active,
                    timestamp: new Date().toISOString(),
                });
            }

            const userData = userDoc.data();
            const lockdownStatus = await getLockdownStatus();

            return reply.send({
                userId,
                points: userData.points || 0,
                xp: userData.xp || 0,
                level: userData.level || 0,
                lockdownActive: lockdownStatus.active,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to get balance');
            throw error;
        }
    });

    // GET /economy/rank - ランク情報
    fastify.get('/rank', { preHandler: rateLimiter }, async (request, reply) => {
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
            const rankData = await getUserRank(userId);

            return reply.send({
                userId,
                ...rankData,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to get rank');
            throw error;
        }
    });

    // GET /economy/leaderboard - リーダーボード
    fastify.get('/leaderboard', { preHandler: rateLimiter }, async (request, reply) => {
        const { limit = 10 } = request.query;

        try {
            const users = await db.collection(FIRESTORE.COLLECTIONS.USERS)
                .orderBy('xp', 'desc')
                .limit(parseInt(limit, 10))
                .get();

            const leaderboard = users.docs.map((doc, index) => {
                const data = doc.data();
                return {
                    rank: index + 1,
                    userId: doc.id,
                    xp: data.xp || 0,
                    level: data.level || 0,
                    points: data.points || 0,
                };
            });

            return reply.send({
                leaderboard,
                count: leaderboard.length,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to get leaderboard');
            throw error;
        }
    });

    // POST /economy/convert - Point→XP変換
    fastify.post('/convert', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, points } = request.body;

        const validation = validateRequired(request.body, ['userId', 'points']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
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

        if (!isValidPoints(points)) {
            return reply.code(400).send({
                error: 'Invalid points value',
                code: 'INVALID_POINTS',
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const result = await convertPointsToXP(userId, points);
            const lockdownStatus = await getLockdownStatus();

            return reply.send({
                success: result.success,
                userId,
                convertedPoints: points,
                xpGained: result.xpGained,
                newXP: result.newXP,
                oldLevel: result.oldLevel,
                newLevel: result.newLevel,
                leveledUp: result.leveledUp,
                lockdownActive: lockdownStatus.active,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return reply.code(404).send({ error: 'User not found', code: 'USER_NOT_FOUND' });
            }
            if (error.message === 'Insufficient points') {
                return reply.code(400).send({ error: 'Insufficient points', code: 'INSUFFICIENT_POINTS' });
            }
            logger.error({ error: error.message, userId, points }, 'Failed to convert points');
            throw error;
        }
    });

    // POST /economy/daily - デイリーボーナス
    fastify.post('/daily', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId } = request.body;

        const validation = validateRequired(request.body, ['userId']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        if (!isValidUserId(userId)) {
            return reply.code(400).send({ error: 'Invalid user ID format', code: 'INVALID_USER_ID' });
        }

        try {
            const result = await claimDailyBonus(userId);
            return reply.send({
                success: result.claimed,
                userId,
                earnedPoints: result.points,
                streak: result.streak,
                nextClaimTime: result.nextClaimTime,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to claim daily bonus');
            throw error;
        }
    });

    // GET /economy/shop - ショップアイテム一覧
    fastify.get('/shop', { preHandler: rateLimiter }, async (request, reply) => {
        try {
            const items = await getShopItems();
            return reply.send({
                items,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to get shop items');
            throw error;
        }
    });

    // POST /economy/buy - アイテム購入
    fastify.post('/buy', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, itemId } = request.body;

        const validation = validateRequired(request.body, ['userId', 'itemId']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const result = await buyItem(userId, itemId);
            return reply.send({
                success: true,
                newPoints: result.newPoints,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            if (error.message === 'Insufficient points') {
                return reply.code(400).send({ error: 'Insufficient points', code: 'INSUFFICIENT_POINTS' });
            }
            if (error.message === 'Item not found') {
                return reply.code(404).send({ error: 'Item not found', code: 'ITEM_NOT_FOUND' });
            }
            logger.error({ error: error.message, userId, itemId }, 'Failed to buy item');
            throw error;
        }
    });

    // GET /economy/inventory - インベントリ取得
    fastify.get('/inventory', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId } = request.query;
        if (!userId) return reply.code(400).send({ error: 'Missing userId', code: 'VALIDATION_ERROR' });

        try {
            const items = await getUserInventory(userId);
            return reply.send({
                userId,
                items,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to get inventory');
            throw error;
        }
    });

    // POST /economy/use - アイテム使用
    fastify.post('/use', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, itemId } = request.body;
        if (!userId || !itemId) return reply.code(400).send({ error: 'Missing fields', code: 'VALIDATION_ERROR' });

        try {
            const result = await useItem(userId, itemId);
            return reply.send({
                success: true,
                message: result.message,
                itemName: result.itemName,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error.message === 'Item not in inventory') {
                return reply.code(400).send({ error: 'Item not in inventory', code: 'ITEM_NOT_OWNED' });
            }
            logger.error({ error: error.message, userId, itemId }, 'Failed to use item');
            throw error;
        }
    });
}
