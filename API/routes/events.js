import { calculateMessagePoints, calculateVoicePoints } from '../services/pointService.js';
import { checkAntiNuke, getLockdownStatus } from '../services/auditService.js';
import { validateRequired, isValidUserId, isValidGuildId } from '../utils/validators.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';
import { getFirestore } from '../config/firebase.js';

const db = getFirestore();

/**
 * イベント系ルートを登録
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function eventsRoutes(fastify) {
    const rateLimiter = createRateLimiter('events');

    // POST /events/message - メッセージポイント付与
    fastify.post('/events/message', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, guildId, channelId, messageId } = request.body;

        // バリデーション
        const validation = validateRequired(request.body, ['userId', 'guildId']);
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

        try {
            const result = await calculateMessagePoints(userId, guildId);

            // 活動ログ保存 (Activity Log)
            if (result.points > 0) {
                await db.collection('activity_logs').add({
                    userId,
                    type: 'MESSAGE',
                    description: `Earned ${result.points} pts by chatting`,
                    pointsEarned: result.points,
                    channelId,
                    createdAt: new Date().toISOString()
                });
            }

            const lockdownStatus = await getLockdownStatus();

            return reply.send({
                success: true,
                earnedPoints: result.points,
                totalPoints: result.total,
                onCooldown: result.cooldown,
                lockdownActive: lockdownStatus.active,
                lockdownReason: lockdownStatus.reason,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId, guildId }, 'Failed to process message event');
            throw error;
        }
    });

    // POST /events/voice - VC滞在時間計算
    fastify.post('/events/voice', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, guildId, event, durationSeconds } = request.body;

        // バリデーション
        const validation = validateRequired(request.body, ['userId', 'guildId', 'event']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                missing: validation.missing,
                timestamp: new Date().toISOString(),
            });
        }

        try {
            // 退室時のみポイント計算
            if (event === 'leave' && durationSeconds) {
                const result = await calculateVoicePoints(userId, durationSeconds);

                // 活動ログ保存
                if (result.points > 0) {
                    await db.collection('activity_logs').add({
                        userId,
                        type: 'VOICE',
                        description: `Earned ${result.points} pts in Voice Chat`,
                        pointsEarned: result.points,
                        durationSeconds,
                        createdAt: new Date().toISOString()
                    });
                }

                const lockdownStatus = await getLockdownStatus();

                return reply.send({
                    success: true,
                    event,
                    earnedPoints: result.points,
                    totalPoints: result.total,
                    durationSeconds,
                    lockdownActive: lockdownStatus.active,
                    lockdownReason: lockdownStatus.reason,
                    timestamp: new Date().toISOString(),
                });
            }

            const lockdownStatus = await getLockdownStatus();
            // 参加・ミュート・配信などは記録のみ
            return reply.send({
                success: true,
                event,
                message: 'Event recorded',
                lockdownActive: lockdownStatus.active,
                lockdownReason: lockdownStatus.reason,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId, guildId, event }, 'Failed to process voice event');
            throw error;
        }
    });

    // POST /events/audit - Anti-Nuke判定 (変更なし)
    fastify.post('/events/audit', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, action, details } = request.body;
        const validation = validateRequired(request.body, ['userId', 'action']);
        if (!validation.valid) {
            return reply.code(400).send({ error: 'Missing required fields', missing: validation.missing });
        }
        try {
            const result = await checkAntiNuke(userId, action, details);
            return reply.send({
                success: true,
                shouldLockdown: result.shouldLockdown,
                actionCount: result.actionCount,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, userId, action }, 'Failed to process audit event');
            throw error;
        }
    });

    // POST /events/bot-join (変更なし)
    fastify.post('/events/bot-join', { preHandler: rateLimiter }, async (request, reply) => {
        const { botId, botName, permissions, addedBy } = request.body;
        const validation = validateRequired(request.body, ['botId', 'permissions']);
        if (!validation.valid) {
            return reply.code(400).send({ error: 'Missing fields' });
        }
        try {
            const dangerousPerms = ['ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_ROLES', 'BAN_MEMBERS', 'KICK_MEMBERS'];
            const hasDangerousPerms = permissions.some((perm) => dangerousPerms.includes(perm));
            if (hasDangerousPerms) {
                logger.warn({ botId, botName, permissions, addedBy }, 'Dangerous bot detected');
            }
            const lockdownStatus = await getLockdownStatus();
            return reply.send({
                success: true,
                isDangerous: hasDangerousPerms,
                dangerousPermissions: permissions.filter((perm) => dangerousPerms.includes(perm)),
                lockdownActive: lockdownStatus.active,
                lockdownReason: lockdownStatus.reason,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ error: error.message, botId }, 'Failed to process bot-join event');
            throw error;
        }
    });

    // Get History (New Feature)
    fastify.get('/events/history', { preHandler: rateLimiter }, async (request, reply) => {
        const { userId, limit = 10 } = request.query;
        if (!userId) return reply.code(400).send({ error: 'Missing userId' });

        try {
            const logs = await db.collection('activity_logs')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(parseInt(limit, 10))
                .get();

            const history = logs.docs.map(doc => doc.data());
            return reply.send({
                userId,
                history,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to get history');
            throw error;
        }
    });
}
