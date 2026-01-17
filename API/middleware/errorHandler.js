/**
 * グローバルエラーハンドリングミドルウェア
 */

import logger from '../utils/logger.js';

/**
 * エラーハンドラー
 * @param {Error} error
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export function errorHandler(error, request, reply) {
    logger.error({
        error: error.message,
        stack: error.stack,
        path: request.url,
        method: request.method,
    }, 'Request error');

    // バリデーションエラー
    if (error.validation) {
        return reply.code(400).send({
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.validation,
            timestamp: new Date().toISOString(),
        });
    }

    // Fastify エラー
    if (error.statusCode) {
        return reply.code(error.statusCode).send({
            error: error.message,
            code: error.code || 'ERROR',
            timestamp: new Date().toISOString(),
        });
    }

    // 未知のエラー
    return reply.code(500).send({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
    });
}

export default errorHandler;
