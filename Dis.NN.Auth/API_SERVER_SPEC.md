# Discord Bot API Server 仕様書

## 📋 概要

このドキュメントは、Discord Bot「UNITED NAMELESS」のバックエンドAPIサーバーの完全な仕様書です。

### アーキテクチャ概要
- **Bot**: Thin Client（イベント検知 → API送信 → 結果実行）
- **API Server**: ビジネスロジック、認証、DB操作を担当
- **Database**: Firestore（ユーザーデータ、サーバー設定）
- **認証**: TOTP（2段階認証）、API Key

---

## 🛠️ 技術スタック

### 推奨スタック
- **Runtime**: Node.js v18+
- **Framework**: Express.js または Fastify
- **Database**: Firebase Firestore
- **認証**: jsonwebtoken, speakeasy (TOTP)
- **バリデーション**: joi または zod
- **ロギング**: winston
- **環境**: dotenv

### 依存関係
```json
{
  "express": "^4.18.0",
  "firebase-admin": "^11.0.0",
  "jsonwebtoken": "^9.0.0",
  "speakeasy": "^2.0.0",
  "joi": "^17.9.0",
  "winston": "^3.10.0",
  "dotenv": "^16.0.0",
  "cors": "^2.8.5"
}
```

---

## 📡 API エンドポイント一覧

### 1. イベント系 (`/events`)

#### POST `/events/message`
メッセージ送信イベント

**Request:**
```json
{
  "guildId": "string",
  "channelId": "string",
  "userId": "string",
  "messageId": "string",
  "createdAt": "number (Unix timestamp)"
}
```

**Response:**
```json
{
  "earned": true,
  "amount": 10,
  "levelUp": false,
  "newBalance": 1550
}
```

**処理内容:**
1. クールダウンチェック（30秒）
2. ポイント付与（5-15pt ランダム）
3. レベルアップ判定
4. Firestore更新

---

#### POST `/events/voice`
ボイスチャンネルイベント

**Request:**
```json
{
  "guildId": "string",
  "userId": "string",
  "channelId": "string",
  "joined": "boolean",
  "selfMuted": "boolean",
  "streaming": "boolean",
  "timestamp": "number"
}
```

**Response:**
```json
{
  "success": true,
  "pointsEarned": 5
}
```

**処理内容:**
1. 参加時刻記録
2. 退出時に滞在時間計算
3. ポイント付与（1分 = 1pt）
4. ミュート/配信状態による補正

---

#### POST `/events/audit`
Audit Logイベント

**Request:**
```json
{
  "guildId": "string",
  "action": "CHANNEL_DELETE | ROLE_DELETE | WEBHOOK_CREATE",
  "executorId": "string",
  "targetId": "string",
  "targetType": "CHANNEL | ROLE | WEBHOOK",
  "timestamp": "number"
}
```

**Response:**
```json
{
  "lockdown": false,
  "warning": false,
  "actionTaken": "none"
}
```

**処理内容:**
1. 短時間内の操作回数カウント
2. 閾値判定（5分以内に5回以上 → lockdown）
3. Lockdown発動判断
4. 管理者通知

---

#### POST `/events/bot-join`
Bot参加イベント

**Request:**
```json
{
  "guildId": "string",
  "botId": "string",
  "botName": "string",
  "permissions": ["array"],
  "hasAdministrator": "boolean",
  "timestamp": "number"
}
```

**Response:**
```json
{
  "warning": true,
  "message": "Suspicious bot detected"
}
```

---

### 2. Economy系 (`/economy`)

#### GET `/economy/balance`
ポイント残高取得

**Query Parameters:**
- `userId`: string
- `guildId`: string

**Response:**
```json
{
  "balance": 1550,
  "rank": 5,
  "level": 12
}
```

---

#### GET `/economy/rank`
ランク情報取得

**Query Parameters:**
- `userId`: string
- `guildId`: string

**Response:**
```json
{
  "balance": 1550,
  "rank": 5,
  "level": 12,
  "xp": 890,
  "nextLevelXp": 1000
}
```

---

#### GET `/economy/leaderboard`
リーダーボード取得

**Query Parameters:**
- `guildId`: string
- `limit`: number (default: 10, max: 50)

**Response:**
```json
{
  "users": [
    {
      "userId": "string",
      "balance": 9999,
      "level": 50,
      "rank": 1
    }
  ]
}
```

---

#### POST `/economy/convert`
ポイント→XP変換

**Request:**
```json
{
  "userId": "string",
  "guildId": "string",
  "pointsToSpend": 100,
  "xpToGain": 1
}
```

**Response:**
```json
{
  "success": true,
  "remainingPoints": 1450,
  "xpGained": 1
}
```

**処理内容:**
1. ポイント残高チェック
2. トランザクション処理
3. ポイント減算
4. XP付与（Bot側で実行）

---

#### POST `/economy/daily`
デイリーボーナス

**Request:**
```json
{
  "userId": "string",
  "guildId": "string",
  "timestamp": "number"
}
```

**Response:**
```json
{
  "success": true,
  "bonus": 150,
  "streak": 3,
  "newBalance": 1700,
  "nextAvailable": 1641234567
}
```

**処理内容:**
1. 最終受取時刻チェック
2. 24時間経過判定
3. ストリーク計算（連続日数）
4. ボーナス付与（基本100pt + ストリーク×50pt）

---

### 3. Admin系 (`/admin`)

#### GET `/admin/check`
管理者権限チェック

**Query Parameters:**
- `userId`: string
- `guildId`: string

