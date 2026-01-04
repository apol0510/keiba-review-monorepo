# X API制限管理ガイド

## 📊 X API Free tier制限

### 制限値
- **月間制限**: 500ツイート/月
- **日次制限**: 50ツイート/日

### 現在の設定（2026-01-04時点）

| 設定項目 | keiba-review-all | nankan-review |
|---------|-----------------|---------------|
| **実行頻度** | 1日4回（6時間ごと） | 1日4回（6時間ごと） |
| **1回あたり投稿数** | 2件 | 2件 |
| **Xアカウント** | KEIBA_REVIEW_ALL_X_* | NANKAN_REVIEW_X_* |

### 月間投稿数の計算

```
1日あたり:
  4回/日 × 2件/回 × 2サイト = 16ツイート/日

月間最大:
  16ツイート/日 × 30日 = 480ツイート/月
```

**✅ 制限内**: 480 < 500

## ⚠️ 制限超過時の症状

1. **nankan-reviewが投稿されない**
   - keiba-review-allが先に実行され、制限を使い切る
   - nankan-reviewのジョブがエラーまたは無視される

2. **GitHub Actionsワークフローのエラー**
   - `429 Too Many Requests`エラー
   - `Rate limit exceeded`エラー

3. **ツイートIDが記録されない**
   - AirtableのTweetIDフィールドが空のまま
   - 同じ口コミが繰り返し投稿されようとする

## 🔧 調整オプション

### オプション1: 1回あたりの投稿数を減らす（現在の設定）

**設定:**
```javascript
// packages/keiba-review-all/scripts/post-to-x.cjs
// packages/nankan-review/scripts/post-to-x.cjs
const MAX_POSTS_PER_RUN = 2;  // 3 → 2に変更
```

**効果:**
- 月間最大: 480ツイート/月（制限内）
- 投稿頻度: 1日4回維持
- 安全マージン: 20ツイート/月

### オプション2: 実行頻度を減らす

**設定:**
```yaml
# .github/workflows/post-to-x.yml
on:
  schedule:
    - cron: '0 21 * * *'  # AM 6:00 JST（削除しない）
    - cron: '0 9 * * *'   # PM 6:00 JST（削除しない）
    # 以下2つをコメントアウト
    # - cron: '0 3 * * *'   # PM 12:00 JST
    # - cron: '0 15 * * *'  # AM 0:00 JST
```

**効果:**
- 1日4回 → 1日2回（12時間ごと）
- 月間最大: 2回 × 3件 × 2サイト × 30日 = 360ツイート/月
- 安全マージン: 140ツイート/月

### オプション3: 両サイトで異なるXアカウントを使用

**設定:**
1. 新しいXアカウント作成（nankan-review専用）
2. X Developer Portal で新しいアプリ作成
3. GitHub Secretsに追加:
   - `NANKAN_REVIEW_X_API_KEY`
   - `NANKAN_REVIEW_X_API_SECRET`
   - `NANKAN_REVIEW_X_ACCESS_TOKEN`
   - `NANKAN_REVIEW_X_ACCESS_SECRET`

**効果:**
- 各サイト500ツイート/月（合計1,000ツイート/月）
- 制限の心配なし
- 完全独立運用

## 📈 モニタリング方法

### 1. GitHub Actions実行履歴を確認

```bash
# 最新の実行履歴を確認
gh run list --workflow="post-to-x.yml" --limit 10

# 特定の実行の詳細ログを確認
gh run view <run-id> --log
```

### 2. Airtableで投稿状況を確認

```bash
# 最近投稿された口コミを確認
cd packages/keiba-review-all
node -e "
require('dotenv').config({ path: '.env' });
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function checkRecentPosts() {
  const records = await base('Reviews')
    .select({
      filterByFormula: 'NOT({TweetID} = BLANK())',
      sort: [{ field: 'TweetedAt', direction: 'desc' }],
      maxRecords: 20
    })
    .all();

  console.log(\`最近投稿された口コミ: \${records.length}件\`);
  records.forEach(r => {
    console.log(\`- \${r.get('SiteName')} (\${r.get('TweetedAt')})\`);
  });
}

checkRecentPosts();
"
```

### 3. Xアカウントで投稿を確認

- keiba-review-all: https://twitter.com/<keiba-review-all-account>
- nankan-review: https://twitter.com/<nankan-review-account>

## 🚨 トラブルシューティング

### 問題: nankan-reviewが投稿されない

**診断コマンド:**
```bash
cd packages/keiba-review-all
node -e "
require('dotenv').config({ path: '.env' });
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function diagnose() {
  const nankanRecords = await base('Reviews')
    .select({
      filterByFormula: \"AND({Status} = '承認済み', OR({TweetID} = '', {TweetID} = BLANK()), {Category} = '南関')\",
      maxRecords: 10
    })
    .all();

  console.log(\`nankan-review投稿対象: \${nankanRecords.length}件\`);

  if (nankanRecords.length === 0) {
    console.log('❌ 投稿対象の口コミがありません');
    console.log('   - Category=\"南関\"の口コミを確認してください');
    console.log('   - Status=\"承認済み\"を確認してください');
  } else {
    console.log('✅ 投稿対象の口コミあり');
    nankanRecords.slice(0, 3).forEach(r => {
      console.log(\`  - \${r.get('SiteName')} (⭐\${r.get('Rating')})\`);
    });
  }
}

diagnose();
"
```

**原因候補:**
1. ✅ データ問題は解決済み（populate-review-fields.cjsで754件補完）
2. ⚠️ **X API制限超過**（最も可能性が高い）
3. GitHub Secretsの設定ミス
4. ワークフローの実行タイミング

**解決策:**
1. MAX_POSTS_PER_RUN = 2に設定（✅ 完了）
2. GitHub Actions実行履歴でエラーログを確認
3. 必要に応じてオプション2または3を検討

### 問題: 同じ口コミが繰り返し投稿される

**原因:**
- ツイート成功後、AirtableのTweetID更新に失敗

**解決策:**
```javascript
// post-to-x.cjsのupdateReviewWithTweetId()を確認
// エラーログを確認してAirtable APIキーの権限をチェック
```

## 📝 変更履歴

### 2026-01-04
- **MAX_POSTS_PER_RUN**: 3 → 2に変更
- **理由**: 月間制限超過リスク回避（720 → 480ツイート/月）
- **影響**: nankan-review自動投稿の安定化

### 2026-01-03
- populate-review-fields.cjsで754件のデータ補完
- post-to-x.cjs簡潔化（Promise.all削除）

## 🔗 関連ドキュメント

- [X API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [GitHub Actions Workflow](.github/workflows/post-to-x.yml)
- [keiba-review-all post-to-x.cjs](packages/keiba-review-all/scripts/post-to-x.cjs)
- [nankan-review post-to-x.cjs](packages/nankan-review/scripts/post-to-x.cjs)
