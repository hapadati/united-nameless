# UNITED NAMELESS - Render.com デプロイ手順

## 📋 デプロイ前チェックリスト

### 1. 必要な情報の収集

- [ ] **Neon PostgreSQL**
  - Database URL取得（`postgresql://...`）
  - Neon Dashboard → Project → Connection String

- [ ] **Firebase**
  - Service Account JSON取得
  - Firebase Console → Project Settings → Service Accounts → Generate New Private Key

- [ ] **Discord**
  - Bot Token (`DISCORD_TOKEN`)
  - Application Client ID (`DISCORD_CLIENT_ID`)
  - Application Client Secret (`DISCORD_CLIENT_SECRET`)
  - Guild ID (`DISCORD_GUILD_ID`)

- [ ] **セキュリティキー生成**
  ```bash
  # NEXTAUTH_SECRET
  openssl rand -base64 32
  
  # JWT_SECRET
  openssl rand -hex 32
  
  # ADMIN_SECRET
  openssl rand -base64 24
  
  # TOTP_SECRET (既に設定済みの場合は再利用)
  # 例: JBSWY3DPEHPK3PXP
  ```

---

## 🚀 Render.comへのデプロイ

### Step 1: リポジトリ準備

1. GitHubにコードをpush
   ```bash
   cd d:/NNB
   git add .
   git commit -m "Production ready - All features implemented"
   git push origin main
   ```

### Step 2: Render.comでBlueprint作成

1. [Render.com Dashboard](https://dashboard.render.com/)にログイン
2. **"New" → "Blueprint"** をクリック
3. GitHubリポジトリを接続
4. `render.yaml` を検出してBlueprint作成
5. **"Apply"** をクリック

### Step 3: 環境変数設定

Render Dashboard で各サービスの環境変数を設定：

#### 🔹 united-nameless-api（API Server）

| Key | Value | 備考 |
|-----|-------|------|
| `DATABASE_URL` | `postgresql://...` | Neon Dashboard から取得 |
| `FIREBASE_SERVICE_ACCOUNT` | `'{"type":"service_account",...}'` | **シングルクォートで囲む** |
| `JWT_SECRET` | `<生成した値>` | `openssl rand -hex 32` |
| `TOTP_SECRET` | `JBSWY3DPEHPK3PXP` | Base32形式 |
| `ADMIN_SECRET` | `<生成した値>` | 管理者認証用 |
| `CORS_ORIGIN` | `https://united-nameless-web.onrender.com` | Web ClientのURL（デプロイ後に更新） |

#### 🔹 united-nameless-bot（Discord Bot）

| Key | Value | 備考 |
|-----|-------|------|
| `DISCORD_TOKEN` | `<Bot Token>` | Discord Developer Portal |
| `CLIENT_ID` | `<Application ID>` | Discord Application |
| `DISCORD_GUILD_ID` | `<Guild ID>` | Discord Server ID |

#### 🔹 united-nameless-web（Web Client）

| Key | Value | 備考 |
|-----|-------|------|
| `DISCORD_CLIENT_ID` | `<OAuth Client ID>` | Discord OAuth Application |
| `DISCORD_CLIENT_SECRET` | `<OAuth Secret>` | Discord OAuth Application |
| `NEXTAUTH_SECRET` | `<生成した値>` | `openssl rand -base64 32` |
| `DISCORD_BOT_TOKEN` | `<Bot Token>` | Discord Bot Token |

### Step 4: デプロイ実行

1. 環境変数設定後、各サービスが自動的にデプロイ開始
2. **デプロイ順序**: API → Bot → Web Client
3. 各サービスのログを確認してエラーがないことを確認

---

## ✅ デプロイ後の確認

### 1. API Serverの確認

```bash
curl https://united-nameless-api.onrender.com/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### 2. Discord Botの確認

- Discordサーバーでボットがオンライン表示
- `/ping` コマンドを実行して応答確認

### 3. Web Clientの確認

1. `https://united-nameless-web.onrender.com` にアクセス
2. Landing Pageが表示されることを確認
3. "Get Started" → Discord Loginを実行
4. ダッシュボードにリダイレクトされることを確認

### 4. 各機能のE2Eテスト

- [ ] **Shop**: アイテム購入
- [ ] **Inventory**: アイテム使用
- [ ] **Profile**: ポイント→XP変換
- [ ] **Admin Portal**: TOTP Setup、Emergency Lockdown

---

## ⚠️ トラブルシューティング

### 問題: API Server が起動しない

**原因**: `FIREBASE_SERVICE_ACCOUNT` の形式エラー

**解決**:
1. JSON全体を**シングルクォート**で囲む
2. 改行を削除（1行に圧縮）
3. Render Dashboardで再設定

### 問題: Web Client が404エラー

**原因**: Build失敗またはNext.js設定ミス

**解決**:
1. Render Logsで `npm run build` のエラー確認
2. `package.json` の `scripts.start` が `next start` であることを確認
3. 再デプロイ

### 問題: Discord Botがオフライン

**原因**: `DISCORD_TOKEN` が無効

**解決**:
1. Discord Developer Portal で Token を再生成
2. Render Dashboard で環境変数更新
3. Bot Serviceを再起動

---

## 🔄 更新のデプロイ

コードを更新してデプロイする場合：

```bash
git add .
git commit -m "Update: <変更内容>"
git push origin main
```

Renderが自動的に検出して再デプロイします。

---

## 📞 サポート

デプロイに関する問題が発生した場合：

1. **Render Logs** を確認（各サービスのDashboard → Logs）
2. `render.yaml` の設定を再確認
3. 環境変数が正しく設定されているか確認

---

**デプロイが完了すると、UNITED NAMELESS は本番環境で稼働開始します！** 🎉
