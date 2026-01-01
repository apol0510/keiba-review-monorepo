# nankan-review

南関競馬専門の口コミプラットフォーム

## ⚠️ 重要な原則（AI開発者への指示）

### Monorepoの目的を忘れるな
このMonorepoの目的は「**価値あるサイトを量産する**」ことである。削除は目的に逆行する。

### サイトの価値を正しく評価せよ
- ❌ **誤った評価**: ページ数だけで価値を判断する
- ✅ **正しい評価**: コンテンツの質、専門性、戦略的価値を総合的に判断する

### 削除ではなく強化せよ
価値が不足しているサイトを発見した場合：
1. ❌ **間違った対応**: 削除を提案する
2. ✅ **正しい対応**: 価値を与える具体的な施策を提案し、実行する

### 任務: 価値あるサイトになるまで遂行せよ
- 各サイトは戦略的な目的を持って作られている
- コンテンツが不足している = 強化のチャンスである
- **価値あるサイトになるまで任務を遂行する**ことがAI開発者の責任である

### nankan-review強化の実例（2026-01-01）
**Before:**
- ページ数: 8ページ
- 評価: 「価値が疑問」

**After（強化施策）:**
- ページ数: 19ページ（+237%）
- 追加コンテンツ: 南関4場ガイド、FAQ、ランキング
- 評価: 「南関競馬特化の価値あるサイト」

**教訓:**
削除を提案するのではなく、価値を与える施策を実行することで、サイトは戦略的資産となる。

---

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

## 🔧 トラブルシューティング

### ビルドエラー: "Rollup failed to resolve import 'airtable'"

**症状:**
```
[vite]: Rollup failed to resolve import "airtable" from "src/pages/api/reviews/submit.ts"
```

**原因:** `airtable`パッケージが`package.json`の依存関係に含まれていない

**解決方法:**
```bash
# package.jsonを確認
cat packages/nankan-review/package.json

# airtableが含まれていない場合、追加
# "dependencies"セクションに以下を追加:
# "airtable": "^0.12.2"

# 依存関係を再インストール
pnpm install

# ビルドテスト
pnpm build
```

**修正履歴:** 2025-12-30に発見・修正（commit: e9eb8ae）

### Netlifyデプロイエラー: "ERR_PNPM_OUTDATED_LOCKFILE"

**症状:**
```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"
because pnpm-lock.yaml is not up to date with package.json
```

**原因:** `package.json`を変更したが、`pnpm-lock.yaml`をコミットしていない

**解決方法:**
```bash
# lockfileを更新
pnpm install

# 変更を確認
git status
# → modified: pnpm-lock.yaml

# lockfileをコミット
git add pnpm-lock.yaml
git commit -m "chore: Update pnpm-lock.yaml"
git push

# Netlifyで自動的に再デプロイが開始される
```

**重要:** CI環境では`--frozen-lockfile`フラグが有効なため、lockfileとpackage.jsonの完全一致が必須

**修正履歴:** 2025-12-31に発見・修正（commit: 2ec5054）

### 開発サーバーが起動しない（ポート競合）

**症状:** `Error: listen EADDRINUSE: address already in use :::4322`

**解決方法:**
```bash
# ポート4322を使用中のプロセスを確認
lsof -i :4322

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
pnpm dev -- --port 4323
```

### 環境変数が読み込まれない

**症状:** APIエンドポイントでAirtable接続エラー

**解決方法:**
```bash
# .envファイルを確認
cat packages/nankan-review/.env

# 必須環境変数を設定
echo "AIRTABLE_API_KEY=your-api-key" >> packages/nankan-review/.env
echo "AIRTABLE_BASE_ID=your-base-id" >> packages/nankan-review/.env

# 開発サーバーを再起動
pnpm dev
```

### サイト詳細ページが404エラー（重要⚠️）

**症状:** サイト一覧は表示されるが、個別のサイト詳細ページ（`/sites/[slug]/`）が404エラー

**原因:** `src/pages/sites/[slug]/index.astro`の`getStaticPaths()`関数でフィルタ条件が間違っていた

**詳細:**
Airtableの`IsApproved`フィールド(boolean)は、コード上で以下のようにマッピングされます：
- `isApproved: true` (boolean)
- `status: 'active'` (string)

しかし、フィルタが`status === 'approved'`をチェックしていたため、どのサイトも該当せず静的ページが生成されませんでした。

**修正前:**
```typescript
// src/pages/sites/[slug]/index.astro:16
const nankanSites = allSites.filter(site => site.category === 'nankan' && site.status === 'approved');
```

**修正後:**
```typescript
// 正しいフィールドを使用
const nankanSites = allSites.filter(site => site.category === 'nankan' && site.isApproved);
```

