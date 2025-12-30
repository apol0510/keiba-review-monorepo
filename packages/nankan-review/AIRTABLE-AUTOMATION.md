# Airtable Automation設定ガイド - 口コミ投稿通知

南関競馬予想サイト口コミで新しい口コミが投稿されたときに、自動的に通知を受け取る設定です。

## 📋 前提条件

- Airtableアカウントが必要
- keiba-reviewベースへのアクセス権限
- メール通知またはSlackワークスペース（任意）

## 🚀 セットアップ手順

### ステップ1: Automationダッシュボードを開く

1. https://airtable.com/ にログイン
2. keiba-reviewのベース（Base ID: `AIRTABLE_BASE_ID`）を開く
3. 画面右上の **「Automations」** タブをクリック
4. **「Create automation」** ボタンをクリック

### ステップ2: Automation名を設定

```
名前: 口コミ投稿通知 - nankan-review
説明: 南関競馬予想サイト口コミに新規投稿があったときに通知
```

### ステップ3: トリガーを設定

**トリガータイプ:** `When a record is created`

**設定:**
- **Table**: `Reviews`
- **View**: `All reviews`（またはカスタムビューを作成）

### ステップ4: 条件フィルターを追加（オプション）

南関関連の口コミのみ通知したい場合：

**条件1: nankan-reviewからの投稿のみ**
```
Field: Source
Condition: is
Value: nankan-review
```

**条件2: 承認待ちのみ**
```
Field: Status
Condition: is
Value: pending
```

### ステップ5: アクションを設定

#### オプションA: メール通知 📧

**アクションタイプ:** `Send an email`

**設定:**
```yaml
To: your-email@example.com
Subject: 【南関口コミ】新規投稿 - {UserName}様
Message:
  🏇 南関競馬予想サイト口コミに新しい投稿がありました！

  【投稿情報】
  投稿者: {UserName}
  評価: {Rating}★
  タイトル: {Title}

  【口コミ内容】
  {Content}

  【詳細情報】
  メールアドレス: {UserEmail}
  投稿日時: {Created}
  ステータス: {Status}

  【アクション】
  承認・却下はこちら:
  https://airtable.com/{BASE_ID}/{TABLE_ID}/{RECORD_ID}

  ---
  このメールは Airtable Automation から自動送信されています。
```

#### オプションB: Slack通知 📱 （推奨）

**アクションタイプ:** `Send to Slack`

**事前準備:**
1. Slackワークスペースに通知用チャンネルを作成（例: `#nankan-reviews`）
2. Airtable Slack Appをインストール

**設定:**
```yaml
Channel: #nankan-reviews
Message:
  :racehorse: *新しい南関口コミが投稿されました！*

  *投稿者:* {UserName}
  *評価:* {Rating} :star:
  *タイトル:* {Title}

  *内容:*
  {Content}

  *メール:* {UserEmail}
  *投稿日時:* {Created}

  <https://airtable.com/{BASE_ID}/{TABLE_ID}/{RECORD_ID}|:white_check_mark: 承認する> | <https://airtable.com/{BASE_ID}/{TABLE_ID}/{RECORD_ID}|:x: 却下する>
```

#### オプションC: Discord通知 🎮

**アクションタイプ:** `Run a script` → `Send webhook`

**設定:**
```javascript
// Discord Webhook URL
const webhookUrl = "YOUR_DISCORD_WEBHOOK_URL";

// Record data
const record = input.config();

const message = {
  content: "🏇 **新しい南関口コミが投稿されました！**",
  embeds: [{
    title: record.Title,
    description: record.Content,
    color: 3447003, // Blue
    fields: [
      { name: "投稿者", value: record.UserName, inline: true },
      { name: "評価", value: `${record.Rating}★`, inline: true },
      { name: "メール", value: record.UserEmail, inline: false },
    ],
    footer: { text: "南関競馬予想サイト口コミ" },
    timestamp: new Date().toISOString()
  }]
};

await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(message)
});
```

