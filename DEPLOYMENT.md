# デプロイメントガイド

keiba-review-monorepoの各サイトをデプロイする手順

## 🎯 デプロイ先

| サイト | URL | Netlify | 用途 |
|--------|-----|---------|------|
| keiba-review-all | https://keiba-review.jp | ✅ | 総合口コミサイト |
| nankan-review | https://nankan-review.jp | ✅ | 南関特化サイト |

## 🚀 初回デプロイ手順

### 前提条件

- Node.js 20.x以上
- pnpm 9.x以上
- Netlify CLIインストール済み
- Netlifyアカウント作成済み

### 1. Netlify CLIのインストールと認証

```bash
# Netlify CLIインストール
npm install -g netlify-cli

# Netlify認証
netlify login
```

### 2. keiba-review-allのデプロイ

```bash
# keiba-review-allディレクトリへ移動
cd packages/keiba-review-all

# Netlifyサイト作成
netlify sites:create --name keiba-review-all

# 環境変数設定
netlify env:set AIRTABLE_API_KEY "your-api-key"
netlify env:set AIRTABLE_BASE_ID "your-base-id"
netlify env:set SITE_URL "https://keiba-review.jp"
netlify env:set PUBLIC_GA_ID "G-XXXXXXXXXX"

# ビルド & デプロイ
pnpm build
netlify deploy --prod --build

# カスタムドメイン設定（オプション）
netlify domains:add keiba-review.jp
```

### 3. nankan-reviewのデプロイ

```bash
# nankan-reviewディレクトリへ移動
cd packages/nankan-review

# Netlifyサイト作成
netlify sites:create --name nankan-review

# 環境変数設定
netlify env:set AIRTABLE_API_KEY "your-api-key"
netlify env:set AIRTABLE_BASE_ID "your-base-id"
netlify env:set SITE_URL "https://nankan-review.jp"
netlify env:set PUBLIC_GA_ID "G-YYYYYYYYYY"

# ビルド & デプロイ
pnpm build
netlify deploy --prod --build

# カスタムドメイン設定（オプション）
netlify domains:add nankan-review.jp
```

## 🔄 継続的デプロイ（GitHub Actions）

### GitHub Secretsの設定

```bash
# リポジトリのSettings → Secrets and variables → Actionsで設定

# 共通
AIRTABLE_API_KEY=xxx
AIRTABLE_BASE_ID=xxx

# keiba-review-all
NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL=xxx
NETLIFY_SITE_ID_KEIBA_REVIEW_ALL=xxx
PUBLIC_GA_ID=xxx

# nankan-review
NETLIFY_AUTH_TOKEN_NANKAN_REVIEW=xxx
NETLIFY_SITE_ID_NANKAN_REVIEW=xxx
PUBLIC_GA_ID_NANKAN=xxx

# スクリーンショット（オプション）
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### 自動デプロイのトリガー

```bash
# keiba-review-allのデプロイ
# → packages/keiba-review-all/** or packages/shared/** の変更をmainにpush

# nankan-reviewのデプロイ
# → packages/nankan-review/** or packages/shared/** の変更をmainにpush

# 手動デプロイ
gh workflow run deploy-keiba-review-all.yml
gh workflow run deploy-nankan-review.yml
```

## 🔧 ローカルビルドテスト

### 環境変数設定

```bash
# .envファイルを各パッケージに作成
cp packages/keiba-review-all/.env.example packages/keiba-review-all/.env
cp packages/nankan-review/.env.example packages/nankan-review/.env

# 環境変数を編集
vim packages/keiba-review-all/.env
vim packages/nankan-review/.env
```

### ビルドテスト

```bash
# Monorepoルートで全パッケージビルド
pnpm build

# 個別ビルド
pnpm --filter=@keiba-review/keiba-review-all build
pnpm --filter=@keiba-review/nankan-review build

