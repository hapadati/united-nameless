/**
 * レート制限ミドルウェア
 */

import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '../utils/logger.js';
import { RATE_LIMITS } from '../config/constants.js';

// レート制限インスタンス
const rateLimiters = {
    events: new RateLimiterMemory({
        points: RATE_LIMITS.EVENTS,
        duration: 1,
    }),
    economy: new RateLimiterMemory({
        points: RATE_LIMITS.ECONOMY,
        duration: 1,
    }),
    admin: new RateLimiterMemory({
        points: RATE_LIMITS.ADMIN,
        duration: 1,
    }),
    default: new RateLimiterMemory({
        points: RATE_LIMITS.DEFAULT,
        duration: 1,
    }),
};

/**
 * レート制限ミドルウェアを生成
 * @param {'events'|'economy'|'admin'|'default'} type
 * @returns {Function}
 */
export function createRateLimiter(type = 'default') {
    const limiter = rateLimiters[type] || rateLimiters.default;

    return async (request, reply) => {
        const key = request.botId || request.ip;

        try {
            await limiter.consume(key);
        } catch (error) {
            logger.warn({ key, type, path: request.url }, 'Rate limit exceeded');
            return reply.code(429).send({
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(error.msBeforeNext / 1000),
                timestamp: new Date().toISOString(),
            });
        }
    };
}

export default createRateLimiter;
