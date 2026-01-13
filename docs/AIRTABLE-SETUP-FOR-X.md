# Airtable X投稿用フィールド追加ガイド

このガイドでは、keiba-review-allとnankan-reviewのReviewsテーブルに、X自動投稿に必要なフィールドを追加します。

## 📋 必要なフィールド一覧

| フィールド名 | タイプ | 説明 | 必須 |
|------------|--------|------|------|
| TweetID | Single line text | 投稿したツイートのID | ✅ 必須 |
| TweetedAt | Date | ツイート投稿日時 | ✅ 必須 |
| Status | Single select | 口コミのステータス | ✅ 必須 |
| SiteName | Single line text | サイト名 | 推奨 |
| SiteSlug | Single line text | サイトのSlug | 推奨 |
| Category | Single select | カテゴリ | 推奨 |

## 🔧 セットアップ手順

### ステップ1: keiba-review-all Reviewsテーブルの更新

1. **Airtableを開く**
   - https://airtable.com/
   - keiba-review-all Base を開く
   - Reviewsテーブルを選択

2. **TweetID フィールドを追加**
   - 右端の「+」ボタンをクリック
   - フィールド名: `TweetID`
   - フィールドタイプ: `Single line text`
   - 「Create field」をクリック

3. **TweetedAt フィールドを追加**
   - 右端の「+」ボタンをクリック
   - フィールド名: `TweetedAt`
   - フィールドタイプ: `Date`
   - 「Include a time field」にチェック
   - Time format: `24 hour`
   - Date format: `Local` (日本時間)
   - 「Create field」をクリック

4. **Status フィールドを追加（既存のIsApprovedの代わり）**
   - 右端の「+」ボタンをクリック
   - フィールド名: `Status`
   - フィールドタイプ: `Single select`
   - オプション:
     - `承認済み` (色: Green)
     - `保留中` (色: Yellow)
     - `却下` (色: Red)
     - `スパム` (色: Gray)
   - 「Create field」をクリック

5. **SiteName フィールドを追加**
   - 右端の「+」ボタンをクリック
   - フィールド名: `SiteName`
   - フィールドタイプ: `Single line text`
   - 「Create field」をクリック

6. **SiteSlug フィールドを追加**
   - 右端の「+」ボタンをクリック
   - フィールド名: `SiteSlug`
   - フィールドタイプ: `Single line text`
   - 「Create field」をクリック

7. **Category フィールドを追加**
   - 右端の「+」ボタンをクリック
   - フィールド名: `Category`
   - フィールドタイプ: `Single select`
   - オプション:
     - `南関` (色: Blue)
     - `中央` (色: Red)
     - `地方` (色: Green)
     - `AI` (色: Purple)
     - `無料` (色: Orange)
     - `総合` (色: Gray)
   - 「Create field」をクリック

8. **Comment フィールドを追加（既存のContentを使う場合は不要）**
   - 既存の `Content` フィールドを `Comment` にリネームするか
   - または新しく `Comment` フィールドを作成:
     - フィールド名: `Comment`
     - フィールドタイプ: `Long text`
     - 「Create field」をクリック

### ステップ2: nankan-review Reviewsテーブルの更新

**nankan-review用の別のAirtable Baseを使う場合:**

1. nankan-review Base を開く
2. 上記のステップ1と同じ手順でフィールドを追加

**keiba-review-allと同じBaseを使う場合:**
- 追加作業は不要（既に追加済み）

### ステップ3: 既存データの移行（オプション）

既存の口コミがある場合、以下のフィールドを手動で設定:

1. **IsApproved → Status の移行**
   - IsApproved = true のレコード → Status = "承認済み"
   - IsApproved = false のレコード → Status = "保留中"

2. **Site (Linked Record) → SiteName, SiteSlug, Category の移行**
   - Sitesテーブルから対応するデータをコピー
   - または、スクリプトで自動取得する（推奨）

### ステップ4: 確認

フィールド追加後、チェックスクリプトを実行:

```bash
cd packages/keiba-review-all
node scripts/check-x-fields.cjs
```

期待される出力:
```
✅ 全てのフィールドが揃っています！
```

## 🔐 環境変数の確認

### keiba-review-all用

`.env` ファイルに以下が設定されているか確認:

```bash
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

### nankan-review用（別のBase使用する場合）

`.env` ファイルを作成:

```bash
cd packages/nankan-review
touch .env
```

以下を記述:

```bash
AIRTABLE_API_KEY=patXXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appYYYYYYYYYYYYYY  # nankan-review専用BaseのID
```

## 🚀 テスト実行

フィールド追加後、ローカルでX投稿スクリプトをテスト:

```bash
# keiba-review-all
cd packages/keiba-review-all
node scripts/post-to-x.cjs

# nankan-review
cd packages/nankan-review
node scripts/post-to-x.cjs
```

## 📊 GitHub Secretsの設定

フィールド追加とローカルテストが成功したら、GitHub Secretsを設定:

```bash
# keiba-review-all用
gh secret set KEIBA_REVIEW_ALL_X_API_KEY
gh secret set KEIBA_REVIEW_ALL_X_API_SECRET
gh secret set KEIBA_REVIEW_ALL_X_ACCESS_TOKEN
gh secret set KEIBA_REVIEW_ALL_X_ACCESS_SECRET

# nankan-review用（別のBase使用する場合）
gh secret set NANKAN_REVIEW_AIRTABLE_API_KEY
gh secret set NANKAN_REVIEW_AIRTABLE_BASE_ID
gh secret set NANKAN_REVIEW_X_API_KEY
gh secret set NANKAN_REVIEW_X_API_SECRET
gh secret set NANKAN_REVIEW_X_ACCESS_TOKEN
gh secret set NANKAN_REVIEW_X_ACCESS_SECRET
```

## 🎯 次のステップ

1. ✅ Airtableフィールド追加完了
2. → X Developer API取得（2アカウント）
3. → GitHub Secrets設定
4. → GitHub Actionsで手動実行テスト
5. → 本番運用開始

---

**作成日:** 2026-01-03
**更新日:** 2026-01-03
