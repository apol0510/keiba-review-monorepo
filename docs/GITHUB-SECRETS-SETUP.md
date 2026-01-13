# GitHub Secrets設定手順書

**作成日:** 2026-01-02
**更新日:** 2026-01-02（全サイト対応に修正）
**目的:** Bluesky自動投稿（keiba-review Monorepo全サイト対応）に必要なGitHub Secretsを設定する

---

## 📋 目次

1. [概要](#概要)
2. [必要なSecrets](#必要なsecrets)
3. [Blueskyアカウント作成](#blueskyアカウント作成)
4. [GitHub Secrets設定手順](#github-secrets設定手順)
5. [動作確認](#動作確認)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

Bluesky自動投稿（`.github/workflows/post-to-bluesky.yml`）を実行するために、
以下のGitHub Secretsを設定する必要があります。

---

## 必要なSecrets

| Secret名 | 説明 | 例 |
|---------|------|---|
| `BLUESKY_IDENTIFIER` | Blueskyハンドル（ユーザー名） | `keiba-review.bsky.social` |
| `BLUESKY_PASSWORD` | Blueskyパスワード | `your-strong-password` |

---

## Blueskyアカウント作成

### ステップ1: Blueskyアプリダウンロード

1. **iOS**: [App Store](https://apps.apple.com/us/app/bluesky-social/id6444370199)
2. **Android**: [Google Play](https://play.google.com/store/apps/details?id=xyz.blueskyweb.app)
3. **Web**: [bsky.app](https://bsky.app/)

### ステップ2: アカウント作成

1. アプリを開く
2. 「Create new account」をタップ
3. 以下を入力:
   - **Email**: あなたのメールアドレス
   - **Password**: 強力なパスワード（後でGitHub Secretsに使用）
   - **Handle（ハンドル）**: `keiba-review`（推奨）

4. 招待コード入力（不要な場合もあり）
5. プロフィール設定:
   - **Display Name**: `競馬予想サイト口コミ | keiba-review`
   - **Avatar**: 競馬関連の画像
   - **Bio**:
     ```
     競馬予想サイトの口コミプラットフォーム🏇
     中央・地方・南関全対応｜リアルな口コミ多数
     👉 https://keiba-review.jp
     ```

### ステップ3: ハンドル確認

アカウント作成後、ハンドルを確認:
- 例: `keiba-review.bsky.social`
- これがGitHub Secretsの `BLUESKY_IDENTIFIER` になります

---

## GitHub Secrets設定手順

### 方法1: GitHub Web UI（推奨）

1. **GitHubリポジトリを開く**
   - https://github.com/あなたのユーザー名/keiba-review-monorepo

2. **Settings → Secrets and variables → Actions**
   - 上部メニュー「Settings」をクリック
   - 左サイドバー「Secrets and variables」→「Actions」をクリック

3. **New repository secret**
   - 「New repository secret」をクリック

4. **BLUESKY_IDENTIFIER を追加**
   - **Name**: `BLUESKY_IDENTIFIER`
   - **Secret**: `keiba-review.bsky.social`（あなたのBlueskyハンドル）
   - 「Add secret」をクリック

5. **BLUESKY_PASSWORD を追加**
   - 「New repository secret」をクリック
   - **Name**: `BLUESKY_PASSWORD`
   - **Secret**: あなたのBlueskyパスワード
   - 「Add secret」をクリック

### 方法2: GitHub CLI

```bash
# GitHub CLIでSecrets設定
gh secret set BLUESKY_IDENTIFIER --body "keiba-review.bsky.social"
gh secret set BLUESKY_PASSWORD --body "your-bluesky-password"

# 設定確認
gh secret list
```

### セキュリティ上の注意

⚠️ **重要:**
- Secretsは暗号化されて保存されます
- 一度設定すると、値は確認できません（上書きのみ）
- パスワードは強力なものを使用してください
- 2段階認証（2FA）を有効化することを推奨

---

## 動作確認

### テスト1: 手動実行

1. **GitHub Actionsページを開く**
   - https://github.com/あなたのユーザー名/keiba-review-monorepo/actions

2. **Post to Bluesky ワークフローを選択**
   - 左サイドバーから「Post to Bluesky」をクリック

3. **手動実行**
   - 「Run workflow」ボタンをクリック
   - 「Run workflow」（緑ボタン）をクリック

4. **実行結果確認**
   - 数秒後、ワークフロー実行が開始
   - ✅ 成功 → Blueskyに投稿されたことを確認
   - ❌ 失敗 → ログを確認（下記トラブルシューティング参照）

### テスト2: Blueskyで投稿確認

1. **Blueskyアプリを開く**
   - https://bsky.app/

2. **あなたのプロフィールを開く**
   - `keiba-review.bsky.social`

3. **投稿を確認**
   - 最新の投稿が表示されていることを確認
   - 投稿内容が正しいことを確認

---

## トラブルシューティング

### エラー1: "AuthenticationRequired"

**原因:** BLUESKY_IDENTIFIERまたはBLUESKY_PASSWORDが間違っている

**解決:**
1. Blueskyアプリでログインできるか確認
2. ハンドルが正しいか確認（`nankan-review.bsky.social`）
3. パスワードが正しいか確認
4. GitHub Secretsを再設定

### エラー2: "BLUESKY_IDENTIFIER must be set"

**原因:** GitHub Secretsが設定されていない

**解決:**
1. GitHub Settings → Secrets and variables → Actions
2. `BLUESKY_IDENTIFIER` と `BLUESKY_PASSWORD` が存在することを確認
3. 存在しない場合、上記手順で設定

### エラー3: "Rate limit exceeded"

**原因:** 投稿頻度が高すぎる

**解決:**
- Bluesky APIはレート制限がありません（2026年1月時点）
- ただし、スパム判定される可能性があるため、1日10-20投稿まで推奨

### エラー4: ワークフローが実行されない

**原因:** cronトリガーが動作していない

**解決:**
1. ワークフローファイルを確認: `.github/workflows/post-to-bluesky.yml`
2. cron設定が正しいか確認: `'0 */6 * * *'`
3. 手動実行（Run workflow）でテスト

---

## 定期実行スケジュール

現在の設定:
```yaml
schedule:
  - cron: '0 */6 * * *'  # UTC 0, 6, 12, 18時 = JST 9, 15, 21, 3時
```

**実行タイミング（JST）:**
- 9:00（朝）
- 15:00（午後）
- 21:00（夜）
- 3:00（深夜）

**投稿頻度:** 1日4回

---

## セキュリティベストプラクティス

### 推奨事項

1. **Bluesky専用アカウントを作成**
   - 個人アカウントと分離
   - パスワードは強力なもの（16文字以上）

2. **App Passwordsを使用（推奨）**
   - Bluesky設定 → Security → App Passwords
   - アプリ専用パスワードを生成
   - GitHub Secretsにはこのパスワードを使用

3. **定期的なパスワード変更**
   - 3-6ヶ月ごとにパスワード変更
   - 変更後、GitHub Secretsも更新

4. **Secretsのアクセス制限**
   - GitHub Settings → Actions → General
   - 「Require approval for all outside collaborators」を有効化

---

## 次のステップ

1. ✅ **Blueskyアカウント作成**
2. ✅ **GitHub Secrets設定**
3. ✅ **手動実行でテスト**
4. ⏳ **定期実行を待つ**（6時間後）
5. ⏳ **GA4で効果測定**（1週間後）

---

**最終更新:** 2026-01-02
**次回レビュー:** 2026-02-01（効果測定）
