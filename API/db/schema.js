import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// アクティビティログ (チャット、VCなどの行動履歴)
// アナリティクスやタイムライン表示に最適
export const activityLogs = pgTable('activity_logs', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type').notNull(), // MESSAGE, VOICE, QUEST etc.
    description: text('description').notNull(),
    pointsEarned: integer('points_earned').default(0),
    xpEarned: integer('xp_earned').default(0),
    metadata: jsonb('metadata'), // チャンネルIDなど
    createdAt: timestamp('created_at').defaultNow(),
});

// ポイント取引履歴 (Ledger)
// Firestoreの残高に対する「通帳」の役割
export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    amount: integer('amount').notNull(), // +/-
    type: text('type').notNull(), // DAILY, CHAT, SHOP_BUY, QUEST
    referenceId: text('reference_id'), // messageId, itemId etc.
    balanceSnapshot: integer('balance_snapshot'), // 取引後の残高(任意)
    createdAt: timestamp('created_at').defaultNow(),
});

// クエスト定義 (Master Data)
// 検索やリレーションが組みやすいためNeonで管理推奨
export const questDefinitions = pgTable('quest_definitions', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    type: text('type').notNull(), // MESSAGE, VOICE
    targetId: text('target_id'), // ChannelID etc.
    requiredCount: integer('required_count').default(1),
    rewardPoints: integer('reward_points').default(0),
    isActive: boolean('is_active').default(true),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').defaultNow(),
});
