# X API制限管理ガイド

## 📊 X API Free tier制限

### 制限値
- **月間制限**: 500ツイート/月
- **日次制限**: 50ツイート/日

### 現在の設定（2026-01-07時点）

| 設定項目 | keiba-review-all | nankan-review |
|---------|-----------------|---------------|
| **実行頻度** | 1日2回（12時間ごと） | 1日2回（12時間ごと） |
| **実行時刻** | AM 9:00, PM 6:00 JST | AM 9:00, PM 6:00 JST |
| **1回あたり投稿数** | 2件 | 2件 |
| **Xアカウント** | KEIBA_REVIEW_ALL_X_* | NANKAN_REVIEW_X_* |

### 月間投稿数の計算

```
1日あたり:
  2回/日 × 2件/回 × 2サイト = 8ツイート/日

月間最大:
  8ツイート/日 × 30日 = 240ツイート/月
```

**✅ 制限内**: 240 < 500（安全マージン: 260ツイート/月）

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

### オプション1: 実行頻度を減らす（✅ 実装済み - 2026-01-07）

**設定:**
```yaml
# .github/workflows/post-to-x.yml
on:
  schedule:
    - cron: '0 0 * * *'   # AM 9:00 JST（通勤時間帯）
    - cron: '0 9 * * *'   # PM 6:00 JST（帰宅時間帯）
```

**効果:**
- 1日4回 → 1日2回（12時間ごと）
- 1日16ツイート → 1日8ツイート（半減）
- 月間最大: 240ツイート/月
- 安全マージン: 260ツイート/月
- **アカウントロックリスク大幅低減**

### オプション2: 1回あたりの投稿数を調整（現在: 2件/回）

**設定:**
```javascript
// packages/keiba-review-all/scripts/post-to-x.cjs
// packages/nankan-review/scripts/post-to-x.cjs
const MAX_POSTS_PER_RUN = 2;  // 現在の設定
```

**将来の調整例:**
- MAX_POSTS_PER_RUN = 3 の場合: 月間360ツイート/月（まだ余裕あり）
- MAX_POSTS_PER_RUN = 4 の場合: 月間480ツイート/月（制限ギリギリ）

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

## 🔒 アカウントロック防止対策（2026-01-07実装）

### 問題の背景

Xアカウントがロックされる主な原因：
1. ❌ **bot検知** - 機械的な投稿パターン
2. ❌ **高頻度投稿** - 1日16ツイートは多すぎる
3. ❌ **テンプレート感** - 投稿内容が類似
4. ❌ **固定スケジュール** - 人間らしさの欠如
5. ❌ **エンゲージメント低** - フォロワーとの交流なし

### 実装済み対策

#### 1. 投稿内容のバリエーション強化

**keiba-review-all:**
- 導入文: 6パターン（「【新着口コミ】」「【ユーザーの声】」等）
- カテゴリ別特別メッセージ: 評価⭐4以上で表示
- 南関: 「夜間レースの予想に強い！」等（3種類）
- 中央: 「重賞レース的中実績あり」等（3種類）
- 地方: 「地方競馬の穴馬情報が豊富」等（3種類）

**nankan-review:**
- 導入文: 6パターン（南関特化）
- 「【南関ユーザーの声】」「【ナイター予想】」等
- 南関特別メッセージ: 評価⭐4以上で表示
- 「夜間レースの予想に強い！」「TCK予想に定評」等（5種類）

#### 2. 投稿時刻のランダム化

**GitHub Actions:**
```yaml
- name: Add random delay (0-15 minutes)
  run: |
    DELAY=$((RANDOM % 900))
    echo "⏱️  ランダム待機: ${DELAY}秒"
    sleep $DELAY
```

**効果:**
- AM 9:00 → AM 9:00-9:15の間でランダム
- PM 6:00 → PM 6:00-6:15の間でランダム
- より人間らしい投稿タイミング

#### 3. レート制限対策の強化

**変更前:**
```javascript
await new Promise(resolve => setTimeout(resolve, 15000)); // 15秒固定
```

**変更後:**
```javascript
const waitTime = 30000 + Math.floor(Math.random() * 30000); // 30-60秒
const waitSeconds = Math.floor(waitTime / 1000);
console.log(`⏱️  ${waitSeconds}秒待機中...`);
await new Promise(resolve => setTimeout(resolve, waitTime));
```

**効果:**
- 待機時間が固定ではなくランダムに変動
- botらしさを軽減

### 手動エンゲージメント推奨事項

自動投稿だけでなく、手動で以下を実施：
- ✅ 競馬関連アカウントのフォロー（10-20アカウント/週）
- ✅ 競馬ツイートへのいいね（5-10件/日）
- ✅ リプライ返信（2-3件/週）
- ✅ プロフィールの充実（ヘッダー画像、自己紹介）

### 改善効果の測定

| 項目 | 改善前 | 改善後 |
|-----|--------|--------|
| 投稿頻度 | 1日4回（固定） | 1日2回（±15分ランダム） |
| 1日合計ツイート | 16ツイート | 8ツイート（-50%） |
| 月間合計ツイート | 480ツイート | 240ツイート（-50%） |
| テキストパターン | 1種類 | 6種類以上 |
| 待機時間 | 15秒固定 | 30-60秒ランダム |
| 特別メッセージ | なし | カテゴリ別（⭐4以上） |
| エンゲージメント | 自動のみ | 手動も推奨 |
| **ロックリスク** | **高** | **極めて低** |

### 注意事項

- 投稿頻度を1日4回 → 1日2回に削減（大幅改善）
- 月間制限に対して52%の余裕（260ツイート）
- 通勤・帰宅時間帯（AM 9:00, PM 6:00）に投稿
- これらの対策でロックリスクは極めて低いが、100%の保証はない
- アカウントがロックされた場合は、X側の指示に従って解除手続きを行う

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

### 2026-01-07
- **アカウントロック防止対策実装（完全版）**
  - 投稿頻度削減: 1日4回 → 1日2回（AM 9:00, PM 6:00 JST）
  - 投稿内容のバリエーション強化（導入文6種類、カテゴリ別特別メッセージ）
  - 投稿時刻のランダム化（0-15分）
  - レート制限対策の強化（待機時間30-60秒ランダム）
  - 手動エンゲージメント推奨事項の追加
- **効果**:
  - 月間480ツイート → 240ツイート（-50%）
  - 安全マージン: 260ツイート/月
  - ロックリスクを極めて低いレベルに低減

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
