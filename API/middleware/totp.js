/**
 * TOTP検証ミドルウェア
 * 管理者操作用の2段階認証
 */

import speakeasy from 'speakeasy';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const TOTP_SECRET = process.env.TOTP_SECRET;

/**
 * TOTP検証ミドルウェア
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function totpMiddleware(request, reply) {
    const token = request.headers['x-totp-token'];

    if (!token) {
        logger.warn({ path: request.url }, 'Missing TOTP token');
        return reply.code(403).send({
            error: 'TOTP token required for this operation',
            code: 'MISSING_TOTP',
            timestamp: new Date().toISOString(),
        });
    }

    const verified = speakeasy.totp.verify({
        secret: TOTP_SECRET,
        encoding: 'base32',
        token: token,
        window: 2, // ±2ステップの時間差を許容
    });

    if (!verified) {
        logger.warn({ path: request.url }, 'Invalid TOTP token');
        return reply.code(403).send({
            error: 'Invalid TOTP token',
            code: 'INVALID_TOTP',
            timestamp: new Date().toISOString(),
        });
    }

    // TOTP検証成功
    logger.info({ path: request.url }, 'TOTP verified');
}

export default totpMiddleware;
