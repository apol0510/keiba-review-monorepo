# GitHub Secrets設定ガイド

## 必須Secrets

以下のSecretsをGitHubリポジトリに設定してください。

**設定場所:**
https://github.com/apol0510/keiba-review-monorepo/settings/secrets/actions

### 共通（全ワークフロー）

```bash
# Airtable
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

### keiba-review-all用

```bash
# Netlify
NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL=your-netlify-token
NETLIFY_SITE_ID_KEIBA_REVIEW_ALL=your-site-id

# Google Analytics
PUBLIC_GA_ID=G-XXXXXXXXXX
```

### nankan-review用

```bash
# Netlify
NETLIFY_AUTH_TOKEN_NANKAN_REVIEW=your-netlify-token
NETLIFY_SITE_ID_NANKAN_REVIEW=your-site-id

# Google Analytics
PUBLIC_GA_ID_NANKAN=G-YYYYYYYYYY
```

### 推奨（オプション）

```bash
# SerpAPI（サイト自動検知）
SERPAPI_KEY=your-serpapi-key

# Cloudinary（スクリーンショット）
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## コマンドラインから設定（推奨）

```bash
# 共通
gh secret set AIRTABLE_API_KEY
gh secret set AIRTABLE_BASE_ID

# keiba-review-all
gh secret set NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL
gh secret set NETLIFY_SITE_ID_KEIBA_REVIEW_ALL
gh secret set PUBLIC_GA_ID

# nankan-review
gh secret set NETLIFY_AUTH_TOKEN_NANKAN_REVIEW
gh secret set NETLIFY_SITE_ID_NANKAN_REVIEW
gh secret set PUBLIC_GA_ID_NANKAN

# オプション
gh secret set SERPAPI_KEY
gh secret set CLOUDINARY_CLOUD_NAME
gh secret set CLOUDINARY_API_KEY
gh secret set CLOUDINARY_API_SECRET
```

## 次のステップ

1. ✅ GitHub Secretsを設定
2. ⏭️ nankan-reviewのNetlifyサイト作成
3. ⏭️ 初回デプロイ実行
4. ⏭️ 動作確認

---

最終更新: 2025-12-29
