import { getFirestore } from '../config/firebase.js';
import { FIRESTORE } from '../config/constants.js';
import logger from '../utils/logger.js';

const db = getFirestore();

// アイテム定義 (本来はDB管理推奨だが、堅牢なコードベースとして定数定義を拡張)
export const SHOP_ITEMS = {
    'xp_boost_1h': {
        id: 'xp_boost_1h',
        name: 'XPブースト (1時間)',
        price: 500,
        description: '1時間の間、獲得XPが2倍になります。',
        type: 'buff',
        duration: 3600 * 1000,
        effect: { type: 'xp_multiplier', value: 2.0 }
    },
    'role_vip': {
        id: 'role_vip',
        name: 'VIPロール',
        price: 10000,
        description: 'サーバー内でVIPロールが付与されます（自動付与）。',
        type: 'role',
        roleId: 'VIP_ROLE_ID_HERE' // 環境変数等で管理すべき
    },
    'gacha_ticket': {
        id: 'gacha_ticket',
        name: 'ガチャチケット',
        price: 100,
        description: 'お楽しみガチャを1回回せます。',
        type: 'consumable',
        effect: { type: 'gacha_roll' }
    }
};

/**
 * ショップアイテム一覧を取得
 */
export async function getShopItems() {
    return Object.values(SHOP_ITEMS);
}

/**
 * アイテムを購入するトランザクション処理
 */
export async function buyItem(userId, itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) {
        throw new Error('Item not found');
    }

    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);

    return await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentPoints = userData.points || 0;

        if (currentPoints < item.price) {
            throw new Error('Insufficient points');
        }

        // ポイント減算
        const newPoints = currentPoints - item.price;

        // インベントリ更新
        const inventory = userData.inventory || [];
        // スタック可能にするか、個別履歴にするか。ここでは個別履歴として追加
        const newItem = {
            itemId: item.id,
            purchasedAt: new Date().toISOString(),
            isUsed: false,
            instanceId: Date.now().toString(36) + Math.random().toString(36).substr(2) // ユニークID
        };
        inventory.push(newItem);

        transaction.update(userRef, {
            points: newPoints,
            inventory
        });

        logger.info({ userId, itemId, price: item.price }, 'Item purchased');

        return {
            success: true,
            newPoints,
            item,
            inventory
        };
    });
}

/**
 * アイテムを使用する
 */
export async function useItem(userId, itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) {
        throw new Error('Item definition not found');
    }

    const userRef = db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId);

    return await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error('User not found');

        const userData = userDoc.data();
        const inventory = userData.inventory || []; // Array of Item Objects

        // 未使用の該当アイテムを探す
        const itemIndex = inventory.findIndex(i => i.itemId === itemId && !i.isUsed);

        if (itemIndex === -1) {
            throw new Error('Item not in inventory');
        }

        const inventoryItem = inventory[itemIndex];

        // アイテム使用処理
        let updates = {};
        let resultMessage = '';

        if (item.type === 'buff') {
            // バフの適用
            const activeBuffs = userData.activeBuffs || [];
            // 既存バフの延長あるいは新規追加
            const expiresAt = new Date(Date.now() + item.duration).toISOString();

            activeBuffs.push({
                type: item.effect.type,
                value: item.effect.value,
                expiresAt,
                sourceItemId: itemId
            });
            updates.activeBuffs = activeBuffs;
            resultMessage = `${item.name}を使用しました！${item.duration / 3600000}時間有効です。`;
        } else if (item.type === 'role') {
            // Role付与はBot側で検知するか、ここでAPIレスポンスに含めてBotにやらせる
            // ここではフラグだけ立てる
            resultMessage = `${item.name}を使用しました！Botがロールを付与します。`;
        } else if (item.type === 'consumable') {
            // ガチャなどの処理
            resultMessage = `${item.name}を使用しました！`;
        }

        // インベントリから消費（削除するか、usedフラグを立てる）
        // ここでは削除して履歴のみ残す設計もありだが、usedフラグにする
        inventory[itemIndex].isUsed = true;
        inventory[itemIndex].usedAt = new Date().toISOString();
        updates.inventory = inventory;

        transaction.update(userRef, updates);

        return {
            success: true,
            itemName: item.name,
            message: resultMessage,
            effect: item.effect
        };
    });
}

/**
 * ユーザーのインベントリを取得 (未使用品のみ集計)
 */
export async function getUserInventory(userId) {
    const userDoc = await db.collection(FIRESTORE.COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) return [];

    const inventory = userDoc.data().inventory || [];
    const activeItems = inventory.filter(i => !i.isUsed);

    // 集計: itemIdごとに個数をカウント
    const summary = {};
    activeItems.forEach(i => {
        if (!summary[i.itemId]) {
            summary[i.itemId] = { count: 0, item: SHOP_ITEMS[i.itemId] };
        }
        summary[i.itemId].count++;
    });

    return Object.values(summary).map(s => ({
        itemId: s.item?.id || 'unknown',
        name: s.item?.name || 'Unknown Item',
        count: s.count,
        description: s.item?.description
    }));
}
