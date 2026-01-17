# UNITED NAMELESS Discord Bot

**API主導型・セキュリティ特化Discord Bot**

## 概要

このBotは「API主導・Thin Client」アーキテクチャを採用しています。
データベースへの直接アクセスは行わず、すべてのビジネスロジックを外部APIに委譲します。

### 主な特徴

- 🛡️ **Anti-Nuke/Anti-Raid**: サーバー破壊行為を自動検知・防御
- 🔄 **API主導**: DB直接アクセスなし、すべてAPIを経由
- 💰 **経済システム**: ポイント、ランク、リーダーボード
- 📊 **ポイント→XPシステム**: メッセージでポイント獲得 → 任意でXPに変換
- 🔒 **TOTP対応**: 重要操作には二段階認証


---

## セットアップ

### 1. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、以下を設定：

```bash
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_server_id

API_BASE_URL=http://localhost:4000
BOT_ID=UNITED_NAMELESS_BOT
PORT=3000
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Mock APIサーバーの起動（開発用）

別ターミナルで：

```bash
node mock-server/index.js
```

### 4. Botの起動

```bash
npm start
```

---

## コマンド一覧

### 経済コマンド

- `/balance [user]` - ポイント残高を表示
- `/rank [user]` - ランク情報を表示
- `/leaderboard [limit]` - リーダーボードを表示
- `/point-to-xp <amount>` - **ポイントをXPに変換**（100pt = 1 XP）


### 管理コマンド（管理者専用）

- `/lockdown` - サーバーを緊急ロックダウン
- `/unlock` - ロックダウンを解除

### その他

既存の各種コマンドも引き続き利用可能です（`/ping`, `/おみくじ`, `/role` など）

---

## アーキテクチャ

```
Discord Events → Bot (Thin Client) → API Server → Database
                    ↓
         (Display Only, No Logic)
```

### イベント監視

- **messageCreate**: メッセージ送信時、APIへ通知 → **ポイント付与**判定
- **voiceStateUpdate**: VC参加/退出時、APIへ通知 → ポイント付与判定
- **guildMemberAdd**: Bot追加時、権限チェック → 不審なBotを検知
- **Audit Log** (今後実装): サーバー操作を監視 → 連続操作でLockdown

### ポイント→XPシステム

```
1. メッセージ送信 → API → ポイント付与 (例: 10pt)
2. `/point-to-xp 100` → 100ポイント消費 → 1 XP獲得
3. XP蓄積 → レベルアップ
```

**メリット**: ユーザーが自分のペースでXPに変換できる


### セキュリティ機能

- **Anti-Nuke**: 短時間の大量操作を検知し自動ロックダウン
- **Lockdown Mode**: `@everyone`の権限停止、Webhook全削除、管理者通知

---

## ファイル構成

```
.
├── main.mjs                    # エントリーポイント
├── .env.example                # 環境変数テンプレート
├── mock-server/
│   └── index.js                # 開発用Mock API
├── utils/
│   ├── api.js                  # APIクライアント
│   └── config.js               # 環境検証
├── events/
│   ├── observer.js             # メッセージ/VC監視
│   ├── security.js             # セキュリティ監視
│   └── message-xp.js           # XPシステム (Legacy)
├── commands/
│   ├── admin/                  # 管理コマンド
│   │   ├── lockdown.js
│   │   └── unlock.js
│   ├── economy/                # 経済コマンド
│   │   ├── rank.js
│   │   └── leaderboard.js
│   ├── points/                 # ポイント関連 (Legacy+API Hybrid)
│   └── ...その他既存コマンド
└── firestore.js                # Firebase連携 (Fallback用)
```

---

## 開発者向け情報

### API Endpoints (Mock Server)

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/events/message` | メッセージイベント |
| POST | `/events/voice` | VCイベント |
| POST | `/events/audit` | Audit Logイベント |
| POST | `/events/bot-join` | Bot追加イベント |
| GET | `/economy/balance` | 残高取得 |
| GET | `/economy/rank` | ランク取得 |
| GET | `/economy/leaderboard` | リーダーボード取得 |
| GET | `/admin/check` | 管理者チェック |
| POST | `/admin/lockdown` | ロックダウン実行 |
| POST | `/admin/unlock` | ロックダウン解除 |

### エラーハンドリング

仕様に基づき、**Botは絶対に落ちない**設計です。
APIエラー時はログ出力のみ行い、処理を継続します。

---

## ライセンス

ISC

---

## サポート

問題が発生した場合は、以下を確認してください：

1. `.env` が正しく設定されているか
2. Mock APIサーバーが起動しているか（開発時）
3. Bot Intentsが正しく設定されているか（Dashboard）
