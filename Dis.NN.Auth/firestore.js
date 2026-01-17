// firestore.js - Firestore Helper Functions (Legacy/Fallback)
import { db } from "./firebase.js";

// ✅ db をエクスポート
export { db };

// 📌 ユーザーポイント管理

/**
 * ユーザーにポイントを追加
 * @param {string} guildId
 * @param {string} userId
 * @param {number} amount
 */
export async function addUserPoints(guildId, userId, amount) {
  if (!guildId || !userId) {
    throw new Error('guildId and userId are required');
  }
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('amount must be a positive number');
  }

  try {
    const ref = db.collection("guilds").doc(guildId).collection("points").doc(userId);
    const doc = await ref.get();

    if (!doc.exists) {
      await ref.set({ points: amount, updatedAt: new Date().toISOString() });
    } else {
      const currentPoints = doc.data()?.points || 0;
      await ref.update({
        points: currentPoints + amount,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('[Firestore] addUserPoints error:', err);
    throw err;
  }
}

/**
 * ユーザーのポイントを取得
 * @param {string} guildId
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUserPoints(guildId, userId) {
  if (!guildId || !userId) {
    throw new Error('guildId and userId are required');
  }

  try {
    const ref = db.collection("guilds").doc(guildId).collection("points").doc(userId);
    const doc = await ref.get();
    return doc.exists ? (doc.data()?.points || 0) : 0;
  } catch (err) {
    console.error('[Firestore] getUserPoints error:', err);
    return 0; // Safe fallback
  }
}

/**
 * ランキングを取得
 * @param {string} guildId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRanking(guildId, limit = 10) {
  if (!guildId) {
    throw new Error('guildId is required');
  }
  if (typeof limit !== 'number' || limit < 1 || limit > 100) {
    limit = 10;
  }

  try {
    const snapshot = await db
      .collection("guilds")
      .doc(guildId)
      .collection("points")
      .orderBy("points", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      userId: doc.id,
      points: doc.data()?.points || 0,
    }));
  } catch (err) {
    console.error('[Firestore] getRanking error:', err);
    return [];
  }
}

// 📌 アイテム管理

/**
 * アイテムを追加
 * @param {string} guildId
 * @param {string} name
 * @param {number} price
 * @param {number} stock
 */
export async function addItem(guildId, name, price, stock) {
  if (!guildId || !name) {
    throw new Error('guildId and name are required');
  }
  if (typeof price !== 'number' || price < 0) {
    throw new Error('price must be a non-negative number');
  }
  if (typeof stock !== 'number' || stock < 0) {
    throw new Error('stock must be a non-negative number');
  }

  try {
    const ref = db.collection("guilds").doc(guildId).collection("items").doc(name);
    await ref.set({
      price,
      stock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('[Firestore] addItem error:', err);
    throw err;
  }
}

/**
 * アイテム一覧を取得
 * @param {string} guildId
 * @returns {Promise<Array>}
 */
export async function getItems(guildId) {
  if (!guildId) {
    throw new Error('guildId is required');
  }

  try {
    const snapshot = await db.collection("guilds").doc(guildId).collection("items").get();
    return snapshot.docs.map(doc => ({
      name: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error('[Firestore] getItems error:', err);
    return [];
  }
}

/**
 * アイテムを購入（トランザクション）
 * @param {string} guildId
 * @param {string} userId
 * @param {string} itemName
 */
export async function buyItem(guildId, userId, itemName) {
  if (!guildId || !userId || !itemName) {
    throw new Error('guildId, userId, and itemName are required');
  }

  const itemRef = db.collection("guilds").doc(guildId).collection("items").doc(itemName);
  const userRef = db.collection("guilds").doc(guildId).collection("points").doc(userId);

  try {
    return await db.runTransaction(async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists) {
        throw new Error("アイテムが存在しません");
      }

      const item = itemDoc.data();
      if (!item || item.stock === undefined || item.price === undefined) {
        throw new Error("アイテムデータが不正です");
      }

      if (item.stock <= 0) {
        throw new Error("在庫がありません");
      }

      const userDoc = await transaction.get(userRef);
      const userPoints = userDoc.exists ? (userDoc.data()?.points || 0) : 0;

      if (userPoints < item.price) {
        throw new Error("ポイントが足りません");
      }

      // Update both documents
      transaction.update(itemRef, {
        stock: item.stock - 1,
        updatedAt: new Date().toISOString()
      });
      transaction.set(userRef, {
        points: userPoints - item.price,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return {
        success: true,
        itemName,
        remainingPoints: userPoints - item.price
      };
    });
  } catch (err) {
    console.error('[Firestore] buyItem error:', err);
    throw err;
  }
}

/**
 * アイテムを削除
 * @param {string} guildId
 * @param {string} itemName
 * @param {boolean} force
 */
export async function deleteItem(guildId, itemName, force = false) {
  if (!guildId || !itemName) {
    throw new Error('guildId and itemName are required');
  }

  try {
    const ref = db.collection("guilds").doc(guildId).collection("items").doc(itemName);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new Error("アイテムが存在しません");
    }

    const data = doc.data();
    if (!force && data?.stock && data.stock > 0) {
      throw new Error("在庫が残っているため削除できません");
    }

    await ref.delete();
    return { success: true };
  } catch (err) {
    console.error('[Firestore] deleteItem error:', err);
    throw err;
  }
}
