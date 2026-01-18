import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

// DB接続プール作成
// DATABASE_URLがない場合はnull (Firestoreのみモード)
const pool = process.env.DATABASE_URL 
    ? new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: true
      }) 
    : null;

if (pool) {
    logger.info('Neon (PostgreSQL) connection pool initialized.');
} else {
    logger.warn('DATABASE_URL not found. Running in Firestore-only mode.');
}

export const db = pool ? drizzle(pool) : null;
export const isNeonEnabled = !!db;