**確認方法:**
```bash
# ビルドログで静的ページ生成を確認
pnpm build

# 以下のような出力があればOK:
# ▶ src/pages/sites/[slug]/index.astro
#   ├─ /sites/nankan-analytics/index.html (+2.34s)
#   ├─ /sites/nankankeiba-xyz/index.html (+2.25s)
#   └─ /sites/apolon-keibanahibi-com/index.html (+2.19s)

# ページ数が増えていることを確認（7ページ → 13ページ等）
```

**デバッグ方法:**
```bash
# Airtableのデータを確認するスクリプト
node scripts/populate-nankan-sites.mjs

# カテゴリ別サイト数が表示される:
# - nankan: 13件
# - chuo: 83件
# - chihou: 4件
```

**修正履歴:** 2025-12-31に発見・修正（commit: 02a4fea）

**重要:**
- Airtableにデータが存在していても、フィルタ条件のバグで静的ページが生成されないことがある
- ビルドログで実際に生成されたページ数を必ず確認すること
- `getStaticPaths()`の戻り値が空の場合、エラーは出ないが404になる

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

- [ ] **本番ビルドテスト（重要⚠️）**
  - [ ] `pnpm build` で本番ビルド成功確認
  - [ ] ビルドエラーがないことを確認
  - [ ] 依存関係の解決確認

- [ ] **デプロイ**
  - [ ] GitHub Actionsで自動デプロイ
  - [ ] カスタムドメイン設定（nankan.keiba-review.jp）
  - [ ] SSL証明書確認

## Google Analytics 4統合

### 測定ID
- `G-CYJ4BWEWEG`（keiba-review.jpプロパティ内のデータストリーム）

### 実装済みイベント（2026-01-01）

**1. `cta_click` - nankan-analyticsへのCTAクリック**
- `event_category: 'conversion'`
- `event_label: 'nankan_analytics_cta'`
- `link_text: クリックされたテキスト`
- `link_url: 遷移先URL`
- `value: 1`

**2. `site_visit_click` - 「サイトを見る」ボタンクリック**
- `event_category: 'conversion'`
- `event_label: 'site_visit_button'`
- `link_url: 遷移先URL`
- `value: 1`

**3. `scroll` - スクロール深度トラッキング**
- `event_category: 'engagement'`
- `event_label: '25%' | '50%' | '75%' | '100%'`
- `value: 25 | 50 | 75 | 100`

**4. `form_submit` - フォーム送信**
- `event_category: 'engagement'`
- `event_label: フォームID`
- `form_action: フォームアクション`

**5. `click` - 外部リンククリック (target="_blank")**
- `event_category: 'outbound'`
- `event_label: リンクURL`
- `link_text: リンクテキスト`

### 重要な実装詳細

**グローバルスコープ修正（BaseLayout.astro:73）:**
```javascript
// ✅ グローバルスコープで定義
window.gtag = function gtag(){dataLayer.push(arguments);}
```

**Navigation Delay パターン:**
- `target="_blank"` の場合: 遅延なし（新しいタブで開くため）
- 同じタブで開く場合: `event_callback` + `setTimeout(200ms)` で遅延

### コンバージョン設定手順

**GA4での設定（方法2: カスタムイベント作成）:**

```
1. GA4 > 管理 > データの表示 > イベント > 「イベントを作成」

2. CTA Conversion:
   - イベント名: nankan_cta_click_conversion
   - キーイベントとしてマークを付ける: ✅ ON
   - 条件: event_name = cta_click
   - 保存 → ☆クリック

3. Site Visit Conversion:
   - イベント名: nankan_site_visit_conversion
   - キーイベントとしてマークを付ける: ✅ ON
   - 条件: event_name = site_visit_click
   - 保存 → ☆クリック
```

### 動作確認

```bash
# 1. https://nankan.keiba-review.jp を開く
# 2. nankan-analyticsリンクをクリック
# 3. GA4 > リアルタイム > イベント で cta_click を確認
# 4. GA4 > リアルタイム > コンバージョン で nankan_cta_click_conversion を確認
```

### トラブルシューティング

**イベントが記録されない場合:**
1. `window.gtag` がグローバルスコープで定義されているか確認
2. Console で `typeof gtag !== 'undefined'` が `true` を返すか確認
3. Netlify環境変数 `PUBLIC_GA_ID` が設定されているか確認
4. リアルタイムレポートで確認（24時間の遅延がある場合あり）

---

**最終更新:** 2026-01-01
**バージョン:** v1.1.0（GA4強化トラッキング実装完了）
**ステータス:** ✅ 完成・運用中
**重要な修正:**
- airtable依存関係の追加（commit: e9eb8ae）
- pnpm-lock.yaml更新（commit: 2ec5054）
- getStaticPaths()フィルタ条件修正 - サイト詳細ページ404エラー解決（commit: 02a4fea）
- GA4トラッキング強化: window.gtag修正 + navigation delay実装（commit: f6335ee）
- Netlifyデプロイ成功確認済み
