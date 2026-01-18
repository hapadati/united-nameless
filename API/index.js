/**
 * UNITED NAMELESS Bot - API Server
 * セキュリティ特化型APIサーバー
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';

import { initializeFirebase } from './config/firebase.js';
import authMiddleware from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

import eventsRoutes from './routes/events.js';
import economyRoutes from './routes/economy.js';
import adminRoutes from './routes/admin.js';
import questRoutes from './routes/quests.js';

// 環境変数読み込み
dotenv.config();

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// Fastifyインスタンス作成
const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
});

/**
 * サーバーを初期化して起動
 */
async function start() {
    try {
        // 環境変数チェック
        const requiredEnvVars = ['BOT_ID', 'JWT_SECRET', 'TOTP_SECRET'];
        const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

        if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            missingVars.push('FIREBASE_SERVICE_ACCOUNT (or FIREBASE_SERVICE_ACCOUNT_PATH)');
        }

        if (missingVars.length > 0) {
            logger.error({ missingVars }, '❌ Missing required environment variables');
            console.error('\n必須の環境変数が設定されていません:');
            missingVars.forEach((varName) => console.error(`  - ${varName}`));
            console.error('\n.env.exampleを参考に.envファイルを作成してください。\n');
            process.exit(1);
        }

        // Firebase初期化
        initializeFirebase();

        // CORS設定
        await fastify.register(cors, {
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
        });

        // セキュリティヘッダー
        await fastify.register(helmet, {
            contentSecurityPolicy: false, // API用のため無効化
        });

        // グローバルエラーハンドラー
        fastify.setErrorHandler(errorHandler);

        // Bot認証ミドルウェア（全エンドポイントに適用）
        fastify.addHook('preHandler', authMiddleware);

        // ヘルスチェックエンドポイント（認証不要）
        fastify.get('/health', { preHandler: [] }, async (request, reply) => {
            return reply.send({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        });

        // ルート登録
        await fastify.register(eventsRoutes, { prefix: '/events' });
        await fastify.register(economyRoutes, { prefix: '/economy' });
        await fastify.register(adminRoutes, { prefix: '/admin' });
        await fastify.register(questRoutes, { prefix: '/quests' });

        // サーバー起動
        await fastify.listen({ port: PORT, host: HOST });

        logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 UNITED NAMELESS API Server                          ║
║                                                           ║
║   Status: Running                                         ║
║   Port: ${PORT}                                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                           ║
║   📡 Endpoints:                                           ║
║   - GET  /health                                          ║
║   - POST /events/message                                  ║
║   - POST /events/voice                                    ║
║   - POST /events/audit                                    ║
║   - POST /events/bot-join                                 ║
║   - GET  /economy/balance                                 ║
║   - GET  /economy/rank                                    ║
║   - GET  /economy/leaderboard                             ║
║   - POST /economy/convert                                 ║
║   - POST /economy/daily                                   ║
║   - GET  /admin/check                                     ║
║   - POST /admin/lockdown    (TOTP Required)               ║
║   - POST /admin/unlock      (TOTP Required)               ║
║   - GET  /admin/audit-log   (TOTP Required)               ║
║                                                           ║
║   🔒 Security: Bot Auth + TOTP + Rate Limiting            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
    } catch (error) {
        logger.error(error, '❌ Failed to start server');
        process.exit(1);
    }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
    process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        await fastify.close();
        process.exit(0);
    });
});

// サーバー起動
start();
