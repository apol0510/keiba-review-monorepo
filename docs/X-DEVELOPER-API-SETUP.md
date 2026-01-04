# X Developer API セットアップガイド

このガイドでは、keiba-review-allとnankan-review用に2つのX (Twitter) Developer APIを取得します。

## 📋 前提条件

- Xアカウント（2つ）
  - `@keiba_review` または `@keiba_review_jp` (keiba-review-all用)
  - `@nankan_review` または `@nankan_keiba` (nankan-review用)
- メールアドレス（認証用）
- 電話番号（認証用、アカウントごとに異なる番号が必要）

## 🎯 取得するAPI認証情報

各アカウントで以下の4つの認証情報を取得します:

1. **API Key** (Consumer Key)
2. **API Secret** (Consumer Secret)
3. **Access Token**
4. **Access Token Secret**

## 🚀 セットアップ手順（アカウントごとに2回実施）

### ステップ1: X Developer Portalにアクセス

1. Xアカウントにログイン（@keiba_review または @nankan_review）
2. https://developer.x.com/en/portal/dashboard にアクセス
3. 「Sign up」または「Apply for a developer account」をクリック

### ステップ2: 開発者アカウント申請

**Basic Information:**
- What country do you live in? → `Japan`
- What's your use case? → `Making a bot`

**Intended Use:**
- In your words → 以下のように記入（英語）:

```
I am building an automated review posting system for horse racing prediction websites.
The bot will:
- Post approved user reviews (3-5 times per day, max 12 tweets/day)
- Share information about horse racing prediction sites
- Help users find reliable prediction services

This is for a review platform website (keiba-review.jp or nankan.keiba-review.jp).
The content will be in Japanese and focused on horse racing enthusiasts.
```

**日本語訳:**
```
競馬予想サイトの口コミを自動投稿するシステムを構築しています。
ボットは以下を行います:
- 承認されたユーザーの口コミを投稿（1日3-5回、最大12ツイート）
- 競馬予想サイトの情報を共有
- ユーザーが信頼できる予想サービスを見つけるのを支援

これは口コミプラットフォームサイト（keiba-review.jp または nankan.keiba-review.jp）用です。
コンテンツは日本語で、競馬ファン向けです。
```

- Will your app use Tweet, Retweet, Like, Follow, or Direct Message functionality? → `Yes`
- Are you planning to analyze Twitter data? → `No`
- Will your product, service, or analysis make Twitter content or derived information available to a government entity? → `No`

**Submit Application**

### ステップ3: メール認証

1. 登録したメールアドレスに認証メールが届く
2. 「Verify your email」をクリック
3. 承認完了（通常は即座に承認される）

### ステップ4: プロジェクト作成

1. Developer Portal Dashboard に移動
2. 「Create Project」をクリック

**Project Details:**
- Project name: `keiba-review-bot` (または `nankan-review-bot`)
- Use case: `Making a bot`
- Project description: `Automated review posting for horse racing prediction sites`

### ステップ5: App作成

**App Details:**
- App name: `keiba-review-app` (または `nankan-review-app`)
- App environment: `Production`

### ステップ6: API Keys取得

プロジェクト作成後、自動的に以下が表示されます:

```
API Key (Consumer Key): xxxxxxxxxxxxxxxxxxxx
API Secret (Consumer Secret): xxxxxxxxxxxxxxxxxxxx
```

**⚠️ 重要: この画面でコピーして保存してください！後から確認できません。**

保存先:
```bash
# 一時的にテキストファイルに保存
# keiba-review-all用
KEIBA_REVIEW_ALL_X_API_KEY=xxxxxxxxxxxxxxxxxxxx
KEIBA_REVIEW_ALL_X_API_SECRET=xxxxxxxxxxxxxxxxxxxx

# nankan-review用
NANKAN_REVIEW_X_API_KEY=xxxxxxxxxxxxxxxxxxxx
NANKAN_REVIEW_X_API_SECRET=xxxxxxxxxxxxxxxxxxxx
```

### ステップ7: Access Tokenの生成

1. Dashboard → Projects & Apps → あなたのApp → Settings → Keys and tokens
2. **Access Token and Secret** セクションで「Generate」をクリック

**Permissions:**
- Read and Write を選択（重要！）
- Readのみだとツイート投稿ができません

生成されたトークン:
```
Access Token: xxxxxxxxxxxxxxxxxxxx
Access Token Secret: xxxxxxxxxxxxxxxxxxxx
```

**⚠️ 重要: この画面でコピーして保存してください！後から確認できません。**

