/**
 * Bot認証ミドルウェア
 * X-Bot-ID ヘッダーを検証
 */

import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const VALID_BOT_ID = process.env.BOT_ID;

/**
 * Bot認証ミドルウェア
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function authMiddleware(request, reply) {
    const botId = request.headers['x-bot-id'];

    if (!botId) {
        logger.warn({ path: request.url }, 'Missing X-Bot-ID header');
        return reply.code(401).send({
            error: 'Missing X-Bot-ID header',
            code: 'MISSING_BOT_ID',
            timestamp: new Date().toISOString(),
        });
    }

    if (botId !== VALID_BOT_ID) {
        logger.warn({ botId, path: request.url }, 'Invalid Bot ID');
        return reply.code(401).send({
            error: 'Invalid Bot ID',
            code: 'INVALID_BOT_ID',
            timestamp: new Date().toISOString(),
        });
    }

    // 認証成功
    request.botId = botId;
}

export default authMiddleware;