# プレビュー
cd packages/keiba-review-all && pnpm preview
cd packages/nankan-review && pnpm preview
```

## 📊 デプロイ後の確認

### 1. サイトアクセス確認

```bash
# keiba-review-all
curl -I https://keiba-review.jp
# → HTTP/2 200

# nankan-review
curl -I https://nankan-review.jp
# → HTTP/2 200
```

### 2. Airtable連携確認

- トップページでサイト一覧が表示されるか
- 口コミが正しく表示されるか
- カテゴリフィルタが機能するか

### 3. Google Analytics確認

- リアルタイムレポートで訪問者が記録されるか
- イベント（外部リンククリック）が記録されるか

## 🐛 トラブルシューティング

### ビルドエラー: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set"

**原因:** 環境変数が設定されていない

**解決:**
```bash
# Netlifyの環境変数を確認
netlify env:list

# 未設定の場合は追加
netlify env:set AIRTABLE_API_KEY "xxx"
netlify env:set AIRTABLE_BASE_ID "xxx"
```

### デプロイエラー: "NOT_AUTHORIZED"

**原因:** Netlify認証トークンが無効

**解決:**
```bash
# 新しいトークンを取得
netlify login

# GitHub Secretsを更新
gh secret set NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL
```

### 404エラー: ページが見つからない

**原因:** ビルド成果物のパスが間違っている

**解決:**
```yaml
# .github/workflows/deploy-*.ymlを確認
publish-dir: './packages/[package-name]/dist'  # ← パスが正しいか確認
```

### デプロイエラー: "The deploy directory has not been found"（monorepo特有）

**原因:** monorepo環境でNetlify CLIが正しいディレクトリを認識できていない

**症状:**
```
Error: The deploy directory "/home/runner/work/.../dist" has not been found.
```

**解決方法:**

1. **working-directoryを使用する（推奨）**
```yaml
- name: Deploy to Netlify
  working-directory: packages/keiba-review-all  # ← プロジェクトディレクトリに移動
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
  run: |
    netlify deploy --prod \
      --dir=dist \                              # ← 相対パス
      --functions=netlify/functions \
      --site=$NETLIFY_SITE_ID \                 # ← 明示的に指定
      --auth=$NETLIFY_AUTH_TOKEN
```

2. **netlify.tomlの設定を確認**
```toml
[build]
  base = "packages/keiba-review-all"  # ← baseディレクトリ
  publish = "dist"                     # ← baseからの相対パス
```

3. **避けるべき設定**
```yaml
# ❌ --cwdフラグは netlify deploy では機能しない
netlify deploy --cwd=packages/keiba-review-all --dir=dist

# ❌ リポジトリルートからの絶対パス（netlify.tomlと競合する）
netlify deploy --dir=packages/keiba-review-all/dist
```

**再発防止策:**
- monorepo環境では必ず`working-directory`を使用
- `--site`と`--auth`パラメータを明示的に指定
- ローカルで`netlify deploy --dry-run`でテスト

## 🔐 セキュリティ

### API キーの管理

- ❌ `.env`ファイルをgitにコミットしない
- ✅ `.env.example`をテンプレートとして使用
- ✅ GitHub Secretsに保存
- ✅ Netlify環境変数に設定

### アクセス制限

```bash
# Netlify環境変数で本番のみ有効化
ENABLE_ADMIN=false  # 管理画面を無効化（本番環境）
```

## 📈 パフォーマンス最適化

### ビルド時間短縮

```bash
# pnpmキャッシュを活用
pnpm store prune  # 定期的にキャッシュクリーンアップ

# Turborepoでビルドキャッシュ
pnpm build  # 2回目以降は高速化
```

### デプロイサイズ削減

- ✅ 画像最適化（WebP形式）
- ✅ コード分割（Astro自動）
- ✅ CSS最小化（Tailwind purge）
- ✅ HTML圧縮有効化

## 📚 参考資料

- [Netlify Documentation](https://docs.netlify.com/)
- [Astro Deployment](https://docs.astro.build/en/guides/deploy/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

最終更新: 2025-12-29