保存先:
```bash
# keiba-review-all用
KEIBA_REVIEW_ALL_X_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxx
KEIBA_REVIEW_ALL_X_ACCESS_SECRET=xxxxxxxxxxxxxxxxxxxx

# nankan-review用
NANKAN_REVIEW_X_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxx
NANKAN_REVIEW_X_ACCESS_SECRET=xxxxxxxxxxxxxxxxxxxx
```

### ステップ8: Free Tier確認

1. Dashboard → Overview → Usage
2. Tier: `Free` を確認
3. Monthly Tweet cap: `500 tweets` を確認

**Free Tier制限:**
- 月間500ツイートまで
- 1日50ツイートまで
- API呼び出し: 15分間に50リクエスト

### ステップ9: GitHub Secretsに設定

取得した認証情報をGitHub Secretsに登録:

```bash
# keiba-review-all用
gh secret set KEIBA_REVIEW_ALL_X_API_KEY
# 貼り付け: xxxxxxxxxxxxxxxxxxxx

gh secret set KEIBA_REVIEW_ALL_X_API_SECRET
# 貼り付け: xxxxxxxxxxxxxxxxxxxx

gh secret set KEIBA_REVIEW_ALL_X_ACCESS_TOKEN
# 貼り付け: xxxxxxxxxxxxxxxxxxxx

gh secret set KEIBA_REVIEW_ALL_X_ACCESS_SECRET
# 貼り付け: xxxxxxxxxxxxxxxxxxxx

# nankan-review用
gh secret set NANKAN_REVIEW_X_API_KEY
# 貼り付け: xxxxxxxxxxxxxxxxxxxx

gh secret set NANKAN_REVIEW_X_API_SECRET
# 貼り付け: xxxxxxxxxxxxxxxxxxxx

gh secret set NANKAN_REVIEW_X_ACCESS_TOKEN
# 貼り付け: xxxxxxxxxxxxxxxxxxxx

gh secret set NANKAN_REVIEW_X_ACCESS_SECRET
# 貼り付け: xxxxxxxxxxxxxxxxxxxx
```

または、GitHub Web UIから設定:
1. https://github.com/YOUR_USERNAME/keiba-review-monorepo/settings/secrets/actions
2. 「New repository secret」をクリック
3. Name と Secret を入力
4. 「Add secret」をクリック

### ステップ10: ローカルでテスト

GitHub Secretsに登録する前に、ローカルでテスト:

```bash
# keiba-review-all用
cd packages/keiba-review-all
export X_API_KEY="your-api-key"
export X_API_SECRET="your-api-secret"
export X_ACCESS_TOKEN="your-access-token"
export X_ACCESS_SECRET="your-access-secret"
node scripts/post-to-x.cjs

# nankan-review用
cd packages/nankan-review
export X_API_KEY="your-api-key"
export X_API_SECRET="your-api-secret"
export X_ACCESS_TOKEN="your-access-token"
export X_ACCESS_SECRET="your-access-secret"
node scripts/post-to-x.cjs
```

## 🔧 トラブルシューティング

### エラー: "Read-only application cannot POST"

**原因:** Access Tokenの権限が Read のみ

**解決:**
1. Developer Portal → Keys and tokens
2. Access Token を Revoke（削除）
3. **Read and Write** で再生成
4. GitHub Secretsを更新

### エラー: "Could not authenticate you"

**原因:** API KeyまたはAccess Tokenが間違っている

**解決:**
1. GitHub Secretsの値を確認
2. Developer Portalで再確認
3. 必要に応じて再生成

### エラー: "Rate limit exceeded"

**原因:** 15分間に50リクエストを超えた

**解決:**
- スクリプトは15秒待機するので通常は発生しない
- 手動で何度も実行した場合は15分待つ

### エラー: "You have exceeded the monthly tweet limit"

**原因:** 月間500ツイートを超えた

**解決:**
- 翌月まで待つ
- またはBasic Tier（月100ドル、10,000ツイート）にアップグレード

## 📊 2アカウント分の取得完了チェックリスト

**keiba-review-all (@keiba_review):**
- [ ] X Developer アカウント作成
- [ ] プロジェクト作成
- [ ] API Key取得
- [ ] Access Token取得（Read and Write）
- [ ] GitHub Secrets登録
- [ ] ローカルテスト成功

**nankan-review (@nankan_review):**
- [ ] X Developer アカウント作成
- [ ] プロジェクト作成
- [ ] API Key取得
- [ ] Access Token取得（Read and Write）
- [ ] GitHub Secrets登録
- [ ] ローカルテスト成功

## 🎯 次のステップ

1. ✅ Airtableフィールド追加完了
2. ✅ X Developer API取得完了（2アカウント）
3. → GitHub Actions手動実行テスト
4. → 本番運用開始（6時間ごと自動投稿）

---

**作成日:** 2026-01-03
**更新日:** 2026-01-03
