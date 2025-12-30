# keiba-review-monorepo

競馬予想サイト口コミプラットフォーム Monorepo

## 🎯 プロジェクト目的

複数の競馬予想サイト口コミプラットフォームを効率的に運営するためのMonorepo。
nankan-analytics（南関アナリティクス）へのトラフィック誘導を目的とした戦略的サイト群。

## 🏗️ Monorepo構成

```
keiba-review-monorepo/
├── package.json                    # ルートpackage.json
├── pnpm-workspace.yaml             # pnpm workspaces設定
├── turbo.json                      # Turborepo設定
├── packages/
│   ├── shared/                     # 共通基盤
│   │   ├── components/            # 共通UIコンポーネント
│   │   ├── lib/                   # ユーティリティ
│   │   ├── types/                 # TypeScript型定義
│   │   └── review-engine/         # 口コミ自動投稿エンジン
│   ├── keiba-review-all/           # 総合口コミサイト
│   └── nankan-review/              # 南関競馬特化サイト
├── .github/
│   └── workflows/                  # 統合CI/CD
└── scripts/                        # 自動化スクリプト
```

## 📦 Packages

### packages/shared

全サイトで共有される共通基盤。

**主要機能:**
- UIコンポーネント（SiteCard、ReviewForm、RatingStars等）
- 口コミ自動投稿エンジン（534件のテンプレート）
- Airtable操作ユーティリティ
- TypeScript型定義
- GA4統一トラッキング

### packages/keiba-review-all

総合競馬予想サイト口コミプラットフォーム（既存プロジェクトの移行）

**特徴:**
- 全カテゴリ網羅（中央・地方・南関）
- ドメイン: keiba-review.jp

### packages/nankan-review

南関競馬専門の口コミプラットフォーム（新規）

**特徴:**
- 南関競馬（大井・川崎・船橋・浦和）特化
- nankan-analyticsへの最適化された導線
- ドメイン: nankan-review.jp（予定）

## 🚀 セットアップ

### 前提条件

- Node.js 20.x 以上
- pnpm 9.x 以上

### インストール

```bash
# pnpmのインストール（未インストールの場合）
npm install -g pnpm

# 依存関係のインストール
pnpm install
```

### 開発

```bash
# 全サイトの開発サーバー起動
pnpm dev

# 特定のサイトのみ起動
pnpm dev --filter=keiba-review-all
pnpm dev --filter=nankan-review

# ビルド
pnpm build

# テスト
pnpm test

# Lint
pnpm lint
```

## 🔧 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Framework** | Astro 5.x + React 19.x |
| **Styling** | Tailwind CSS 4.x |
| **Database** | Airtable |
| **Analytics** | Google Analytics 4 |
| **Deployment** | Netlify |
| **CI/CD** | GitHub Actions |

## 📊 Monorepoのメリット

### コード共有
- UIコンポーネントの再利用
- 口コミ自動投稿ロジックの共有
- Airtable操作の統一

### 開発効率
- 1箇所の修正で全サイトに反映
- 統一されたビルドプロセス
- 依存関係の一元管理

### 運用効率
- 統合CI/CD
- 一括デプロイ
- 統一されたモニタリング

## 🎯 戦略

### 競合対抗戦略

競合は複数の口コミサイトを運営している（3-4サイト以上）。
このMonorepoにより、効率的に複数サイトを展開し対抗する。

### サイト展開計画

**Phase 1（完了✅）:**
- ✅ Monorepo基盤構築（pnpm + Turborepo）
- ✅ shared/パッケージの作成（534件テンプレート、Airtableユーティリティ、型定義）
- ✅ 既存keiba-reviewの移行（packages/keiba-review-all/）
  - インポート文の一括更新
  - 重複コード削除
  - 依存関係の解決

**Phase 2（完了✅）:**
- ✅ nankan-review（南関特化）の立ち上げ
  - 青系デザイン（夜間レースイメージ）
  - nankan-analytics導線強化
  - ポート4322で起動
- ✅ GitHub Actions統合CI/CD
  - 6ワークフロー実装済み
  - パスベース自動デプロイ
- ✅ ドキュメント整備
  - DEPLOYMENT.md作成
  - .github/workflows/README.md作成
  - VSCode-CRASH-FIX.md作成

