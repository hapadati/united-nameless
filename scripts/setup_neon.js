// Imports removed as we use raw SQL for initial setup
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

// User provided connection string
const connectionString = 'postgresql://neondb_owner:npg_THcP94oAIukd@ep-hidden-art-a10wkqj9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
    console.log('🔌 Connecting to Neon...');
    const pool = new Pool({ connectionString, ssl: true });
    const db = drizzle(pool);

    console.log('🚀 Running database migrations (creating tables)...');

    // Quick & Dirty Migration: Create tables if not exist using raw SQL for simplicity in this script
    // (Drizzle-kit usually handles this, but for "quick setup" this is reliable)

    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                points_earned INTEGER DEFAULT 0,
                xp_earned INTEGER DEFAULT 0,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ table created: activity_logs');

        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL,
                reference_id TEXT,
                balance_snapshot INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ table created: transactions');

        await client.query(`
            CREATE TABLE IF NOT EXISTS quest_definitions (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL,
                target_id TEXT,
                required_count INTEGER DEFAULT 1,
                reward_points INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ table created: quest_definitions');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
        console.log('✨ Setup complete!');
        process.exit(0);
    }
}

main().catch(console.error);
