# GitHub Actions ワークフロー

Monorepo全体のCI/CDを管理するGitHub Actionsワークフロー

## 📋 ワークフロー一覧

### 1. CI (ci.yml)
**トリガー:** push/PR to main/develop
**内容:**
- すべてのパッケージのビルドテスト
- shared → keiba-review-all → nankan-review の順でビルド
- 依存関係の検証

**実行時間:** 約10-15分

### 2. Deploy keiba-review-all (deploy-keiba-review-all.yml)
**トリガー:**
- mainブランチへのpush（packages/keiba-review-all/** or packages/shared/**）
- 手動実行

**内容:**
- keiba-review-allをビルド
- Netlifyへデプロイ（https://keiba-review.jp）

**実行時間:** 約15-20分

### 3. Deploy nankan-review (deploy-nankan-review.yml)
**トリガー:**
- mainブランチへのpush（packages/nankan-review/** or packages/shared/**）
- 手動実行

**内容:**
- nankan-reviewをビルド
- Netlifyへデプロイ（https://nankan-review.jp）

**実行時間:** 約10-15分

### 4. Auto Post Reviews Daily (auto-post-reviews.yml)
**トリガー:** 毎日AM4:00（JST）

**内容:**
- keiba-review-all用の口コミ自動投稿
- run-daily-reviews-v4.cjs実行
- 投稿後の検証

**実行時間:** 約20-30分

### 5. Weekly Screenshot Capture (auto-screenshots.yml)
**トリガー:** 毎週月曜AM5:00（JST）

**内容:**
- 全サイトのスクリーンショット取得
- Cloudinaryへアップロード

**実行時間:** 約20-30分

### 6. Daily Monitoring (daily-monitoring.yml)
**トリガー:** 毎日AM9:00（JST）

**内容:**
- Airtableスキーマ検証
- 統計情報確認
- 異常値検出

**実行時間:** 約5-10分

## 🔐 必須GitHub Secrets

### 共通（全ワークフロー）
```
AIRTABLE_API_KEY          # Airtable Personal Access Token
AIRTABLE_BASE_ID          # AirtableベースID
```

### デプロイ関連（keiba-review-all）
```
NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL    # Netlify認証トークン
NETLIFY_SITE_ID_KEIBA_REVIEW_ALL       # NetlifyサイトID
PUBLIC_GA_ID                            # Google Analytics 4 測定ID
```

### デプロイ関連（nankan-review）
```
NETLIFY_AUTH_TOKEN_NANKAN_REVIEW       # Netlify認証トークン
NETLIFY_SITE_ID_NANKAN_REVIEW          # NetlifyサイトID
PUBLIC_GA_ID_NANKAN                     # Google Analytics 4 測定ID
```

### スクリーンショット関連
```
CLOUDINARY_CLOUD_NAME     # Cloudinaryクラウド名
CLOUDINARY_API_KEY        # Cloudinary APIキー
CLOUDINARY_API_SECRET     # Cloudinary APIシークレット
```

## 🚀 セットアップ手順

### 1. GitHubリポジトリにSecretsを設定

```bash
# GitHubリポジトリの設定画面で
# Settings → Secrets and variables → Actions → New repository secret

# または GitHub CLI で
gh secret set AIRTABLE_API_KEY
gh secret set AIRTABLE_BASE_ID
gh secret set NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL
gh secret set NETLIFY_SITE_ID_KEIBA_REVIEW_ALL
gh secret set NETLIFY_AUTH_TOKEN_NANKAN_REVIEW
gh secret set NETLIFY_SITE_ID_NANKAN_REVIEW
gh secret set PUBLIC_GA_ID
gh secret set PUBLIC_GA_ID_NANKAN
gh secret set CLOUDINARY_CLOUD_NAME
gh secret set CLOUDINARY_API_KEY
gh secret set CLOUDINARY_API_SECRET
```

### 2. Netlifyサイトの作成

#### keiba-review-all
```bash
# Netlify CLIでサイト作成
cd packages/keiba-review-all
netlify sites:create --name keiba-review-all

# サイトIDを取得
netlify status
# → Site ID: xxx-xxx-xxx

# GitHub Secretsに登録
gh secret set NETLIFY_SITE_ID_KEIBA_REVIEW_ALL
```

#### nankan-review
```bash
# Netlify CLIでサイト作成
cd packages/nankan-review
netlify sites:create --name nankan-review

# サイトIDを取得
netlify status
# → Site ID: yyy-yyy-yyy

# GitHub Secretsに登録
gh secret set NETLIFY_SITE_ID_NANKAN_REVIEW
```

### 3. ワークフローの手動実行テスト

```bash
# CI実行
gh workflow run ci.yml

# デプロイ実行
gh workflow run deploy-keiba-review-all.yml
gh workflow run deploy-nankan-review.yml

# 実行状況確認
gh run list --limit 5

# ログ確認
gh run view <run-id> --log
```

## 📊 ワークフロー実行スケジュール

| 時刻（JST） | ワークフロー | 説明 |
|------------|-------------|------|
| 毎日 AM4:00 | Auto Post Reviews | 口コミ自動投稿 |
| 毎週月曜 AM5:00 | Screenshot Capture | スクリーンショット取得 |
| 毎日 AM9:00 | Daily Monitoring | 日次モニタリング |

## 🔧 トラブルシューティング

### ビルドエラー

**原因:** 環境変数が設定されていない
**解決:** GitHub Secretsを確認

### デプロイエラー

**原因:** Netlify認証情報が間違っている
**解決:** Netlify CLIで再取得して更新

### 口コミ投稿エラー

**原因:** Airtable APIキーの権限不足
**解決:** `data.records:read` と `data.records:write` 権限を確認

## 📚 参考資料

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [pnpm in CI](https://pnpm.io/continuous-integration)
- [Netlify GitHub Actions](https://github.com/nwtgck/actions-netlify)

---

最終更新: 2025-12-29
