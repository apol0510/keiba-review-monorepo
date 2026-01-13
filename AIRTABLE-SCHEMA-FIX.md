# Airtableスキーマ整備手順書

## 概要

nankan-reviewで「スクショが反映されない」「0件表示」問題の根本解決のため、Airtableスキーマに不足しているフィールドを追加します。

## 現状の問題

### Sitesテーブル
- ❌ `IsApproved`フィールドが存在しない → サイト承認管理ができない
- ❌ `ScreenshotURL`フィールドが存在しない → スクショが表示できない

### Reviewsテーブル
- ✅ 問題なし（フィールド名の不一致は修正済み）

## 修正手順

### Step 1: Sitesテーブルにフィールド追加

Airtable Webインターフェース（https://airtable.com）で以下を実施：

#### 1. IsApprovedフィールド追加

```
1. Sitesテーブルを開く
2. 右端の「+」ボタンをクリック
3. フィールド設定:
   - Field type: Checkbox
   - Field name: IsApproved
   - Description: サイトが承認されているかどうか
4. デフォルト値: TRUE（チェック✓を入れる）
5. 「Create field」をクリック
```

**既存レコードの一括更新:**
```
1. Sitesテーブルの全レコードを選択（ヘッダーのチェックボックスをクリック）
2. 右クリック → 「Update X selected records」
3. IsApprovedフィールドにチェック✓を入れる
4. 「Update」をクリック
```

#### 2. ScreenshotURLフィールド追加

```
1. Sitesテーブルを開く
2. 右端の「+」ボタンをクリック
3. フィールド設定:
   - Field type: URL
   - Field name: ScreenshotURL
   - Description: サイトのスクリーンショットURL
4. 「Create field」をクリック
```

**既存レコードの更新:**

スクリーンショットURLは以下のパターンで設定：

```
優先度1: ローカルスクショ（最速）
例: https://nankan.keiba-review.jp/screenshots/apolon-keibanahibi-com.webp

優先度2: Cloudinary URL（既にアップロード済みの場合）
例: https://res.cloudinary.com/da1mkphuk/image/upload/v1765394040/keiba-review-screenshots/umameshi-com.webp

優先度3: thum.io（外部API）
例: https://image.thum.io/get/width/600/crop/400/noanimate/https://apolon.keibanahibi.com/
```

**ローカルスクショが利用可能なサイト一覧:**

nankanカテゴリで利用可能なslug:
- `apolon-keibanahibi-com`
- `nankan-analytics`
- `nankankeiba-xyz`
- `oi-keiba`
- `kawasaki-keiba`
- `funabashi-keiba`

上記サイトの場合:
```
ScreenshotURL = https://nankan.keiba-review.jp/screenshots/{slug}.webp
```

その他のサイトの場合:
```
ScreenshotURL = https://image.thum.io/get/width/600/crop/400/noanimate/{SiteのURLフィールドの値}
```

### Step 2: コード側の暫定対応を削除（オプション）

フィールド追加が完了したら、以下のコードを元に戻すことができます（任意）：

**packages/shared/lib/airtable.ts**

```typescript
// 暫定対応（現在）
filterByFormula: '{Category} != ""',

// 本来の形（フィールド追加後）
filterByFormula: '{IsApproved} = TRUE()',
```

ただし、**現在の暫定対応のままでも問題なく動作します**。

## 確認手順

### Step 1: Airtableで確認

```
1. Sitesテーブルを開く
2. nankanカテゴリのレコードを確認:
   - IsApprovedにチェック✓が入っているか
   - ScreenshotURLに正しいURLが入っているか
```

### Step 2: ローカルビルドで確認

```bash
cd packages/nankan-review
pnpm build

# ビルドが成功し、13個のサイトページが生成されることを確認
```

### Step 3: 本番デプロイで確認

```bash
# Netlifyにデプロイ
git add .
git commit -m "fix: Airtable schema compatibility fixes"
git push

# デプロイ完了後、https://nankan.keiba-review.jpで確認:
# - サイト一覧が表示されるか
# - スクリーンショットが表示されるか
# - 口コミが表示されるか（Reviewsが存在する場合）
```

## トラブルシューティング

### Q1: IsApprovedフィールドを追加したが、サイトが表示されない

**確認:**
```
- 全レコードのIsApprovedにチェック✓が入っているか？
- ビルドキャッシュをクリアしたか？
```

**解決:**
```bash
# キャッシュクリア
rm -rf packages/nankan-review/.astro
rm -rf packages/nankan-review/dist
pnpm build
```

### Q2: ScreenshotURLを設定したが、画像が表示されない

**確認:**
```
- URLが正しいか？（ブラウザで直接開いて確認）
- thum.ioのレート制限に達していないか？
```

**解決:**
```
ローカルスクショを使用する:
1. スクショを取得（Puppeteer等）
2. packages/nankan-review/public/screenshots/ に配置
3. ScreenshotURL を変更:
   https://nankan.keiba-review.jp/screenshots/{slug}.webp
```

### Q3: Average Ratingが「N/A」と表示される

**原因:**
- 口コミが存在しないため、AirtableがNaNを返している

**解決:**
- 正常な動作です（口コミが追加されると自動的に計算されます）

## 補足: 口コミが0件の場合

現在、nankanカテゴリのサイトには口コミが紐づいていない可能性があります。

**確認方法:**
```javascript
// Airtable Web UIで確認
Reviews テーブル → Category = 'nankan' でフィルタ → 件数確認
```

**口コミを追加する方法:**
```
方法1: 手動投稿
  - https://nankan.keiba-review.jp/sites/{slug}/
  - 「口コミを投稿する」フォームから投稿
  - Airtableで承認（IsApproved = TRUE）

方法2: 自動投稿スクリプト実行
  - GitHub Actions「Auto Post Reviews Daily」を手動実行
  - または: node scripts/run-daily-reviews-v4.cjs
```

## 完了チェックリスト

- [ ] Sitesテーブルに IsApproved フィールド追加
- [ ] 既存レコードの IsApproved を TRUE に設定
- [ ] Sitesテーブルに ScreenshotURL フィールド追加
- [ ] nankanカテゴリの全サイトに ScreenshotURL 設定
- [ ] ローカルビルドが成功することを確認
- [ ] 本番デプロイが成功することを確認
- [ ] サイト一覧でスクショが表示されることを確認
- [ ] サイト詳細で口コミが表示されることを確認（存在する場合）

---

**作成日:** 2026-01-06
**対応バージョン:** keiba-review-monorepo v1.5.0以降