### ステップ6: テスト実行

1. **「Test automation」** をクリック
2. サンプルレコードで動作確認
3. 通知が正しく届くか確認

### ステップ7: 有効化

1. **「Turn on」** をクリック
2. Automationが緑色（Active）になったことを確認

## 🎨 カスタマイズ例

### 複数の通知先を設定

異なる条件で複数のアクションを実行：

```
アクション1: 高評価（★4-5）→ #good-reviews チャンネル
アクション2: 低評価（★1-2）→ #attention-needed チャンネル
アクション3: 全投稿 → 管理者メール
```

### 営業時間外は通知を抑制

**条件追加:**
```javascript
// Script action
const now = new Date();
const hour = now.getHours();

// 9:00-18:00のみ通知
if (hour >= 9 && hour < 18) {
  // 通知を送信
}
```

## 📊 利用状況の確認

1. Automationsタブを開く
2. 作成したAutomationをクリック
3. **「Run history」** タブで実行履歴を確認

**確認項目:**
- 実行回数
- 成功/失敗
- 実行時間
- エラーログ

## ⚠️ 注意事項

### Airtable無料プランの制限

- **Automation実行回数:** 月100回まで
- **Automation数:** 最大5個まで

月100回を超える場合は、Pro プラン（$20/月）へのアップグレードが必要です。

### プライバシーへの配慮

- メール通知にユーザーのメールアドレスが含まれる
- Slackは複数人が閲覧可能なので注意
- 機密情報は通知に含めない

### セキュリティ

- Webhook URLは秘密情報として扱う
- Slackチャンネルのアクセス権限を適切に設定
- Automationの編集権限を制限

## 🔧 トラブルシューティング

### 通知が届かない

**チェックポイント:**
1. Automationが「Active」（緑色）になっているか？
2. トリガー条件が正しく設定されているか？
3. Airtableの無料枠を超えていないか？
4. メールアドレス/Webhook URLが正しいか？

**解決方法:**
- Run historyでエラーログを確認
- テストレコードで動作確認
- 条件フィルターを一時的に外して確認

### 重複通知が来る

**原因:**
- 同じトリガーで複数のAutomationが動作している

**解決方法:**
- 不要なAutomationを削除
- 条件フィルターで重複を防ぐ

### メール通知が迷惑メールに入る

**原因:**
- Airtableからの自動メールが迷惑メール扱いされる

**解決方法:**
- Airtableのメールアドレス（`@airtable.com`）をホワイトリスト登録
- Slack通知に切り替える

## 📈 運用Tips

### 1週間の投稿を週次サマリーで確認

**別途Automationを作成:**
```
トリガー: Scheduled (毎週月曜 9:00)
アクション: 先週の投稿件数・平均評価をメール送信
```

### 高評価口コミを自動承認

```
トリガー: When a record is created
条件: Rating >= 4 AND Content length > 100
アクション: Update record → Status = "approved"
```

### 低評価口コミをアラート

```
トリガー: When a record is created
条件: Rating <= 2
アクション: Send urgent email to admin
```

## 🎯 推奨設定

初めての方には以下の設定をおすすめします：

```yaml
名前: 口コミ投稿通知 - シンプル
トリガー: When a record is created (Reviews table)
条件: Source = "nankan-review" AND Status = "pending"
アクション: Send email
メール先: あなたのメールアドレス
件名: 【南関口コミ】新規投稿
本文:
  投稿者: {UserName}
  評価: {Rating}★
  タイトル: {Title}
  内容: {Content}

  承認: https://airtable.com/...
```

この設定で、南関関連の承認待ち口コミがメールで届くようになります！

---

**作成日:** 2025-12-30
**対象サイト:** nankan-review（南関競馬予想サイト口コミ）
**Airtable Base:** keiba-review
