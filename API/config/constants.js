/**
 * アプリケーション定数
 * ポイント計算、レベル計算、Anti-Nuke閾値などの定数を管理
 */

export const POINTS = {
  // メッセージポイント
  MESSAGE_MIN: 1,
  MESSAGE_MAX: 5,
  MESSAGE_COOLDOWN: 60, // 秒

  // VC滞在ポイント
  VOICE_INTERVAL: 10, // 分
  VOICE_POINTS: 10,

  // デイリーボーナス
  DAILY_BASE: 100,
  DAILY_STREAK_BONUS: 10, // 連続ログインごとに+10pt
};

export const XP = {
  // XP計算式: level = floor(sqrt(xp / 100))
  // 逆算: xp = level^2 * 100
  BASE_DIVISOR: 100,
};

export const ANTI_NUKE = {
  // Anti-Nuke判定閾値
  TIME_WINDOW: 30, // 秒
  MAX_ACTIONS: 3, // 同じユーザーによる危険操作の最大回数

  // 危険な操作の種類
  DANGEROUS_ACTIONS: [
    'CHANNEL_DELETE',
    'ROLE_DELETE',
    'MEMBER_BAN_ADD',
    'MEMBER_KICK',
    'WEBHOOK_DELETE',
    'GUILD_UPDATE', // サーバー設定変更
  ],
};

export const RATE_LIMITS = {
  // レート制限設定（リクエスト/秒）
  EVENTS: 20,
  ECONOMY: 10,
  ADMIN: 5,
  DEFAULT: 10,
};

export const FIRESTORE = {
  // Firestoreコレクション名
  COLLECTIONS: {
    USERS: 'users',
    AUDIT_LOGS: 'auditLogs',
    SERVER_CONFIG: 'serverConfig',
  },
};

export const BOT_PERMISSIONS = {
  // 危険なBot権限
  DANGEROUS: [
    'ADMINISTRATOR',
    'MANAGE_GUILD',
    'MANAGE_ROLES',
    'MANAGE_CHANNELS',
    'MANAGE_WEBHOOKS',
    'BAN_MEMBERS',
    'KICK_MEMBERS',
  ],
};

export default {
  POINTS,
  XP,
  ANTI_NUKE,
  RATE_LIMITS,
  FIRESTORE,
  BOT_PERMISSIONS,
};