**Response:**
```json
{
  "isAdmin": true,
  "requireTOTP": false,
  "permissions": ["lockdown", "unlock", "audit-log"]
}
```

---

#### POST `/admin/lockdown`
Lockdown発動

**Request:**
```json
{
  "guildId": "string",
  "executorId": "string",
  "timestamp": "number",
  "totp": "123456" // 必要な場合
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lockdown activated"
}
```

---

#### POST `/admin/unlock`
Lockdown解除

**Request:**
```json
{
  "guildId": "string",
  "executorId": "string",
  "timestamp": "number"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lockdown released"
}
```

---

#### GET `/admin/audit-log`
監査ログ取得

**Query Parameters:**
- `guildId`: string
- `limit`: number (default: 10, max: 50)
- `filter`: string (all | channel | role | member | webhook)

**Response:**
```json
{
  "logs": [
    {
      "action": "CHANNEL_DELETE",
      "executorId": "123456789",
      "targetId": "ch_001",
      "targetType": "CHANNEL",
      "timestamp": 1641234567
    }
  ]
}
```

---

## 🗄️ データベース設計

### Firestore コレクション構造

```
guilds/{guildId}/
  ├── users/{userId}
  │   ├── xp: number
  │   ├── level: number
  │   ├── lastMessage: number (timestamp)
  │   ├── lastLevelUpSent: number
  │   └── buffs: string[]
  │
  ├── config/
  │   ├── levelRoles
  │   │   └── roles: { [level]: roleId }
  │   ├── unlocks
  │   │   └── unlocks: { [level]: string[] }
  │   └── settings
  │       ├── ignoreChannels: string[]
  │       └── ignoreCategories: string[]
  │
  └── auditLogs/{logId}
      ├── action: string
      ├── executorId: string
      ├── targetId: string
      ├── targetType: string
      └── timestamp: number

servers/{guildId}/
  ├── points/{userId}
  │   ├── points: number
  │   ├── daily
  │   │   ├── lastClaim: number
  │   │   └── streak: number
  │   ├── updatedAt: string
  │   └── updatedBy: string
  │
  └── items/{itemId}
      ├── mid: string
      ├── displayName: string
      ├── price: number
      └── stock: number

admins/{userId}
  ├── totpSecret: string (encrypted)
  ├── permissions: string[]
  └── guilds: string[]
```

---

## 🔐 認証・セキュリティ

### 1. Bot認証
すべてのリクエストに `X-Bot-ID` ヘッダーが必要

```javascript
if (req.headers['x-bot-id'] !== process.env.AUTHORIZED_BOT_ID) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### 2. TOTP認証（管理者コマンド）

重要な操作（lockdown等）には2段階認証を要求

```javascript
const verified = speakeasy.totp.verify({
  secret: adminSecret,
  encoding: 'base32',
  token: req.body.totp,
  window: 2
});
```

### 3. レートリミット

```javascript
// 1分間に60リクエストまで
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60
});
```

---

## 🔄 ビジネスロジック

### ポイント付与ロジック

```javascript
// メッセージ送信時
function calculateMessagePoints() {
  return Math.floor(Math.random() * 11) + 5; // 5-15pt
}

// VC滞在時間
function calculateVoicePoints(minutes) {
  return minutes; // 1分 = 1pt
}

// デイリーボーナス
function calculateDailyBonus(streak) {
  return 100 + (streak * 50); // 基本100pt + ストリーク×50pt
}
```

### レベル計算式

```javascript
function getNextLevelXP(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}
```

### Anti-Nuke判定

```javascript
// 5分以内に5回以上の危険操作でlockdown
const THRESHOLD_ACTIONS = 5;
const THRESHOLD_TIME = 5 * 60 * 1000; // 5分

function shouldLockdown(recentActions) {
  const now = Date.now();
  const recent = recentActions.filter(a => now - a.timestamp < THRESHOLD_TIME);
  return recent.length >= THRESHOLD_ACTIONS;
}
```

---

## 🚀 デプロイ

### 環境変数 (`.env`)

```env
# Server
PORT=4000
NODE_ENV=production

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Security
AUTHORIZED_BOT_ID=YOUR_BOT_CLIENT_ID
JWT_SECRET=your-secret-key
TOTP_ENCRYPTION_KEY=your-encryption-key

# Database
FIRESTORE_EMULATOR_HOST= # 開発時のみ
```

### 起動スクリプト

```bash
# 開発
npm run dev

# 本番
npm start
```

### Docker対応

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]
```

---

## 📊 ロギング・監視

### Winston設定

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### ヘルスチェック

```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

---

## ⚠️ エラーハンドリング

### 標準エラーレスポンス

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### エラーコード一覧
- `AUTH_FAILED` - 認証失敗
- `INSUFFICIENT_POINTS` - ポイント不足
- `RATE_LIMIT_EXCEEDED` - レート制限超過
- `INVALID_REQUEST` - 不正なリクエスト
- `DATABASE_ERROR` - DB操作エラー
- `INTERNAL_ERROR` - 内部エラー

---

## 🧪 テスト

### テストカバレッジ目標
- Unit Tests: 80%以上
- Integration Tests: 主要エンドポイント全て
- E2E Tests: クリティカルフロー

### テストツール
- Jest
- Supertest
- Firebase Emulator

---

## 📝 次のステップ

1. ✅ 仕様書確認
2. ⬜ プロジェクトセットアップ
3. ⬜ コア機能実装
4. ⬜ 認証実装
5. ⬜ テスト実装
6. ⬜ デプロイ準備

---

🚀 **この仕様書に基づいてAPIサーバーを実装してください！**
