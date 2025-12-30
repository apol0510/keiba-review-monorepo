# nankan-review

南関競馬専門の口コミプラットフォーム

## 🎯 プロジェクト概要

南関競馬（大井・川崎・船橋・浦和）に特化した予想サイトの口コミ・評価プラットフォーム。
nankan-analytics（南関アナリティクス）への導線として機能し、ナイター競馬ファンに価値を提供します。

## 🏗️ 特徴

### 南関競馬特化
- **対象競馬場**: 大井（TCK）・川崎・船橋・浦和
- **対象カテゴリ**: `nankan`のみ
- **テーマカラー**: 青系（ナイター競馬のイメージ）

### nankan-analyticsへの導線
- トップページとサイト一覧ページにCTA設置
- データ分析を求めるユーザーを誘導
- SEO最適化でトラフィック獲得

### Monorepo構成
- **共通パッケージ**: `@keiba-review/shared`を利用
- **独立デプロイ**: keiba-review-allとは別のドメイン
- **コード共有**: UIコンポーネント、口コミエンジン、Airtableユーティリティ

## 📦 技術スタック

| 項目 | 技術 |
|------|------|
| Framework | Astro 5.x + React 19.x |
| Styling | Tailwind CSS 4.x |
| Database | Airtable（keiba-review-allと共通） |
| Deployment | Netlify |
| Package Manager | pnpm (workspace) |

## 🚀 セットアップ

### 前提条件
- Node.js 20.x以上
- pnpm 9.x以上
- Monorepoルートで`pnpm install`実行済み

### 開発サーバー起動

```bash
# Monorepoルートから
pnpm --filter=@keiba-review/nankan-review dev

# または nankan-reviewディレクトリで
cd packages/nankan-review
pnpm dev
```

デフォルトポート: `4322`（keiba-review-allと競合しないように設定）

### ビルド

```bash
# Monorepoルートから
pnpm --filter=@keiba-review/nankan-review build

# または nankan-reviewディレクトリで
pnpm build
```

## 📁 ディレクトリ構造

```
nankan-review/
├── src/
│   ├── pages/
│   │   ├── index.astro                   # トップページ
│   │   ├── sites.astro                   # サイト一覧
│   │   ├── sites/[slug]/index.astro      # サイト詳細ページ
│   │   ├── about.astro                   # このサイトについて
│   │   ├── contact.astro                 # お問い合わせ
│   │   ├── terms.astro                   # 利用規約
│   │   ├── privacy.astro                 # プライバシーポリシー
│   │   ├── 404.astro                     # カスタム404エラーページ
│   │   └── api/
│   │       ├── reviews/submit.ts         # 口コミ投稿API
│   │       └── contact.ts                # お問い合わせAPI
│   ├── layouts/
│   │   └── BaseLayout.astro              # 基本レイアウト
│   ├── components/                       # keiba-review-allから共有
│   ├── lib/                              # @keiba-review/sharedから利用
│   └── styles/
│       └── global.css                    # グローバルスタイル（82行）
├── public/
│   └── favicon.svg                       # ファビコン
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── AIRTABLE-AUTOMATION.md                # 口コミ通知設定ガイド
└── CLAUDE.md                             # このファイル
```

## 🎨 デザイン

### カラーパレット

```css
--nankan-primary: #1e40af;    /* 青系 - プライマリ */
--nankan-secondary: #0284c7;  /* スカイブルー - セカンダリ */
--nankan-accent: #f59e0b;     /* オレンジ - アクセント */
```

### フォント
- システムフォント優先
- Hiragino Sans（macOS）
- Meiryo（Windows）

## 🔄 データフロー

### Airtable連携

keiba-review-allと同じAirtable Baseを使用：

```typescript
import { getSitesByCategory, sortByRankingScore } from '@keiba-review/shared/lib';

// nankanカテゴリのサイトのみ取得
const sites = await getSitesByCategory('nankan');
const ranked = sortByRankingScore(sites);
```

### 口コミ自動投稿

shared/review-engineを使用して南関サイトに口コミを自動投稿：
- 毎日AM4:00に実行（GitHub Actions）
- SiteQualityに基づいて投稿頻度を調整
- 534件のテンプレートからランダム選択

## 📈 SEO戦略

### ターゲットキーワード
- 南関競馬 予想サイト
- 大井競馬 予想
- 川崎競馬 予想
- ナイター競馬 予想サイト
- TCK 予想

### メタ情報
- タイトル: `[ページ名] | 南関競馬予想サイト口コミ`
- Description: 南関4場特化を強調
- Canonical URL: 適切に設定

### 内部リンク
- nankan-analyticsへの導線を明確に
- 関連サイトとしてkeiba-review-allへもリンク

## 🚀 デプロイ

### Netlify設定

```bash
# Netlifyサイト作成
netlify sites:create --name nankan-review

# 環境変数設定
netlify env:set AIRTABLE_API_KEY "xxx"
netlify env:set AIRTABLE_BASE_ID "xxx"
netlify env:set PUBLIC_GA_ID "G-XXXXXXXXXX"
netlify env:set SITE_URL "https://nankan-review.jp"

# 本番デプロイ
netlify deploy --prod --build
```

### ドメイン設定
- 予定ドメイン: `nankan-review.jp`
- Netlify DNSまたはカスタムドメイン設定

