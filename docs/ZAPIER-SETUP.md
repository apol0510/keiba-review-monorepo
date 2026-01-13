# Zapier + X（Twitter）自動投稿 設定手順書

**作成日:** 2026-01-02
**更新日:** 2026-01-02（全サイト対応に修正）
**目的:** 競馬予想サイト口コミプラットフォーム（keiba-review Monorepo全サイト）のSNS自動投稿をZapierで実現する

---

## 📋 目次

1. [前提条件](#前提条件)
2. [パターンA: Airtable新着口コミ → X投稿](#パターンa-airtable新着口コミ--x投稿)
3. [パターンB: GitHub Push → X投稿](#パターンb-github-push--x投稿)
4. [パターンC: RSS Feed → X投稿](#パターンc-rss-feed--x投稿)
5. [トラブルシューティング](#トラブルシューティング)
6. [運用Tips](#運用tips)

---

## 前提条件

### 必要なアカウント

- ✅ **Zapier有料プラン**（あなたは既に加入済み）
- ✅ **Xアカウント**（通常のアカウント、Developer API不要）
- ✅ **Airtableアカウント**（nankan-review用Base）
- ✅ **GitHubアカウント**（keiba-review-monorepo）

### 料金

- **Zapier有料プラン**: 既に契約済み
- **X投稿**: 無料（通常アカウントでOK）
- **Airtable**: 無料枠で十分
- **GitHub**: 無料

**→ 追加コストなし！**

---

## パターンA: Airtable新着口コミ → X投稿

**目的:** 口コミが承認されたら自動的にXに投稿してプロモーション

### ステップ1: Zapier新規Zap作成

1. [Zapier](https://zapier.com/app/zaps)にログイン
2. 「Create Zap」をクリック
3. Zap名を入力: `keiba-review: 全サイト口コミ → X投稿`

### ステップ2: Trigger設定（Airtable）

1. **Trigger選択**
   - App: `Airtable`
   - Event: `New Record`

2. **Airtableアカウント接続**
   - 「Sign in to Airtable」をクリック
   - OAuth認証でAirtableにログイン
   - Zapierへのアクセスを許可

3. **Trigger設定**
   ```
   Base: 全サイト共通Base（または各サイトのBase）
   Table: Reviews（口コミテーブル）
   Trigger Column: なし（全ての新規レコード）

   重要: keiba-review-all、nankan-review、将来のサイト全てのAirtable Baseから
   口コミを取得するため、複数のZapを作成するか、1つのBaseに統合することを推奨
   ```

4. **Test Trigger**
   - 「Test trigger」をクリック
   - サンプルレコードが取得されることを確認
   - 「Continue」をクリック

### ステップ3: Filter設定（承認済みのみ）

1. **Filter追加**
   - 「+」ボタンをクリック → 「Filter」を選択

2. **Filter条件設定**
   ```
   Only continue if...
   Status (exactly matches) 承認済み
   ```

3. **Test Filter**
   - 「Test step」をクリック
   - 条件に一致するレコードが通過することを確認

### ステップ4: Action設定（X投稿）

1. **Action選択**
   - App: `X (formerly Twitter)`
   - Action Event: `Create Tweet`

2. **Xアカウント接続**
   - 「Sign in to X」をクリック
   - OAuth認証でXにログイン
   - Zapierへのアクセスを許可

3. **投稿テンプレート設定**

   **Message（投稿内容）:**
   ```
   【新着口コミ】{{1. サイト名}} ⭐{{1. 評価}}

   「{{1. コメント | truncate: 50}}」

   📍 {{1. カテゴリ}}

   詳細はこちら👇
   https://keiba-review.jp/review/{{1. Record ID}}?utm_source=twitter&utm_medium=social&utm_campaign=airtable_review

   #競馬予想 #{{1. カテゴリハッシュタグ}} #{{1. サイト名 | remove: ' '}}
   ```

   **設定例:**
   - `{{1. サイト名}}`: Airtableの「サイト名」フィールド（例: 南関アナリティクス）
   - `{{1. 評価}}`: Airtableの「評価」フィールド（1-5）
   - `{{1. コメント | truncate: 50}}`: コメントを50文字に切り詰め
   - `{{1. カテゴリ}}`: 中央競馬/地方競馬/南関競馬/AI予想など
   - `{{1. Record ID}}`: AirtableのレコードID

   **重要:**
   - keiba-review-all の口コミ → keiba-review.jp に誘導
   - nankan-review の口コミ → keiba-review.jp に誘導（統合アカウントのため）
   - カテゴリによってハッシュタグを動的に変更

4. **Test Action**
   - 「Test step」をクリック
   - 実際にXに投稿されることを確認
   - ⚠️ テスト投稿は削除推奨

### ステップ5: 本番化

1. **Zap名を確認**
   - `keiba-review: 全サイト口コミ → X投稿`

2. **Zapをオン**
   - 右上の「Publish」をクリック
   - Zapが有効化される

3. **動作確認**
   - Airtableで口コミを「承認済み」に変更
   - 数分以内にXに投稿されることを確認

---

## パターンB: GitHub Push → X投稿

**目的:** 全サイト更新時に自動的にXで告知

### ステップ1: Zapier新規Zap作成

1. Zap名: `keiba-review: GitHub更新 → X投稿`

### ステップ2: Trigger設定（GitHub）

1. **Trigger選択**
   - App: `GitHub`
   - Event: `New Push`

2. **GitHubアカウント接続**
   - OAuth認証でGitHubにログイン
   - Zapierへのアクセスを許可

3. **Trigger設定**
   ```
   Account: あなたのGitHubアカウント
   Repository: keiba-review-monorepo
   Branch: main
   ```

4. **Test Trigger**
   - 最新のPushが取得されることを確認

### ステップ3: Filter設定（全サイト対応）

1. **Filter条件設定**
   ```
   Only continue if...
   Head Commit Modified (contains) packages/keiba-review-all
   OR
   Head Commit Modified (contains) packages/nankan-review
   OR
   Head Commit Message (contains) feat
   OR
   Head Commit Message (contains) fix

   重要: 将来のサイト（chuo-keiba-review等）も自動的に対応
   ```

### ステップ4: Action設定（X投稿）

1. **Action選択**
   - App: `X (formerly Twitter)`
   - Action Event: `Create Tweet`

2. **投稿テンプレート設定**

   **Message:**
   ```
   【サイト更新】keiba-reviewを更新しました！

   ✨ {{1. Head Commit Message}}

   最新情報をチェック👇
   https://keiba-review.jp?utm_source=twitter&utm_medium=social&utm_campaign=github_push

   #競馬予想 #競馬予想サイト
   ```

   **注意:** 全サイトの更新を1つのXアカウントで告知

3. **投稿頻度制限（重要）**
   - Zapier設定で「Delay」を追加
   - 1日1回まで投稿（スパム回避）

### ステップ5: 本番化

1. Zapをオン
2. テスト: git pushしてX投稿を確認

---

## パターンC: RSS Feed → X投稿

**目的:** 全サイトの新着ページを自動的にXで告知

### ステップ1: RSS Feed作成

各サイトにRSSフィードを作成（将来の拡張に対応）:

```javascript
// packages/nankan-review/src/pages/rss.xml.js
import rss from '@astrojs/rss'

export async function GET(context) {
  return rss({
    title: 'nankan-review 更新情報',
    description: '南関競馬予想サイト口コミプラットフォーム',
    site: context.site,
    items: [
      {
        title: '新着口コミ追加',
        pubDate: new Date(),
        link: '/review/latest',
      },
      // 他の更新情報
    ],
  })
}
```

### ステップ2: Zapier Trigger設定

1. **Trigger選択**
   - App: `RSS by Zapier`
   - Event: `New Item in Feed`

2. **Feed URL設定**
   ```
   Feed URL: https://nankan.keiba-review.jp/rss.xml
   ```

### ステップ3: Action設定（X投稿）

1. **投稿テンプレート**
   ```
   【更新情報】{{1. Title}}

   {{1. Description | truncate: 100}}

   詳細はこちら👇
   {{1. Link}}?utm_source=twitter&utm_medium=social&utm_campaign=rss

   #南関競馬 #競馬予想
   ```

---

## トラブルシューティング

### エラー1: "X couldn't be verified"

**原因:** X OAuth認証が期限切れ

**解決:**
1. Zapier設定 → Connected Accounts
2. Xアカウントを再接続
3. OAuth認証をやり直す

### エラー2: "Duplicate tweet detected"

**原因:** 同じ内容を短時間で投稿

**解決:**
- 投稿テンプレートに `{{zap_meta_utc_iso8601}}` を追加（タイムスタンプで重複回避）
- または、投稿頻度を制限（Delayステップ追加）

### エラー3: "Airtable record not found"

**原因:** Filterで弾かれたレコード

**解決:**
- Filter条件を確認
- Test Triggerで実際のレコードを確認

### エラー4: "Rate limit exceeded"

**原因:** X投稿の頻度が高すぎる

**解決:**
- 1日10-20投稿まで制限
- Zapier設定でThrottleを追加

---

## 運用Tips

### 投稿頻度の最適化

| パターン | 推奨頻度 | 理由 |
|---------|---------|------|
| **Airtable新着口コミ** | 即座（1日5-10件まで） | リアルタイム性重視 |
| **GitHub更新** | 1日1-2回まで | スパム回避 |
| **RSS新着** | 1日2-3回まで | バランス型 |

### UTMパラメータ活用

全てのX投稿にUTMパラメータを付与:
```
utm_source=twitter
utm_medium=social
utm_campaign=airtable_review / github_push / rss
```

GA4で効果測定:
- X経由の訪問者数
- X → nankan-analytics遷移率
- 最も効果的なパターン分析

### 投稿タイミング最適化

Zapier Delayステップで投稿時刻を調整:
- **平日**: 12:00-13:00（昼休み）、20:00-22:00（帰宅時間）
- **土日**: 10:00-12:00（午前）、15:00-17:00（レース前）

### ハッシュタグ戦略

効果的なハッシュタグ:
- `#南関競馬`（必須）
- `#競馬予想`（必須）
- `#AI予想` / `#大井競馬` / `#川崎競馬`（文脈に応じて）
- 最大3-5個まで

### 画像添付（オプション）

エンゲージメント+50%:
- Zapier Image by Zapierステップで画像生成
- または、Cloudinaryから競馬場写真を取得
- X投稿に画像URLを添付

---

## 次のステップ

1. **パターンA実装** → 新着口コミ投稿を自動化
2. **効果測定** → GA4でX経由のトラフィック確認
3. **パターンB/C追加** → サイト更新・RSS投稿も自動化
4. **最適化** → 投稿タイミング・内容をA/Bテスト

---

**最終更新:** 2026-01-02
**次回レビュー:** 2026-02-01（1ヶ月後、効果測定）
