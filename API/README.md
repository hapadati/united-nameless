# UNITED NAMELESS Bot - API Server

セキュリティ特化型のDiscord Bot用APIサーバー。Firebase Firestoreをデータベースとして使用し、Bot認証、TOTP 2段階認証、レート制限などの包括的なセキュリティ機能を実装しています。

## 🚀 特徴

- **高速**: Fastifyフレームワークで低レイテンシを実現
- **セキュア**: Bot認証（X-Bot-ID）+ TOTP 2段階認証
- **スケーラブル**: Firebase Firestoreでクラウド対応
- **レート制限**: エンドポイントタイプごとに最適化
- **構造化ログ**: Pinoによる高性能ロギング

## 📋 APIエンドポイント

### イベント系 (5エンドポイント)
- `POST /events/message` - メッセージポイント付与
- `POST /events/voice` - VC滞在時間計算
- `POST /events/audit` - Anti-Nuke判定
- `POST /events/bot-join` - 危険なBot検知

### Economy系 (5エンドポイント)
- `GET /economy/balance` - 残高取得
- `GET /economy/rank` - ランク情報
- `GET /economy/leaderboard` - リーダーボード
- `POST /economy/convert` - Point→XP変換
- `POST /economy/daily` - デイリーボーナス

### Admin系 (6エンドポイント)
- `GET /admin/check` - 権限チェック
- `POST /admin/lockdown` - Lockdown発動 **(TOTP必須)**
- `POST /admin/unlock` - Lockdown解除 **(TOTP必須)**
- `GET /admin/audit-log` - 監査ログ取得 **(TOTP必須)**
- `GET /admin/config` - サーバー設定取得 **(TOTP必須)**
- `POST /admin/points` - ポイント手動調整 **(TOTP必須)**

### ヘルスチェック
- `GET /health` - サーバー状態確認（認証不要）

## 🛡️ Anti-Nuke機能

APIサーバーは安全性を確保するため、自動的なAnti-Nuke判定を行います。
- 30秒以内に同一ユーザーが3回以上の危険操作（チャンネル削除、ロール削除等）を行った場合、APIサーバーが自動的に**Lockdown状態**に移行します。
- 全てのイベント系・Economy系レスポンスには、現在の`lockdownActive`状態が含まれます。

## 🛠️ セットアップ

### 1. 依存関係のインストール

```powershell
cd d:\NNB\API
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`を作成：

```powershell
copy .env.example .env
```

`.env`ファイルを編集して、以下の値を設定：

```env
# サーバー設定
PORT=4000
NODE_ENV=development

# Firebase設定
# Firebase Admin SDKのサービスアカウントキーのパスを指定
FIREBASE_SERVICE_ACCOUNT_PATH=D:/NNB/API/firebase-service-account.json

# Bot認証
# Discord BotのID（Bot TokenではなくBot ID）
BOT_ID=YOUR_DISCORD_BOT_ID

# JWT設定
# ランダムな文字列を生成（例: openssl rand -base64 32）
JWT_SECRET=your-super-secret-jwt-key-change-this

# TOTP設定
# Google Authenticatorでこのシークレットを登録
TOTP_SECRET=your-totp-secret-key-change-this
```

### 3. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. プロジェクト設定 → サービスアカウント → 新しい秘密鍵の生成
3. ダウンロードしたJSONファイルを`firebase-service-account.json`として保存
4. `.env`の`FIREBASE_SERVICE_ACCOUNT_PATH`にパスを設定

### 4. サーバー起動

```powershell
# 開発モード（自動リロード）
npm run dev

# 本番モード
npm start
```