**Phase 3（完了✅）:**
- ✅ Netlifyデプロイ環境整備（2025-12-30完了）
  - keiba-review-all サイトの環境変数設定（AIRTABLE_API_KEY、AIRTABLE_BASE_ID、SITE_URL）
  - netlify.toml ビルドコマンド修正（pnpm filter使用）
  - netlify.toml publish パス修正（packages/keiba-review-all/dist）
  - keiba-review-all サイトのデプロイ成功
- ✅ カスタムドメイン移行
  - 古いkeiba-reviewサイトから keiba-review.jp ドメインを削除
  - keiba-review-all サイトに keiba-review.jp ドメインを追加
  - Monorepoからのデプロイが keiba-review.jp で公開開始
- ✅ nankan-review サイトのデプロイ成功
  - Netlifyデプロイ成功（nankan-review.netlify.app）
  - カスタムドメイン設定完了（nankan.keiba-review.jp）
  - SSL証明書発行完了（Let's Encrypt）
- ✅ 2サイト体制での本番運用開始

**Phase 4（進行中🚀）:**
- ⏳ SEO最適化とトラフィック分析
- ⏳ GA4データ活用
- ✅ nankan-review カスタムドメイン設定（nankan.keiba-review.jp）
- ✅ GitHub Actions自動デプロイの確認と最適化

**Phase 5（将来）:**
- ⏳ chuo-keiba-review（中央競馬特化）
- ⏳ chihou-keiba-review（地方競馬特化）
- ⏳ keiba-ai-review（AI予想特化）
- ⏳ muryou-keiba-review（無料予想特化）
- ⏳ 4-6サイト体制の確立

## 📝 開発ガイドライン

### 新しいサイトの追加

```bash
# スクリプトを使用（将来実装予定）
./scripts/create-site.sh --name "new-site" --category "category"

# 手動の場合
cd packages
cp -r keiba-review-all new-site
cd new-site
# package.jsonとastro.config.mjsを編集
```

### 共通コンポーネントの追加

```typescript
// packages/shared/components/NewComponent.tsx
export const NewComponent = () => {
  // 実装
}

// 各サイトから使用
import { NewComponent } from '@keiba-review/shared/components'
```

### 環境変数

各パッケージで以下の環境変数が必要：

```bash
# 必須
AIRTABLE_API_KEY=xxx
AIRTABLE_BASE_ID=xxx

# 推奨
PUBLIC_GA_ID=G-XXXXXXXXXX
SITE_URL=https://example.jp
```

## 🔄 自動化

### GitHub Actions（6ワークフロー）

