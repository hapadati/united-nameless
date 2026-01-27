/**
 * チュートリアルクエスト初期化スクリプト
 * 
 * 使用方法:
 * node scripts/init-tutorial-quests.js
 */

import { getFirestore } from '../config/firebase.js';

const db = getFirestore();

const TUTORIAL_QUESTS = [
    {
        title: '[Tutorial] VCデビュー',
        description: 'ボイスチャンネルに1分以上参加してみよう！新たな仲間との会話を楽しんで。',
        type: 'VOICE_JOIN',
        requiredCount: 1, // 1分
        rewardPoints: 100,
        createdBy: 'system'
    },
    {
        title: '[Tutorial] 仲間を増やそう',
        description: 'サーバーに友達を1人招待しよう！コミュニティを盛り上げてください。',
        type: 'INVITE_USER',
        requiredCount: 1, // 1人
        rewardPoints: 300,
        createdBy: 'system'
    },
    {
        title: '[Tutorial] 自己紹介',
        description: '自己紹介チャンネル（または任意のチャンネル）で挨拶してみよう！',
        type: 'MESSAGE_IN_CHANNEL',
        targetId: null, // チャンネル指定なし（本来は自己紹介CHのIDを入れると良い）
        requiredCount: 1, // 1回
        rewardPoints: 50,
        createdBy: 'system'
    }
];

async function initTutorialQuests() {
    try {
        console.log('Initializing Tutorial Quests...');

        const batch = db.batch();
        const questsRef = db.collection('quests');

        for (const quest of TUTORIAL_QUESTS) {
            // タイトルで既存チェック（重複作成防止）
            const existing = await questsRef.where('title', '==', quest.title).get();
            if (!existing.empty) {
                console.log(`Skipping existing quest: ${quest.title}`);
                continue;
            }

            const docRef = questsRef.doc();
            batch.set(docRef, {
                id: docRef.id,
                ...quest,
                isActive: true,
                createdAt: new Date().toISOString()
            });
            console.log(`Scheduled creation: ${quest.title}`);
        }

        await batch.commit();
        console.log('✓ Tutorial Quests initialized successfully');

    } catch (error) {
        console.error('Error initializing quests:', error);
        process.exit(1);
    }

    process.exit(0);
}

initTutorialQuests();