起動成功すると、以下のような画面が表示されます：

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 UNITED NAMELESS API Server                          ║
║                                                           ║
║   Status: Running                                         ║
║   Port: 4000                                              ║
║   ...                                                     ║
╚═══════════════════════════════════════════════════════════╝
```

## 🔒 セキュリティ

### Bot認証（X-Bot-ID）

すべてのエンドポイント（`/health`を除く）で必須。

```javascript
// リクエスト例
fetch('http://localhost:4000/economy/balance?userId=123456789', {
  headers: {
    'X-Bot-ID': 'YOUR_BOT_ID'
  }
});
```

### TOTP 2段階認証（X-TOTP-Token）

管理者操作（Lockdown/Unlock/監査ログ）で必須。

**TOTP設定方法**:
1. `.env`の`TOTP_SECRET`をGoogle Authenticatorに登録
2. アプリで生成された6桁のトークンを`X-TOTP-Token`ヘッダーに含める

```javascript
// リクエスト例
fetch('http://localhost:4000/admin/lockdown', {
  method: 'POST',
  headers: {
    'X-Bot-ID': 'YOUR_BOT_ID',
    'X-TOTP-Token': '123456', // Google Authenticatorから取得
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Anti-Nuke triggered',
    initiatedBy: 'ADMIN_USER_ID'
  })
});
```

### レート制限

| エンドポイント種別 | 制限 |
|-------------------|------|
| イベント系 | 20 req/秒 |
| Economy系 | 10 req/秒 |
| Admin系 | 5 req/秒 |

制限超過時は`429 Too Many Requests`を返却。

## 📊 データベース構造

### Firestoreコレクション

#### `users`
```javascript
{
  userId: string,           // Discord User ID
  points: number,           // 現在のポイント
  xp: number,               // 現在のXP
  level: number,            // 現在のレベル
  lastMessage: timestamp,   // 最後のメッセージ送信時刻
  lastDaily: timestamp,     // 最後のデイリー取得時刻
  dailyStreak: number,      // 連続ログイン日数
  voiceJoinTime: timestamp, // VC参加時刻
  totalVoiceTime: number    // 累計VC時間（秒）
}
```

#### `auditLogs`
```javascript
{
  userId: string,           // 実行者のID
  action: string,           // 操作種別
  dangerous: boolean,       // 危険な操作か
  timestamp: timestamp,     // 実行時刻
  details: object           // 詳細情報
}
```

#### `serverConfig`
```javascript
{
  lockdownActive: boolean,  // Lockdown状態
  lockdownReason: string,   // Lockdown理由
  lockdownAt: timestamp     // Lockdown発動時刻
}
```

## 🧪 テスト

### Postmanでのテスト

1. [Postman](https://www.postman.com/)をインストール
2. 新しいリクエストを作成
3. ヘッダーに`X-Bot-ID`を追加
4. エンドポイントにリクエスト

### curlでのテスト

```powershell
# ヘルスチェック
curl http://localhost:4000/health

# 残高取得
curl -H "X-Bot-ID: YOUR_BOT_ID" "http://localhost:4000/economy/balance?userId=123456789"

# メッセージイベント
curl -X POST -H "X-Bot-ID: YOUR_BOT_ID" -H "Content-Type: application/json" \
  -d "{\"userId\":\"123456789\",\"guildId\":\"987654321\"}" \
  http://localhost:4000/events/message
```

## 📁 プロジェクト構造

```
d:/NNB/API/
├── index.js                 # エントリーポイント
├── package.json
├── .env
├── .env.example
├── .gitignore
│
├── config/
│   ├── firebase.js          # Firebase初期化
│   └── constants.js         # 定数管理
│
├── middleware/
│   ├── auth.js              # Bot認証
│   ├── totp.js              # TOTP検証
│   ├── rateLimit.js         # レート制限
│   └── errorHandler.js      # エラーハンドリング
│
├── routes/
│   ├── events.js            # イベント系エンドポイント
│   ├── economy.js           # Economy系エンドポイント
│   └── admin.js             # Admin系エンドポイント
│
├── services/
│   ├── pointService.js      # ポイント計算ロジック
│   ├── rankService.js       # ランク計算ロジック
│   ├── auditService.js      # 監査ログ管理
│   └── dailyService.js      # デイリーボーナス
│
└── utils/
    ├── logger.js            # ロギング
    ├── jwt.js               # JWT生成・検証
    └── validators.js        # バリデーション
```

## 🐛 トラブルシューティング

### Firebase初期化エラー

**エラー**: `FIREBASE_SERVICE_ACCOUNT_PATH environment variable is required`

**解決策**: `.env`に正しいFirebaseサービスアカウントキーのパスを設定

### Bot認証エラー

**エラー**: `401 Unauthorized - Invalid Bot ID`

**解決策**: 
1. `.env`の`BOT_ID`が正しいか確認
2. リクエストヘッダーに`X-Bot-ID`が含まれているか確認

### TOTP認証エラー

**エラー**: `403 Forbidden - Invalid TOTP token`

**解決策**: 
1. Google Authenticatorに正しいシークレット（`.env`の`TOTP_SECRET`）を登録
2. 時刻が正確か確認（TOTPは時刻同期が重要）

## 📝 ライセンス

MIT

## 🤝 サポート

問題が発生した場合は、Issueを作成してください。
