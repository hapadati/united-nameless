# UNITED NAMELESS Bot - API デプロイガイド

このドキュメントでは、APIサーバーをローカル環境または本番環境にデプロイする手順を説明します。

## 📦 ローカル開発環境

### 前提条件

- Node.js 18以上
- Firebase プロジェクト
- Discord Bot（Bot IDが必要）

### セットアップ手順

#### 1. 依存関係のインストール

```powershell
cd d:\NNB\API
npm install
```

#### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択
3. **プロジェクト設定** → **サービスアカウント** → **新しい秘密鍵の生成**
4. ダウンロードしたJSONファイルを`firebase-service-account.json`として`d:\NNB\API\`に保存

#### 3. 環境変数の設定

```powershell
copy .env.example .env
```

`.env`を編集：

```env
PORT=4000
NODE_ENV=development

FIREBASE_SERVICE_ACCOUNT_PATH=D:/NNB/API/firebase-service-account.json
BOT_ID=YOUR_DISCORD_BOT_ID_HERE

# JWT Secret生成（PowerShell）
# -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
JWT_SECRET=生成したランダム文字列

# TOTP Secret生成（PowerShell）
# -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
TOTP_SECRET=生成したランダム文字列
```

**Bot IDの取得方法**:
1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセス
2. あなたのBotアプリケーションを選択
3. **General Information** → **APPLICATION ID**をコピー

#### 4. TOTP設定（管理者操作用）

1. Google Authenticatorアプリをスマホにインストール
2. アプリで**+**をタップ → **セットアップキーを入力**
3. アカウント名: `UNITED-NAMELESS-API`
4. キー: `.env`の`TOTP_SECRET`の値を入力
5. 時間ベース: **ON**

#### 5. サーバー起動

```powershell
# 開発モード（ファイル変更時に自動リロード）
npm run dev

# 本番モード
npm start
```

起動成功すると以下が表示されます：

```
╔═══════════════════════════════════════════════════════════╗
║   🚀 UNITED NAMELESS API Server                          ║
║   Status: Running                                         ║
║   Port: 4000                                              ║
╚═══════════════════════════════════════════════════════════╝
```

#### 6. 動作確認

```powershell
# ヘルスチェック（認証不要）
curl http://localhost:4000/health

# Bot認証テスト
curl -H "X-Bot-ID: YOUR_BOT_ID" "http://localhost:4000/economy/balance?userId=123456789"
```

---

## 🐳 Docker デプロイ

### Dockerfileの作成

`d:\NNB\API\Dockerfile`を作成：

```dockerfile
FROM node:18-alpine

# 作業ディレクトリ設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係インストール
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY . .

# ポート公開
EXPOSE 4000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# アプリ起動
CMD ["node", "index.js"]
```

### .dockerignoreの作成

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
firebase-service-account.json
```

### ビルドと起動

```powershell
# Dockerイメージをビルド
docker build -t united-nameless-api .

# コンテナを起動
docker run -d \
  --name united-nameless-api \
  -p 4000:4000 \
  -e BOT_ID=YOUR_BOT_ID \
  -e FIREBASE_SERVICE_ACCOUNT_PATH=/app/firebase-service-account.json \
  -e JWT_SECRET=your-jwt-secret \
  -e TOTP_SECRET=your-totp-secret \
  -v D:/NNB/API/firebase-service-account.json:/app/firebase-service-account.json \
  united-nameless-api

# ログ確認
docker logs -f united-nameless-api
```

---

## ☁️ クラウドデプロイ (Google Cloud Run)

### 前提条件

- Google Cloud アカウント
- gcloud CLI インストール済み

### デプロイ手順

#### 1. gcloud CLI 認証

```powershell
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

#### 2. Artifact Registry準備

```powershell
gcloud artifacts repositories create united-nameless \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="UNITED NAMELESS API"
```

#### 3. Dockerイメージをビルド・プッシュ

```powershell
# イメージをビルド
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/united-nameless/api:latest

