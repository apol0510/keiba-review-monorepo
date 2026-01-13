# 🏇 keiba-review-monorepo

競馬予想サイト口コミプラットフォーム Monorepo - 効率的な複数サイト運営基盤

[![CI](https://github.com/apol0510/keiba-review-monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/apol0510/keiba-review-monorepo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🎯 プロジェクト概要

複数の競馬予想サイト口コミプラットフォームを効率的に運営するためのMonorepo。nankan-analytics（南関アナリティクス）へのトラフィック誘導を目的とした戦略的サイト群。

### 📌 プロジェクト移行について

このリポジトリは、旧[keiba-review](https://github.com/apol0510/keiba-review)リポジトリをMonorepo化したものです。

**移行の経緯:**
- 2025-12-29: Monorepo構築開始
- 2025-12-30: 旧リポジトリからコード移行完了
- 2025-12-30: 旧リポジトリをアーカイブ（履歴参照用）
- 2025-12-30: 2サイト体制での本番運用開始

**旧リポジトリ:** [apol0510/keiba-review](https://github.com/apol0510/keiba-review) 🗄️ アーカイブ済み

### 稼働中のサイト

| サイト | URL | カテゴリ | ステータス |
|--------|-----|---------|----------|
| **keiba-review-all** | https://keiba-review.jp | 総合（全カテゴリ） | ✅ 稼働中 |
| **nankan-review** | https://nankan.keiba-review.jp | 南関特化 | ✅ 稼働中 |

## ✨ 主要機能

- 🚀 **Monorepo構成** - pnpm workspaces + Turborepo による効率的な開発
- 📦 **共通基盤** - 534件の口コミテンプレート、Airtable操作ライブラリ共有
- 🤖 **自動化** - GitHub Actionsによる口コミ自動投稿・デプロイ
- 📊 **Analytics** - Google Analytics 4統合トラッキング
- 🎨 **最適化** - Astro SSG、Tailwind CSS、SEO最適化
- 🔄 **CI/CD** - パスベース自動デプロイ（6ワークフロー）

## 🏗️ アーキテクチャ

```
keiba-review-monorepo/
├── packages/
│   ├── shared/              # 共通ライブラリ（534件テンプレート）
│   ├── keiba-review-all/    # 総合口コミサイト
│   └── nankan-review/       # 南関特化サイト
├── .github/workflows/       # CI/CD（6ワークフロー）
├── pnpm-workspace.yaml
└── turbo.json
```

## 🚀 クイックスタート

### 前提条件

- Node.js 20.x 以上
- pnpm 9.x 以上

### セットアップ

```bash
# リポジトリクローン
git clone https://github.com/apol0510/keiba-review-monorepo.git
cd keiba-review-monorepo

# pnpmインストール（未インストールの場合）
npm install -g pnpm

# 依存関係インストール
pnpm install

# 環境変数設定
cp packages/keiba-review-all/.env.example packages/keiba-review-all/.env
cp packages/nankan-review/.env.example packages/nankan-review/.env
# .envファイルを編集してAPIキーを設定

# 開発サーバー起動
pnpm dev
# keiba-review-all: http://localhost:4321
# nankan-review: http://localhost:4322
```

### 主要コマンド

```bash
# 開発サーバー起動（全サイト）
pnpm dev

# ビルド（全サイト）
pnpm build

# 個別サイト開発
pnpm --filter=@keiba-review/keiba-review-all dev
pnpm --filter=@keiba-review/nankan-review dev
```

## 📦 パッケージ

### packages/shared

全サイトで共有される共通基盤。

- **review-engine/** - 534件の口コミテンプレート（⭐1〜⭐5）
- **lib/airtable.ts** - Airtable操作ユーティリティ（600行）
- **lib/validation.ts** - Zodバリデーションスキーマ
- **types/** - TypeScript型定義

### packages/keiba-review-all

総合競馬予想サイト口コミプラットフォーム。

- URL: https://keiba-review.jp
- カテゴリ: nankan / chuo / chihou / other
- 機能: 全カテゴリ網羅、管理画面、自動投稿

### packages/nankan-review

南関競馬専門の口コミプラットフォーム。

- URL: https://nankan-review.jp
- カテゴリ: nankan専用
- 特徴: 青系デザイン、nankan-analytics導線強化

## 🤖 自動化

### GitHub Actions（6ワークフロー）

| ワークフロー | トリガー | 機能 |
|------------|---------|------|
| ci.yml | push/PR to main | 全パッケージビルドテスト |
| deploy-keiba-review-all.yml | keiba-review-all変更 | keiba-review-allデプロイ |
| deploy-nankan-review.yml | nankan-review変更 | nankan-reviewデプロイ |
| auto-post-reviews.yml | 毎日AM4:00 JST | 口コミ自動投稿 |
| auto-screenshots.yml | 毎週月曜AM5:00 JST | スクリーンショット取得 |
| daily-monitoring.yml | 毎日AM9:00 JST | 統計・異常値検出 |

詳細: [.github/workflows/README.md](.github/workflows/README.md)

## 🔧 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **Monorepo** | pnpm workspaces + Turborepo 2.7.2 |
| **Framework** | Astro 5.x + React 19.x |
| **Styling** | Tailwind CSS 4.x |
| **Database** | Airtable |
| **Analytics** | Google Analytics 4 |
| **Deployment** | Netlify |
| **CI/CD** | GitHub Actions |

## 📚 ドキュメント

- [CLAUDE.md](./CLAUDE.md) - 詳細ドキュメント（技術仕様、運用指針）
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメントガイド
- [.github/workflows/README.md](./.github/workflows/README.md) - GitHub Actionsワークフロー
- [VSCode-CRASH-FIX.md](./VSCode-CRASH-FIX.md) - VSCodeクラッシュ対策

## 🎯 今後の展開

### Phase 3（予定）
- 2サイト体制での運用開始
- SEO最適化とトラフィック分析
- GA4データ活用

### Phase 4（将来）
- chuo-keiba-review（中央競馬特化）
- chihou-keiba-review（地方競馬特化）
- keiba-ai-review（AI予想特化）
- muryou-keiba-review（無料予想特化）
- 4-6サイト体制の確立

## 🤝 貢献

このプロジェクトはnankan-analyticsエコシステムの一部です。

**プロジェクト構成:**
- nankan-analytics.com - 南関競馬AI予想（メイン）
- keiba-review.jp - 総合口コミサイト（導線1）
- nankan-review.jp - 南関特化口コミサイト（導線2）

## 📄 ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)を参照

## 📞 お問い合わせ

- GitHub: [@apol0510](https://github.com/apol0510)
- Issues: [GitHub Issues](https://github.com/apol0510/keiba-review-monorepo/issues)

---

**最終更新:** 2025-12-30 | **バージョン:** Monorepo v1.1.0 (Phase 3完了)

