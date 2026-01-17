import { getFirestore } from '../config/firebase.js';
import { FIRESTORE } from '../config/constants.js';
import logger from '../utils/logger.js';

const db = getFirestore();

export const QUEST_TYPES = {
    MESSAGE_IN_CHANNEL: 'MESSAGE_IN_CHANNEL',
    // 将来的な拡張性:
    // VOICE_TIME: 'VOICE_TIME',
    // REACTION_ADD: 'REACTION_ADD'
};

/**
 * 新しいクエストを作成する (管理者用)
 */
export async function createQuest(questData) {
    const { title, description, type, targetId, requiredCount, rewardPoints, createdBy } = questData;

    try {
        const questRef = db.collection(FIRESTORE.COLLECTIONS.QUESTS || 'quests').doc();
        const newQuest = {
            id: questRef.id,
            title,
            description,
            type, // e.g., 'MESSAGE_IN_CHANNEL'
            targetId, // e.g., Channel ID
            requiredCount: parseInt(requiredCount, 10),
            rewardPoints: parseInt(rewardPoints, 10),
            createdBy,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        await questRef.set(newQuest);
        logger.info({ questId: newQuest.id, title }, 'Quest created');
        return newQuest;
    } catch (error) {
        logger.error({ error: error.message }, 'Failed to create quest');
        throw error;
    }
}

/**
 * アクティブなクエスト一覧を取得
 */
export async function getActiveQuests() {
    try {
        const snapshot = await db.collection(FIRESTORE.COLLECTIONS.QUESTS || 'quests')
            .where('isActive', '==', true)
            .get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        logger.error({ error: error.message }, 'Failed to get active quests');
        throw error;
    }
}

/**
 * クエストの進捗を更新・チェックする (Botから呼ばれる)
 * @param {string} userId
 * @param {object} action { type: 'MESSAGE_IN_CHANNEL', channelId: '...' }
 */
export async function processQuestProgress(userId, action) {
    const { type, channelId } = action;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (デイリークエスト用)

    // 1. アクティブなクエストを取得
    // 実際にはキャッシュなどを使うべきだが、ここではFirestoreクエリ
    const activeQuests = await getActiveQuests();

    // タイプが一致するクエストのみフィルタリング
    // 例: メッセージ投稿系のクエストで、かつチャンネルが一致するもの
    const relevantQuests = activeQuests.filter(q => {
        if (q.type !== type) return false;
        if (q.type === QUEST_TYPES.MESSAGE_IN_CHANNEL && q.targetId !== channelId) return false;
        return true;
    });

    if (relevantQuests.length === 0) return { completed: [] };

    const completedQuests = [];
    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return; // ユーザー未登録なら何もしない

        const userData = userDoc.data();
        const questProgress = userData.questProgress || {}; // { [questId]: { date: '...', count: 0, completed: false } }

        let shouldUpdate = false;
        let earnedPoints = 0;

        for (const quest of relevantQuests) {
            // プログレス取得 (デイリーリセット判定)
            const currentProgress = questProgress[quest.id] || { date: today, count: 0, completed: false };

            // 日付が変わっていたらリセット
            if (currentProgress.date !== today) {
                currentProgress.date = today;
                currentProgress.count = 0;
                currentProgress.completed = false;
            }

            if (currentProgress.completed) continue; // 既に本日クリア済み

            // カウント進行
            currentProgress.count += 1;
            shouldUpdate = true;

            // 達成確認
            if (currentProgress.count >= quest.requiredCount) {
                currentProgress.completed = true;
                currentProgress.completedAt = new Date().toISOString();

                earnedPoints += quest.rewardPoints;
                completedQuests.push({
                    questId: quest.id,
                    title: quest.title,
                    rewardPoints: quest.rewardPoints,
                    message: `🎉 クエスト「${quest.title}」を達成しました！ +${quest.rewardPoints}pt`
                });
            }

            questProgress[quest.id] = currentProgress;
        }

        if (shouldUpdate) {
            const newPoints = (userData.points || 0) + earnedPoints;
            transaction.update(userRef, {
                questProgress,
                points: newPoints
            });
        }
    });

    return { completed: completedQuests };
}