## 🔮 開発フェーズ

### Phase 1（完了✅ 2025-12-30）
- ✅ 基本サイト構築（トップ、一覧、about）
- ✅ nankanカテゴリのサイト一覧表示
- ✅ nankan-analyticsへの導線
- ✅ デザインシステム確立（青系グラデーション）
- ✅ ナイター表記の修正（正確な南関競馬情報に変更）

### Phase 2（完了✅ 2025-12-30）
- ✅ サイト詳細ページ（/sites/[slug]/）
  - 評価分布チャート
  - 口コミ一覧（ソート・フィルタリング）
  - 関連サイト表示
  - 構造化データ対応（Product、BreadcrumbList）
- ✅ 口コミ投稿フォーム（ReviewForm + API）
- ✅ お問い合わせページ（/contact/ + API）
- ✅ 利用規約（/terms/）
- ✅ プライバシーポリシー（/privacy/）
- ✅ カスタム404エラーページ

### Phase 3（完了✅ 2025-12-30）
- ✅ API実装
  - POST /api/reviews/submit（口コミ投稿）
  - POST /api/contact（お問い合わせ）
- ✅ Airtable連携
  - 口コミ自動保存（Status: pending）
  - Source識別（nankan-review）
- ✅ 口コミ投稿通知システム
  - AIRTABLE-AUTOMATION.md 完全ガイド作成
  - メール/Slack/Discord通知対応
  - トラブルシューティング完備

### Phase 4（将来）
- ⏳ 南関4場別のフィルタリング
- ⏳ コース別の傾向分析（nankan-analyticsとの連携）
- ⏳ 開催情報の表示
- ⏳ ユーザー認証システム
- ⏳ 口コミへの「参考になった」投票機能

## 🎯 実装済み機能一覧

### ページ（全8ページ）
| ページ | URL | 説明 |
|--------|-----|------|
| トップ | `/` | ヒーロー、統計、特徴、nankan-analytics CTA |
| サイト一覧 | `/sites/` | 南関予想サイトグリッド表示 |
| サイト詳細 | `/sites/[slug]/` | 口コミ一覧、投稿フォーム、評価分布 |
| このサイト | `/about/` | 南関競馬の特徴、口コミポリシー |
| お問い合わせ | `/contact/` | フォーム + API連携 |
| 利用規約 | `/terms/` | 9条構成 |
| プライバシー | `/privacy/` | GDPR準拠、GA4対応 |
| 404 | `/404` | カスタムエラーページ |

### API（2エンドポイント）
| エンドポイント | メソッド | 機能 |
|---------------|---------|------|
| `/api/reviews/submit` | POST | 口コミ投稿→Airtable保存 |
| `/api/contact` | POST | お問い合わせ→SendGrid送信 |

### データベース（Airtable）
- **Sitesテーブル**: category='nankan'でフィルタ
- **Reviewsテーブル**: Source='nankan-review'で識別
- **Status**: pending（承認待ち）→ approved（公開）

### 通知システム
- **Airtable Automation**: 口コミ投稿時に自動通知
- **対応チャネル**: メール、Slack、Discord
- **設定ガイド**: AIRTABLE-AUTOMATION.md

### デザインシステム
- **カラー**: 青系グラデーション（from-blue-600 to-sky-600）
- **レイアウト**: max-w-6xl mx-auto px-4 統一
- **スタイル**: Tailwind utilities only（カスタムCSS最小化）
- **レスポンシブ**: モバイル・タブレット・デスクトップ

### SEO対策
- 構造化データ（Product、BreadcrumbList）
- 動的メタディスクリプション生成
- Canonical URL設定
- Google Analytics 4統合

## 📚 参考資料

- [Monorepo全体のドキュメント](../../CLAUDE.md)
- [shared パッケージ](../shared/README.md)
- [Airtable Automation設定ガイド](./AIRTABLE-AUTOMATION.md)
- [Astro Documentation](https://docs.astro.build/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 関連プロジェクト

- **keiba-review-all**: 総合競馬予想サイト口コミ
- **nankan-analytics**: 南関競馬データ分析サイト（導線先）
- **shared**: 共通パッケージ（Airtableユーティリティ、型定義）

## 🚦 運用開始チェックリスト

本番環境での運用前に以下を確認してください：

- [ ] **環境変数設定完了**
  - [ ] AIRTABLE_API_KEY
  - [ ] AIRTABLE_BASE_ID
  - [ ] PUBLIC_GA_ID（推奨）
  - [ ] SITE_URL
  - [ ] SENDGRID_API_KEY（オプション）
  - [ ] ADMIN_EMAIL（オプション）

- [ ] **Airtable Automation設定**
  - [ ] AIRTABLE-AUTOMATION.md参照
  - [ ] テスト口コミで通知確認

- [ ] **動作確認**
  - [ ] 全ページ表示確認
  - [ ] モバイル表示確認
  - [ ] 口コミ投稿テスト
  - [ ] お問い合わせテスト
  - [ ] GA4トラッキング確認

- [ ] **デプロイ**
  - [ ] GitHub Actionsで自動デプロイ
  - [ ] カスタムドメイン設定（nankan.keiba-review.jp）
  - [ ] SSL証明書確認

---

**最終更新:** 2025-12-30
**バージョン:** v1.0.0（本番運用開始）
**ステータス:** ✅ 完成・運用中
