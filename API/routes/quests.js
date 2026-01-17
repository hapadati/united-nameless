import { createQuest, getActiveQuests, processQuestProgress, QUEST_TYPES } from '../services/questService.js';
import { validateRequired } from '../utils/validators.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';

/**
 * Quest系エンドポイント
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function questRoutes(fastify) {
    const rateLimiter = createRateLimiter('quests');

    // GET /quests/active - アクティブなクエスト一覧
    fastify.get('/quests/active', { preHandler: rateLimiter }, async (request, reply) => {
        try {
            const quests = await getActiveQuests();
            return reply.send({
                quests,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to get active quests');
            throw error;
        }
    });

    // POST /quests - クエスト作成 (本来は管理者認証が必要)
    fastify.post('/quests', { preHandler: rateLimiter }, async (request, reply) => {
        // 簡易的なAdmin認証: ヘッダーに `X-Admin-Key` を要求 (Webから送信させる)
        // 環境変数 ADMIN_SECRET と照合。設定なければ誰でも作れてしまうので注意書きする
        const adminKey = request.headers['x-admin-key'];
        const serverAdminKey = process.env.ADMIN_SECRET || 'CHANGE_THIS_IN_PROD'; // デフォルトキー

        if (adminKey !== serverAdminKey) {
            return reply.code(403).send({ error: 'Unauthorized', code: 'FORBIDDEN' });
        }

        const validation = validateRequired(request.body, ['title', 'type', 'requiredCount', 'rewardPoints']);
        if (!validation.valid) {
            return reply.code(400).send({
                error: 'Missing required fields',
                missing: validation.missing
            });
        }

        try {
            const newQuest = await createQuest(request.body);
            return reply.send({
                success: true,
                quest: newQuest,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to create quest');
            throw error;
        }
    });

    // POST /quests/progress - Botからの進捗報告
    fastify.post('/quests/progress', { preHandler: rateLimiter }, async (request, reply) => {
        // Bot認証はGlobal Middlewareで行われている想定だが、念のためチェック
        // request.headers['x-bot-id'] は index.js でチェック済

        const { userId, type, context } = request.body;
        // context: { channelId, etc. }

        if (!userId || !type) {
            return reply.code(400).send({ error: 'Missing userId or type' });
        }

        try {
            const result = await processQuestProgress(userId, { type, ...context });
            return reply.send({
                success: true,
                completed: result.completed, // 達成したクエストの配列
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, userId }, 'Failed to process quest progress');
            throw error;
        }
    });
}