| ワークフロー | トリガー | 機能 | 実行時間 |
|------------|---------|------|---------|
| **ci.yml** | push/PR to main | 全パッケージビルドテスト | 10-15分 |
| **deploy-keiba-review-all.yml** | packages/keiba-review-all/** or shared/** 変更 | keiba-review-allデプロイ | 15-20分 |
| **deploy-nankan-review.yml** | packages/nankan-review/** or shared/** 変更 | nankan-reviewデプロイ | 10-15分 |
| **auto-post-reviews.yml** | 毎日AM4:00（JST） | 口コミ自動投稿 | 20-30分 |
| **auto-screenshots.yml** | 毎週月曜AM5:00（JST） | スクリーンショット取得 | 20-30分 |
| **daily-monitoring.yml** | 毎日AM9:00（JST） | 統計・異常値検出 | 5-10分 |

詳細: `.github/workflows/README.md`

### 必須GitHub Secrets

```bash
# 共通
AIRTABLE_API_KEY          # Airtable Personal Access Token
AIRTABLE_BASE_ID          # AirtableベースID

# keiba-review-all
NETLIFY_AUTH_TOKEN_KEIBA_REVIEW_ALL
NETLIFY_SITE_ID_KEIBA_REVIEW_ALL
PUBLIC_GA_ID

# nankan-review
NETLIFY_AUTH_TOKEN_NANKAN_REVIEW
NETLIFY_SITE_ID_NANKAN_REVIEW
PUBLIC_GA_ID_NANKAN

# SerpAPI
SERPAPI_KEY

# Cloudinary（オプション）
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### 口コミ自動投稿

各サイトで独立して口コミ自動投稿が実行される：
- 毎日AM4:00（JST）に自動実行
- shared/review-engine を使用（534件テンプレート）
- サイトごとに異なるAirtable Base

**テンプレート構成:**
- ⭐1-negative.json: 70件（malicious用）
- ⭐2-slightly-negative.json: 130件（poor/malicious用）
- ⭐3-neutral.json: 70件（normal/poor用）
- ⭐3-positive.json: 90件（excellent/premium用）
- ⭐4-positive.json: 74件（normal/excellent用）
- ⭐5-excellent.json: 100件（premium/excellent専用）

**投稿ロジック:**
- **premium（南関アナリティクス専用）**: ⭐3-5、毎日100%投稿、平均4.0
- **excellent（優良サイト）**: ⭐3-5、毎日100%投稿、平均4.1
- **normal（通常サイト）**: ⭐2-4、2-3日に1回40%投稿、平均3.0
- **poor（低品質サイト）**: ⭐1-3、3-4日に1回30%投稿、平均2.0
- **malicious（悪質サイト）**: ⭐1-2、5日に1回20%投稿、平均1.5

## 🔧 トラブルシューティング

### ビルドエラー: "AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set"

**原因:** 環境変数が設定されていない

**解決:**
```bash
# .envファイルを確認
cat packages/keiba-review-all/.env

# 環境変数を設定
export AIRTABLE_API_KEY="xxx"
export AIRTABLE_BASE_ID="xxx"
```

### デプロイエラー: "NOT_AUTHORIZED"

**原因:** Netlify環境変数のAirtable APIキーが古い

**解決:**
```bash
# Netlifyの環境変数を更新
netlify env:set AIRTABLE_API_KEY "your-latest-api-key"
netlify env:set AIRTABLE_BASE_ID "your-base-id"

# デプロイをトリガー
git commit --allow-empty -m "Trigger deploy"
git push
```

詳細: `DEPLOYMENT.md` のトラブルシューティングセクション

### VSCodeクラッシュ

**原因:** 大規模Monorepoでメモリ不足

**解決:**
1. `.vscode/settings.json` で `typescript.tsserver.maxTsServerMemory: 4096` 設定
2. `VSCode-CRASH-FIX.md` のトラブルシューティング実行
3. ワークスペースを分割（keiba-review-all, nankan-review別々に開く）

詳細: `VSCode-CRASH-FIX.md`

### pnpm install失敗

**原因:** pnpm未インストール

**解決:**
```bash
npm install -g pnpm
pnpm --version  # 9.15.0以上であることを確認
```

### ポート衝突

**原因:** 複数サイトの同時起動でポート競合

**解決:**
各サイトは異なるポートを使用：
- keiba-review-all: 4321
- nankan-review: 4322

## 📚 参考資料

### 内部ドキュメント
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメントガイド
- [.github/workflows/README.md](./.github/workflows/README.md) - GitHub Actionsワークフロー
- [VSCode-CRASH-FIX.md](./VSCode-CRASH-FIX.md) - VSCodeクラッシュ対策
- [packages/keiba-review-all/CLAUDE.md](./packages/keiba-review-all/CLAUDE.md) - keiba-review-all詳細
- [packages/nankan-review/CLAUDE.md](./packages/nankan-review/CLAUDE.md) - nankan-review詳細

### 外部リンク
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Astro Documentation](https://docs.astro.build/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Airtable API](https://airtable.com/developers/web/api/introduction)
- [Google Analytics 4](https://support.google.com/analytics/answer/10089681)

## 🎯 運用指針

### SEO戦略
- 各サイトは独立したドメイン・コンテンツで運営
- 構造化データ（Schema.org）全サイト実装済み
- サイトマップ自動生成（sitemap.xml）
- OGP画像動的生成（Satori + Resvg）

### トラフィック分析
- GA4による統一トラッキング
- サイト別コンバージョン測定（nankan-analyticsへのクリック）
- カテゴリ別パフォーマンス分析

### 口コミ品質管理
- 承認制（管理画面で目視確認）
- NGワード検出（URLリンク禁止）
- 自動投稿は品質別にロジック調整

## 🤝 貢献

このプロジェクトはnankan-analyticsエコシステムの一部です。

**プロジェクト構成:**
- nankan-analytics.com - 南関競馬AI予想（メイン）
- keiba-review.jp - 総合口コミサイト（導線1）
- nankan-review.jp - 南関特化口コミサイト（導線2）

**今後の展開:**
- 中央競馬特化サイト
- 地方競馬特化サイト
- AI予想特化口コミサイト
- 無料予想特化口コミサイト

---

**最終更新:** 2025-12-30
**バージョン:** Monorepo v1.2.0（Phase 4進行中 - カスタムドメイン完全移行）
**メンテナ:** @apol0510
