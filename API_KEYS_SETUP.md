# APIキー・トークン取得ガイド

## 📋 取得が必要なキー一覧

### 必須（Phase 3で即座に必要）
- [ ] Airtable API Key
- [ ] Airtable Base ID
- [ ] Netlify認証トークン
- [ ] Netlify Site ID（nankan-review）
- [ ] Netlify Site ID（keiba-review-all）

### 推奨
- [ ] Google Analytics 4 測定ID（nankan-review）
- [ ] Google Analytics 4 測定ID（keiba-review-all）

### オプション
- [ ] SerpAPI Key
- [ ] Cloudinary（Cloud Name, API Key, API Secret）

---

## 1️⃣ Airtable APIキーとベースID

### 手順1: Personal Access Token取得

1. https://airtable.com/create/tokens にアクセス
2. 「Create new token」をクリック
3. トークン名を入力（例: `keiba-review-monorepo`）
4. **Scopes**で以下を選択：
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. **Access**で使用するベースを選択
6. 「Create token」をクリック
7. **表示されたトークンをコピー**（再表示されません）

```bash
# 取得したトークンを環境変数に設定
export AIRTABLE_API_KEY="patXXXXXXXXXXXXXXXX"
```

### 手順2: Base ID取得

1. https://airtable.com にアクセス
2. 使用するベース（競馬予想サイト口コミ用）を開く
3. URLから Base ID を確認
   - URL形式: `https://airtable.com/{BASE_ID}/...`
   - 例: `appwdYkA3Fptn9TtN`

```bash
# Base IDを環境変数に設定
export AIRTABLE_BASE_ID="appXXXXXXXXXXXXXX"
```

---

## 2️⃣ Netlify認証トークンとサイトID

### 手順1: Netlify認証トークン取得

1. https://app.netlify.com/ にログイン
2. 右上のユーザーアイコン → 「User settings」
3. 左メニュー「Applications」→「Personal access tokens」
4. 「New access token」をクリック
5. トークン名を入力（例: `keiba-review-monorepo`）
6. 「Generate token」をクリック
7. **表示されたトークンをコピー**

```bash
# 取得したトークンを環境変数に設定
export NETLIFY_AUTH_TOKEN="your-netlify-token"
```

### 手順2: nankan-reviewサイト作成

```bash
# nankan-reviewディレクトリへ移動
cd packages/nankan-review

# Netlifyサイト作成
netlify sites:create --name nankan-review

# サイトIDを確認
netlify status
# → Site ID: xxx-xxx-xxx をコピー

# 環境変数に保存
export NETLIFY_SITE_ID_NANKAN_REVIEW="xxx-xxx-xxx"
```

### 手順3: keiba-review-allサイト作成

```bash
# keiba-review-allディレクトリへ移動
cd ../keiba-review-all

# Netlifyサイト作成
netlify sites:create --name keiba-review-all

# サイトIDを確認
netlify status
# → Site ID: yyy-yyy-yyy をコピー

# 環境変数に保存
export NETLIFY_SITE_ID_KEIBA_REVIEW_ALL="yyy-yyy-yyy"
```

---

## 3️⃣ Google Analytics 4 測定ID（推奨）

### 手順1: GA4プロパティ作成（nankan-review用）

1. https://analytics.google.com/ にアクセス
2. 「管理」→「プロパティを作成」
3. プロパティ名: `nankan-review`
4. タイムゾーン: 日本
5. 通貨: 日本円（JPY）
6. 「次へ」→「次へ」→「作成」
7. 「データストリーム」→「ウェブ」
8. ウェブサイトURL: `https://nankan-review.jp`
9. ストリーム名: `nankan-review.jp`
10. **測定ID（`G-XXXXXXXXXX`）をコピー**

```bash
# 測定IDを環境変数に設定
export PUBLIC_GA_ID_NANKAN="G-XXXXXXXXXX"
```

### 手順2: GA4プロパティ作成（keiba-review-all用）

上記と同様の手順で：
- プロパティ名: `keiba-review-all`
- ウェブサイトURL: `https://keiba-review.jp`
- ストリーム名: `keiba-review.jp`

```bash
# 測定IDを環境変数に設定
export PUBLIC_GA_ID="G-YYYYYYYYYY"
```

---

## 4️⃣ SerpAPI Key（オプション）

### 手順

1. https://serpapi.com/users/sign_up にアクセス
2. アカウント登録（無料枠: 月5,000クエリ）
3. ダッシュボードから「API Key」をコピー

```bash
# APIキーを環境変数に設定
export SERPAPI_KEY="your-serpapi-key"
```

---

## 5️⃣ Cloudinary（オプション）

### 手順

1. https://cloudinary.com/users/register/free にアクセス
2. アカウント登録（無料枠: 25クレジット/月）
3. ダッシュボードから以下をコピー：
   - Cloud name
   - API Key
   - API Secret

```bash
# Cloudinary設定を環境変数に設定
export CLOUDINARY_CLOUD_NAME="your-cloud-name"
export CLOUDINARY_API_KEY="your-api-key"
export CLOUDINARY_API_SECRET="your-api-secret"
```

---

## ✅ GitHub Secretsへの設定

全ての値を取得したら、GitHub Secretsに設定します：

```bash
# 共通
gh secret set AIRTABLE_API_KEY
gh secret set AIRTABLE_BASE_ID

# keiba-review-all
gh secret set NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL -b"$NETLIFY_AUTH_TOKEN"
gh secret set NETLIFY_SITE_ID_KEIBA_REVIEW_ALL -b"$NETLIFY_SITE_ID_KEIBA_REVIEW_ALL"
gh secret set PUBLIC_GA_ID -b"$PUBLIC_GA_ID"

# nankan-review
gh secret set NETLIFY_AUTH_TOKEN_NANKAN_REVIEW -b"$NETLIFY_AUTH_TOKEN"
gh secret set NETLIFY_SITE_ID_NANKAN_REVIEW -b"$NETLIFY_SITE_ID_NANKAN_REVIEW"
gh secret set PUBLIC_GA_ID_NANKAN -b"$PUBLIC_GA_ID_NANKAN"

# オプション
gh secret set SERPAPI_KEY -b"$SERPAPI_KEY"
gh secret set CLOUDINARY_CLOUD_NAME -b"$CLOUDINARY_CLOUD_NAME"
gh secret set CLOUDINARY_API_KEY -b"$CLOUDINARY_API_KEY"
gh secret set CLOUDINARY_API_SECRET -b"$CLOUDINARY_API_SECRET"
```

または、Webから設定:
https://github.com/apol0510/keiba-review-monorepo/settings/secrets/actions

---

## 📝 チェックリスト

取得が完了したら、以下をチェック：

- [ ] Airtable API Key取得
- [ ] Airtable Base ID取得
- [ ] Netlify認証トークン取得
- [ ] nankan-reviewサイト作成（Site ID取得）
- [ ] keiba-review-allサイト作成（Site ID取得）
- [ ] GA4測定ID取得（nankan-review）
- [ ] GA4測定ID取得（keiba-review-all）
- [ ] GitHub Secretsに全て設定完了

---

**最終更新:** 2025-12-29