# または、ローカルでビルドしてプッシュ
docker build -t asia-northeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/united-nameless/api:latest .
docker push asia-northeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/united-nameless/api:latest
```

#### 4. Cloud Runにデプロイ

```powershell
gcloud run deploy united-nameless-api \
  --image asia-northeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/united-nameless/api:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,BOT_ID=YOUR_BOT_ID,JWT_SECRET=YOUR_JWT_SECRET,TOTP_SECRET=YOUR_TOTP_SECRET" \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/firebase:latest" \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

#### 5. Firebaseシークレットを登録

```powershell
# Secret Managerにシークレットを作成
gcloud secrets create firebase-service-account \
  --data-file=D:/NNB/API/firebase-service-account.json

# Cloud RunサービスにIAM権限を付与
gcloud secrets add-iam-policy-binding firebase-service-account \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 6. デプロイ確認

```powershell
# デプロイされたURLを取得
gcloud run services describe united-nameless-api --region asia-northeast1 --format 'value(status.url)'

# ヘルスチェック
curl https://YOUR_CLOUD_RUN_URL/health
```

---

## 🔒 セキュリティのベストプラクティス

### 1. 環境変数の管理

- `.env`ファイルは**絶対にGitにコミットしない**
- 本番環境では環境変数またはシークレット管理サービスを使用

### 2. Firebase認証情報

- サービスアカウントキーは安全な場所に保管
- 定期的にキーをローテーション

### 3. レート制限

- ニーズに応じて`config/constants.js`の`RATE_LIMITS`を調整
- 本番環境ではより厳格な制限を推奨

### 4. HTTPS必須

- 本番環境では必ずHTTPSを使用
- Cloud Runは自動的にHTTPSを有効化

### 5. ロギング

- 本番環境では`LOG_LEVEL=warn`または`error`を推奨
- 機密情報がログに含まれないよう注意

---

## 📊 モニタリング

### Cloud Runのログ確認

```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=united-nameless-api" --limit 50 --format json
```

### 稼働状況確認

```powershell
# ヘルスチェック
curl https://YOUR_CLOUD_RUN_URL/health

# レスポンス例
{
  "status": "ok",
  "timestamp": "2026-01-11T15:56:59+09:00",
  "uptime": 3600.5
}
```

---

## 🔄 更新デプロイ

### ローカル環境

```powershell
# ファイル変更後、自動リロード（npm run dev使用時）
# または手動再起動
npm start
```

### Docker環境

```powershell
# イメージを再ビルド
docker build -t united-nameless-api .

# 既存コンテナを停止・削除
docker stop united-nameless-api
docker rm united-nameless-api

# 新しいコンテナを起動
docker run -d --name united-nameless-api -p 4000:4000 [環境変数...] united-nameless-api
```

### Cloud Run

```powershell
# 新しいイメージをビルド・プッシュ
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/YOUR_GCP_PROJECT_ID/united-nameless/api:latest

# 自動的に新しいリビジョンにトラフィックが切り替わる
```

---

## ❓ FAQ

### Q: Firebase接続エラーが出る

**A**: 
1. サービスアカウントキーのパスが正しいか確認
2. Firebaseプロジェクトが有効か確認
3. ネットワーク接続を確認

### Q: Bot認証が通らない

**A**: 
1. `.env`の`BOT_ID`が正しいDiscord Bot IDか確認
2. リクエストヘッダーに`X-Bot-ID`が含まれているか確認
3. Bot IDにスペースや改行が含まれていないか確認

### Q: TOTP認証エラー

**A**: 
1. Google Authenticatorに正しいシークレットを登録しているか確認
2. スマホの時刻が正確か確認
3. TOTPトークンは30秒ごとに更新されるため、最新のトークンを使用

---

## 📧 サポート

問題が発生した場合は、Issueを作成するか、開発チームに連絡してください。
